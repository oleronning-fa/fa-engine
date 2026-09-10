# Fa Engine — idébanken

## Hvordan flere kan levere gjennomarbeidede idéer inn i roadmapet

*v0.1 · august 2026 · svar på OCs spørsmål 5. august · bygger på `fa-engine-plan.md` og `fa-engine-roadmap-krav.md`*

---

## 1. Kortsvaret: du trenger ikke en bro

Spørsmålet var «et område for idéer, og så en bro fra området til roadmapet». Broen er der problemet oppstår. Hver gang to systemer skal snakke sammen må noen vedlikeholde koblingen, og i praksis blir idéområdet et sted ting *ligger* i stedet for et sted ting *skjer*.

Alternativet er enklere og bedre: **la idéen bo i roadmapet fra første dag, bare på et tidligere stadium.** Statusmodellen i `fa-engine-roadmap-krav.md` §3.1 har allerede seks verdier. Legg til én foran:

```
Idea  →  Under review  →  Prioritized  →  In Jira  →  Delivered
                    ↘                            ↘
                      Declined                     (begrunnelse logges)
```

Da er «å bestemme at vi bygger Magnus' idé» én statusendring, ikke en migrering. Beskrivelsen, mockupen, evidensen og forfatteren er allerede på plass — fordi de aldri lå noe annet sted. Spørsmålet «vet FA Engine allerede om den?» får svaret ja, av konstruksjon.

Dette er samtidig det som holder planens egen hovedregel: ingen ny modul før den forrige har daglige brukere. Idébanken blir ikke fase 1.5. Den er et felt, en visning og en mal.

---

## 2. To slags idéer, og de finnes begge i modellen allerede

Den viktige distinksjonen er ikke *idé vs. roadmap-punkt*. Den er **ønske vs. konsept**.

| | Ønske | Konsept |
|---|---|---|
| Hva | «Kunne vi ikke hatt X?» | Gjennomarbeidet forslag med problem, omfang og gjerne mockup |
| Hvem | Hvem som helst — Slack, e-post, kundeservice, salg | Den som har tid og verktøy til å jobbe det fram |
| Arbeid bak | Sekunder | Timer, med AI-assistanse |
| Blir i Fa Engine | **`signal`** med `source = intern idé` | **`roadmap_item`** med `status = Idea` |
| Havner i | Et tema, sammen med lignende ønsker | Idébank-visningen, med eier og beslutningsfrist |

Begge finnes i domenemodellen i `fa-engine-plan.md` §2 i dag. `signal` har allerede `intern idé` som kilde. `roadmap_item` har allerede `theme_ids[]`. **Ingen nye entiteter trengs.**

Konsekvensen er en klar regel folk kan huske: *har du et ønske, si det i Slack. Har du et konsept, skriv det i malen.* Friksjonen i malen er en funksjon, ikke et hinder — den er nøyaktig det som skiller de to, og Claude gjør jobben uansett.

---

## 3. Standardformatet

Dette er den delen som er verdt mest og koster minst. Den kan lages denne uken, før én linje kode finnes.

Et konsept er **én mappe med to filer**: `concept.md` og valgfritt `mockup.html` (selvstendig, alt inline — samme regel som mockup-agenten i planens §3).

```markdown
---
concept_id: 2026-08-magnus-portfolio-alerts   # dato-forfatter-slug
title: Price alerts on watchlist positions
proposed_by: Magnus
created: 2026-08-05
area: Watchlist & portefølje      # NØYAKTIG én av de 15 i roadmap-krav §7
type: feature                      # feature | improvement | fix | research
size: M                            # S | M | L | ongoing — grovt, valgfritt
status: idea
mockup: mockup.html
related_items: []                  # kjente roadmap-punkter eller Jira-nøkler
related_themes: []                 # fylles av agenten, ikke av forfatter
---

## Problem
Hvem har det, hvor ofte, hva koster det. Maks fem setninger.

## Who it affects
Lesere / bedriftskunder / redaksjon / salg / support / internt.
Anslag på antall hvis mulig.

## Proposal
Hva vi bygger. Nok til at en annen kan vurdere det — ikke en spesifikasjon.

## Not in scope
Det som *ikke* er med. Dette feltet er verdt mer enn det ser ut:
det er der de fleste interne diskusjoner ellers havner.

## How we'd know it worked
Én målbar ting.

## Open questions
```

