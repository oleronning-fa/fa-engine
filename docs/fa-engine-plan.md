# Fa Engine — arkitektur- og utviklingsplan

*v0.1 · utkast til diskusjon · Hegnar Media / Finansavisen · august 2026*

Bygger på: `fa-design-system.md` v1.1, `startsiden/vibecode-template` (AGENTS.md), designskillene `pbakaus/impeccable` og `design-taste`.

Avklart på forhånd: **feedback-hub + roadmap først** · **utvid vibecode-template** · **Slack nå, Sesamy senere (erstatter Unite + Zephr)** · **ekstern LLM med DPA i EU er OK**.

---

## 1. Hva slags system er dette egentlig?

Kort svar: det er ikke ett system, det er **tre produkter på én kundegraf, med et agentlag over**.

Nærmeste kommersielle paralleller:

| Del av Fa Engine | Sjanger | Produkter som gjør dette |
|---|---|---|
| Feedback inn → temaer → roadmap | Product Ops / Voice-of-Customer | Productboard, Canny, Dovetail, Enterpret |
| Chatbot med selvbetjening | Support-deflection | Intercom Fin, Zendesk AI |
| Abosalg / B2B | Vertikal CRM | HubSpot, Salesforce (dere trenger ~10 % av det) |
| Ukesagenten | *Ingen god hyllevare finnes* | Dette er deres faktiske edge |

Men den viktigste analogien er en annen: **et kontrollplan**, eller om du vil, en CDP-lite med arbeidsflyt oppå. Alle de tre produktene over finnes å kjøpe. Grunnen til å bygge selv er at hyllevarene ikke deler datamodell — Productboard vet ikke hvem som er bedriftskunde, CRM-et vet ikke at kunden klaget på feriestopp i går, og chatboten vet ikke at fiksen ligger i roadmapet. Verdien ligger i skjøten, ikke i modulene.

**Konsekvens for planen:** den eneste tingen som virkelig må være riktig fra dag én er **domenemodellen**. Alt annet kan bygges om. Den vanligste måten "hub"-prosjekter dør på, er at man bygger tre separate apper i samme repo og oppdager for sent at de ikke joiner.

For *følelsen* av verktøyet er referansen **Linear**, ikke Salesforce: tastaturdrevet, tett, raskt, sterke defaults, lite konfigurasjon. Interne verktøy blir elsket når de er raske, ikke når de er fleksible.

---

## 2. Domenemodellen (bygg denne først)

Alt som skjer i Fa Engine er et **signal** knyttet til en **person/konto**, klassifisert i et **område**, gruppert i et **tema**, koblet til et **roadmap-punkt**. Agenten produserer **forslag** mot den grafen. Alt logges.

```
person ──┬── signal ──── theme ──── roadmap_item ──── owner ──── slack_channel
         │     ▲            ▲             ▲
account ─┘     │            │             │
   │        kilde:      klynge av      status, område,
subscription  chat       signaler      innsats/effekt
(via adapter) form
              e-post
              salgsnotat
              forum
              intern idé
```

Kjerneentiteter:

- **`person`** — leser/kunde. Pseudonym ID som primærnøkkel. Kobles til abonnent *via adapter*, aldri direkte.
- **`account`** — bedrift. Bærer B2B-avtalen, seter, fornyelsesdato.
- **`subscription`** — les via `SubscriptionProvider`-grensesnitt. Zephr/Unite i dag, Sesamy senere. Se §6.
- **`signal`** — én innkommende ytring. Felt: `source`, `raw_text`, `occurred_at`, `person_id?`, `account_id?`, `area`, `sentiment`, `embedding`, `dedupe_key`.
- **`theme`** — klynge av signaler med et menneskelig navn ("Kan ikke bytte brukernavn i forumet"). Bærer teller, første/siste forekomst, berørt ARR.
- **`roadmap_item`** — det Google Sheetet er i dag, men med `area`, `owner`, `status`, `effort`, `impact`, og lenker til temaer.
- **`proposal`** — agentens output. Type (`nytt punkt` / `hev prioritet` / `slå sammen` / `lukk sløyfen`), evidens (signal-IDer), konfidens, status (`ventende` / `godkjent` / `avvist`), begrunnelse for avvisning.
- **`event`** — append-only revisjonslogg. Hvem/hva/når, inkludert alle agenthandlinger.
- **`llm_call`** — hvert modellkall: prompt-hash, tokens, kostnad, latens, hvilken PII-klasse som gikk ut. Både kostnadskontroll og GDPR-dokumentasjon.

