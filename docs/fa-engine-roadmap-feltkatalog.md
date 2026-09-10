# Fa Engine fase 1 — feltkatalog for Epic og Task

*v0.8 · 2. september 2026 · kontrakten mellom prototypen og den ekte implementasjonen*

> **Endret i v0.8 (OC, 2. september):** Alle kort (tavle, Backlog, Idea bank, Epics,
> «For deg») viser nå **dato for siste endring**, avledet fra `status_log[]` — ingen
> nytt felt. Task/Bug/Research-kort med egne sub-tasks (`parent_id` som peker på et
> annet Task, ikke en Epic — §3) viser samme fremdriftsindikator som Epic-kort alt
> hadde («N av M sub-tasks ferdig»); kort uten sub-tasks viser ingen indikator. Alle
> kortlister (tavle, Backlog, Idea bank, «For deg») viser nå **kun hovedoppgaver** —
> en sub-task vises ikke som sitt eget kort, bare telt med på foreldrekortet. **Timer
> (estimert/gjenstående) ble bevisst holdt utenfor** — samme beslutning som §6 fra
> før, bekreftet av OC denne runden. Se ny §3 sub-task-note og §5c.
>
> **Endret i v0.7 (OC, 2. september):** To nye menypunkt, ingen nye felt — begge er
> rene visninger over data som allerede finnes. **«For deg»** (nytt, plassert øverst
> i menyen): alt der Ole Christian er `hmOwner`/`owner`/i `assignee_ids[]` — Epic og
> Task/Bug/Research om hverandre, samme kort som Epics-siden og tavlen bruker, med en
> liten rolle-etikett (Owner (HM)/Coordinator/Team) på hvert kort. **«Logg»** (nytt,
> nederst i menyen): `status_log[]` (§1) fra *alle* punkter — Epic og Task samlet i én
> kronologisk feed, gruppert per dato, nyeste øverst. Se ny §8.
>
> **Endret i v0.6 (OC, 2. september):** Idea bank er tømt — alt som lå der (alle Task/Bug/
> Research med `status Idea/Under review/Prioritized`, 26 punkter) er flyttet til Backlog
> (§5b), logget som en samle-handling. Ingen av dem fikk en ekte `jira_key` i denne
> flyttingen — `backlogged` alene styrer medlemskap i Backlog i prototypen, en Jira-nøkkel
> er ikke en forutsetning her (kun en visuell badge når den finnes). Ny knapp **«New
> Idea»** i toppbaren åpner et skjema med **samme forenklede felt som «New Epic»** —
> tittel, beskrivelse, team og et valgfritt leveringsestimat, ellers ingenting — og
> oppretter et nytt punkt med `type: Task`, `status: Idea`, som havner rett i den nå
> tomme Idea bank. Se §2 (samme mønster som Epic sin forenklede opprettelse) og §5a.
>
> **Endret i v0.5 (OC, 8. september):** Tavlen («All items») er nedjustert til 4
> kolonner: `Code review` og `Testing` er slått sammen til én — **Code review &
> testing** — og `Declined` er **midlertidig fjernet** fra UI (feltene under er
> uendret, klar til å skrus på igjen). `To do` er døpt om til **Neste**, og et helt
> nytt steg er satt inn foran den: **Backlog**, et eget menypunkt mellom All items og
> Epics. Alt som lå i gamle To do er flyttet dit — se nytt felt `backlogged` i §1 og
> ny §5b. Idea bank sin «attach Jira key»-handling går nå til Backlog, ikke rett på
> tavlen; derfra er det en egen «→ Move to Neste»-knapp (eller dra-og-slipp, samme
> mønster som Idea bank) som flytter saken inn på selve tavlen.
>
> **Endret i v0.4 (OC, 1. september):** Epic har fått en egen side — klikk på et
> epic-kort åpner en dedikert visning (ikke lenger side-panelet som Task bruker), der
> alle felt kan redigeres direkte, ingen «Rediger»-modus nødvendig. Epic har samtidig
> fått **sitt eget statuskodesett**, uavhengig av Task/Bug/Research sitt: 3 trinn i
> stedet for 6 (`Ikke påbegynt` → `Påbegynt` → `Ferdig - arkivert`), se §0.
> Og et nytt felt, `comments[]` — en kommentartråd som følger fremdriften, der siste
> kommentar vises på epic-kortet i oversikten. Se §2.
>
> **Endret i v0.3 (OC, 21. august):** «All items» er nå en Jira-lik tavle med
> statusfelt (To do → Påbegynt → Code review → Testing → Done/Declined), bygget på
> `status`/`jiraSubstatus` fra §0 — ingen nye felt, kun en ny visning. Se nytt §5.
> Idea bank er samtidig omdefinert til **backlog**: alt som ikke er i Jira ennå
> (`Idea`/`Under review`/`Prioritized`, ikke Epic), med dra-og-slipp for å knytte en
> `jira_key` og flytte punktet rett inn på tavlen. Opprettelse av ny Epic er forenklet
> til 4 felt (tittel, beskrivelse, team, estimert levering) — se note i §2.
>
> **Endret i v0.2, mot en oppdatert kopi av arket (OC, 20. august):** Owner er bekreftet
> å være to kolonner, ikke én — se `owner_id`/`coordinator_id` i §1. «WiP - Fa Roadmap
> 2026»-arket og et eventuelt `initiative`-nivå over Epic er **avklart som ikke aktuelt**
> — se §2, som dermed ikke lenger har et åpent spørsmål der.