Fire ting er ikke forhandlingsbare, og hver av dem har en grunn hentet fra dataene:

**`area` må være én av de 15.** Dette er hele koblingen. Fritekst her gjenskaper `Owner`/`Team`-problemet fra roadmap-krav §3.3 — 22 unike verdier for to personer — bare ett lag tidligere i kjeden. Nedtrekksliste, ikke tekstfelt, den dagen det finnes UI.

*(MERK: dette punktet er senere oppdatert — det er nå 18 verdier, se `fa-engine-signalkoblingen.md` §5.)*

**`proposed_by` følger punktet hele veien til levering.** Attribusjon er drivstoffet i et sånt område. Magnus' idé skal hete Magnus' idé også når den shipper, og han skal få beskjed når det skjer.

**Malen er på engelsk.** Punktet ender i roadmapet, og roadmapet skal være på engelsk fordi utviklingsteamet sitter i Zagreb (roadmap-krav §10). Skriver noen på norsk er det greit — Claude oversetter tittel og problemsammendrag ved innlevering. Men standarden er engelsk, ellers får dere to språk i samme liste.

**Én mockup-fil, ikke et prosjekt.** Selvstendig HTML, FA-tokens fra designsystemet, alt inline. Da kan den vises i verktøyet, i en preview-deploy og i Slack uten byggesteg.

Dette formatet bør pakkes som en **skill** som hver bidragsyter installerer sammen med designsystem-filen. Skillen gjør tre ting: stiller de spørsmålene malen krever, håndhever områdelista, og skriver ut mappa. Da får dere samme format fra fem personer uten å be dem lese en instruks.

Bonus: `concept.md` er også svaret på et problem regnearket har i dag. Beskrivelser ligger nå i raden *under* tittelen, uten eget felt (roadmap-krav §1). Et konsept *er* en ordentlig beskrivelse. Punkter som kommer inn denne veien er bedre dokumentert enn noe i arket i dag.

---

## 4. Veien fra Magnus' Claude-konto til Fa Engine

Tre nivåer, i økende kostnad. De er ikke alternativer — de er en rekkefølge.

**Nivå 1 — delt Claude-prosjekt. Tilgjengelig i dag, null bygging.**
Magnus jobber i sin egen konto, og skriver ferdig konsept inn i et delt prosjekt. Alle ser det, Claude kan søke i det. Det er nøyaktig mekanismen dette notatet selv ble til med. Ingen status, ingen telling, ingen kobling til signaler — men det samler innholdet, og innholdet er det knappe.

**Nivå 2 — `concepts/`-mappe i repoet, én PR per idé. Fase 0, nesten gratis.**
Planen krever allerede PR + godkjenning + preview-deploy per PR (§8). Da får dere følgende uten å bygge noe nytt: mockupen er klikkbar i preview-deployen, diskusjonen skjer i PR-en, versjonshistorikken er gratis, og *merge er beslutningen om å ta idéen inn i banken*. Et byggesteg leser `concepts/*/concept.md` ved deploy og skriver punktene inn i databasen. Dette er den billigste ekte broen som finnes, og den er verdt å velge selv om nivå 3 kommer senere.

**Nivå 3 — innlevering i Fa Engine. Fase 2, sammen med feedback-huben.**
Dra inn `concept.md`, parseren leser front matter, mockupen lagres som vedlegg. Ved innlevering kjøres semantisk søk mot både eksisterende konsepter og temaer: *«to lignende konsepter finnes — er dette det samme?»* Samme pgvector-maskineri som temaklyngingen, ingen ny teknologi.

