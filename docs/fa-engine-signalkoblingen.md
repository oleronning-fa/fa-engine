# Fa Engine — signalkoblingen

## Hvordan CRM, idébank, feedback og roadmap blir ett system

*v0.1 · 12. august 2026 · svar på «hvordan får vi dette sammen i samme løsning?»*
*Leses sammen med `fa-engine-plan.md` §2, `fa-engine-idebank.md`, `fa-engine-crm-krav.md` §5*

> **Avgjør tre ting.** (1) Områdetaksonomien konsolideres til **18 verdier** — §5.
> (2) Salgsinnvendinger får en **egen akse**, `signal.objection`, ikke egne
> områder — §6. (3) Telemarketing begynner å registrere avvisningsgrunn **nå**,
> i dagens verktøy, lenge før CRM-modulen finnes — §10. Punkt tre er det eneste
> som haster.

---

## 1. Kortsvaret: de er allerede samme system

Spørsmålet «hvordan kobler vi dem sammen» har samme form som spørsmålet OC
stilte om idébanken 5. august — «et område for idéer, og så en bro til
roadmapet». Svaret er det samme, og av samme grunn: **broen er der problemet
oppstår.**

Idébanken er ikke en modul. Den er `status = Idea` på `roadmap_item`, pluss en
visning. CRM-et er ikke et separat system. Det er en arbeidsflate på den samme
kundegrafen. Skjøten mellom dem finnes allerede i `fa-engine-plan.md` §2, og
den heter `signal`:

```
person ──── signal ──── theme ──── roadmap_item (status: Idea → … → Delivered)
   ▲           ▲                          ▲
   │      source: salgsnotat          konsept fra idébanken
   │      objection: pris             proposed_by: Magnus
   │      area: Abonnement & betaling
   │
CRM: prospekt, samtale, tilbud, salg
```

Det som mangler er ikke en integrasjon. Det er **tre felt, ett kodesett og en
beslutning om rekkefølge.**

Og det er verdt å si hva som faktisk står på spill her, for det er større enn
det ser ut: dette er den ene mekanismen som gjør Fa Engine til noe annet enn tre
verktøy i samme repo. Hovedplanen §1 sier det selv — *verdien ligger i skjøten,
ikke i modulene*. Dette dokumentet er skjøten.

---

## 2. Telemarketing er den største signalkilden Hegnar har

Dette er den delen som er lett å undervurdere, så la oss regne på det.

Alle feedback-kildene i fase 2 har samme skjevhet: **de hører bare fra folk som
allerede er lesere, og som er motiverte nok til å skrive.** Feedback-widgeten,
kundeservice-innboksen, forumet, chatboten — alle sammen. Det er verdifull data,
og den er systematisk blind for én gruppe.

Telemarketing snakker hver dag med **de som sa nei.**

| Kilde | Hvem den hører fra | Volum per år |
|---|---|---|
| Feedback-widget (fase 2) | Lesere som gidder å skrive | Ukjent, trolig hundrevis |
| Kundeservice | Lesere med et problem | Hundrevis til få tusen |
| Forum | Aktive lesere | Løpende, men skjevt utvalg |
| **Telemarketing** | **Folk som ikke abonnerer, og folk som sa opp** | **Titusener** |

Regnestykket, med tall som **må verifiseres** — antall selgere og samtaler per
dag er åpent spørsmål 8 i `fa-engine-crm-krav.md`: seks selgere × 60 oppringninger
per dag × 220 dager ≈ 79 000 forsøk, hvorav kanskje 40 % når fram til rett person
≈ **32 000 reelle samtaler i året**. Er tallet halvparten, er poenget uendret.

Av dem er de fleste et nei. Hvert nei har en grunn. I dag forsvinner den grunnen
i det øyeblikket selgeren legger på.

**Ingen andre i norsk mediebransje har den datastrømmen strukturert.** Det er
ikke en integrasjonsdetalj — det er potensielt det mest verdifulle datasettet i
hele Fa Engine, og det koster ett felt og en `INSERT` å begynne å samle.

I tillegg kommer en kilde til som er gratis: **`cancellationReason` fra Sesamy**.
Hver vinback-liste er per definisjon en liste over folk som sa opp, og
oppsigelsesgrunnen ligger allerede i abonnementssystemet. Den er et signal uten
at noen taster noe.

---

## 3. Signalkontrakten