Samme prinsipp som `fa-engine-crm-feltkatalog.md`: hvert felt med **type**, **eier**
(hvem som fyller det inn) og **om det kan redigeres i Fa Engine**. Genereres fra/
holdes i takt med `src/modules/roadmap/domain/types.ts` når koden skrives.

Grunnlaget er kartleggingen i `fa-engine-roadmap-krav.md` §4 (felt-for-felt mapping
fra dagens regneark) og §8 (krav til fase 1), oppdatert med den konsoliderte
statusmodellen fra `fa-engine-idebank.md` §1 og områdelisten fra
`fa-engine-signalkoblingen.md` §5.

## Eierkoder

| Kode | Betyr | Skriverett i Fa Engine |
|---|---|---|
| `FA` | Skrives av bruker i Fa Engine | Ja |
| `JIRA` | Speiles fra Jira, envegs lesesynk | Nei — kun Jira kan endre |
| `UTL` | Utledet/generert i kode | Nei — beregnes eller logges automatisk |

Statuser, prioritet, størrelse og område er **faste kodesett, endres i kode** — samme
regel som roadmap-krav §8 («ikke bygg») og feltkatalog-CRM §12 («ingen egendefinerte
felt»). Fritekst her har allerede vist seg å ødelegge all aggregering (roadmap-krav
§3.3: 21 varianter av «Owner» for to personer).

---

## 0. Delte kodesett

**Status** — 6 verdier, engelsk (interne flater er på engelsk, roadmap-krav §10).
Konsoliderer roadmap-krav §3.1 og idébank §1 til én rekkefølge:

`Idea` → `Under review` → `Prioritized` → `In Jira` → `Delivered` · `Declined`

- `In Jira` speiler Jira-status envegs. Delfeltet `jiraSubstatus` (`CR`/`FT`/`On QA`)
  vises kun her, og skrives aldri i Fa Engine — se §7 «ikke bygg» i roadmap-krav.
- `Declined` samler `Won't do` og `Outdated` fra dagens ark (roadmap-krav §4), og
  krever en begrunnelse — se `declined_reason` under. **Midlertidig fjernet fra UI i
  v0.5** — ingen måte å sette denne statusen i prototypen akkurat nå. Feltet
  (`declined_reason`) og regelen under er uendret og klar til å skrus på igjen —
  se v0.5-noten øverst.
- `Delivered` settes automatisk når Jira rapporterer saken løst; `completed_at` fylles
  samtidig.

**Status — Epic har et eget kodesett (v0.4), ikke de 6 verdiene over.** Epic har ingen
Jira-speiling og ingen «avslått»-tilstand som Task har — den langsiktige
arbeidsstrømmen har rett og slett færre reelle tilstander. 3 trinn:

`Ikke påbegynt` → `Påbegynt` → `Ferdig - arkivert`

