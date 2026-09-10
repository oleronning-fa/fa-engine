# Fa Engine fase 1 — roadmap-modulen

## Kartlegging av dagens regneark og kravene som følger av det

*v0.2 · august 2026 · basert på `Fa Teams — Big Headlines — Allocation Plan.xlsx`*

> **Endret i v0.2:** hyperlenkene i arket viser at 69 % av punktene allerede er Jira-saker. Det snur konklusjonen om Jira-integrasjon (§3.1) og forenkler statusmodellen betydelig. Bekreftet av OC: Jira er den ekte kilden for utviklingsarbeid.

---

## 1. Hva arket faktisk inneholder

| | |
|---|---|
| Faner | **15** — `Work in Progress`, `Next to do`, 11 × `Done MMYY` (okt. 2025 – aug. 2026), 2 skjulte |
| Punkter totalt | **356** reelle linjer (ekskl. seksjonsoverskrifter) |
| Levert siste 12 mnd | **285** |
| Snitt siste 6 mnd | **~30 punkter i måneden** |
| Backlog i dag | 45 punkter i `Next to do` |
| Aktivt nå | 22 punkter i `Work in Progress` |
| Personer involvert | 2 koordinatorer, ~14 utførende |
| **Punkter med Jira-lenke i tittelen** | **244 av 356 (69 %)** — se §3.1 |

### To ulike skjemaer i samme dokument

`Work in Progress` og alle `Done`-fanene deler ett oppsett:

`Epic / Task` · `Owner` · `Team` · `Status` · `Ballpark Est` · `Actual Dev Est` · `Estimated delivery date` · `Final Delivery Date` · `Comment`

`Next to do` har et helt annet:

`Prio` · `Epic` · `Owner` · `WiP - Fa Roadmap 2026 / Comment`

Ingen status, ingen estimater, ingen datoer i backloggen. Det betyr at **å flytte et punkt fra backlog til arbeid er en manuell omskriving**, ikke en statusendring. Det er det første som skal forsvinne.

### Struktur som ligger i tekst, ikke i felter

Fire ting bæres av konvensjon i stedet for av data:

- **Kategori** er radoverskrifter i kolonne B: `DEVELOPMENT epic`, `DEVELOPMENT task`, `DESIGN`. En visuell skillelinje, ikke et felt man kan filtrere på.
- **Beskrivelse** ligger i raden *under* tittelen. `Redpill to AWS` på rad 3, `Switching solution from Redpill to AWS` på rad 4. Ingen kolonne eier den.
- **Underoppgaver** markeres med `- ` foran tittelen (Bellsheep-nyhetsbrevet i mars har tre slike). Ingen forelder-kobling.
- **Type og flate** ligger i klammer i tittelen: `[research]`, `[bug]`, `[hotfix]`, `[iOS]`, `[Android]`, `[Pagespeed]`, `[Security Headers]`, `[fa-web]`.

Alt dette lar seg importere, men det må gjøres eksplisitt. Se §4.

---

## 2. Prosessen, slik den ser ut fra dataene

```
Next to do  ──►  Work in Progress  ──►  Done MMYY
 (Prio,           (Status: Waiting →      (arkiv, ny fane
  Owner,           Todo → In progress →    hver måned,
  Slack-lenke)     CR → FT → On QA →       flyttes manuelt)
                   Done)
```

Tre stadier, tre steder, to skjemaer, og en manuell arkivering hver måned. Statusflyten i seg selv er god og gjennomtenkt — `CR` (code review) og `FT` (feature test) er reelle porter, ikke pynt.

**Owner vs Team er feil navn på riktig konsept.** `Owner` er Marina på 245 av 330 punkter — hun er koordinator, ikke utfører. `Team` er den som faktisk gjør jobben. To roller, dårlige etiketter. I Fa Engine bør de hete `ansvarlig` og `utfører`.

*(MERK: Owner viste seg senere å være to kolonner, ikke én — se §10 og `fa-engine-roadmap-feltkatalog.md` §1, `owner_id`/`coordinator_id`.)*

