# Fa Engine fase 5 — CRM for telemarketing og abonnementssalg

## Kravspec, basert på «CRM-system for telemarketing»

*v0.1 · 12. august 2026 · leses sammen med `fa-engine-plan.md` §§2, 4, 6 og `fa-engine-roadmap-krav.md`*

> **Endrer hovedplanen på tre punkter.** (1) Fase 5 slås sammen: telemarketing B2C og
> abosalg B2B blir **én modul på én kundegraf**, ikke to. (2) Estimatet på 6–8 uker i
> `fa-engine-plan.md` §4 holder ikke — kravspec'en inneholder et provisjonsgrunnlag, en
> betalingsspeiling og et juridisk kontrollag som ikke var med i det anslaget. Realistisk
> **18–23 uker**, delt i fem leveranser (§16). (3) Sesamy går fra «avhengighet» til
> **forutsetning**: uten Sesamy finnes ikke salget, ordren eller betalingen, og da finnes
> ikke provisjonen heller.

---

## 1. Hva dette systemet er, og hva det ikke er

Kravspec'en beskriver to ting som ser like ut på papiret og er helt ulike å bygge:

**Et arbeidsbord for høyt volum.** Selgeren skal gjennom mange samtaler per time. Alt
handler om tastetrykk, kø, neste kunde, og at ingenting krever et skjermbytte.
Suksesskriteriet i spec'en sier det presist, og det er det eneste kriteriet som betyr noe
for adopsjon.

**Et regnskap over hvem som skylder hvem provisjon.** Det andre halvparten av spec'en —
førstegangsbetaling, kreditering, manglende betaling, provisjonsberettiget salg — er ikke
et CRM-krav. Det er et etterprøvbart oppgjørssystem som skal tåle å bli uenig med en
selger om lønn. Det krever uforanderlige poster, versjonerte regler og en revisjonslogg,
og det er den delen folk undervurderer.

De to delene møtes i én setning: **et salg er ikke et salg før Sesamy sier at det er
betalt.** Hele modellen henger på det.

**Dette er ikke en dialer.** Ringingen skjer i Telia. Fa Engine ber Telia om å ringe og
lytter på hva som skjedde. Se §13.

**Dette er ikke et fakturasystem.** Produkt, pris, ordre, faktura, betaling, oppsigelse og
entitlement eies av Sesamy. Fa Engine eier relasjonen, samtalen, tilbudet, eierskapet og
provisjonsgrunnlaget. Se §2.

Analogien til roadmap-modulen er nyttig, for arbeidsdelingen er den samme:

> Jira eier gjennomføring. Sesamy eier pengene. **Fa Engine eier relasjonen og intensjonen.**

---

## 2. Datadelingen — hvem eier hva

Dette er den viktigste tabellen i dokumentet. Hvert felt har én eier, og de andre leser.

| Data | Eier | Retning | Merknad |
|---|---|---|---|
| Produkt, pris, kampanjekode, rabatt | **Sesamy** | leses | Fa Engine skal ikke ha et priskatalog nummer to. Selgeren velger blant Sesamys produkter. |
| Ordre, faktura, betaling, kreditnota | **Sesamy** | leses (webhook + polling) | Grunnlaget for `aktivert` og `betalt` i trakten. |
| Abonnement, entitlement, oppsigelse, pause | **Sesamy** | leses | Skrives via Sesamy-API der det er nødvendig, aldri i egen tabell. |
| Distribusjonsadresse (papir) | **Sesamy** | leses | Også den sikreste identitetsnøkkelen vi har for papirabonnenter. Se §4.3. |
| Samtale, forsøk, varighet, retning, kø | **Telia** | leses (WebSocket + logg) | Fa Engine speiler, teller ikke selv. |
| Prospekt, kontaktinfo, notat, resultatkode | **Fa Engine** | eier | |
| Ringeliste, kampanje, tildeling, eierskap, låsing | **Fa Engine** | eier | |
| Tilbud, avtale, oppgave, skriftlig aksept | **Fa Engine** | eier | |
| Sperre, frekvenspolicy, samtykke | **Fa Engine** | eier | Se §3.3 — dette er det farligste å ta feil. |
| Reservasjon mot telefonmarkedsføring | **Brønnøysundregistrene** | leses (SFTP) | Vaskes inn, aldri overstyres i Fa Engine. |
| Bransje, ansatte, omsetning, roller, styreverv | **Brønnøysundregistrene** | leses (åpne API-er) | «Ønskelig»-punktet i spec'en er nesten gratis. Se §10. |
| Provisjonsgrunnlag | **Fa Engine** | eier, utleder | Utledet av Sesamy-hendelser, men eid og låst her. |
| Lønnsutbetaling | Lønnssystem | eksporteres til | Åpent spørsmål 6. |

**Konsekvens for arkitekturen:** `SubscriptionProvider`-grensesnittet fra
`fa-engine-plan.md` §6 er ikke lenger et nice-to-have for fase 4. Det er bærebjelken i
fase 5, og det må utvides med skriveoperasjoner — `createOrder`, `applyCampaign` — som
ikke fantes i den første skissen. Zephr får aldri noen av dem.

---

## 3. Juridikken er arkitektur, ikke policy

Norsk telefonsalg er strengt regulert, og reglene er av den typen som er *lette å kode og
umulige å huske*. Derfor: alle kravene under skal håndheves i koden i det øyeblikket det
ringes, ikke stå i en rutinebeskrivelse. Et system som lar en selger ringe en reservert
person søndag klokka 08 er ikke et fleksibelt system, det er et ødelagt system.

### 3.1 Reservasjonsregisteret

Det er forbudt å telefonmarkedsføre mot forbrukere som har reservert seg. Lister skal
vaskes mot registeret før første henvendelse og deretter før hver måneds henvendelser.
Vaskingen skjer mot navn, adresse, fødselsdato og telefonnummer.

Praktisk løsning: abonnement på daglig oppdatering via SFTP fra Brønnøysundregistrene
(24 600 kr/år for eget register per prislisten deres; 2 100 kr for et engangskjøp hvis
dere vil teste først). Med daglig fil kan vasken kjøres hver natt, langt hyppigere enn
loven krever, og da blir kravet trivielt oppfylt.