Dette er et bevisst avvik fra prinsippet i §1 om at Epic og Task deler alt — `status`
er det ene feltet der de to typene har hvert sitt kodesett, fordi de faktisk beskriver
to forskjellige ting: et Task sin status er «hvor i Jira-flyten er dette», mens en
Epic sin status er «har arbeidet startet». Ingen av views/filtrene som bruker
Task-statusene (tavlen i §5, backlogen) ser noensinne en Epic — de to kodesettene
kolliderer aldri i praksis.

**Type** — `Epic` · `Task` · `Bug` · `Research` (fra klammeprefiksene `[bug]`,
`[research]` i dagens titler, roadmap-krav §4).

**Discipline** (valgfri, ikke en type) — `Design`. Et punkt kan være både
`type: Task` og `discipline: Design`, akkurat som i dagens ark (roadmap-krav §2:
«et designpunkt kan være både epic og task»).

**Priority** — `Hotfix` · `High` · `Medium` · `Low`. Erstatter de to skalaene
(`1.0` / `High-Medium-Low` / `?`) som lever side om side i dag (roadmap-krav §3.6).

**Size** (valgfri t-skjorte, ikke timer) — `S` · `M` · `L` · `Ongoing`. Obligatoriske
tidsestimater dør — roadmap-krav §3.2 viser at utfyllingen falt til 0 % i juli.

**Area** — én av de 18 konsoliderte verdiene i `fa-engine-signalkoblingen.md` §5:

`Børs & instrumenter` · `Bjellesauer` · `Artikkel, innhold & søk` ·
`Nyhetsbrev & varsler` · `Forum` · `MittFa & personalisering` ·
`Watchlist & portefølje` · `Papir & eAvis` · `Abonnement & betaling` ·
`Bedriftsabonnement & B2B` · `Innlogging & konto` · `App` · `Annonse` ·
`AI & Investorchat` · `Sporing & analyse` · `Ytelse & teknisk plattform` ·
`Interne verktøy` · `Annet`

---

## 1. `roadmap_item` — felles felt for Epic og Task

Epic og Task er **samme tabell, forskjellig `type`** — ikke to entiteter. Det er
poenget med domenemodellen i `fa-engine-plan.md` §2: alt er ett `roadmap_item`,
og skjemaet under gjelder begge. §2 og §3 lister hva som i praksis alltid/nesten
alltid fylles ut per type, og §4 er det ene feltet som er nytt for Task.