CRM-modulen skriver aldri i feedback-modulens tabeller. Den kaller én funksjon i
`core`, per modulgrensen i `fa-engine-plan.md` §8:

```ts
// src/core/signals.ts
recordSignal({
  source: 'salgsnotat',
  personId,                    // prospektet ER en person — crm-krav §4.1
  rawText,                     // selgerens egne ord, aldri omskrevet
  occurredAt,
  area,                        // valgfri — én av de 18 (§5)
  objection,                   // valgfri — én av de 10 (§6)
  context: { callAttemptId, campaignId, listId, offeredProductId, offeredPriceNok },
})
```

**Fire regler:**

1. **Rå tekst lagres uendret.** Selgerens formulering er evidensen. Agenten
   oppsummerer; den erstatter ikke. Samme regel som for lesersitater i
   `fa-engine-roadmap-krav.md`: sitater oversettes aldri.
2. **`context` bærer pengene.** Uten tilbudt produkt og pris kan et signal
   telles, men ikke verdsettes. Med dem kan idébanken svare «hva koster denne
   innvendingen oss» — se §7.
3. **Tre resultatkoder skriver signal**, og bare de tre: `ikke_interessert`,
   `allerede_kunde`, `klage`. Det står allerede i
   `fa-engine-crm-krav.md` §5 og i prototypens `domain/rules.ts` som
   `createsSignal`.
4. **Signalet skrives i samme transaksjon som resultatkoden.** Ikke i en
   etterjobb. En feilet etterjobb gir stille datatap i den ene kilden vi ikke
   kan rekonstruere.

### Hva CRM *leser* fra resten av grafen

Koblingen går begge veier, og retningen tilbake er undervurdert:

| Selgeren ser | Kommer fra | Hvorfor det betyr noe |
|---|---|---|
| «Denne personen klaget på levering i mai» | `signal` (kundeservice) | Ikke begynn med en pitch |
| «Fiksen ligger i roadmapet, planlagt november» | `roadmap_item` | Et ekte svar i stedet for en unnskyldning |
| «Dette er tema nr. 3 i år, 84 signaler» | `theme` | Selgeren vet at hun ikke er alene |
| «Konseptet hun etterspør er foreslått av Magnus» | `roadmap_item` status `Idea` | **Men se advarselen i §9** |

De to første er ren gevinst og bør inn i kundekortet i 5a. Den fjerde er den
farlige.

---

## 4. Hvorfor salgsdata ikke passer i områdetaksonomien

Her ligger den tekniske kjernen i hele spørsmålet.

Et lesersignal handler nesten alltid om en **flate**: «jeg får ikke logget inn»,
«forumet er tregt», «kan ikke bytte brukernavn». Det mapper rent til et område.

Et salgsavslag handler nesten aldri om en flate:

> «For dyrt.» · «Jeg leser DN allerede.» · «Har ikke tid.» ·
> «Får det jeg trenger gratis på E24.» · «Vil ikke ha papir i postkassen.» ·
> «Jeg er pensjonist nå.»

Ingen av disse er `Forum` eller `Børs & instrumenter`. Presser man dem inn i
områdelista, skjer to ting samtidig, og begge er dyre: områdelista fylles med
verdier som ikke er flater og slutter å fungere som ruter til en ansvarlig, *og*
salgsdataen mister det som gjør den verdifull — at innvendingen er
sammenlignbar på tvers av alle produkter og kampanjer.

**Løsningen er to akser, ikke én lengre liste:**

|  | `area` | `objection` |
|---|---|---|
| Svarer på | *Hvilken del av produktet?* | *Hvorfor ikke?* |
| Ruter til | Områdeansvarlig, Slack-kanal | Produkt- og prisansvarlig |
| Finnes på | Alle signaler | Bare salgssignaler |
| Kan være tom | Ja | Ja |
| Kodesett | 18 (§5) | 10 (§6) |

Et signal kan ha begge: *«Jeg leser bare Børs-stoffet, og da er 5 490 for mye»*
→ `area: Børs & instrumenter` + `objection: pris`. **Det er nøyaktig det
signalet som blir et konsept om produktpakking**, og det er utelukket i en
enakset modell.

---

## 5. Den konsoliderte områdelista — 18 verdier