**Krav:**

- `person.reservation_status` med `checked_at`. Ingen tildeling til ringeliste uten en
  fersk sjekk.
- **Hard sperre i ringehandlingen** dersom `checked_at` er eldre enn en konfigurerbar
  terskel (foreslått: 7 døgn, altså ti ganger strengere enn loven).
- Vaskejobben logges som en `event`. Én rad per kjøring, med antall vurderte, antall nye
  reservasjoner, antall tildelinger som ble trukket tilbake. Dette er dokumentasjonen
  overfor Forbrukertilsynet, og den skal finnes uten at noen må lete.

### 3.2 Unntaket for eksisterende kundeforhold — og hvorfor det er teknisk vanskelig

Reservasjon stopper ikke markedsføring i et **eksisterende kunde- eller giverforhold**,
og bare for **egne ytelser tilsvarende dem kundeforholdet bygger på**. Det er unntaket
oppsalg og gjenvinning lever av.

Problemet er at unntaket ikke kan settes med en avkrysningsboks. Det må være et **utledet,
etterprøvbart flagg** med kilde: dette abonnementet, i Sesamy, med denne datoen. Og da
kolliderer det med identitetsproblemet i §4.3 — vi har et telefonnummer, Sesamy har en
e-postadresse.

**Krav:** unntaket kan bare påberopes når det finnes en bekreftet
`identity_link` til et Sesamy-abonnement, og lenken vises i kundekortet med kilde og
dato. «Antatt kunde» gir ikke unntak. Der lenken mangler, gjelder reservasjonen.

### 3.3 Tre ting som blandes sammen, og som må være tre felt

| | Hva | Levetid | Kan overstyres? |
|---|---|---|---|
| **Reservasjon** | Registrert i Reservasjonsregisteret | Til den oppheves der | Nei. Bare av unntaket i §3.2 |
| **Egen sperre** | «Ikke ring meg» sagt til oss | Permanent som standard | Nei. Bare av personen selv |
| **Frekvenspolicy** | Ikke oftere enn hver *n*-te måned | Rullende vindu | Ja, av selgerleder med begrunnelse som logges |

Spec'ens «sperreregister så kunder ikke tas ut på ringelister for ofte» er den tredje.
Den er den eneste av de tre som er en forretningsregel. De to første er lov og løfte.

Og én ubehagelig, men viktig detalj: **en egen sperre må overleve sletting av
personopplysninger.** Sletter dere personen helt, ringer dere henne igjen om tre måneder.
Løsningen er en egen tabell med bare en saltet hash av normalisert telefonnummer, uten
navn eller annen kontekst, som ikke slettes ved sletteforespørsel og som dokumenteres i
personvernvurderingen som nettopp det tiltaket det er.

### 3.4 Ringevinduer er lov, ikke konfigurasjon

Telefonmarkedsføring mot forbrukere er forbudt lørdager, søndager og helligdager, og på
hverdager før 09.00 og etter 21.00.

**Krav:** ringevindu er en systemgrense, og kampanjekonfigurasjon kan bare gjøre vinduet
*smalere*, aldri bredere. Norsk helligdagskalender må ligge i databasen — bevegelige
helligdager gjør dette til noe man ikke kan hardkode. Ringeknappen er deaktivert utenfor
vinduet, med en forklaring, ikke bare grå.

### 3.5 Skriftlig aksept — og unntaket som gjelder Finansavisen

Hovedregelen ved uanmodet telefonsalg til forbrukere er at avtalen **ikke er bindende**
før forbrukeren har akseptert et skriftlig tilbud skriftlig, på et varig medium.
Lydopptak av et muntlig ja holder ikke.

Fra dette gjelder to unntak: **frivillige organisasjoner**, og **abonnement på aviser**
som utkommer regelmessig med minst ett nummer ukentlig og har rett til momsfritak.
Unntaket gjelder ikke fag- og ukepresse. Finansavisen som avis faller innenfor.

**Dette er den enkeltavklaringen med størst produktkonsekvens i hele modulen**, og den er
juridisk, ikke teknisk: *gjelder avisunntaket også et rent digitalt abonnement?*
Elektroniske nyhetstjenester har eget momsfritak, men Forbrukertilsynets veiledning er
skrevet med papiravisen i tankene, og den utgaven vi har lest er fra 2020.

**Krav som gjør oss robuste uansett svar:** flagget
`product.requires_written_acceptance` settes per produkt i Sesamy-katalogen, av juridisk,
ikke av en utvikler. Er det satt, kan et salg ikke registreres som bindende før en
`written_acceptance` er mottatt og logget, og salget står i `tilbud sendt` inntil da.
Trakten i spec'en (`tilbud → salg`) tåler dette uten endring. Bygg mekanismen selv om
svaret blir at unntaket gjelder — det koster to dager nå og en omskriving senere.

### 3.6 Muntlig opplysningsplikt som en logget sjekkliste

Selv under avisunntaket gjelder full muntlig opplysningsplikt: identitet og formål,
tjenestens hovedegenskaper, samlet pris medregnet avgifter, angrerett og vilkårene for
den, avtalens varighet og oppsigelsesvilkår.

**Krav:** samtaleskriptet i kundekortet er ikke pynt — det er dokumentasjon. Punktene
vises som en kvitteringsliste selgeren huker av, og avhukingen lagres på salget med
tidsstempel. Uten dette har dere ingen dokumentasjon på at plikten er oppfylt, og
angrefristen kan bli 12 måneder lengre enn 14 dager fordi ingen kan vise at det ble
opplyst.

### 3.7 Oppbevaring, samtaleopptak og DPIA

- **Dokumentasjon på aksept:** Forbrukertilsynet omtaler seks måneder som nedre grense.
  Samtidig er salgsdokumentasjon også regnskapsmateriale, og provisjonstvister kan komme
  sent. Dette er ikke én oppbevaringstid, det er tre ulike formål med tre ulike frister,
  og de må settes eksplisitt per datatype av juridisk. **Åpent spørsmål 4.**