### Områdetaksonomien er den viktigste enkeltbeslutningen

Uten et delt vokabular joiner ingenting. Definer den i uke 1, hold den kort (12–18 verdier), og gi hvert område én ansvarlig og én Slack-kanal. Forslag til start:

`Papiravis & distribusjon` · `eAvis` · `Innlogging & konto` · `Betaling & faktura` · `Bedriftsabonnement` · `Forum` · `Watchlist & portefølje` · `Børs & markedsdata` · `MittFa` · `Bjellesauer` · `Søk` · `App` · `Nyhetsbrev & varsler` · `Redaksjonelt innhold` · `Annet`

**MERK:** denne listen er senere erstattet av den konsoliderte 18-verdis-listen i `fa-engine-signalkoblingen.md` §5 — se det dokumentet for den gjeldende taksonomien.

Denne tabellen er også ruteren: område → ansvarlig → Slack-kanal. Det er den som gjør "tagger riktig ansvarlig" til en `SELECT`, ikke en gjetning.

---

## 3. Agentlaget — hvordan gjøre det til noe folk stoler på

Det er her prosjektet enten blir det dere beskriver, eller blir enda en varselstrøm folk muter. Fire regler:

**1. Agenten foreslår, mennesket skriver.** Ingenting treffer roadmapet uten et klikk, i hvert fall ikke i v1. Tillit er den knappe ressursen, og den brukes opp første gang agenten oppretter tull. Når aksept-raten har ligget over ~70 % i to måneder kan dere vurdere auto-godkjenning på lavrisiko-typer (slå sammen duplikater, oppdater teller).

**2. Alt som påstås må ha evidens.** "23 brukere har klaget på feriestopp siste 14 dager" skal være klikkbart ned til de 23 signalene, med sitater. Det er dette som skiller et beslutningsgrunnlag fra en LLM-oppsummering.

**3. Deterministisk der det kan være det.** Telling, deduplisering, ruting, ARR-summering, terskelverdier: kode. Navngiving, oppsummering, semantisk matching mot eksisterende roadmap, utkast til tekst: modell. Dette er det som holder både kostnad og hallusinasjon nede — og det gjør agenten testbar.

**4. Mål den.** Aksept-rate på forslag er hovedmetrikken. Under ~40 % er agenten støy og skal skrus av eller strammes inn, ikke tunes i det uendelige.

### Ukesagenten, konkret

Kjører mandag morgen, idempotent (samme uke to ganger = ingen duplikater):

1. Hent alle signaler siden forrige kjøring
2. Embed → klyngeanalyse → slå sammen med eksisterende temaer over likhetsterskel
3. Navngi og oppsummer nye temaer (LLM), regn ut volum, trend, berørt ARR (kode)
4. Semantisk match hvert tema mot roadmapet: finnes det allerede? Er det levert? Er det avvist tidligere?
5. Produser forslag med evidens og konfidens
6. Post per område til riktig Slack-kanal, tagg ansvarlig, dyplenk inn i Fa Engine
7. Menneske godkjenner/avviser i verktøyet → roadmap oppdateres → logges

### Mockup-agenten (fase 6, ikke før)

Det du beskrev — "flagg problemet, design en fiks, send til Slack" — er fullt gjennomførbart, og dere har allerede den vanskeligste ingrediensen: `fa-design-system.md` er skrevet som en maskinlesbar spesifikasjon med kopierbare tokens. Oppskriften blir:

> tema + evidens + `fa-design-system.md` §13 + `impeccable`/`design-taste`-reglene → én selvstendig HTML-fil → skjermbilde → vedlegg på roadmap-punktet → Slack