| Felt | Type | Eier | Red. | Merknad |
|---|---|---|---|---|
| `id` | Id | UTL | – | |
| `type` | `Epic`/`Task`/`Bug`/`Research` | FA | Nei etter opprettelse | Endres ikke — en epic som blir en task er en ny relasjon (`parent_id`), ikke en typeendring |
| `discipline` | `Design`? | FA | Ja | Valgfri, ikke eksklusiv med `type` |
| `title` | string | FA | Ja | Kort. Klammeprefikser (`[bug]`) skal ikke skrives inn manuelt — bruk `type`/`priority`-feltene |
| `raw_title` | string? | UTL | Nei | Kun satt ved import fra regneark, for sporbarhet |
| `description` | markdown | FA | Ja | Kort kontekst — hva og hvorfor. Rad-under-tittel-konvensjonen fra arket blir et ekte felt |
| `area` | én av 18 | FA | Ja | Nedtrekksliste, ikke fritekst. Obligatorisk på `Task`, valgfri på `Epic` (§3) |
| `owner_id` | person | FA | Ja | **«Owner, Hegnar Media»** — forretningseier/produkteier (OC, Magnus). Bekreftet i det oppdaterte arket 20. august: dette er en egen kolonne, ikke det samme som koordinator under |
| `coordinator_id` | person | FA | Ja | **«Owner, Profico»** — koordinerende rolle på leverandørsiden (Marina på de fleste oppgaver; en teknisk lead som Filip/Kula/Andrija på epics). Dette var feltet som tidligere het `owner_id`/«ansvarlig» i v0.1 av denne katalogen, før arket viste at Owner faktisk er to kolonner |
| `assignee_ids[]` | person[] | FA | Ja | **«Team»/utførere**. Flere tillatt, som i dag — men som en ekte relasjon, ikke fritekst (`Marina/Kula`) |
| `status` | kodesett (§0) | FA/JIRA | Ja, unntatt `In Jira`→`Delivered` | Speilet automatisk når `jira_key` finnes. Hver endring logges i `status_log[]` |
| `jiraSubstatus` | `CR`/`FT`/`On QA`? | JIRA | Nei | Vises kun når `status = In Jira` |
| `declined_reason` | string? | FA | Ja | **Obligatorisk når `status = Declined`.** Slår sammen `Won't do`/`Outdated` — begge krever en grunn nå, ingen av dem gjorde det i arket |
| `jira_key` | string? | FA (settes)/JIRA (speiles) | Nei, kun kobling | **Ikke unik** — flere punkter kan peke på samme sak (fa-engine-status.md). Én gang satt, henter systemet status og løsningsdato derfra |
| `backlogged` | boolean | FA | Ja (via flytt-handling, ikke direkte) | **Nytt felt (v0.5), kun relevant på Task/Bug/Research.** Skiller Backlog (§5b) fra Neste-kolonnen på tavlen (§5) — begge er `status: In Jira` med `jiraSubstatus: Todo`/`Waiting`, så uten dette feltet ville de to stegene vært umulige å skille. Settes `true` når en idé får tilknyttet en `jira_key` (havner i Backlog, ikke rett på tavlen); settes `false` av «→ Move to Neste»-handlingen. Rent app-internt — ingenting Jira vet om |
| `priority` | kodesett (§0) | FA | Ja | |
| `size` | kodesett (§0) | FA | Ja | Valgfri. Aldri obligatorisk — se §0 |
| `target_date` | dato? | FA | Ja | Ekte dato. Et intervall skrives i `target_week`, ikke her |
| `target_week` | string? | FA | Ja | For punkter uten dagspresisjon (`10.–14.08.2026` → uke 33) |
| `completed_at` | tidspunkt? | UTL | Nei | Settes automatisk når `status` blir `Delivered` |
| `parent_id` | Id? | FA | Ja | Ekte forelder-relasjon. Erstatter `- `-prefikset i tittelen. Et `Task` peker vanligvis på en `Epic`; underoppgaver kan peke på et annet `Task` |
| `sources[]` | kilde[] | FA | Ja | Slack-permalink (med forhåndsvisning), Signal, Tema, ekstern URL. Se roadmap-krav §4 — «det viktigste feltet i hele modulen» |
| `theme_ids[]` | Id[] | UTL | Nei | Kobling til feedback-temaer (fase 2+). Tomt til fase 2 er bygget |
| `status_log[]` | hendelse[] | UTL | Nei | Hvem, hva, når — for hver endring, fra dag én |
| `created_at` / `created_by` | – | UTL | Nei | |
| `updated_at` | – | UTL | Nei | |

---

## 2. Epic — hva som faktisk fylles ut i praksis

Epic er de langsiktige arbeidsstrømmene (roadmap-krav §2: `Redpill to AWS`,
`Investorchat`, `Page speed + Personalization`, `FA vibe coding` — 7 i dagens ark).
Feltmodellen er identisk med §1, men bruksmønsteret er et annet:

| Felt | Typisk for Epic |
|---|---|
| `area` | Ofte tom eller kun retningsgivende — en epic kan skjære gjennom flere områder. Vises som «Flere områder» i UI når tom, ikke som en feilende validering |
| `size` | Nesten alltid `Ongoing` — «long term effort» i dagens ark har ingen slutt. Unntak finnes (f.eks. «New paywall design + better setup i Zephr» har et konkret 3–4-ukers estimat) — behandles som data, ikke som feil |
| `target_date` | Vanligvis tom. Epics har ingen leveransedato — de har fremdrift, ikke en slutt |
| `jira_key` | Sjelden. 0 av 7 epics i dagens ark har Jira-lenke (roadmap-krav §3.1) |
| `owner_id` / `coordinator_id` | Begge fylt ut på alle 7 epics i det oppdaterte arket — dette er nettopp nivået der Owner-splitten er tydeligst: OC/Magnus som Hegnar-eier, en Profico-person (Filip/Kula, Andrej/Sinisa T/Matija/Andrija) som koordinator |
| `parent_id` | Alltid tom — Epic er toppnivået. Se boksen øverst i dokumentet: et nivå over Epic er avklart som ikke aktuelt |
| `assignee_ids[]` | Ofte flere — en epic har typisk et team, ikke én utfører |