- **Samtaleopptak er ikke i spec'en, og bør ikke inn i fase 1.** Opptak krever eget
  behandlingsgrunnlag og informasjon, gir en tung mengde lyddata, og hjelper ikke mot
  skriftlighetskravet uansett. Trenger dere det senere, hører det hjemme i telefonilaget
  hos Telia, med referanse — ikke fil — i Fa Engine.
- **Prospekter uten kundeforhold** behandles på berettiget interesse. Det krever en
  balansetest, dataminimering og en reell slettefrist på prospekter som aldri ble kunder.
  Sammen med volumet av samtaledata gjør dette en **DPIA nødvendig før modulen går i
  produksjon** — på linje med chatboten i fase 4, og av samme grunn.

---

## 4. Domenemodell

### 4.1 Prospekt er ikke en egen entitet

Den viktigste modelleringsbeslutningen: **et prospekt er en `person` uten abonnement.**
Ingen egen prospekttabell. Hele grunnen til å bygge dette i Fa Engine i stedet for å
kjøpe et ringesystem er at kunden, prospektet, klageren og forumbrukeren er samme rad.
Lager vi en parallell tabell, har vi kjøpt et ringesystem med ekstra trinn.

Det samme gjelder `account` for bedrifter — den finnes allerede i `core` og bærer B2B-
avtalen.

### 4.2 Nye entiteter i `src/modules/crm/`

```
campaign ──── call_list ──── list_membership ──── person
                  │                │
             assignment ───────────┘         (én aktiv per person, se §7)
                  │
             call_attempt ──── call (speilet fra Telia)
                  │
              outcome (resultatkode, §5)
                  │
        ┌─────────┼──────────┬────────────┐
      offer     task       note        message (e-post/SMS)
        │
      sale ──── sesamy_order_id ──── payment_event (speilet)
                                          │
                                  commission_entry (§9)
```

| Entitet | Bærer | Merknader |
|---|---|---|
| `campaign` | Formål, produktutvalg, periode, prioritet, ringevindu, frekvenspolicy | Kan arkiveres uten å miste historikk |
| `call_list` | Utvalgsregel eller importert fil, kildesporing, restbeholdning | Lister er *visninger med eierskap*, ikke kopier av personer |
| `list_membership` | Person i liste, status: `urørt / påbegynt / oppfølging / avtale / avsluttet` | Kapasitetsvisningen i spec'en er en `GROUP BY` på dette |
| `assignment` | Hvilken selger eier hvilken person nå, fra–til, hvem tildelte | Se §7 |
| `call_attempt` | Forsøk nr., tidspunkt, resultatkode, notat, hvem | Fa Engine eier forsøket |
| `call` | Speilet Telia-hendelse: retning, varighet, nummer, kø | Kobles til `call_attempt`, ikke omvendt |
| `offer` | Produkt, pris, gyldighet, sendt-kanal, `written_acceptance` | §8 |
| `task` | Oppgave/avtale med dato, klokkeslett, eier, prioritet, påminnelse | Navnekollisjon med roadmap-modulens `task` — namespaces per modul |
| `sale` | Produkt, pris, selger, kampanje, liste, `sesamy_order_id`, opplysningsplikt-kvittering | §9 |
| `payment_event` | Speilet fra Sesamy: første betaling, manglende, kreditering, kansellering | Append-only |
| `commission_entry` | Uforanderlig post med regelversjon, periode, beløp, status | §9 |
| `contact_policy` | Sperre og frekvens per person | §3.3 |
| `identity_link` | Person ↔ Sesamy-bruker, med matchemetode, konfidens, bekreftet av | §4.3 |

### 4.3 Identitetsproblemet — den reelle risikoen i hele modulen

**Telemarketing har telefonnummer. Sesamy har e-postadresse.** Sesamy identifiserer
brukere på e-post og passordløs innlogging; telefonnummer er ikke dokumentert som en
søkbar nøkkel i API-et. Det betyr at spørsmålet *«er denne personen allerede
abonnent?»* ikke uten videre kan besvares fra et telefonnummer alene.

Det er ikke en detalj. Det brekker fire krav i spec'en samtidig:

1. Abonnementshistorikk i kundekortet — hovedkravet i §4 i spec'en
2. Unntaket for eksisterende kundeforhold (§3.2) — altså lovligheten av oppsalgslister
3. Duplikathåndtering ved import
4. Å unngå å selge et abonnement til noen som allerede har det

**Tiltak, i prioritert rekkefølge:**

1. **Få telefonnummer inn i Sesamy-profilen** ved kjøp og ved kundeservicekontakt. Dette
   er en Sesamy-konfigurasjonssak og bør tas inn i migrasjonsprosjektet nå, mens
   feltvalgene fortsatt er åpne. Det er den billigste løsningen med flere størrelsesordener.
2. **Matching på distribusjonsadresse for papirabonnenter.** Papir har adresse i Sesamy;
   ringelister har ofte adresse. Navn + adresse er en brukbar nøkkel for den gruppen.
3. **Eksplisitt `identity_link`-tabell** med `match_method`
   (`epost` / `telefon` / `navn+adresse` / `manuelt bekreftet`), konfidens, og hvem som
   bekreftet. Ingen automatisk kobling under terskel. Kundekortet viser alltid *hvorfor*
   systemet tror dette er samme person.
4. **Telefonnummer normaliseres til E.164 overalt** — `+47XXXXXXXX`. Nummeret er
   fellesnøkkelen mot Telia, mot Reservasjonsregisteret, mot ringelistene og mot
   dedupliseringen, og det er samtidig det skitneste feltet i alle kilder. Én
   normaliseringsfunksjon i `core`, brukt av alle, testdekket.

**Dette er blokker nummer én.** Uten en avklaring fra Sesamy på hvordan en person slås
opp på telefonnummer, er kundekortet i spec'en ikke byggbart som beskrevet.

### 4.4 Duplikater