Konflikten mellom `fa-engine-plan.md` §2 og `fa-engine-roadmap-krav.md` §7 ble
flagget i `fa-engine-konseptmal.md` §2 og er nå tvingende: en tredje forbruker
(CRM) kan ikke velge mellom to lister. Under er én liste. **Erstatt begge.**

| # | Område | Fra plan §2 | Fra roadmap §7 | Endring |
|---|---|---|---|---|
| 1 | **Børs & instrumenter** | Børs & markedsdata | Børs & markedsdata (84) | Delt, som roadmap §7 selv foreslo |
| 2 | **Bjellesauer** | Bjellesauer | (i Børs) | Skilt ut. Egen flate, egne signaler |
| 3 | **Artikkel, innhold & søk** | Redaksjonelt innhold + Søk | Artikkel & innhold (58) | Slått sammen. Å finne innhold er en del av innholdsflaten |
| 4 | **Nyhetsbrev & varsler** | Nyhetsbrev & varsler | (i Artikkel) | Beholdt. Egen kanal, egne klager |
| 5 | **Forum** | Forum | Forum (45) | — |
| 6 | **MittFa & personalisering** | MittFa | MittFa & personalisering (29) | Roadmap-navnet |
| 7 | **Watchlist & portefølje** | Watchlist & portefølje | Watchlist & portefølje (18) | — |
| 8 | **Papir & eAvis** | Papiravis & distribusjon + eAvis | (i Abonnement) | Slått sammen. Leseren skiller ikke |
| 9 | **Abonnement & betaling** | Betaling & faktura | Abonnement & betaling (28) | Roadmap-navnet. Sesamy-migrasjonen bor her |
| 10 | **Bedriftsabonnement & B2B** | Bedriftsabonnement | Bedriftsabonnement & B2B | — |
| 11 | **Innlogging & konto** | Innlogging & konto | Innlogging & konto (15) | — |
| 12 | **App** | App | App (5) | — |
| 13 | **Annonse** | — | Annonse (16) | **Ny i plan §2.** Egen interessent, egne inntekter |
| 14 | **AI & Investorchat** | — | AI & Investorchat (13) | **Ny i plan §2** |
| 15 | **Sporing & analyse** | — | Sporing & analyse (18) | **Ny i plan §2** |
| 16 | **Ytelse & teknisk plattform** | — | Infrastruktur (31) + Ytelse (13) | Slått sammen. Arbeid uten synlig flate |
| 17 | **Interne verktøy** | — | — | **Ny.** Lukker hullet i konseptmal §2 |
| 18 | **Annet** | Annet | Annet | Må ha eier, ellers blir det en kirkegård |

**Tre merknader.**

`Interne verktøy` løser problemet konseptmal-notatet fant: en kundeservicevisning
av abonnementshistorikk hørte ingen steder hjemme. Den midlertidige regelen der —
*bruk forretningsdomenet den interne flaten betjener* — var fornuftig, men den
gjør Fa Engine selv usynlig i sitt eget roadmap. Med område 17 kan dere svare på
«hvor mye kapasitet går til interne verktøy», og det er et spørsmål ledelsen
kommer til å stille.

`Papir & eAvis` er den mest diskutable sammenslåingen. Argumentet for: for en
leser som ringer kundeservice er «avisa kom ikke» og «eAvis lastet ikke» samme
frustrasjon, og telemarketing selger dem som ett produkt. Argumentet mot: det er
to helt ulike tekniske flater. **Skill dem hvis distribusjon får egen ansvarlig.**

Hver av de 18 trenger fortsatt **én ansvarlig og én Slack-kanal**. Det er
punkt 1 i hovedplanens §10 og fortsatt ikke gjort. Nå har det tre forbrukere som
venter.

---

## 6. Innvendingskodene — 10 verdier

Fast kodesett, endres i kode, samme regel som resultatkodene. Fritekst her
gjenskaper `Owner`/`Team`-problemet fra roadmap-krav §3.3 ett lag tidligere.