**Epics og oppgaver lever side om side med ulik natur.** Epics i WIP har `long term effort` som estimat og `-` som dato: `Redpill to AWS`, `Investorchat`, `Page speed + Personalization`, `FA vibe coding`. De er egentlig arbeidsstrømmer, ikke punkter med en slutt. Det er greit, men de trenger sin egen visning — de forsvinner i en liste sammen med «fjern hvitt felt under headeren».

---

## 3. Hva dataene forteller

Dette er ikke kritikk av arket. Det er evidens for hvilke krav som er ekte og hvilke som bare høres fornuftige ut.

### 3.1 Arket er ikke et roadmap. Det er en rapportlinje over Jira.

Dette lå i hyperlenkene, ikke i celleverdiene, og det endrer designet av modulen.

**244 av 356 punkter (69 %) har allerede en Jira-sak lenket på tittelen.** Fordelt på prosjekt: `FCK` 222 · `FIB` 9 · `FADT` 9 · `FAPPS` 3 · `JB` 1.

Men fordelingen er det interessante:

| Fane | Med Jira-lenke |
|---|---|
| `Next to do` (backlog) | **3 av 45** |
| `Work in Progress`, oppgavedelen | **14 av 14** |
| `Work in Progress`, epic-delen | 0 av 7 |
| `Done`-fanene samlet | **226 av 285 (79 %)** |

Mønsteret er entydig: **når noe blir ekte utviklingsarbeid, får det en Jira-sak.** Arket finnes fordi Jira ikke kan svare på spørsmålene Ole, Magnus og ledelsen har — hva jobber vi med på tvers av fem Jira-prosjekter, i én liste, i et språk en ikke-utvikler forstår, med en leveranseoversikt per måned.

Backloggen er den delen som **ikke** finnes i Jira: 42 av 45 punkter er ideer, Slack-ønsker og forespørsler som ennå ikke er blitt til noe. Det er nøyaktig der Fa Engine har verdi, og nøyaktig der feedback-modulen kobler seg på.

**Konsekvensene er store og forenklende:**

1. **Jira eier gjennomføring. Fa Engine eier intensjon.** Ikke bygg om `CR`, `FT` og `On QA` — det er Jira-tilstander som utviklerne allerede oppdaterer. Statusmodellen i Fa Engine krymper til seks verdier:

   `Ny` → `Under vurdering` → `Prioritert` → `I Jira` (speilet) → `Levert` · `Avvist`

2. **Envegs lesesynk fra Jira**, ikke toveis. Gitt en saksnøkkel: hent status, løsningsdato og utfører. Ingen skriving tilbake, aldri. Det er en av de billigste integrasjonene som finnes — og den avliver den manuelle månedsarkiveringen helt, fordi et punkt flytter seg til `Levert` når Jira sier det er ferdig.

3. **De 226 leverte punktene kan berikes fra Jira-API-et ved import**: ekte opprettelsesdato, løsningsdato, utfører, komponenter, etiketter, epic-kobling, beskrivelse. Historikken i §6 blir dermed langt rikere enn regnearket alene tilsier.

4. **De 7 epicene er den delen som bare finnes i arket.** `Redpill to AWS`, `Investorchat`, `Page speed + Personalization`, `FA vibe coding`. Ingen Jira-nøkkel, ingen sluttdato, `long term effort` som estimat. Det er arbeidsstrømmer på ledelsesnivå, og de er en av to grunner til at arket eksisterer i det hele tatt. De trenger sin egen visning.

### 3.2 Estimatene er død funksjonalitet

| Måned | Punkter | Ballpark utfylt | Faktisk estimat utfylt |
|---|---|---|---|
| mars 2026 | 37 | 31 | 26 |
| april | 29 | 20 | 17 |
| mai | 24 | 18 | 12 |
| juni | 28 | 11 | 4 |
| **juli** | **43** | **0** | **0** |
| august | 3 | 0 | 0 |

To kolonner ble opprettholdt i et halvår og så sluttet folk. Ingen bestemte det; kostnaden var bare høyere enn verdien. **Krav som følger av dette:** ikke bygg obligatoriske estimatfelt. Gjør estimat valgfritt (t-skjorte-størrelse, ikke timer), og utled ledetid automatisk fra statusloggen i stedet — den koster ingen ekstra tasting og gir bedre svar enn `2h-4h` gjorde.