Spec'en ber om å oppdage og håndtere duplikater «uten å miste historikk eller
samtykke/reservasjon», og om å foreslå sammenslåing med administratorgodkjenning. Det er
riktig stilt. Regelen som gjør det trygt:

> **Ved sammenslåing er restriksjoner en union, aldri et snitt.** Har én av de to postene
> en sperre, en reservasjon eller et trukket samtykke, arver den sammenslåtte posten det.
> Historikk, notater og samtaler slås sammen. Ingen automatisk sammenslåing — forslag med
> evidens, godkjent av administrator, logget. Samme prinsipp som agentlaget i
> `fa-engine-plan.md` §3: systemet foreslår, mennesket bestemmer.

---

## 5. Resultatkodetaksonomien

Dette er fase 5 sin versjon av områdetaksonomien i roadmap-modulen: **den ene
beslutningen som all rapportering senere hviler på.** Spec'en nevner resultater og
«responser» som noe administrator konfigurerer. Det er en felle. Fritt konfigurerbare
resultatkoder gir en KPI-modell som ikke kan aggregeres etter tre måneder — presis samme
mekanisme som ga 22 unike verdier i `Owner` i regnearket.

Fast kodesett, endres i kode, med eksplisitt semantikk per kode:

| Kode | Teller som kontakt? | Ut av liste? | Utløser sperre? | Nytt forsøk |
|---|---|---|---|---|
| Ikke svar | Nei | Nei | Nei | Etter pause |
| Opptatt / avvist i nettet | Nei | Nei | Nei | Etter pause |
| Feil eller ugyldig nummer | Nei | **Ja** | Nei | Nei |
| Talt med feil person | Nei | Nei | Nei | Ja |
| Avtalt ny samtale | **Ja** | Nei | Nei | På avtalt tid |
| Ikke interessert | **Ja** | **Ja** | Frekvenspolicy | Neste kampanje |
| Vil ikke kontaktes | **Ja** | **Ja** | **Permanent** | Aldri |
| Interessert — tilbud sendt | **Ja** | Nei | Nei | Oppfølging |
| Salg | **Ja** | **Ja** | Nei | — |
| Allerede kunde | **Ja** | **Ja** | Nei | — |
| Klage | **Ja** | **Ja** | Vurderes | Etter håndtering |
| Utenfor målgruppe | Nei | **Ja** | Nei | Nei |

To ting følger av tabellen:

**Kontaktgrad blir målbart.** Spec'en ber om kontaktgrad per ringeliste uten å definere
den. Med kolonne to er definisjonen en `SELECT`, og alle rapporter bruker samme.

**«Ikke interessert» skal ha en grunn, og grunnen er et signal.** Fritekstnotatet fra en
avvist samtale er nøyaktig den typen data feedback-modulen i fase 2 lever av — `salgsnotat`
står allerede som kildetype i `fa-engine-plan.md` §2. Krav: resultatkoden `Ikke
interessert` med grunn skriver en `signal`-rad, med område. Da svarer telemarketing på
spørsmålet «hvorfor sier folk nei til Finansavisen» én gang i måneden, automatisk. **Dette
er den enkeltfunksjonen som best rettferdiggjør å bygge framfor å kjøpe**, og den koster
nesten ingenting når kundegrafen først er delt.

---

## 6. Selgerflaten

Suksesskriteriet i spec'en er ett skjermbilde, og det må tas bokstavelig.

**Én arbeidsflate, tre soner.** Kø til venstre, kundekort i midten, handling til høyre.
Ingen modaler i hovedløkken. Ingen navigasjon mellom «ring» og «registrer».

**Kundekortet skiller tre slags innhold visuelt**, som spec'en ber om: faktafelt (fra
Sesamy eller Brreg, ikke redigerbare her), selgernotater (fritekst, med forfatter og
tid), og systemhendelser (samtaler, e-post, statusendringer). Tre registre, tre
behandlinger. Faktafelt viser alltid kilde.

**Tastatur, ikke mus.** `Space` ringer, `1`–`9` setter resultatkode, `n` skriver notat,
`t` lager oppgave, `Enter` går videre og henter neste. `Cmd-K` for alt annet. Dette er
allerede designprinsippet i `fa-engine-plan.md` §7; her er det ikke en preferanse, det er
selve produktet.

**Etter registrert utfall hentes neste kunde automatisk** etter prioriteringsregelen i §7.
Selgeren skal ikke velge hvem hun ringer.

**Tidsvindu og sperrer vises før samtalen, ikke etter.** Et kort med en aktiv sperre ser
annerledes ut, og ringeknappen er borte med en begrunnelse.

Statusfarger følger regelen i `fa-engine-plan.md` §7: **grønt og rødt er okkupert av
markedsretning**. Salg vises ikke i grønt. Resultatkoder og pipeline får blåskalaen.

---

## 7. Ringelister, fordeling, eierskap og låsing

Spec'ens vanskeligste krav er dette: *hindre at samme prospekt ringes parallelt fra flere
lister, med definert regel for eierskap og låsing.* Det er et samtidighetsproblem, og det
løses feil hvis man låser lister.

**Løsningen er å låse personen, ikke listen:**

- `list_membership` er mange-til-mange. En person kan stå i flere lister.
- `assignment` er **én aktiv per person**, håndhevet med en unik indeks i databasen. Én
  eier, én gang, uansett hvor mange lister hun står i.
- Tildelingen har en **TTL**. Rører ikke selgeren kortet innen *n* timer, faller det
  tilbake i puljen. Dette er også hele mekanismen bak «omfordele ved sykdom og fravær» —
  det trenger ikke være en egen funksjon, bare et kortere TTL og en manuell frigjøring.
- Overføring til kollega er et bytte av `assignment` med begrunnelse, og forrige eier
  beholdes i historikken. Spec'ens krav om at en selger skal se hvem som hadde kontakt
  tidligere er dermed dekket av samme tabell.

**Prioriteringsrekkefølgen** skal være én funksjon i `core`, ikke logikk spredt i UI:

1. Avtalt samtaletid som er nå
2. Forfalt oppfølging, eldst først
3. Tilbud sendt uten svar, innenfor gyldighet
4. Kampanjeprioritet
5. Færrest forsøk
6. Eldste siste kontakt

**Maksforsøk, pause mellom forsøk og avslutningsregler** settes per kampanje, med en
systemgrense over. En liste som er «tom» skal si *hvorfor* hver gjenstående person ikke
kan ringes — sperret, utenfor vindu, maks forsøk nådd, låst av annen selger. Ellers
ringer selgerlederen utvikleren.

**Kapasitetsvisning** per selger og liste: tildelt, urørt, påbegynt, oppfølging, avtale.
Direkte fra `list_membership.status`. Denne visningen er selgerlederens hovedskjerm.

---

## 8. Tilbud, avtaler og skriftlig aksept

- **Tilbud** er en entitet med produkt, pris, gyldighet, kanal og status — ikke et notat.
  Uten den kan ikke «åpne tilbud uten neste aktivitet» rapporteres, som spec'en krever.
- **E-post og SMS sendes bare fra godkjente maler.** Levering, avsender og innhold logges
  som `message`. Maler eies av selgerleder, versjoneres, og en sendt melding peker på den
  versjonen som faktisk gikk ut — ikke på malen slik den ser ut i dag.
- **Skriftlig aksept** (§3.5) er et eget felt på tilbudet med kanal, tidspunkt og
  referanse til den mottatte meldingen. Er `requires_written_acceptance` satt på produktet,
  kan salget ikke gå videre uten.
- **Oppgaver og avtaler** varsles etter konfigurerbare regler, og **lederoverføring ved
  fravær og fratredelse** er samme `assignment`-bytte som i §7. Én mekanisme, tre krav i
  spec'en dekket.
- **Kalenderintegrasjon** holdes enveis i første omgang: avtaler i Fa Engine kan skrives
  til selgerens Google-kalender. Toveis kalendersynk er, som toveis Jira-synk, dyrere og
  mer skuffende enn den ser ut.

---

## 9. Salg, betaling og provisjonsgrunnlag

Her er kravet strengere enn i resten av modulen, fordi utdata er lønn.

**Salget opprettes i Sesamy, ikke i Fa Engine.** Selgeren velger produkt fra Sesamys
katalog, og Fa Engine kaller Sesamy (`POST` checkout/ordre) og lagrer `sesamy_order_id`.
Ingen skyggeordre. Feiler kallet, blir salget stående som `venter` med en synlig feil, og
det finnes en kø for manuell utbedring — det er langt bedre enn en rad som ser ferdig ut i
Fa Engine og ikke finnes hos Sesamy.

**Trakten i spec'en får eiere per steg:**

| Steg | Kilde |
|---|---|
| tildelt → forsøkt → kontaktet | Fa Engine (`assignment`, `call_attempt`, resultatkode) |
| tilbud | Fa Engine (`offer`) |
| salg | Fa Engine, men bekreftet av at `sesamy_order_id` finnes |
| aktivert | **Sesamy** (entitlement/abonnement aktivt) |
| betalt | **Sesamy** (første betaling gjennomført) |

De to siste kan ikke eies av CRM-et. Det er også svaret på hvorfor rapporten over
«førstegangsbetaling, manglende betaling, kansellering og kreditering» må bygges på
speilede hendelser og ikke på noe en selger registrerer.

**Provisjonsreglene:**

1. **Provisjon beregnes på hendelse, ikke på registrering.** Et salg blir
   provisjonsberettiget når Sesamy bekrefter første betaling, ikke når selgeren trykker
   «salg».
2. **Tilbakeføring innenfor et definert vindu.** Kansellering, kreditering eller uteblitt
   betaling innen *n* dager reverserer posten. Vinduet er en policy, ikke en
   utviklerbeslutning. **Åpent spørsmål 5.**
3. **`commission_entry` er uforanderlig.** Rettelser skjer med en ny motpost, aldri ved
   endring. Hver post bærer `rule_version`.
4. **Perioden låses.** Når en periode er sendt til lønn, fryses grunnlaget. Etterslep
   havner i neste periode med referanse til den forrige.
5. **Manuelle justeringer er tillatt, men aldri usynlige.** Egen posttype, med begrunnelse,
   godkjenner og logg.
6. **Selgeren ser sitt eget grunnlag fortløpende**, med lenke til hvert underliggende
   salg. Det er den billigste måten å halvere antallet provisjonsdiskusjoner.

**Ikke bygg en formeleditor for provisjon.** Reglene kodes, versjoneres og testes. En
konfigurerbar provisjonsmotor er den typen fleksibilitet som gjør at ingen tør endre noe
etterpå.

---

## 10. Bedriftskort og berikelse

Spec'ens «ønskelig»-punkt — ansatte, bransje, omsetning, roller og styreverv i
kundebildet — er nesten gratis, fordi kildene er åpne:

- **Enhetsregisteret** (åpent API hos Brønnøysundregistrene): organisasjonsnummer, navn,
  næringskode, antall ansatte, adresser, status.
- **Regnskapsregisteret** (åpent API): nøkkeltall fra siste årsregnskap — omsetning,
  resultat.
- **Roller og styreverv**: tilgjengelig via Enhetsregisterets rolleopplysninger. Dekning
  og bruksvilkår må verifiseres før dette vises i kundekortet.

**Krav:** berikelse er en jobb i `worker`, cachet med `fetched_at` og vist med kilde og
dato i kortet. Aldri et synkront kall i ringeløkken — kortet skal være framme før
samtalen starter. Kommersielle berikelseskilder (Proff, Enin og liknende) vurderes først
hvis det åpne datasettet viser seg utilstrekkelig; start gratis.

For B2B-delen som overtar det gamle fase 5: `account` med seter, fornyelsesdato,
kontaktpersoner, pipeline med få steg, og Sesamys B2B-funksjonalitet (setelisensiering,
domenetilgang, SSO, fakturering) som underliggende system. Fa Engine eier relasjonen og
fornyelsesarbeidet, ikke setene.

---

## 11. Roller og tilgang