**Egen visning, ikke en liste-rad.** Roadmap-krav §8 punkt 8: de 7 epicene skal ha en
tidslinje-/kvartalsvisning, ikke drukne i oppgavelisten. En Epic viser dessuten en
utledet fremdrift: *N av M underliggende Task levert* — beregnet fra `parent_id`,
ikke et eget felt.

**Opprettelse er forenklet til 4 felt (v0.3).** «Legg til ny Epic»-skjemaet spør bare
om `title`, `description`, `assignee_ids[]` («team — hvem kan jobbe med det») og
`target_date`/`target_week` («estimert levering»). `owner_id`, `coordinator_id`,
`area`, `priority`, `size`, `discipline` settes til fornuftige forvalg (status
`Ikke påbegynt`, priority `Medium`, size `Ongoing`) og fylles inn senere fra siden —
se §4 i idébank-dokumentet om at det skal være billig å opprette et punkt. **Samme
skjema brukes nå av «New Idea» (v0.6, §5a)** — identiske fire felt, samme forvalg-
prinsipp, eneste forskjell er at resultatet er `type: Task`/`status: Idea` i stedet
for en Epic.

**Egen side, ikke et side-panel (v0.4).** Et klikk på et epic-kort åpner en dedikert
side — samme mønster som en Jira-sak, ikke det korte side-panelet Task/Bug/Research
bruker (§5-tavlen og backlogen). Alle felt fra §1 som er meningsfulle på Epic er
redigerbare direkte på siden, uten en egen «rediger»-modus: tittel, beskrivelse,
`status` (§0), `area`, `priority`, `size`, `owner_id`, `coordinator_id`,
`assignee_ids[]`, `target_date`, `jira_key`, `discipline` og `sources[]` (kan legges
til og fjernes derfra). `parent_id` vises ikke — alltid tom på Epic, se tabellen over.

**`comments[]` — nytt felt, kun på Epic.**

| Felt | Type | Eier | Red. | Merknad |
|---|---|---|---|---|
| `comments[]` | {who, text, date}[] | FA | Ja | Fritekst-kommentartråd som følger fremdriften over tid — nyeste øverst. Skilt fra `status_log[]`: loggen er systemets automatiske hendelser (statusendringer m.m.), kommentarene er menneskers egne notater underveis |

Siste kommentar (`comments[0]`) vises på epic-kortet i oversikten (§2), slik at
fremdrift er synlig uten å måtte åpne siden — akkurat som en siste Slack-melding i en
tråd. Samme logikk som `notes` på Task (§3): ingen struktur påtvunget, ingen
automatisk utfylling.

---

## 3. Task — det som er nytt i forhold til Epic

Task er den konkrete oppgaven — det roadmap-krav §2 kaller punktet med en faktisk
slutt. Alle felt i §1 gjelder, og i tillegg:

| Felt | Type | Eier | Red. | Merknad |
|---|---|---|---|---|
| `notes` | langt fritekstfelt, markdown | FA | Ja | **Nytt felt, finnes ikke på Epic.** Fritt tekstfelt for alt som ikke passer i `description` — utfyllende kontekst, limt inn tekst fra en samtale, avklaringer, ting man vil huske. Ingen struktur påtvunget, ingen automatisk utfylling |

**Hvorfor dette står som eget felt og ikke bare et lengre `description`.**
`description` er den korte konteksten — hva og hvorfor, det som var raden under
tittelen i arket. `notes` er tenkt som et sted for alt det som *ikke* er ryddig nok
for `description`, og som i dag ikke har noe hjem i det hele tatt og enten forsvinner
eller blir en kommentar i Slack ingen finner igjen. Feltet er bevisst holdt fritt:
ingen seksjoner, ingen obligatorisk utfylling — se «bevisst utelatt» under.

**`area` er obligatorisk på Task**, i motsetning til Epic — en konkret oppgave hører
alltid til én flate, og det er nøyaktig koblingen som gjør ukesagenten i fase 3
mulig (matching mot temaer, roadmap-krav §7).