| Kode | Selgeren hører | Hvem eier svaret | Blir typisk til |
|---|---|---|---|
| `pris` | «For dyrt for det jeg får ut av det» | Produkt & pakking | Konsept om pakking eller nivå |
| `bruker_det_ikke` | «Jeg leser det ikke ofte nok» | Produkt | Konsept om lettere inngang, varsler |
| `konkurrent` | «Jeg har DN / E24 / Kapital» | Redaksjon & strategi | Posisjoneringsarbeid, ikke et konsept |
| `gratis_alternativ` | «Får det jeg trenger gratis» | Redaksjon & paywall | Paywall-strategi |
| `innhold` | «For lite om det jeg bryr meg om» | Redaksjon | **Har som regel også `area`** |
| `format` | «Vil ikke ha papir» / «vil bare ha papir» | Produkt & distribusjon | Konsept om kanalvalg |
| `tidligere_erfaring` | «Sist gikk det galt» | Kundeservice | **Ofte kobling til et eksisterende tema** |
| `beslutning_hos_andre` | «Det er bedriften/min mann som bestemmer» | Salg | B2B-liste, ikke et produktproblem |
| `livssituasjon` | «Jeg er pensjonert / sluttet i bransjen» | Ingen | Målgruppedata. Renser lister |
| `ikke_oppgitt` | Ingen grunn gitt | — | Telles, men bærer ingen konklusjon |

To av dem er gull, og av motsatte grunner. **`innhold` bærer nesten alltid et
område med seg** — det er signalet som forteller redaksjonen hva folk savner, fra
folk som ikke leser dem. **`tidligere_erfaring` peker på et eksisterende tema** —
det er en klage som allerede finnes i feedback-huben, og nå med en prislapp: den
kostet et abonnement.

`livssituasjon` er ikke et produktproblem, og det er poenget med å ha koden: uten
den forurenser den `ikke_interessert` og får det til å se ut som en innvending
mot produktet. Den skal også kunne fjerne folk fra utvalgsregler permanent.

---

## 7. Tre tellere på et konsept

`fa-engine-idebank.md` §5 beskrev mekanismen som skiller et levende idéområde fra
en kirkegård: **idéer akkumulerer evidens mens de venter.** Med CRM-et koblet på
går det fra én teller til tre.

> **Konsept `2026-08-magnus-weekend-tier`** — «Rimeligere helgeabonnement»
> Område: Abonnement & betaling · Foreslått av Magnus · Status: `Idea`
>
> - **41 lesersignaler** — feedback, forum, kundeservice
> - **212 salgsavvisninger** med `objection: pris` på papirprodukter, siste 90 dager
> - **1,04 MNOK** i tilbudt førsteårsverdi på de 212 *(sum av `offeredPriceNok`)*
> - 3 av 4 kampanjer viser samme mønster

Den tredje linjen er den som endrer et møte. En feature-request-teller er et
argument om popularitet. **En sum i kroner på hva innvendingen kostet i tapt
førsteårssalg er et argument om penger**, og det er den valutaen et mediehus
prioriterer i.

Vær presis på hva tallet er, ellers blir det angripelig: det er
**tilbudt førsteårsverdi på avviste tilbud med denne innvendingen**, ikke tapt
inntekt. Ingen av de 212 ville sagt ja uansett. Det er et *volummål på
motstand*, ikke en prognose, og det skal hete det i grensesnittet.

Fjerde kilde, gratis: **oppsigelsesgrunn fra Sesamy** på samme tema. Da har dere
motstanden fra tre hold — de som aldri kjøpte, de som sluttet, og de som ble og
klaget.

Teknisk er dette ingenting nytt. `roadmap_item.theme_ids[]` finnes i planen fra
før. Ukesagentens steg 4 matcher allerede temaer semantisk mot roadmapet.
Konsepter legges i samme korpus — det står allerede i idébank §5. Det eneste som
er nytt er at signalene nå også kommer fra telefonen, og at noen av dem bærer et
beløp.

---

## 8. Den motsatte sløyfen — og den er den beste delen

Idébanken lukker sløyfen mot leseren: *«ditt konsept shippet, her er hva
feedbacken sier nå.»* Med CRM-et lukkes en sløyfe til, og den har en direkte
kroneverdi.

**Når et konsept leveres, vet Fa Engine nøyaktig hvem som sa nei av den grunnen.**

> Konseptet «Rimeligere helgeabonnement» ble levert 12. november.
> 212 personer avviste et papirtilbud med `objection: pris` mens det var
> uløst. Av dem er **168 ringbare nå** — resten er reservert, sperret eller
> innenfor frekvensvinduet.
> **Opprett gjenvinningsliste?**