Ikke-kodere kan levere på nivå 1 og 3. Nivå 2 er for de som allerede er i repoet.

---

## 5. Det som gjør dette til noe annet enn en idépostkasse

Her ligger den egentlige verdien, og det er den delen OC beskrev til slutt: *«hvis det kommer mye feedback, kanskje FA Engine kan flagge — dette løses av Magnus' idé!»*

Det faller ut nesten gratis. Steg 4 i ukesagenten matcher allerede hvert nytt tema semantisk mot roadmapet. Legg konseptene i det samme korpuset, og agenten kan si:

> «34 nye signaler denne uken om varsler på porteføljen. Dette matcher konsept `2026-08-magnus-portfolio-alerts` (ikke bygget, foreslått i august, berørt ARR 1,2 MNOK).»

Da har konseptet fått en **etterspørselsteller**. Og det er den enkeltmekanismen som skiller et idéområde som lever fra ett som dør:

- Et konsept skrevet i mars med 0 signaler holder seg stille. Ingen trenger å avslå det.
- Et konsept som samler 40 signaler løfter seg selv, uten at forfatteren må minne om det i Slack.
- Prioritering blir et spørsmål med et tall bak, ikke et spørsmål om hvem som var mest overbevisende i møtet.

Sagt annerledes: **idéer akkumulerer evidens mens de venter.** Idépostkasser dør fordi ingenting skjer etter innlevering. Her skjer det noe hver mandag, uten at noen gjør noe.

Koblingen finnes allerede i modellen — `theme_ids[]` på `roadmap_item` og `sources[]` som peker andre veien. Broen OC spurte etter er to felt som er tegnet inn i planen fra før.

Den motsatte retningen er også verdifull og billigere enn den ser ut: når et konsept leveres, vet Fa Engine hvilke temaer det var koblet til, og dermed hvem som klaget. Planen har allerede forslagstypen `lukk sløyfen`. Samme mekanisme brukt på bidragsytere: *«ditt konsept shippet 12. november, og her er hva feedbacken sier nå.»* Det er det som utløser innlevering nummer to.

*(MERK: med CRM-modulen fra fase 5 koblet på, går dette fra én teller til tre — se `fa-engine-signalkoblingen.md` §7.)*

---

## 6. Beslutningsrytmen — det som faktisk avgjør om dette lever

Nesten alle interne idéområder er døde etter tre måneder. Alltid av samme grunn: ingen eier beslutningen, så ingenting får svar, så folk slutter å levere.

Fire regler mot det:

1. **Hvert konsept rutes til områdets ansvarlige automatisk.** Område → ansvarlig → Slack-kanal-tabellen finnes fra fase 0 (planens §2). Innlevering poster i kanalen og tagger eieren. Ingen «hvem ser på dette?».
2. **Fast gjennomgang, ikke løpende vurdering.** Én times konseptgjennomgang i måneden. Alt som ligger i `Idea` får en avgjørelse: `Under review`, `Declined` med begrunnelse, eller *bevisst liggende* — og «liggende» er et ærlig svar her, fordi telleren gjør jobben videre.
3. **Avslag er et svar, og det skal begrunnes én gang.** `proposal`-entiteten har allerede `begrunnelse for avvisning`. Det gjør at agenten senere kan si «dette ble avslått i mars, av denne grunnen — gjelder den fortsatt?» i stedet for at samme idé kommer tilbake hver høst.
4. **Mockup er ikke et løfte.** En polert mockup i FA-stil ser ut som en beslutning, spesielt for noen utenfor rommet. Konsepter må ha en synlig `Concept — not committed`-tilstand i alle visninger, og aldri komme med en PR mot produksjonskode. Planen sier dette om mockup-agenten (§3); det gjelder like sterkt for mennesker med Claude.

---

## 7. Hva som må bygges, og når

Ingenting av dette er en ny fase.