Rolletabellen i spec'en lister «Selgerleder» fem ganger med fem ulike behov. Det er
åpenbart en redigeringsfeil, men den skjuler en reell beslutning: **fire av de fem
behovene bør ikke ligge hos samme rolle.** Kontroll av betaling og provisjonsgrunnlag hos
den som også setter salgsmål er en dårlig arbeidsdeling, og integrasjoner og sletting hos
en salgsleder er en dårlig sikkerhetsmodell.

Forslag, fem roller:

| Rolle | Kan |
|---|---|
| `selger` | Egne tildelinger, egne kunder, egne resultater og eget provisjonsgrunnlag |
| `selgerleder` | Fordele og omfordele, se og godkjenne teamets arbeid, opprette lister, priser, kampanjer og maler, følge teamresultater |
| `økonomi` | Kontrollere ordre, betaling, kreditering, låse og eksportere provisjonsgrunnlag. Ingen operative endringer |
| `analytiker` | Aggregerte KPI-er og trender, ingen skriverettigheter, ingen enkeltkundeoppslag utover det rapporten krever |
| `admin` | Integrasjoner, felt, tilgang, logg, innsyn, sletting, reservasjonsregler |

Rollene legges til dem som finnes i `fa-engine-plan.md` §5 (`salg` / `support` / `produkt`
/ `admin`), og `salg` splittes i de tre første. Tilgang til kundekort logges — ved innsyn
etter GDPR må dere kunne svare på hvem som har sett hva.

---

## 12. Rapporter og KPI

Spec'ens rapportliste er god og kan tas nesten uendret. Tre krav som gjør den brukbar:

1. **Alle tall skal kunne bores ned til postene bak, innenfor brukerens tilgang.** Samme
   prinsipp som evidenskravet på agentlaget: en KPI uten klikkbar bunn er en påstand.
2. **Én definisjonsfil.** Kontaktgrad, konvertering, provisjonsberettiget salg og
   gjennomsnittlig ordreverdi defineres én gang, i kode, og brukes av alle visninger og
   eksporter. Uten dette får dashbordet og lønnseksporten ulike tall for samme uke, og da
   er tilliten borte for godt.
3. **Eksport til Google Sheets og xlsx** som spec'en ber om — men som *eksport av
   rapportgrunnlag*, aldri som en integrasjon noen bygger videre på. Erfaringen fra
   roadmap-arket gjelder her også.

Trakten `tildelt → forsøkt → kontaktet → tilbud → salg → aktivert → betalt` er selve
ryggraden, og med §5 og §9 er hvert steg definert av et felt med én eier.

---

## 13. Integrasjoner — konkret

### Telia

Telia Smart Connect har et **Integrator-API** som dekker det spec'en ber om: klikk-for-å-
ringe, overføring, avslutning av samtale, og — viktigst — **abonnement på hendelser over
WebSocket** med samtalestatus, ringende og oppringt nummer, tidsstempler og retning, samt
kølogg og inn-/utlogging av kø. Full Swagger er tilgjengelig etter innlogging i
løsningen.

**Krav og forbehold:**

- Fa Engine sender ringekommandoen og **speiler** hendelsene. Varighet og antall samtaler
  telles aldri i CRM-et.
- Kobling mellom `call` og `call_attempt` gjøres på normalisert nummer + tidsvindu +
  selgeridentitet. Det kommer til å feile av og til; det trengs en kø for uparede
  samtaler, ikke stille tap.
- **Ingen prediktiv oppringing.** Progressiv og manuell klikk-for-å-ringe. Prediktiv
  dialer gir forlatte samtaler, som er både et omdømme- og et regelverksproblem, og den
  gir ingen målbar gevinst på abonnementssalg i dette volumet.
- Verifiser først: at Hegnar faktisk har **Smart Connect** og ikke et annet Telia-produkt
  (Bedriftsnett, ACE), og hva Integrator-API-et koster på deres avtale. **Åpent
  spørsmål 3.**

### Sesamy

Dokumentert i utviklerdokumentasjonen: REST-API-er for abonnementer (`GET` liste og
enkeltoppslag), entitlements, produkter, brukere (`GET` liste og enkeltoppslag, `POST`
opprett) og checkout (`POST`), med API-nøkler, OAuth 2.0 eller JWT, samt webhooks.

**Må avklares før koding — dette er blokker nummer to:**

1. Kan en bruker slås opp på **telefonnummer**? (Se §4.3. Alt henger på dette.)
2. Hvilke **webhook-hendelser** finnes konkret — fornyelse, første betaling, mislykket
   betaling, kansellering, kreditering? Trakten fra `aktivert` til `betalt` er ikke
   byggbar uten disse, og polling er et dårlig andrevalg for et provisjonsgrunnlag.
3. Kan en **ordre opprettes på vegne av** en selger, med selger- og kampanjereferanse som
   følger med, slik at attribusjonen ikke må gjenskapes med tidsstempler?
4. Finnes et **sandkasseremiljø**? Uten det kan ikke provisjonslogikken testes forsvarlig.

### Reservasjonsregisteret

SFTP-abonnement fra Brønnøysundregistrene, nattlig vask (§3.1). Egen jobb i `worker`, egen
`event`-logg, hard sperre ved for gammel sjekk.

### Brønnøysundregistrene, åpne data

Enhetsregisteret og Regnskapsregisteret for bedriftsberikelse (§10). Ingen avtale
nødvendig, ingen kostnad.

### E-post, SMS, kalender

Google Workspace for e-post og kalender. SMS gjennom **én** leverandør bak et
`MessageProvider`-grensesnitt, samme mønster som `SubscriptionProvider` og `LLMProvider`.
Levering kvitteres tilbake og logges på `message`.

### Økonomi- og lønnssystem

Provisjonsgrunnlaget eksporteres, det integreres ikke. Filformat og mottakssystem er
**åpent spørsmål 6**.

---

## 14. Migrering fra dagens løsning

Uten å vite hvilket system dagens CRM er (**åpent spørsmål 1**), gjelder tre regler:

1. **Sperrer, reservasjoner og trukne samtykker migreres først, og fullstendig.** Dette er
   det eneste datasettet der et tap er et lovbrudd og ikke en ulempe. Migreres separat,
   verifiseres med antall, og signeres av selgerleder før noe annet importeres.
2. **Eierskap og aktive avtaler migreres.** En selger som mister en avtalt samtale i
   overgangen, mister tilliten til verktøyet i uke én.
3. **Historikk migreres etter beste evne, og det er greit at den blir tynn.** Samme
   holdning som til de 112 punktene uten Jira-nøkkel i roadmap-importen: den blir riktig
   fra importdagen.

Kjør importen mot testdatabase minst tre ganger, med en gjennomgangsvisning for det som
ikke lot seg tolke — ikke `NULL`-verdier ingen ser.

---

## 15. Bygg vs. kjøp

Ærlig svar: **dette er den delen av Fa Engine der hyllevaren er mest moden, og der
argumentet for å bygge er svakest — men det holder, hvis dere deler oppgaven riktig.**

| | Kjøpe en telemarketingsuite | Bygge i Fa Engine |
|---|---|---|
| Ringing, køer, ringemoduser, opptak | Ferdig i dag | Skal ikke bygges uansett — Telia gjør det |
| Ringelister, fordeling, forsøksregler | Ferdig, godt gjennomarbeidet | 3–4 uker |
| Compliance mot nasjonale registre | Delvis, varierende for Norge | Må bygges, men er kjent arbeid |
| Provisjonsgrunnlag koblet til Sesamy-betaling | Nei — eller via egen integrasjon | Kjernen i verdien |
| Kundekort med abonnementshistorikk fra Sesamy | Krever integrasjonsprosjekt | Direkte |
| «Hvorfor sier folk nei» inn i produktroadmapet | Nei | Nesten gratis (§5) |
| Tid til første produktive selger | 4–8 uker | 12–16 uker |

Markedet finnes og er reelt — Adversus er en av de mest utbredte i Norden på utgående salg, med
prediktiv, progressiv og manuell oppringing, opptak, lead-håndtering og API. Ingen av dem
kobler seg til Sesamy, til feedback-modulen eller til roadmapet, og ingen av dem eier
provisjonsgrunnlaget deres.

**Anbefaling, delt i tre:**

1. **Kjøp aldri en dialer inn i Fa Engine.** Telefonilaget er Telias, og Integrator-API-et
   dekker behovet.
2. **Bygg CRM-laget.** Verdien ligger i skjøten mot Sesamy og mot resten av Fa Engine,
   akkurat som i hovedplanens §1. Et innkjøpt ringesystem løser telemarketing og etterlater
   dere med en fjerde datasilo — og en fjerde integrasjon å vedlikeholde.
3. **Men vær ærlig om tiden.** Trenger telemarketing en ny løsning innen tolv uker, og
   Fa Engine er i fase 0–1, er tidsplanene uforenlige. Da er det riktige valget et
   innkjøpt ringesystem som **bro**, med en bevisst plan for å hente dataene inn i
   Fa Engine senere — ikke å haste fase 5 foran fase 1 og 2.

**Beslutningsregelen:** har dagens løsning under seks måneder igjen å leve, kjøp bro. Har
den mer, bygg. Det er det eneste spørsmålet som avgjør dette, og svaret finnes hos
telemarketing, ikke i et arkitekturdokument. **Åpent spørsmål 2.**

---

## 16. Faseinndeling og estimat

`fa-engine-plan.md` §4 setter fase 5 til 6–8 uker. Med provisjonsgrunnlag, betalings-
speiling og et juridisk kontrollag er det for lavt. Delt i fem leveranser, hver med egen
verdi:

| | Innhold | Varighet | Ferdig når |
|---|---|---|---|
| **5a** | Kundegraf, kundekort, Sesamy-oppslag lesende, `identity_link`, E.164-normalisering, Brreg-berikelse | 3–4 uker | En selger kan slå opp en kunde og se abonnementshistorikken |
| **5b** | Ringelister, kampanjer, fordeling og låsing, resultatkoder, Telia klikk-for-å-ringe, reservasjonsvask, ringevinduer, sperrer | 4–5 uker | Telemarketing ringer produktivt fra Fa Engine. **Dette er MVP** |
| **5c** | Tilbud, oppgaver og avtaler, e-post/SMS-maler, skriftlig aksept, overføring ved fravær | 3 uker | Ingen bruker Excel eller egen kalender ved siden av |
| **5d** | Salg → Sesamy-ordre, betalingsspeiling, provisjonsgrunnlag, rapporter, eksport | 4–5 uker | Provisjonen for én periode er kjørt i Fa Engine og stemmer med lønn |
| **5e** | B2B-pipeline, fornyelser, setebruk, churn-signaler, oppsalgsforslag | 4–6 uker | B2B-selgerne har forlatt Excel |
| | **Sum** | **18–23 uker** | |

Rekkefølgen er ikke forhandlingsbar på ett punkt: **5b kan ikke leveres uten det juridiske
kontrollaget i §3.** Det er ikke en fase 5d-oppgave man tar senere.

Parallelliserbart: 5a og 5b er ett spor. 5d kan starte når 5b er i produksjon, hvis Sesamy-
avklaringene er på plass. 5e er reelt et eget prosjekt og bør ikke blande seg inn i
telemarketing-leveransen.

---

## 17. Ikke bygg dette

- **Prediktiv dialer.** Forlatte samtaler, regelverksrisiko, ingen gevinst i dette volumet.
- **Samtaleopptak i Fa Engine.** Hører hjemme i telefonilaget, hjelper ikke mot
  skriftlighetskravet, og gir en tung personvernbyrde.
- **Eget produkt- og priskatalog.** Sesamy eier det. To kataloger gir garantert avvik på
  pris, og pris er det selgeren sier høyt i telefonen.
- **Egen fakturering, purring eller betalingshåndtering.** Sesamy.
- **Formeleditor for provisjon.** Kodede, versjonerte regler.
- **Egendefinerte felt og arbeidsflytbygger.** Samme konklusjon som i roadmap-modulen: det
  er slik interne verktøy blir uvedlikeholdbare.