Til sammenligning: `Final Delivery Date` er utfylt på 94 % av alle leverte punkter. Det feltet har folk faktisk bruk for.

### 3.3 Navnevariantene ødelegger all aggregering

Nedtrekkslistene i arket er ufullstendige, så folk skriver fritt ved siden av dem:

- Samme person: `Sina T.` · `Sina T` · `Sinisa T` · `Sinisa T.` · `Siniša T` — fem skrivemåter
- Samme person: `Sina M.` · `Sinisa M` · `Sinisa M.` — tre
- Delt eierskap: `Marina / OC` · `Marina/Kula` · `Marina / (Magnus)` · `Kula, Andrej` · `Kula/Andrej` — fritekst i et felt som burde vært en relasjon

Resultat: 22 unike verdier i `Owner` for 2 faktiske personer, og 24 i `Team` for ~14. Ingen kan svare på «hva har Carlo levert i år» uten å telle for hånd.

### 3.4 Datoene kan ikke sorteres

De fleste er tekst med etterfølgende punktum: `03.08.2026.`. Noen få er ekte datoer: `2026-07-01 00:00:00`. `10.-14.08.2026.` er et intervall skrevet som tekst. Ingen tidslinje, ingen forsinkelsesvarsler, ingen «hva skulle vært levert forrige uke».

### 3.5 Statusverdier utenfor validering

Nedtrekkslista er `Waiting, Todo, In progress, CR, FT, On QA, Done`. I dataene finnes også `Won't do` (3) og `Outdated` (1) — reelle utfall som mangler i modellen. De skal med.

### 3.6 Prioritet er to skalaer i én kolonne

`High` / `Medium` / `Low` på oppgaver, `1.0` på epics, og `?` på ett punkt. Backlogen har 45 punkter og 24 av dem har prioritet. De øvrige 21 er usortert.

---

## 4. Felt-for-felt mapping til Fa Engine

| I dag | Blir til | Merknad |
|---|---|---|
| `Epic / Task` (tittel) | `title` | Klammeprefikser strippes ut til egne felt ved import |
| raden under tittelen | `description` | Ekte felt, markdown |
| `- ` foran tittel | `parent_id` | Reell forelder-barn-relasjon |
| seksjonsrad `DEVELOPMENT epic` | `type = epic` | |
| seksjonsrad `DEVELOPMENT task` | `type = task` | |
| seksjonsrad `DESIGN` | `discipline = design` | Design er en disiplin, ikke en type. Et designpunkt kan være både epic og task. |
| `[bug]`, `[hotfix]` | `type = bug`, `priority = hotfix` | |
| `[research]` | `type = research` | |
| `[iOS]`, `[Android]`, `[Pagespeed]` | `area` | Se taksonomien i §7 |
| `Owner` | `owner_id` → person | **Omdøpes til «ansvarlig»**. Relasjon, ikke tekst. |
| `Team` | `assignee_ids[]` → personer | **Omdøpes til «utfører»**. Flere tillatt, som i dag. |
| `Status` | `status` | **Krymper til 6 verdier** (§3.1). `CR`/`FT`/`On QA` avvikles — de eies av Jira. `Won't do` og `Outdated` slås sammen til `Avvist` med begrunnelse. Hver endring logges. |
| hyperlenke på tittelen | **`jira_key`** | Førsteklasses felt. Speiler status og løsningsdato envegs fra Jira. |
| `Prio` | `priority` | Én skala: `Hotfix / Høy / Medium / Lav`. `1.0` og `?` avvikles. |
| `Ballpark Est` | `size` (valgfri) | `S / M / L / Løpende`. Ikke obligatorisk. |
| `Actual Dev Est` | *avvikles* | Erstattes av ledetid utledet fra statusloggen |
| `Estimated delivery date` | `target_date` | Ekte dato. Intervaller løses med `target_week`. |
| `Final Delivery Date` | `completed_at` | Settes automatisk når status blir `Done` |
| `Comment` / Slack-lenke | **`sources[]`** | Se under — dette er det viktigste feltet i hele modulen |
| `Done MMYY`-fanene | *forsvinner* | Blir et filter på `completed_at`. 11 faner erstattes av én visning. |
| — *nytt* | `area` | Produktflate. Bindeleddet til feedback-modulen. |
| — *nytt* | `status_log[]` | Hvem, hva, når. Grunnlaget for all måling. |
| — *nytt* | `theme_ids[]` | Kobling til feedback-temaer |