Viktig avgrensning: agenten leverer et **designforslag**, ikke produksjonskode, og aldri en PR. Den er en samtalestarter for en prosjektleder eller designer. Å prøve å hoppe over det leddet er der dette går galt.

---

## 4. Faseplan

**MERK: dette kapittelet er erstattet av `fa-engine-versjonsplan.md`.** Den gjeldende faseinndelingen (v1.0 / v1.1 / v1.2 / v2.0 / v3.0+) står der, med begrunnelse for hvorfor nummereringen endret prinsipp. Kapittelet under er bevart for historikk.

Prinsippet gjennom hele: **ingen ny modul startes før den forrige har ekte daglige brukere.** Et halvferdig CRM ved siden av et halvferdig roadmap-verktøy er verre enn Google Sheetet.

| Fase | Innhold | Varighet* | Ferdig når |
|---|---|---|---|
| **0. Fundament** | Repo fra template + Postgres/pgvector, auth, jobbkø, revisjonslogg, domenemodell, områdetaksonomi, komponentkit, OKD-deploy staging+prod | 2–3 uker | En tom, deployet app med innlogging, én tabell og et designfundament |
| **1. Roadmap** | Import av Sheetet, board/liste/tidslinje, statuser, eiere, områder, kommentarer, filtre, delbare visninger, Slack-varsler | 3–4 uker | Google Sheetet er arkivert og ingen savner det |
| **2. Feedback-hub** | Feedback-widget på Fa.no, e-postinntak fra kundeservice, manuell registrering fra salg/support, triage-innboks, temaer med klynging | 3–4 uker | Én uke med reell feedback er triagert og koblet til roadmapet |
| **3. Ukesagenten** | Klynging, roadmap-matching, forslag med evidens, Slack-ruting, godkjenn-UI, aksept-rate-måling | 2–3 uker | Første mandagsrapport blir faktisk lest, og aksept-raten måles |
| **4. Chatbot** | Kunnskapsbase + RAG over hjelpeinnhold, samtale-UI i FA-stil, eskalering til menneske. Skrivehandlinger **kun** bak abonnements-adapteren | 4–6 uker | Definert andel henvendelser løses uten menneske, og hver samtale blir et signal |
| **5. CRM (abosalg/B2B)** | Kontoer, kontakter, pipeline, aktiviteter, fornyelser, setebruk. AI: møtebrief, churn-signaler, oppsalgsforslag | 6–8 uker | B2B-selgerne har forlatt Excel |
| **6. Automasjon** | Mockup-agenten, dypere Slack-arbeidsflyt, prediktive churn-varsler | løpende | — |

\* Indikativt for én utvikler med AI-assistanse. Med to parallelle spor kan fase 4 og 5 overlappe, men ikke fase 0–3.

**Til fase 1, som er den eneste fasen med reell adopsjonsrisiko:** verktøyet må slå Sheetet på dag én, ikke på dag nitti. Konkret betyr det: raskere å oppdatere enn en celle (inline redigering, tastatursnarveier, bulk-endring), delbar lenke til en filtrert visning, og at ingen mister noe de har i dag. Skriv ned de kriteriene før dere begynner, og test dem på de faktiske brukerne før dere kaller fase 1 ferdig.

---

## 5. Teknisk — hva vi arver, hva vi legger til

### Arves uendret fra `vibecode-template`

Astro 5 med `output: 'server'` og Node-adapter · Tailwind 4 via `@tailwindcss/vite` (ingen JS-config) · TypeScript overalt · pnpm via corepack · Node 22 LTS · multi-stage Dockerfile → OKD via Profico · `deploy/okd/` · `AGENTS.md` + `skills/`-mønsteret · FA-tokens i `src/styles/globals.css`, aldri hardkodet hex.

### Legges til (det templaten ikke dekker)