Det er en ferdig kampanje, generert av at et produktproblem ble løst, og det er
den enkeltfunksjonen som best rettferdiggjør at dette er ett system og ikke to.
Ingen innkjøpt kombinasjon av Productboard og et ringesystem kan lage den
listen.

**Fire porter, og de er ikke forhandlingsbare** — `fa-engine-crm-krav.md` §3:

1. **Reservasjon** sjekkes på nytt. En liste generert i november på data fra
   august er verdiløs juridisk.
2. **Egen sperre** gjelder uansett. `vil_ikke_kontaktes` betyr for alltid, også
   når vi har gode nyheter.
3. **Frekvenspolicyen** gjelder. Et løst produktproblem er ikke en unntaksgrunn.
4. **Unntaket for eksisterende kundeforhold** kan bare påberopes der det finnes
   en bekreftet `identity_link` — og disse er per definisjon *ikke* kunder.
   Reservasjon stopper dem.

At `ikke_interessert` utløser en **frekvenssperre og ikke en permanent sperre**
er nettopp det som gjør denne listen mulig senere. Det var en bevisst
konstruksjon i resultatkodetabellen, og her er grunnen.

---

## 9. Hvem leverer hva — og én advarsel

`fa-engine-idebank.md` §2 har regelen allerede: **ønske → `signal`. Konsept →
`roadmap_item`.** Den blir viktigere når selgerne kommer inn, ikke mindre.

**Selgere leverer signaler, ikke konsepter.** En selger som har hatt fire
frustrerende samtaler på rad har en mening, ikke et konsept. Konseptmalen krever
problem, omfang, avgrensning og målemetode — timers arbeid med Claude. Å be
selgere om det ville drept både innleveringen og formatet.

Praktisk: én tast i arbeidsflaten (`i`) som lager et `signal` med
`source: salgsnotat`, prospektet som person, og selgerens egne ord. Ferdig.
Attribusjonen følger med. Er ideen god nok, samler den evidens og blir plukket
opp av en som har tid til å skrive den ordentlig — og da er selgeren fortsatt
kreditert som opphav.

**Advarselen:** ikke vis konsepter med status `Idea` i selgerens kundekort.

Idébank §6 sier at en mockup ikke er et løfte, og at konsepter må ha en synlig
`Concept — not committed`-tilstand. Det holder internt. Det holder ikke i en
telefonsamtale. En selger under press som ser «Konsept: rimeligere
helgeabonnement» kommer til å si *«det kommer noe billigere til høsten»* — og da
har Hegnar gitt et løfte om et produkt som ikke er besluttet, muntlig, til en
forbruker, i en samtale som er underlagt opplysningsplikt. Det er ikke et
kommunikasjonsproblem. Det er et forbrukerrettslig problem.

**Regel:** kundekortet viser roadmap-punkter fra og med `Prioritert`, og bare med
kvartalspresisjon. `Idea` og `Under review` er usynlige for salgsflaten.
Selgerlederen ser dem i idébanken, ikke selgeren i samtalen.

---

## 10. Rekkefølge — og det ene som haster

Hovedplanen er tydelig: ingen ny modul før den forrige har daglige brukere. Det
prinsippet står. Men **signalkoblingen er ikke en modul**, og den følger en annen
logikk: den som skriver må komme før den som leser, ellers finnes det ingenting å
lese.

| Når | Hva | Kostnad |
|---|---|---|
| **Nå, før noe bygges** | Telemarketing registrerer avvisningsgrunn med de 10 kodene, **i verktøyet de har i dag**. Regneark, felt i dagens CRM, hva som helst. | En ettermiddag |
| Fase 0 | De 18 områdene + de 10 innvendingskodene i `core`. `signal.objection` i skjemaet. | Timer |
| Fase 1 | `status = Idea`, idébank-visning. Som planlagt i idébank §7. | Uendret |
| Fase 2 | Feedback-huben. Importer avvisningsgrunnene som er samlet siden nå. | Uendret |
| Fase 3 | Ukesagenten matcher temaer mot konsepter **og mot innvendinger**. | Ett korpus til |
| Fase 5b | Resultatkode → `recordSignal()` i samme transaksjon. Ikke 5d. | Én dag |
| Fase 5d+ | Kronetellere og gjenvinningslister. | Del av rapportlaget |

**Øverste rad er hele poenget.** Regnestykket i §2, selv halvert, betyr rundt
**1 300 tapte datapunkter i måneden** — hver måned dere venter. Avvisningsgrunner
lar seg ikke rekonstruere. Ingen husker i november hvorfor noen sa nei i august.