### `sources[]` er der de to modulene møtes

Kommentarkolonnen i `Next to do` er allerede en kildehenvisning — den gjør bare jobben manuelt:

| Kildetype | Antall av 45 backlog-punkter |
|---|---|
| Slack-permalink | **20** |
| «Line 22» / «Line 46» — radnummer i et *annet* dokument | 4 |
| Jira-lenke | 1 |
| Annen tekst | 4 |
| Ingenting | 16 |

Nesten halve backlogen peker allerede tilbake til en Slack-samtale. Det er nøyaktig den koblingen §3 i hovedplanen skal automatisere. Konkret betyr det at `sources[]` må ha førsteklasses støtte for:

- **Slack-permalink** — hentes inn, viser kanal, avsender, dato og utdrag i verktøyet, uten å måtte klikke ut
- **Signal** — et feedback-punkt fra fase 2
- **Tema** — en klynge av signaler
- **Ekstern URL** — Jira, facode.no, hva som helst

De fire «Line N»-referansene er den skjøreste konstruksjonen i hele arket: radnummer i et regneark som endres hver uke. De må løses opp manuelt ved import — ingen automatikk kan gjette hva rad 22 var.

Kanalene som allerede fungerer som feedback-kilder, og som bør kobles på i fase 2: `C055TQURJFQ`, `GQDC5PQMT`, `C03KCLQ9WUA`, `C04V6MU1CH4`, `C0ACSND7GSZ`.

---

## 5. Importen er ikke triviell — spesifikasjon

Engangsjobb, men den må kjøres flere ganger mot en testdatabase før den treffer.

1. **Les alle 13 synlige faner.** Fanenavnet `Done MMYY` gir `completed_month` som fallback når `Final Delivery Date` mangler.
2. **Del i seksjoner** på radene `DEVELOPMENT epic` / `DEVELOPMENT task` / `DESIGN`. Alt under en seksjonsrad arver `type` og `discipline` til neste seksjonsrad.
3. **Slå sammen beskrivelsesrader.** En rad med verdi kun i kolonne B, og ingen owner/status, er en beskrivelse av raden over. Unntak: rader som starter med `- ` er underoppgaver, og rader som er en bar URL (`JIRA board: …`) er en kilde, ikke en beskrivelse. Tre regler, og de dekker alt jeg fant.
4. **Trekk ut klammeprefikser** fra tittelen til `type` og `area`. Behold original tittel i `raw_title` for sporbarhet.
5. **Normaliser personnavn** mot en manuelt vedlikeholdt aliastabell. Denne må skrives for hånd én gang — det er ~20 linjer og den er verdt hvert minutt.
6. **Parse datoer** med tre mønstre: `DD.MM.YYYY.`, ekte datetime, og intervall `DD.-DD.MM.YYYY.` → `target_week`. Alt som ikke matcher havner i `import_notes` for manuell gjennomgang, ikke i en `NULL` som ingen ser.
7. **Utled område** med regelbasert nøkkelordmatching (se §7), og la en LLM foreslå for restene. **Ingen automatisk skriving** — hele importen legges i en gjennomgangsvisning der Marina bekrefter område på de ~90 punktene reglene ikke treffer. Det er en times arbeid og det setter kvaliteten på alt agentlaget gjør senere.
8. **Les hyperlenkene, ikke bare celleverdiene.** 244 titler bærer en Jira-nøkkel i lenken uten at den står i teksten. Det var det jeg selv oversåg i første gjennomgang, og det er den enkeltfeilen som ville kostet mest.
9. **Berik fra Jira-API-et** for alle punkter med nøkkel: opprettet, løst, utfører, komponenter, etiketter, epic-kobling, beskrivelse. Da får `status_log` ekte datoer for 226 av 285 leverte punkter i stedet for bare måneden fanen het. Dette er også hvordan områdefeltet kan utledes mye mer presist enn nøkkelordmatching — Jira-komponenter er allerede en taksonomi.
10. **Skriv `status_log`** med det vi nå vet. For de 112 uten Jira-nøkkel blir historikken tynn. Det er greit — den blir riktig fra importdagen.