- **Fritt konfigurerbare resultatkoder.** §5.
- **Toveis synk av noe Sesamy eier.** Les, eller skriv gjennom Sesamys API. Aldri begge.
- **Lead-scoring med maskinlæring i første versjon.** Prioriteringsregelen i §7 er
  deterministisk og forklarbar. Kom tilbake til dette når det finnes seks måneder med
  resultatkoder — da er det også mulig å måle om det virker.
- **Automatisk sammenslåing av duplikater.** §4.4.

---

## 18. Adopsjonskriterier

Måles før 5b kalles ferdig:

| Kriterium | Måles slik |
|---|---|
| Dagens CRM er forlatt | Null innlogginger i 14 dager |
| Samtaleløkken er rask nok | Stoppeklokke: ferdig samtale, registrert utfall, neste kunde framme — under 10 sekunder uten skjermbytte |
| Kundekortet er til å stole på | Selger finner abonnementshistorikk på minst 90 % av oppringte som er kunder |
| Ingen ringer noen de ikke skal | Null oppringninger utenfor ringevindu, null mot reservert uten dokumentert unntak, over 30 dager |
| Ingen prospekt ringes dobbelt | Null tilfeller av to aktive tildelinger på samme person |
| Provisjonen stemmer | Én full periode kjørt parallelt med dagens metode, avvik forklart post for post |
| Selgerleder har sluttet å spørre utvikleren | Null forespørsler om «hvorfor er lista tom» — visningen svarer selv |

Det nest siste er det som avgjør om modulen får leve. Et provisjonsgrunnlag som er feil én
gang, blir aldri stolt på igjen.

---

## 19. Åpne spørsmål

Rangert etter hva som blokkerer mest.

1. **Hvilket CRM brukes i dag, og kan vi få en full eksport?** Avgjør migreringen (§14) og
   halve tidsplanen.
2. **Hvor lenge lever dagens løsning?** Under seks måneder → kjøp bro. Over → bygg (§15).
3. **Hvilket Telia-produkt har Hegnar, og er Integrator-API-et med i avtalen?** Smart
   Connect, Bedriftsnett eller ACE — svaret endrer §13.
4. **Gjelder avisunntaket fra skriftlig aksept også et rent digitalt abonnement?**
   Juridisk avklaring. Endrer salgsflyten for alle digitale produkter (§3.5). Samtidig:
   sett oppbevaringstider per datatype (§3.7).
5. **Hvordan beregnes provisjon i dag, konkret — og hvor lenge er tilbakeføringsvinduet?**
   Uten dette kan ikke §9 spesifiseres ferdig.
6. **Hvilket lønns- og økonomisystem skal ta imot provisjonsgrunnlaget, i hvilket format?**
7. **Sesamy:** oppslag på telefonnummer, webhook-katalog, ordre på vegne av selger,
   sandkasse (§13). Og når er Sesamy i produksjon for Finansavisen?
8. **Hvor mange selgere, og hvor mange samtaler per dag?** Volumet avgjør om
   `assignment`-låsingen trenger å være noe mer enn en unik indeks.
9. **Selges det til bedrifter i samme telemarketing-operasjon, eller er B2B et eget team?**
   Avgjør om 5e hører til denne modulen eller er et eget prosjekt.

---

## 20. Det ene å ta med videre

Kravspec'en er god på arbeidsflaten og undervurderer to ting: at **et salg ikke er et salg
før Sesamy sier det er betalt**, og at **det juridiske laget er infrastruktur, ikke en
rutine**. Får dere de to riktige, er resten håndverk.

Og den ene funksjonen som ikke står i spec'en, men som er grunnen til at dette hører
hjemme i Fa Engine i stedet for i et innkjøpt ringesystem: **hver «nei takk» med en grunn
blir et signal i feedback-modulen.** 200 samtaler om dagen er Finansavisens største
uutnyttede kilde til å forstå hvorfor folk ikke abonnerer.

---

*Kilder: `CRMsystem for telemarketing.pdf` (kravspec, lest 12. august 2026) ·
[Forbrukertilsynets veiledning om regelverket ved telefonsalg](https://www.forbrukertilsynet.no/lov-og-rett/veiledninger-og-retningslinjer/forbrukerombudets-veiledning-regelverket-telefonsalg) ·
[Regjeringen.no om telefonsalg](https://www.regjeringen.no/no/tema/forbruker/telefonsalg/id750957/) ·
[angrerettloven kap. 3](https://lovdata.no/dokument/NL/lov/2014-06-20-27/KAPITTEL_3) ·
[Reservasjonsregisteret hos Brønnøysundregistrene](https://www.brreg.no/en/about-us-2/our-registers/about-the-central-marketing-exclusion-register/) og
[priser for direktemarkedsføringsdata](https://www.brreg.no/en/use-of-data-from-the-bronnoysund-register-centre/subscription/information-for-use-in-direct-marketing/) ·
[Enhetsregisterets åpne API](https://data.brreg.no/enhetsregisteret/api/dokumentasjon) ·
[Regnskapsregisterets åpne API](https://github.com/brreg/regnskapsregister-api) ·
[Sesamy developer documentation](https://developers.sesamy.com/) og
[API-referanse](https://developers.sesamy.com/api/) ·
[Sesamy features](https://sesamy.com/features) ·
[Telia Smart Connect Integrator-API](https://www.telia.no/bedrift/telefoni-og-kundebetjening/telia-smart-connect/telia-smart-connect-hjelpesider/integrasjons-api/) ·
[Adversus](https://www.adversus.io/telemarketing-software) ·
`fa-engine-plan.md`, `fa-engine-roadmap-krav.md`, `fa-design-system.md` (prosjektminne)*

*Juridiske henvisninger er lest fra Forbrukertilsynets veiledning (oppdatert april 2020) og
regjeringen.no. Ordlyden i markedsføringsloven og angrerettloven bør verifiseres mot
gjeldende tekst av juridisk før modulen bygges — særlig §3.5.*