**`parent_id` peker normalt på en Epic.** Ikke obligatorisk — de fleste Task i dagens
ark (`Work in Progress`, `Done`) har ingen epic-forelder og skal ikke tvinges til å
finne en kunstig én. Underoppgaver (`- `-prefikset i dag) peker på et annet Task —
det er *denne* relasjonen (`parent_id` → et annet Task/Bug/Research, ikke en Epic)
som definerer en «sub-task» i v0.8 (§5c): kortlistene viser aldri en sub-task som sitt
eget kort, kun telt inn i foreldrekortets fremdriftsindikator. I dagens fixture-data
finnes ingen slike relasjoner ennå — kun Task→Epic — men modellen og filtreringen er
klar for når de dukker opp. **Ingen UI for å opprette en sub-task ennå:**
«New Task»-skjemaets «Parent Epic»-felt lister kun Epics — å sette `parent_id` til et
annet Task krever i dag en direkte dataendring, ikke et skjema.

---

## 5. Visning: Idea bank → Backlog → tavle («All items»)

Ingen nye felt i §5/§5a — kun hvordan `status`/`jiraSubstatus` fra §0 vises. Gjelder
**kun Task/Bug/Research, ikke Epic** (Epic har sin egen side, §2). Tre steg, fra minst
til mest forpliktet — hvert med sitt eget menypunkt:

`Idea bank` (ikke i Jira) → `Backlog` (i Jira, ikke plukket) → `All items`-tavlen

**Alle tre viser kun hovedoppgaver (v0.8).** En sub-task (§3 — `parent_id` peker på et
annet Task) vises aldri som sitt eget kort i noen av de tre, kun telt inn i
foreldrekortets «N av M sub-tasks ferdig»-indikator, akkurat som Epics-siden (§2)
allerede gjorde for Task under en Epic. Hvert kort viser også **dato for siste
endring**, avledet fra nyeste oppføring i `status_log[]` (`created_at` om loggen er
tom) — ikke et nytt felt, bare en ny visning av et felt som allerede fantes.

### 5a. Idea bank — ikke i Jira ennå

Alt av type Task/Bug/Research med `status` `Idea`, `Under review` eller `Prioritized`,
gruppert etter status. Hvert kort har «● Concept — not committed»-merket, samme som i
kundevendte konsept-mockups (`fa-engine-konseptmal.md`) — ingenting her er lovet bort.
For å flytte et punkt videre: dra kortet inn på dropstripen, eller trykk kortets
«⚡ Attach Jira key»-knapp, skriv inn en `jira_key` — punktet får `status = In Jira`,
`jiraSubstatus = Todo`, `backlogged = true` (§1), og havner i **Backlog** (§5b), ikke
rett på tavlen.

**Ny knapp «New Idea» (v0.6), samme fire felt som «New Epic»** (§2): tittel,
beskrivelse, team, valgfritt leveringsestimat — resten settes til forvalg
(`area`/`owner_id`/`coordinator_id` tomme, `priority: Medium`) og fylles inn senere.
Oppretter `type: Task`, `status: Idea`, havner rett i Idea bank. Dette er nå den
tiltenkte veien inn — **Idea bank ble tømt i v0.6**: alle 26 punkter som lå der er
flyttet til Backlog i én samle-handling (logget per punkt), for å skille en fersk
start fra det gamle innholdet.

### 5b. Backlog — i Jira, men ikke plukket som Neste ennå (nytt i v0.5)

Eget menypunkt mellom All items og Epics. Viser alt med `status = In Jira`,
`jiraSubstatus` `Todo`/`Waiting`/tom, og `backlogged = true`. Beholder «● Concept —
not committed»-merket — en `jira_key` alene forplikter ikke, det gjør det først når
saken faktisk er plukket til å jobbes med. Herfra: dra kortet inn på dropstripen,
eller trykk «→ Move to Neste», og `backlogged` settes `false` — punktet dukker
umiddelbart opp i Neste-kolonnen på tavlen (§5c).

`backlogged = true` alene styrer medlemskap her — `jira_key` er ikke en forutsetning
i prototypen (kun en badge på kortet når den finnes). Det er derfor de 26 punktene
som ble bulk-flyttet fra Idea bank i v0.6 (§5a) kunne havne rett i Backlog uten å gå
via «Attach Jira key»-skjemaet — samme sluttilstand, kortere vei for en samle-handling.

### 5c. «All items» — en Jira-lik tavle med statusfelt, 4 kolonner (endret i v0.5)