**Alle 285 leverte punktene importeres, ikke bare backloggen.** Det er ikke nostalgisk arkivarbeid, se §6.

---

## 6. Hvorfor historikken er verdt mer enn backloggen

285 leverte punkter med dato, utfører og område er treningsgrunnlaget agenten i fase 3 trenger for å være noe annet enn en tekstgenerator:

- **«Er dette allerede løst?»** Steg 4 i ukesagenten er semantisk matching mot roadmapet. Uten Done-historikken kan den bare matche mot 45 backlog-punkter. Med den matcher den mot 330, og kan svare *«dette ble levert 21. juli — kanskje fiksen ikke virket?»* Det er en helt annen type svar.
- **Kapasitetsforankring.** ~30 punkter i måneden er et målt tall. Agenten kan si «dette området har fått 3 punkter i år av 285» i stedet for å ha en mening om prioritet.
- **Ledetid som baseline.** Fra importdagen måles den ekte; historikken gir grovkalibrering.
- **Områdetaksonomien testes mot virkeligheten** i stedet for å bli funnet på i et møte. Det gjorde jeg allerede — se under.

---

## 7. Områdetaksonomi, utledet fra de faktiske 356 punktene

Dette er §2 i hovedplanen, nå med tall bak. Jeg kjørte nøkkelordmatching over alle titlene:

| Område | Treff | Kommentar |
|---|---|---|
| Børs & markedsdata | 84 | Klart største flate. Bør kanskje deles i `Børs & instrumenter` og `Bjellesauer` |
| Artikkel & innhold | 58 | Inkluderer nyhetsbrev og journalistverktøy |
| Forum | 45 | |
| Infrastruktur & teknisk gjeld | 31 | Har ingen bruker-feedback, men fyller kapasitet — må være synlig |
| MittFa & personalisering | 29 | |
| Abonnement & betaling | 28 | Her kommer Sesamy-migrasjonen |
| Sporing & analyse | 18 | Kilkaya, Mixpanel, SEO-schema |
| Watchlist & portefølje | 18 | |
| Annonse | 16 | Egen interessent, egne inntekter |
| Innlogging & konto | 15 | |
| AI & Investorchat | 13 | |
| Ytelse | 13 | |
| App (iOS/Android) | 5 | Lavt i arket, men egen leveransekanal |
| **Uten treff** | **87** | Se under |

De 87 uten treff er en blanding av (a) beskrivelsesrader som importsteg 3 fjerner, (b) rene UI-detaljer uten flate i tittelen — «Spacing updates to the Topp 50», «hvitt felt under headeren» — og (c) reelle hull: `Bedriftsabonnement` og `Selvbetjening B2B` finnes som punkter men ikke som ord reglene fanger.

**Anbefaling: 15 områder.** De 13 over, pluss `Bedriftsabonnement & B2B` og `Annet`. Det er kort nok til å stå i en nedtrekksliste, og langt nok til at «hva har vi gjort for Forum i år» blir et ekte spørsmål med et ekte svar.

**MERK: denne 15-listen er senere konsolidert til en 18-verdis-liste** som også dekker CRM-modulens behov — se `fa-engine-signalkoblingen.md` §5 for den gjeldende taksonomien (`fa-engine-plan.md` §2 hadde en tredje, avvikende liste; alle tre er nå erstattet).

---

## 8. Krav til fase 1

### Må ha — ellers flytter ingen fra arket