| Behov | Valg | Hvorfor |
|---|---|---|
| Database | **Postgres 16 + pgvector** | Én database til både relasjoner og embeddings. Ingen separat vektordatabase. |
| ORM | **Drizzle** | TS-native, tynn, migrasjoner i repo. Prisma funker også, men er tyngre i Docker. |
| Jobbkø / cron | **pg-boss** | Kø i Postgres. Ingen Redis, ingen ny infrastruktur å be Profico om. |
| Auth | **Google Workspace OIDC** (Auth.js) | Interne brukere finnes allerede der. Rolle i egen tabell: `salg` / `support` / `produkt` / `admin`. |
| Interaktivitet | **React-øyer**, `client:visible` | Per templatens `add-react.md`. Tabellene og boardene trenger det; alt annet er server-rendret. |
| LLM | Anthropic bak et **eget `LLMProvider`-grensesnitt** | DPA i EU er avklart, men leverandøren skal kunne byttes uten å røre domenelogikken. |
| Slack | Bolt + Block Kit | Utgående forslag, godkjenn-knapp direkte i meldingen på sikt. |
| Test | Vitest + Playwright | Kontraktstester på domenemodellen (§7). |

### To containere, ikke én

Templaten antar én prosess. Fa Engine trenger `web` + `worker` (agenten, e-postinntak, embeddings) fra samme image med ulik entrypoint. Det er en liten, men reell DevOps-forespørsel til Profico — ta den i fase 0, ikke i fase 3.

### Kundevendte flater

Feedback-widget og chatbot lever på Fa.no og må gjengis inne i Zephr-chromet. Følg templatens harde regel: **React-øyer skal aldri omslutte en Zephr-feature-tag.** Widgeten leveres som en selvstendig, lett bundle (målsetting: under 20 kB) som monterer seg i sin egen node, og som feiler stille hvis Fa Engine er nede. Den skal aldri kunne ta ned en artikkelside.

---

## 6. Sesamy — den viktigste tekniske beslutningen dere ikke har tatt ennå

At Sesamy skal erstatte Unite og Zephr endrer prioriteringen mer enn noe annet i denne planen.

**Bygg `SubscriptionProvider` som et grensesnitt fra dag én**, selv om det bare finnes én implementasjon:

```ts
interface SubscriptionProvider {
  findPerson(email: string): Promise<Person | null>
  getSubscription(personId: string): Promise<Subscription | null>
  getAccount(accountId: string): Promise<Account | null>
  // skrivehandlinger — implementeres først når leverandøren er bestemt
  pauseDelivery?(subId: string, from: Date, to: Date): Promise<void>
  updateAddress?(subId: string, address: Address): Promise<void>
}
```

Tre konsekvenser:

1. **Ingen skrivehandlinger mot Zephr.** Feriestopp, adresseendring, oppsigelse — alt det chatboten skal kunne gjøre — bygges mot Sesamy, ikke mot noe som skal bort. Chatboten i fase 4 starter derfor lesende og eskalerende, og får skrivehandlinger når Sesamy er på plass. Det er ikke en nedprioritering, det er å slippe å bygge det to ganger.
2. **CRM-et (fase 5) er avhengig av Sesamy-tidslinjen.** Har dere ikke en dato, planlegg fase 5 med egne data + CSV-import + manuell registrering, og synk mot Sesamy når det finnes.
3. **Migrasjonen er en mulighet.** Sesamy eier faktura og entitlements. Fa Engine kan eie *hvorfor* — relasjonen, historikken, signalene. Det er en renere arbeidsdeling enn dere har i dag, og verdt å ta med inn i Sesamy-diskusjonen.

Roadmapet importeres som engangsopplasting fra Google Sheet — ingen løpende synk, ingen tilbakeskriving. Sheetet settes til lesevisning samme dag.

---

## 7. Design — hvordan dette faktisk ser bra ut

`impeccable` kaller dette **Operate**-modus: brukeren skal fullføre en oppgave. Skannbarhet, konsistens og tetthet slår uttrykk; merkevaren lever i presisjonen. Det er ikke en landingsside, og det skal ikke se ut som en.

**Innstillinger:** `DESIGN_VARIANCE 3` (rolig, systematisk) · `MOTION_INTENSITY 2` (bare tilstandsendringer) · `VISUAL_DENSITY 7` (dette er et datamiljø, ikke en blogg).

