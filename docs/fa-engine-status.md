# Fa Engine — status

*Sist oppdatert 12. august 2026*

## Hvor vi er

Fase 0 er påbegynt. Repoet finnes som `fa-engine.zip` (levert i chat, ikke i prosjektet
— zip kan ikke lagres her). Skjema, import og Jira-klient er verifisert mot ekte data.

**Bygges av:** Ole Christian og Magnus i Oslo, med AI-assistanse. Ikke Marinas team i
Kroatia — de er brukere med skrivetilgang til dataene.

## Dokumenter i prosjektet

| Fil | Innhold |
|---|---|
| `fa-engine-plan.md` | Helheten: systemanalogi, domenemodell, faseplan, teknisk stack, risiko |
| `fa-engine-roadmap-krav.md` | v0.2 + §11. Kartlegging av begge regnearkene, kravspec for fase 1 |
| `fa-engine-idebank.md` | Hvordan konsepter kommer inn i roadmapet. Ikke en modul — et felt, en visning og en mal |
| `fa-engine-konseptmal.md` | `fa-concept`-skillen, og de to hullene testene fant |
| `fa-engine-crm-krav.md` | Kravspec for fase 5 — telemarketing og abosalg |
| `fa-engine-crm-feltkatalog.md` | Hvert felt med type, eier og redigerbarhet. Kontrakten mot prototypen |
| `fa-engine-signalkoblingen.md` | **Ny 12. august.** Hvordan CRM, idébank, feedback og roadmap blir ett system |
| `fa-engine-status.md` | Denne |

**Prototype:** `fa-engine-crm-prototype` — feltkomplett arbeidsflate med fixture-lag,
levert i chat og som artefakt. Fem skjermer, ingen datakilder koblet.

## Verifisert i repoet

- 16 tabeller, migrasjoner genereres og kjører mot Postgres 16 + pgvector
- Importen leser begge arkene: **439 punkter, 15 initiativer, 30 kilder, 4 åpne spørsmål**, seedet rent
- 226 punkter venter på manuell områdegjennomgang (med vilje — importen gjetter ikke selvsikkert)
- `src/core/jira.ts`: lesing av FCK/FIB/FADT/FAPPS/JB, én engangs `createIssue`, ingen toveis synk

## Beslutninger tatt

- Jira eier gjennomføring, Fa Engine eier intensjon. Seks statuser, ikke ni. `CR`/`FT`/`On QA` speiles som `jiraSubstatus`.
- Én container. pg-boss kjører i samme Node-prosess. Ingen DevOps-forespørsel til Profico i fase 0.
- Interne flater på engelsk, leservendte på bokmål. Sitater fra lesere oversettes aldri.
  **Unntak fra 12. august: CRM-modulen er på norsk** — telemarketing-selgerne sitter i Oslo.
  Feltnavn i kode er engelske, etiketter i UI norske via `i18n/nb.ts`.
- Statusfarger er en ren blåskala. Grønt og rødt er reservert for markedsretning.
- `jira_key` er **ikke** unik. Flere roadmap-rader kan peke på én Jira-sak.
- `SubscriptionProvider`-grensesnitt fra dag én. Ingen skrivehandlinger mot Zephr.

### Fase 5 — CRM

- **Telemarketing og B2B slås sammen til én CRM-modul** på én kundegraf. Prospekt er en
  `person` uten abonnement, ikke en egen entitet.
- **Sesamy eier pengene.** Produkt, pris, ordre, faktura, betaling, entitlement.
  Fa Engine eier relasjonen, samtalen, tilbudet, eierskapet og provisjonsgrunnlaget.
  Et salg er ikke provisjonsberettiget før Sesamy bekrefter første betaling.
- **Telia er telefonilaget.** Smart Connect Integrator-API for klikk-for-å-ringe og
  samtalehendelser. Ingen dialer i Fa Engine, ingen prediktiv oppringing.
- **Det juridiske laget håndheves i kode**, ikke i rutine: reservasjonsvask, ringevinduer,
  sperrer, skriftlig aksept. Kan ikke utsettes til senere leveranse.