1. **Én liste, ikke tre faner.** Backlog, aktivt og levert er statuser, ikke steder. Månedsarkiveringen forsvinner.
2. **Inline redigering som er minst like rask som en celle.** Klikk i feltet, skriv, Tab til neste, Enter for å lagre. Hvis det tar to klikk mer enn Google Sheets, taper vi.
3. **Bulk-endring.** Merk 10 rader, sett status eller utfører. Dette gjør de i dag ved å dra i en kolonne.
4. **Filtrering og gruppering på alle felt**, og **delbar lenke til en filtrert visning**. «Alt Mihovil har i design nå» skal være en URL man limer i Slack.
5. **Hele historikken importert** — alle 356 punktene, søkbare.
6. **Slack-lenker som ekte kilder** med forhåndsvisning, ikke tekst i en kommentarkolonne.
7. **Statuslogg** på alt, fra dag én.
8. **Epic-visning.** De 7 langsiktige arbeidsstrømmene skal ikke drukne i oppgavelista.
9. **Tastaturnavigasjon.** `Cmd-K`, `j`/`k`, `e` for redigering. Dette er ikke pynt — det er hele grunnen til at folk opplever et verktøy som raskere enn et regneark.
10. **Lesetilgang for salg og kundeservice.** De har ikke arket i dag. Fra fase 1 skal de kunne se hva som kommer, slik at fase 2 gir dem noe å melde inn *mot*.

### Bør ha — men ikke hvis det forsinker

- Tidslinje-/kvartalsvisning på epics
- Kommentartråd per punkt
- Slack-varsel ved statusendring på punkter man følger
- Ukentlig oppsummering i Slack (forløperen til ukesagenten — bygg den «dumme» versjonen i fase 1, det er en dags arbeid og den vaner folk til kanalen)

### Ikke bygg

- **Obligatoriske timeestimater.** Dataene viser at de dør. Valgfri t-skjorte-størrelse, ingenting mer.
- **Sprinter, poeng, velocity.** Det ligger i Jira, og ingenting i arbeidsmåten deres antyder at de vil ha det to steder.
- **Utviklingstilstander.** `CR`, `FT`, `On QA` er Jira-tilstander. Å speile dem inn i Fa Engine ville gitt to steder å oppdatere status og garantert avvik.
- **Toveis Jira-synk.** *Dette punktet er endret fra v0.1, der jeg frarådet Jira-integrasjon helt. Med 69 % dekning var det feil.* Men det som skal bygges er **envegs lesing** — hent status og løsningsdato, aldri skriv tilbake. Toveis synk er fortsatt en av de dyreste og mest skuffende integrasjonene som finnes.
- **Egendefinerte felt og arbeidsflyter.** Fristende, og det er slik interne verktøy blir uvedlikeholdbare. Faste felt, endres i kode.
- **Tilbakeskriving til Google Sheet.** Arket settes til lesevisning samme dag importen er godkjent.

---

## 9. Adopsjonskriterier — mål disse før fase 1 kalles ferdig

Fra hovedplanen, nå konkretisert:

| Kriterium | Måles slik |
|---|---|
| Arket er forlatt | Null redigeringer i Google Sheet i 14 dager |
| Registrering er raskere | Stoppeklokke: nytt punkt med tittel, område, ansvarlig, prioritet — under 20 sekunder |
| Promotering er ett klikk | Backlog → aktivt uten omskriving |
| Ingen har mistet noe | Marina bekrefter at alle 356 punktene finnes og er riktige |
| Månedsarkiveringen er borte | Ingen manuell operasjon ved månedsskifte — Jira-synken flytter punktene selv |
| Jira-speilingen er til å stole på | Null avvik mellom Jira-status og Fa Engine over 14 dager |
| Nye brukere er om bord | Minst én fra salg og én fra kundeservice har logget inn og funnet fram |

Det siste er det viktigste, og det er lett å hoppe over. Roadmap-modulen er ikke bare en erstatning for et regneark — det er *inngangsdøra* som gjør at feedback-modulen har et sted å peke i fase 2.

---

## 10. Avklart med OC, 5. august

**«WiP - Fa Roadmap 2026» er et annet Google Sheet.** Det står ikke i noen celle — det er en hyperlenke på *kolonneoverskriften* D1 i `Next to do`, altså selve kolonnenavnet:

`docs.google.com/spreadsheets/d/1nuBY0dVtQvaPG39j1LGKS_QmgspOy8Li_wbTqK0aVUI`