### Fire konkrete beslutninger

**Inter blir stående.** `design-taste` fraråder Inter som default. `impeccable`s overordnede regel er at *briefen vinner* — og Inter er Finansavisens merkevareskrift, ikke en refleks. Vi bruker den godt i stedet: reell vektkontrast mellom nivåer, `tabular-nums` overalt hvor tall står under hverandre, stram tracking på display, og `i-b0` 14/20 som app-brødtekst slik designsystemet faktisk spesifiserer.

**Grønt og rødt er okkupert.** I FAs designsystem betyr grønn og rød *markedsretning* — og de har til og med tre ulike kontekstpar (§3.4). Fa Engine har statuser (`ny`, `under arbeid`, `levert`, `avvist`), sentiment og prioritet, og hvis de får grønt/rødt kolliderer to betydningssystemer i hodet på folk som ser Fa.no hele dagen. **Løsning:** statuser og prioritet får en egen skala i grå/blå/rav som ikke overlapper. Sentiment vises med form og ord, ikke med markedsfarger. Dette er en av tingene som må stå i `DESIGN.md` før noen skriver UI.

**Chrome-et er ikke det samme internt.** Kundevendte flater (widget, chatbot) må ligge sømløst inne i FA-chromet — tickerstripe, blue-700 topp, 8px hjørnetabber. Interne flater skal *ikke* ha den to-raders mastheaden; de får en blue-700 sidemeny, grey-25 lerret, hvite kort med radius 8, og blue-500 som eneste interaktive farge. Samme tokens, annet register.

**Tastaturet først.** `Cmd-K` for alt, `j`/`k` i lister, `e` for redigering, bulk-handlinger med shift-klikk, angre i stedet for bekreftelsesdialoger. Dette er ikke pynt — det er hele forskjellen mellom et internt verktøy folk bruker og et de unngår.

### Prosess

I fase 0: kjør `impeccable init` → `PRODUCT.md`, og skriv `DESIGN.md` for Fa Engine som *avleder* fra `fa-design-system.md` (arver tokens, definerer det interne registeret og statusskalaen over). Bygg komponentkittet én gang — tabell, board, tabs, chips, skjema, tomtilstander, toasts, sidepanel — og la det være kilden alle bidragsytere trekker fra. Slå på `impeccable`s detektor-hook slik at AI-generert UI ikke driver bort fra systemet, og legg `design-taste`s pre-flight inn i definisjonen av ferdig.

**Designsystem-filen bør oppdateres først.** Den er sterk (v1.1, evidensbasert, kopierbar CSS), men den beskriver Fa.no — den har ingen mønstre for tabeller med sortering og paginering, board/kanban, filterrader, tomtilstander, laste- og feiltilstander, modaler, sidepaneler, kommandopalett eller varsler. Alt dette trenger Fa Engine, og hvis vi ikke skriver det ned, finner hver bidragsyter opp sitt eget. Det er en avgrenset jobb på noen dager, og den bør gjøres i fase 0. Den lukker samtidig et par av hullene filen selv lister i §14.

---

## 8. Flere bidragsytere — planlegg for det nå, ikke etter v1

Dere sier flere vil bidra, og at de ikke er kodere: prosjektledere og designere som jobber med AI-assistanse. Det er faktisk en fordel her, fordi `vibecode-template` allerede er bygget for nøyaktig den brukeren. Men det stiller én hard betingelse: **kodebasen må være lesbar for en agent.**

Seks ting som må på plass før tredje bidragsyter, ikke etter:

1. **Modulgrenser.** `src/modules/{roadmap,feedback,crm,chat}/` + `src/core/` for domenemodellen. Moduler snakker gjennom `core`, aldri direkte med hverandre. Da kan to personer jobbe samtidig uten å kollidere.
2. **`AGENTS.md` per modul.** Rot-filen arver templatens regler og legger til Fa Engine-spesifikke. Hver modul har sin egen med datamodell, invarianter og "slik legger du til X her".
3. **`skills/`-oppskrifter for de vanlige oppgavene.** "Legg til et felt på roadmap-punkt", "lag en ny visning", "legg til en feedback-kilde", "legg til et område". Dette er templatens beste idé, og den skalerer rett inn hit.
4. **Kontraktstester på `core`.** En bidragsytende agent skal ikke kunne bryte kundegrafen i stillhet. Migrasjoner og domeneinvarianter er testdekket; UI trenger ikke være det.
5. **Preview-deploy per PR.** Ikke-kodere trenger å *se* endringen for å vurdere den. Uten dette blir review et flaskehals hos den ene som kan lese diff.
6. **Ingen push til main.** PR + minst én godkjenning + grønn CI. Definisjonen av ferdig er templatens kvalitetsporter (`pnpm build`, `astro check`, ingen hardkodet hex) pluss designets pre-flight.

Prosessmessig: én person eier `core` og domenemodellen. Moduler kan ha roterende eierskap. Det er skjøten som må beskyttes.

---

## 9. Risiko

| Risiko | Alvorlighet | Håndtering |
|---|---|---|
| Scope creep — "huben" vokser i alle retninger | **Høy** | Én modul om gangen, og neste starter ikke før forrige har daglige brukere. Domenemodellen eies av én person. |
| Roadmap-verktøyet slår ikke Google Sheet | **Høy** | Skriv adopsjonskriteriene før fase 1 og test dem på brukerne før fasen kalles ferdig. |
| Agenten blir støy folk muter | Middels | Ukentlig, ikke daglig. Aksept-rate måles. Evidens på hver påstand. Av-bryter per område. |
| GDPR — kundedata i prompts | Middels | DPA er på plass, men det er ikke nok: dataminimering i prompts, `llm_call`-logg med PII-klasse, definert oppbevaringstid på signaler, DPIA før chatboten går live. Pseudonym ID som primærnøkkel gjør dette enklere. |
| Chatboten svarer feil om abonnement eller pris | Middels | Kun kildebelagte svar fra kunnskapsbasen, aldri improvisert policy, tydelig eskalering. Ingen skrivehandlinger før Sesamy. |
| Sesamy-tidslinjen glipper | Middels | Adapteren isolerer skaden. Fase 5 planlegges med egne data som fallback. |
| Widget påvirker Fa.no | Lav, men dyr | Selvstendig bundle, feiler stille, ingen delt state, egen feilbudsjett-overvåking. |
| LLM-kostnad løper | Lav | `llm_call`-tabellen fra dag én. Deterministisk kode der det går. Klynging på embeddings er billig; generering er ikke. |

---

## 10. Neste steg

1. **Bestem områdetaksonomien** og hvem som eier hvert område. Én ettermiddag, og den låser opp all ruting senere.
2. **Skaff Sesamy-tidslinjen.** Den avgjør fase 4 og 5.
3. **Oppdater `fa-design-system.md`** med de interne app-mønstrene (§7). Noen dager.
4. **Bygg fase 0.** Repo, database, auth, deploy, komponentkit.
5. Underveis: klikkbar mockup av feedback-hub + roadmap i FA-stil, som brukertest før koden skrives.

**Åpne spørsmål å ta stilling til:**

- Hvor mange bruker roadmapet i dag, og hva er det de faktisk gjør i Sheetet? (Avgjør fase 1 helt.)
- Finnes kundeservice-innboksen i Google Workspace, eller et ticketsystem?
- Hva er dagens B2B-salgsprosess konkret — hvor ligger pipeline nå?
- Skal feedback-widgeten kreve innlogging? (Påvirker signalkvalitet mot volum.)
- Hvem er teknisk eier hos Profico for OKD-endringen med to containere?

---

*Kilder: [startsiden/vibecode-template](https://github.com/startsiden/vibecode-template) · [pbakaus/impeccable](https://github.com/pbakaus/impeccable) · [h3nryprod01/design-taste](https://github.com/h3nryprod01/design-taste) · `fa-design-system.md` v1.1 (prosjektminne)*