- **Estimatet for fase 5 er hevet fra 6–8 til 18–23 uker**, delt i fem leveranser (5a–5e).
- Resultatkodetaksonomien er fast kodesett, endres i kode. Fritt konfigurerbare
  resultatkoder er forbudt.

### Signalkoblingen — 12. august

- **Områdetaksonomien er konsolidert til 18 verdier.** Listene i `fa-engine-plan.md` §2 og
  `fa-engine-roadmap-krav.md` §7 var ulike; konflikten ble flagget i `fa-engine-konseptmal.md`
  §2. Begge erstattes av lista i `fa-engine-signalkoblingen.md` §5. Nytt område:
  **`Interne verktøy`**, som lukker hullet konseptmal-testene fant.
- **Salgsinnvendinger får en egen akse, `signal.objection`** — 10 faste koder. Et salgsavslag
  har som regel ingen flate, og skal ikke presses inn i områdelista.
- **Selgere leverer signaler, ikke konsepter.** Én tast lager et signal med `source: salgsnotat`.
  Konseptmalen beholder friksjonen den har.
- **Konsepter vises aldri i selgerens kundekort.** Roadmap vises fra `Prioritert`, med
  kvartalspresisjon. Et muntlig løfte om et ubesluttet produkt til en forbruker er et
  forbrukerrettslig problem, ikke bare et kommunikasjonsproblem.
- **Et konsept får tre tellere:** lesersignaler, salgsavvisninger og tilbudt førsteårsverdi.
  Det siste tallet heter aldri «tapt inntekt».
- **Gjenvinningssløyfen:** når et konsept leveres, kan CRM-et generere ringelisten over dem
  som sa nei av den grunnen — gjennom samme vask som alle andre lister.

## Blokkere

| Hva | Hvem |
|---|---|
| Fargelegenden i WiP-arket (sju farger, ingen forklaring) | Den som fargela |
| Jira API-token, lesetilgang til 5 prosjekter | Profico / Atlassian-admin |
| Slack-app med `chat:write` | Hegnar workspace-admin |
| **Sesamy: oppslag på telefonnummer, webhook-katalog, ordre på vegne av selger, sandkasse** | Sesamy |
| Sesamy: eksponeres `cancellationReason`? Gratis fjerde signalkilde | Sesamy |
| Sesamy-tidslinje for Finansavisen | Hegnar |
| **Hvilket CRM telemarketing bruker i dag, og hvor lenge det lever** | Telemarketing |
| **Hvor mange samtaler telemarketing har i uka** — avgjør hele signalargumentet | Telemarketing |
| **Hvilket Telia-produkt Hegnar har, og om Integrator-API er med i avtalen** | Hegnar / Telia |
| **Gjelder avisunntaket fra skriftlig aksept også rent digitalt abonnement?** | Juridisk |
| **Provisjonsregler og tilbakeføringsvindu, konkret** | Telemarketing / lønn |
| **Én ansvarlig og én Slack-kanal per av de 18 områdene** — nå med tre ventende forbrukere | Hegnar |
| **Hvem eier innvendingskodene?** Pris og pakking, men hvem er det? | Hegnar |
| Abonnement på Reservasjonsregisteret (SFTP, ~24 600 kr/år) | Hegnar innkjøp |
| DPA med LLM-leverandør i EU | Juridisk |

## Neste

1. **Be telemarketing registrere avvisningsgrunn fra denne uken**, med de 10 kodene, i
   verktøyet de har i dag. Dette er det eneste som haster — dataen lar seg ikke
   rekonstruere. `fa-engine-signalkoblingen.md` §10
2. Områdegjennomgang av de 226 punktene, nå mot den konsoliderte 18-lista
3. Jira-token → kjør berikelse av de 238 punktene med saksnøkkel
4. Første ekte roadmap-visning bygget på det seedede datasettet
5. Oppdater plan §2, roadmap-krav §7, idébank §5 og `fa-concept`-skillen med den nye lista
6. Svar på blokkerne i **fet** — de avgjør om fase 5 bygges eller broes (`fa-engine-crm-krav.md` §15)
