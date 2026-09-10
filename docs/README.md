# Fa Engine — dokumentpakke for Claude Code

Dette er den komplette spesifikasjonen for Fa Engine (Hegnar Media / Finansavisen),
eksportert fra Claude-prosjektet "Fa Engine" slik at du kan legge den i en lokal
mappe og starte en Claude Code-økt mot den. Alt her er skrevet av OC (Ole Christian)
sammen med Claude, gjennom flere runder i august–september 2026.

## Hvordan bruke pakken

1. Pakk ut alle filene i denne zip-en i rota av det nye repoet ditt (eller i en
   `docs/`-mappe — men behold filnavnene som de er, dokumentene refererer til
   hverandre ved filnavn).
2. Start Claude Code i den mappa. Be den lese `fa-engine-plan.md` og
   `fa-engine-versjonsplan.md` først for helheten, deretter resten etter behov
   (se rekkefølgen under).
3. `fa-engine-roadmap-prototype.html` er **ikke kode som skal bygges videre på**
   — det er en klikkbar UX-mockup med fixture-data (ingen ekte backend, ingen
   database). Bruk den som visuell referanse for hvordan roadmap-modulen skal
   oppføre seg og se ut. Åpne den direkte i en nettleser.
4. `fa-engine-roadmap-feltkatalog.md` og `fa-engine-crm-feltkatalog.md` er
   **kontrakten** mellom prototypen og den ekte implementasjonen — de beskriver
   nøyaktig hvilke felt som skal finnes, hvem som eier dem, og om de kan
   redigeres. Dette er trolig de viktigste dokumentene å gi Claude Code når
   dere begynner å bygge datamodellen.

## Anbefalt leserekkefølge

**Start her — helheten:**

1. `fa-engine-plan.md` — arkitektur- og utviklingsplanen. Systemanalogi,
   domenemodell, teknisk stack (Astro 5, Postgres/pgvector, Drizzle, pg-boss,
   Auth.js, osv.), designprinsipper, risiko. *Merk: kapittel 4 (faseplanen) er
   erstattet av `fa-engine-versjonsplan.md` — resten av dokumentet står.*
2. `fa-engine-versjonsplan.md` — den gjeldende versjons-/rekkefølgeplanen
   (v1.0 → v1.1 → v1.2 → v2.0 → v3.0+), med begrunnelse, tidslinje og
   konsekvensene av rekkefølgen.
3. `fa-engine-status.md` — statusøyeblikksbilde fra midten av august: hva som
   er verifisert i det opprinnelige repoet, beslutninger tatt, blokkere, neste
   steg. Nyttig kontekst, men sjekk om noe har endret seg siden.

**v1.0 — roadmap-modulen:**

4. `fa-engine-roadmap-krav.md` — kravspesifikasjon basert på kartlegging av
   Google Sheet-regnearkene som roadmapet skal erstatte (356 punkter, 15
   faner). Felt-for-felt-mapping, importspesifikasjon, adopsjonskriterier.
5. `fa-engine-roadmap-feltkatalog.md` — **kontrakten**. Alle felt på Epic og
   Task/Bug/Research, med type, eier og redigerbarhet. v0.8, holdt i takt med
   prototypen gjennom mange runder — les endringsloggen øverst i filen for å
   forstå utviklingen.
6. `fa-engine-roadmap-prototype.html` — den klikkbare mockupen (se over).

**Idébanken (del av v1.0):**

7. `fa-engine-idebank.md` — hvordan idéer og konsepter kommer inn i roadmapet
   uten en egen modul (statusfeltet `Idea` + en visning + en mal).
8. `fa-engine-konseptmal.md` — `fa-concept`-skillen som strukturerer
   konseptinnlevering, og to modellhull den avdekket (nå løst, se merknadene i
   filen).

**Skjøten mellom modulene:**

9. `fa-engine-signalkoblingen.md` — **det viktigste enkeltdokumentet for
   domenemodellen.** Hvordan CRM, idébank, feedback og roadmap blir ett system
   via `signal`-entiteten. Inneholder den **gjeldende, konsoliderte
   18-verdis områdetaksonomien** (§5) som erstatter de spredte listene i
   `fa-engine-plan.md` og `fa-engine-roadmap-krav.md`, og innvendingskodene
   (§6) for salgsdata.

**v2.0 — CRM for telemarketing (senere fase, men spesifisert i sin helhet):**

10. `fa-engine-crm-krav.md` — full kravspesifikasjon for CRM-modulen: juridiske
    krav (reservasjonsregister, ringevinduer, skriftlig aksept), domenemodell,
    resultatkoder, selgerflate, ringelister/fordeling/låsing, provisjon,
    integrasjoner (Sesamy, Telia, Brreg), fem deleveranser (5a–5e).
11. `fa-engine-crm-feltkatalog.md` — **kontrakten** for CRM-modulen, samme
    format som roadmap-feltkatalogen.

**Design:**

12. `fa-design-system.md` — det fullstendige Finansavisen-designsystemet
    (v1.1), reverse-engineert fra produksjon: farger, typografi, layout,
    global chrome, komponenter. Fa Engine sine interne flater arver disse
    tokenene, men med et eget internt register (blue-700 sidemeny, grey-25
    lerret, blue-500 som eneste interaktive farge — se `fa-engine-plan.md`
    §7). Inneholder et kopierbart CSS-startpunkt i §13.

## Viktige ting å vite før du begynner å kode

- **Domenemodellen kommer først.** `fa-engine-plan.md` sier det rett ut: alt
  annet kan bygges om, men domenemodellen (person/signal/theme/roadmap_item,
  og CRM-entitetene senere) må være riktig fra dag én.
- **Områdetaksonomien har hatt tre versjoner** (i `fa-engine-plan.md` §2, i
  `fa-engine-roadmap-krav.md` §7, og opprinnelig i idébank/konseptmal). **Bruk
  alltid den konsoliderte 18-verdis-listen i `fa-engine-signalkoblingen.md`
  §5** — den er den gjeldende og erstatter de andre. Dokumentene over har fått
  merknader der dette er relevant, men dobbeltsjekk alltid mot
  signalkoblingen.
- **Jira eier gjennomføring, Sesamy eier pengene, Fa Engine eier relasjonen og
  intensjonen.** Dette prinsippet går igjen i både roadmap- og CRM-delen og er
  verdt å ha i bakhodet ved enhver integrasjonsbeslutning.
- **Ingen ny modul før forrige har daglige brukere.** Hovedregelen for
  rekkefølge, gjentatt i flere dokumenter.
- **Prototypen (`fa-engine-roadmap-prototype.html`) er UX-referanse, ikke
  kode.** Den bruker fixture-data og har ingen ekte datalag. Feltkatalogene er
  den formelle kontrakten — bruk dem, ikke prototypens JS, som kilde til
  sannhet om datamodellen.

## Hva som mangler i denne pakken

Det opprinnelige repoet (`fa-engine.zip`, nevnt i `fa-engine-status.md`) med
faktisk skjema, import og Jira-klient ligger ikke i Claude-prosjektet og er
derfor ikke med her — det ble levert direkte i en tidligere samtale. Har du
det liggende lokalt, er det naturlig å legge disse dokumentene rett i det
repoet.

---

*Eksportert fra Claude-prosjektet "Fa Engine" til Hegnar Media, 10. september 2026.*