Dette er samme innsikt som idébank §7 hadde om å samle konsepter før visningen
finnes, av samme grunn: **et system som lanseres tomt, dør.** Fase 3-agenten som
kan si «212 avvisninger på pris» første mandagen den kjører, er et helt annet
produkt enn en som må vente et halvår på å bli interessant.

Og det er billig å be om: én kolonne med nedtrekksliste. Kodesettet i §6 er
ferdig. Blir det feil, er det ti verdier å justere — mot et halvår med data som
ellers ikke finnes.

---

## 11. Hva som må endres i eksisterende dokumenter

| Dokument | Endring |
|---|---|
| `fa-engine-plan.md` §2 | Erstatt områdelista med de 18 i §5. Legg `objection` på `signal`. Legg `salgsnotat` inn som kilde med `context`-feltene |
| `fa-engine-roadmap-krav.md` §7 | Erstatt lista med de 18. Behold treffanalysen som begrunnelse |
| `fa-engine-idebank.md` §5 | Utvid etterspørselstelleren fra én til tre. Legg til gjenvinningssløyfen fra §8 |
| `fa-engine-konseptmal.md` §2 | Begge hullene er lukket: lista er konsolidert, `Interne verktøy` finnes. Oppdater `fa-concept`-skillen med de 18 |
| `fa-engine-crm-krav.md` §5 | Legg `objection` på de tre signalskapende resultatkodene. Legg til regelen i §9 om hva salgsflaten ikke får se |
| `DESIGN.md` (fase 0) | Statusnavn oversettes én gang. Konsept-tilstand vises aldri i salgsflaten |

---

## 12. Risiko

| Risiko | Alvorlighet | Håndtering |
|---|---|---|
| **Selger lover et konsept i telefonen** | **Høy** | Konsepter usynlige i salgsflaten. Roadmap vises fra `Prioritert`, kvartalspresisjon. §9 |
| Kronetallet leses som tapt inntekt | **Høy** | Heter «tilbudt førsteårsverdi på avviste tilbud» overalt. Aldri «tapt omsetning» |
| Salgssignaler drukner lesersignaler | Middels | Volumet er 10–50× høyere. Temaer må kunne filtreres på kilde, og agenten må rapportere de to hver for seg før den slår dem sammen |
| Selgere begynner å skrive konsepter | Middels | Én tast lager et signal. Konseptmalen krever den friksjonen den krever |
| Innvendingskodene blir upresise i praksis | Middels | Mål fordelingen etter to uker. Er over 40 % `ikke_oppgitt`, er kodesettet feil eller registreringen for tungvint |
| Gjenvinningsliste bryter reservasjonsreglene | **Høy** | Fire porter i §8, håndhevet i kode. Listen genereres aldri ferdig — den går gjennom samme vask som alle andre |
| Tre tellere gir tre sannheter | Lav | Én definisjonsfil, som kontaktgrad. `fa-engine-crm-krav.md` §12 |

---

## 13. Åpne spørsmål

1. **Hvor mange samtaler har telemarketing i uka, faktisk?** Hele §2 hviler på
   et anslag. Tallet avgjør om dette er den største signalkilden eller bare en av
   dem — og det er et spørsmål noen kan svare på i dag.
2. **Hvem eier hvert av de 18 områdene?** Fortsatt punkt 1 på hovedplanens
   liste over neste steg. Nå med tre systemer som venter på tabellen.
3. **Skal `objection` også registreres av kundeservice?** En oppsigelsessamtale
   har samme struktur som et salgsavslag. Trolig ja, men det er fase 2.
4. **Eksponerer Sesamy `cancellationReason`?** Åpent i `fa-engine-crm-krav.md`
   §13. Det er den gratis fjerde kilden i §7.
5. **Hvem eier innvendingskodene?** Områdene rutes til produkt. Innvendinger
   rutes til pris og pakking — og det er uklart hvem det er hos Hegnar.

---

*Se `fa-engine-plan.md` (helheten) · `fa-engine-idebank.md` (hvorfor idébanken
ser slik ut) · `fa-engine-crm-krav.md` (fase 5) · `fa-engine-crm-feltkatalog.md`
(feltene) · `fa-engine-konseptmal.md` (formatet).*