| Når | Hva | Kostnad |
|---|---|---|
| **Nå, før kode** | Malen + skillen. Samle konsepter i det delte Claude-prosjektet. | En ettermiddag |
| **Fase 0** | `status = Idea` med i statusmodellen. `proposed_by` som felt. `concepts/`-mappe + PR-flyt. | Timer, ikke dager |
| **Fase 1** | Idébank-visning: filtrert på `Idea`, gruppert på område, med mockup-forhåndsvisning. Importer konseptene som finnes. | Én visning i et verktøy som allerede har visninger |
| **Fase 2** | Innlevering i UI, dedup-søk ved innlevering, kobling til temaer. | Del av feedback-huben |
| **Fase 3** | Agenten matcher signaler mot konsepter og rapporterer etterspørsel. | Ett ekstra korpus i et steg som finnes |
| **Fase 6** | Mockup-agenten går andre veien: tema → konseptutkast. | Som planlagt |

Det viktigste i tabellen er øverste rad. Hvis dere begynner å samle konsepter nå, har idébanken innhold den dagen visningen finnes. Den andre måten sånne områder dør er å bli lansert tomme — ingen vil være den første som legger noe i en tom mappe.

---

## 8. Risiko

| Risiko | Alvorlighet | Håndtering |
|---|---|---|
| Idébanken blir en kirkegård | **Høy** | Fast månedlig gjennomgang, navngitt eier per område, etterspørselstelleren gjør «liggende» til et ærlig svar |
| 300 idéer drukner 45 backlog-punkter | Middels | `Idea` er et eget stadium med egen visning — den blander seg aldri inn i den prioriterte lista. Ønsker blir signaler, ikke punkter. |
| Mockup leses som en beslutning | Middels | Synlig `not committed`-tilstand, ingen PR mot produksjonskode, aldri i en kundevendt sammenheng |
| Fem varianter av samme idé | Middels | Semantisk dedup ved innlevering. Samme maskineri som temaklyngingen. |
| Fritekst i `area` bryter koblingen | Middels | Nedtrekksliste fra dag én. Skillen håndhever de 15 verdiene før noe UI finnes. |
| Formatet oppleves som byråkrati | Lav | Claude fyller det ut. Malen er seks korte seksjoner, og «not in scope» sparer mer tid enn hele malen koster. |
| Området vokser til en egen modul | Lav, men reell | Dette er felt + visning + mal. Idet noen foreslår egen arbeidsflyt, egne felt eller egne statuser: nei. |

---

## 9. Åpne spørsmål

1. **Hvem eier beslutningen per område?** Samme tabell som planens §2 krever — men nå med en ekstra grunn til å skrive den ferdig denne uken.
2. **Skal konsepter være synlige for salg og kundeservice?** De får lesetilgang i fase 1 uansett. Å se hva som er *tenkt på* gjør innmeldingen deres langt mer treffsikker — men det skaper også forventninger hos folk som snakker med kunder daglig. Verdt en avgjørelse, ikke en tilfeldighet.
3. **Er `epic` riktig nivå over et konsept?** Dette henger sammen med det uavklarte spørsmålet om «WiP - Fa Roadmap 2026» er et strategisk nivå (roadmap-krav §10). Hvis det finnes et `initiativ`-nivå, er det naturlig at konsepter kobles dit — «denne idéen hører til Investorchat».
4. **Skal Zagreb kunne levere konsepter?** Forslaget i roadmap-krav §10 er at utviklerne bare skriver i Jira. Konsepter er noe annet enn gjennomføring, og Marina og teamet har flest idéer om hva som er galt. Min anbefaling: ja, samme mal, samme vei inn.
5. **Trenger malen et felt for kostnad eller avhengighet?** Jeg har holdt det ute med vilje — estimatfeltene i arket døde etter et halvår (roadmap-krav §3.2). `size` som t-skjorte er nok på idéstadiet.

---

*Se også `fa-engine-plan.md` (helheten) og `fa-engine-roadmap-krav.md` (fase 1, feltmodellen). Se `fa-engine-signalkoblingen.md` for hvordan idébanken kobles til CRM-signaler i fase 5.*