«Line 22», «Line 18», «Line 10», «Line 46», «Line 61» er radnumre i *det* arket. Fem punkter i backloggen peker dit. Det betyr at roadmapet ikke er ett dokument, men to — og det andre er trolig det strategiske nivået (2026-planen) mens dette er gjennomføringsnivået. **Det arket bør også lastes opp**; det avgjør om `epic` i Fa Engine skal ha et nivå over seg (`initiativ` / `mål`).

**Jira er den ekte kilden for utviklingsarbeid, og kjører parallelt.** Bekreftet. Se §3.1 — det er innarbeidet i hele dokumentet.

**Ingen kapasitetsplanlegging.** `Oslo trip`-fanen var en engangsøvelse. Droppet.

### Flere skrivere endrer to ting

Skrivetilgang: OC og Magnus i Oslo, Marina m.fl. i Kroatia. Det er ikke bare et tilgangsflagg — det har to konkrete konsekvenser:

**Verktøyet bør være på engelsk.** Hele arket er på engelsk allerede, fordi utviklingsteamet sitter i Kroatia. Det er den eneste grunnen som trengs. Det betyr en klar deling som må stå i `DESIGN.md`: **interne flater på engelsk, kundevendte flater (chatbot, feedback-skjema) på norsk bokmål** etter designsystemets §11. Feedback fra lesere kommer inn på norsk og skal *vises* på norsk — men agentens oppsummeringer og temanavn bør være på engelsk, siden det er kroaterne som skal handle på dem. Dette er verdt å bestemme nå; det er dyrt å snu senere.

**Samtidig redigering må håndteres eksplisitt.** Google Sheets overskriver i stillhet når to redigerer samme rad, og med tre tidssoner mellom Oslo og Zagreb skjer det. Fa Engine trenger feltnivå-låsing, synlig «endret av X for 2 minutter siden», og en endringslogg per punkt. Det er ikke luksus — det er en av de faktiske grunnene til å forlate regnearket.

### Nye spørsmål

1. **Last opp «WiP - Fa Roadmap 2026».** Er det et nivå over epics, eller en duplikat av det samme?
2. **Skal utviklerne i Kroatia skrive i Fa Engine, eller bare i Jira?** Mitt forslag: bare Jira. Fa Engine speiler status. Da har hver person ett sted å oppdatere, og Marina slipper å synkronisere for hånd.
3. **Har dere en Jira-API-token vi kan bruke til import og lesesynk?** Det er den eneste tekniske avhengigheten i fase 1.
4. **Jira-komponenter og -etiketter** — brukes de systematisk i FCK? Hvis ja, er områdetaksonomien i §7 allerede løst og skal utledes derfra i stedet for fra nøkkelord.

**MERK (bekreftet 20. august, se `fa-engine-roadmap-feltkatalog.md` v0.2):** Owner er bekreftet å være to kolonner, ikke én — `owner_id` («Owner, Hegnar Media», forretningseier) og `coordinator_id` («Owner, Profico», koordinerende rolle). Et eventuelt `initiative`-nivå over Epic er avklart som **ikke aktuelt**.

---

## 11. «WiP - Fa Roadmap 2026» — det strategiske nivået

*Lagt til etter opplasting 5. august.*

Ett ark, 159 rader, 112 punkter fordelt på **14 programmer**. Tre kolonner: `Project`, `Short Description`, `Open Question`. Ingen eier, ingen status, ingen dato, ingen prioritet. Fanen heter `Roadmap 2026 - Not prirotized`, og det er en presis selvbeskrivelse.

Programmene: Bellsheep · All Investor DB · Personalizing Finansavisen · My Fa · Ads (eget roadmap) · User Activation · Fa App (eget roadmap) · Improving the Core Product · Stock Portfolio · Stock Fantasy Competition · AI Generated Content · Journalist Boost · Outperform the manual customer service · Self service for B2B · Parked: Search UX.

### Fargen er statusfeltet, og legenden finnes ikke

Sju fyllfarger over 112 rader, uten forklaring noe sted i dokumentet:

| Farge | Antall |
|---|---|
| Lys gul `FFF2CC` | 30 |
| Rosa `F4CCCC` | 22 |
| Sterk gul `FFFF00` | 13 |
| Grå `999999` | 11 (hele Journalist Boost, merket «NEEDS TO BE UPDATED») |
| Lys lilla `D9D2E9` | 3 (kundeservice) |
| Lys grønn `B6D7A8` | 1 (B2B selvbetjening) |
| Lys oransje `FCE5CD` | 3 (parkert) |

Betydningen finnes bare i hodet på den som fargela. Det er det sterkeste enkeltargumentet i begge arkene for et ekte verktøy, og det må avklares før import — ellers mister vi det eneste statussignalet dokumentet har.

### Dokumentet er frakoblet, ikke gammeldags

Det er ikke det årlige som er problemet. Problemet er at planen ble skrevet i februar og aldri koblet til det som faktisk skjer. Symptomene står i dokumentet selv: «Next Steps TBD», rader med bare «...», og «NEEDS TO BE UPDATED» over et helt program. **Av 112 punkter har 5 en kobling til gjennomføringsarket.** Ingen kan i dag svare på hvor mye av 2026-planen som er levert.

Og radnummer-referansene har allerede begynt å råtne. Fire av fem treffer eksakt, men «Line 46» peker nå på seksjonsoverskriften `User Activation` i stedet for punktet den ble skrevet mot. Én innsatt rad, og resten følger etter.

### Rettelsen er ett hierarki, ikke to dokumenter

Delingen mellom strategi og gjennomføring er riktig i prinsippet. Det som mangler er skjøten. Fire nivåer i samme graf:

`initiative` (de 14 programmene) → `epic` → `item` → `jira_key`

Da blir «hvor mye av 2026-planen er levert» et spørsmål med et svar, ikke et arkeologisk prosjekt.

**MERK: avklart 20. august (§10) — et eget `initiative`-nivå er ikke aktuelt.** Fire-nivå-hierarkiet under er derfor ikke bygget; Epic er toppnivået i den faktiske datamodellen.

### Her ligger potensialet

1. **Reverse-sporing ved import.** 112 planlagte punkter mot 356 leverte. Én semantisk matching forteller hva dere faktisk bygget mot planen — og hvor mye av arbeidet som aldri sto der. Det tallet alene er verdt øvelsen.
2. **`Open Question` er dokumentets beste idé, og den er nesten ubrukt.** Tre av 112 rader har en. En åpen beslutning bør være en entitet med eier og frist, ikke en tom kolonne. `Fa's long-term strategy around Personalization` har stått åpen siden februar og blokkerer fem punkter.
3. **Programmet blir levende.** Ukesagenten rapporterer mot initiativet, ikke bare mot enkeltpunkter: *«Personalizing Finansavisen: 4 av 12 levert, 3 i Jira, 5 urørt siden februar — to av dem har nå 14 feedback-signaler.»* Det er svaret på «gammeldags»: planen står, men den revurderes kontinuerlig mot evidens i stedet for én gang i året.

### Fa Engine står allerede i deres egen 2026-plan

Rad 134–137: *Outperform the manual customer service* → *Research: Map which tasks are handled by Customer Service — OC and Ragnar mapping out cases* → *Chat bots?*

Rad 143–144: *Selv service solution for B2B customers* → *Research: extract data from Zephr into web page with login for b2b clients*

Det er fase 4 og fase 5, parkert på «Research:» og «?». Fa Engine er altså ikke et sideprosjekt utenfor roadmapet — det er gjennomføringen av to programmer som har stått stille siden februar. Legg det inn som et initiativ i verktøyet på dag én, så lukker det de to.

Merk også at rad 144 sier «extract data from Zephr». Zephr erstattes av Sesamy. Nok en bekreftelse på adapteren i §6 av hovedplanen.

---

*Kilder: `Fa Teams — Big Headlines — Allocation Plan.xlsx` (15 faner) og `WiP - Fa Roadmap 2026.xlsx` (1 fane, 159 rader), lest 5. august 2026. Se også `fa-engine-plan.md` for helheten.*