| Kolonne på tavlen | Vises når |
|---|---|
| Neste | `status = In Jira`, `jiraSubstatus` `Todo`/`Waiting`/tom, `backlogged = false` |
| Påbegynt | `status = In Jira` og `jiraSubstatus = In progress` |
| Code review & testing | `status = In Jira` og `jiraSubstatus` er `CR`, `FT` eller `On QA` — slått sammen fra to kolonner i v0.5 |
| Done | `status = Delivered` |

`Declined` er ikke en kolonne her lenger — se v0.5-noten øverst. Å dra et kort til en
annen kolonne er en skrivehandling: det setter `status`/`jiraSubstatus` (eller
`completed_at` for Done, `backlogged = false` uansett), og logger endringen i
`status_log[]` — akkurat som om brukeren endret statusfeltet direkte.

---

## 6. Bevisst utelatt

Samme regel som CRM-feltkatalogen §12, av samme grunn:

- **Egendefinerte felt.** Faste felt, endres i kode.
- **Obligatoriske tidsestimater i timer.** `size` er nok — se §0. **Bekreftet på nytt
  i v0.8**, da OC selv foreslo timer-fremdrift på kortene og valgte å holde seg til
  denne beslutningen i stedet — se v0.8-noten øverst. Sub-task-fremdrift (§5c) dekker
  behovet uten å måtte gjenskape et felt som historisk lå på 0 % utfylling.
- **`notes` som strukturert felt (undertitler, obligatoriske seksjoner).** Det var
  fristelsen, og det er nøyaktig det som ville gjort feltet til enda en `description`.
  Formatet skal være «skriv hva du vil», ikke en ny mal.
- **AI-generert utfylling av `notes` ved opprettelse.** Vurdert og avvist for denne
  versjonen — konseptmalen (`fa-engine-konseptmal.md`) løser det behovet for
  gjennomarbeidede konsepter via `fa-concept`-skillen. Task skal være billig å
  opprette; å kreve et intervju før en oppgave kan lagres ville gjenskapt exakt den
  friksjonen idébank §9 advarer mot for selgere.
- **Sprinter, poeng, velocity.** Jira sitt domene.

---

## 7. Visning: «For deg» og «Logg» (nytt i v0.7)

Ingen nye felt — begge er rene visninger over felt som allerede finnes i §0/§1. Begge
slår sammen Epic og Task/Bug/Research i én liste, noe ingen annen visning i dokumentet
gjør (§5-serien og tavlen viser kun Task/Bug/Research; Epics-siden viser kun Epic).

**«For deg»** — plassert øverst i menyen, over «All items». Viser alt der innlogget
bruker (i denne prototypen alltid Ole Christian) er `hmOwner`, `owner`, eller står i
`assignee_ids[]` (§1) — tre uavhengige treff, ikke gjensidig utelukkende, og et punkt
kan derfor vise flere rolle-etiketter samtidig (**Owner (HM)** / **Coordinator** /
**Team**, samme ordlyd som kv-listen i sidepanelet). Epics vises som samme kort som på
Epics-siden (§2), Task/Bug/Research som samme kort som på tavlen (§5c) — begge med
rolle-etikettene lagt til nederst. Klikk åpner epic-siden eller sidepanelet, avhengig
av `type`, akkurat som å klikke kortet i sin opprinnelige visning ville gjort.

**Logg** — plassert nederst i menyen. `status_log[]` fra *hvert eneste* punkt i
databasen (Epic og Task/Bug/Research om hverandre) slått sammen til én feed, gruppert
per dato og sortert nyeste-først. Hver rad viser hvem, hva og hvilket punkt det gjelder
(med type-ikon), og er klikkbar på samme måte som «For deg» over. Siden `status_log[]`
kun har datopresisjon (ikke klokkeslett — §1), er rekkefølgen *innad* i én dato ikke
garantert kronologisk, bare gruppert riktig etter dato.

---

*Se `fa-engine-roadmap-krav.md` (kravspec fase 1), `fa-engine-idebank.md` (statusmodellens
`Idea`-trinn), `fa-engine-signalkoblingen.md` §5 (områdelisten) og
`fa-engine-crm-feltkatalog.md` (samme katalogformat for fase 5).*
