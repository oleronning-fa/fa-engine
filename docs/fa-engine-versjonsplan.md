# Fa Engine — versjonsplan

## Hva som bygges når, og hvilken avdeling som kommer om bord

*v0.1 · 12. august 2026 · erstatter faseplanen i `fa-engine-plan.md` §4*

> **Status:** 1.0, 1.1, 1.2 og 2.0 er definert under. Versjonene etter 2.0 kommer
> fra OC og fylles inn i §7.

---

## 1. Prinsippet bak nummereringen

Faseplanen i hovedplanen nummererte etter *hvor mye kode som skrives*. Den nye
lista nummererer etter noe bedre:

> **Hovedversjon = en ny avdeling får sin egen arbeidsflate.**
> **Underversjon = en avdeling som allerede er om bord får en ny evne.**

Det er en skarpere regel enn den ser ut, og den avgjør flere plasseringer med én
gang:

- **Feedback-skjema og chatbot er 1.x, ikke 2.0**, selv om det er mye arbeid.
  Leserne er *kilder*, ikke brukere av verktøyet. Brukeren er fortsatt
  produktteamet.
- **Kundeservice blir en bidragsyter i 1.1** — innboksen deres blir en
  signalkilde — men de får ingen egen arbeidsflate. De blir en hovedversjon
  først den dagen de får en sakskø i Fa Engine.
- **Telemarketing er 2.0** fordi de får et sted å jobbe, ikke bare et sted å
  levere data.

Regelen gjør også noe nyttig med forventningene: **et hovedversjonssprang koster
måneder, et underversjonssprang koster uker.** Da ser alle med én gang at 1.0 →
1.1 → 1.2 er tre skritt i samme retning, mens 1.x → 2.0 er et helt nytt prosjekt.

---

## 2. Oversikt

| Versjon | Hvem får en arbeidsflate | Innhold | Varighet* | Blokkere |
|---|---|---|---|---|
| **1.0** | Produktteamet | Roadmap-verktøy, Sheet-import, Jira-synk, idébank | 4–6 uker | Jira-token |
| **1.1** | *(ingen ny — leserne blir kilde)* | Feedback-skjema, chatbot på Fa.no, triage-innboks | 6–9 uker | Kunnskapsbase, DPIA |
| **1.2** | *(ingen ny)* | Ukesagenten: klynging, temaer, forslag, mandagsrapport | 2–3 uker | 1.1 må ha kjørt en stund |
| **2.0** | Telemarketing | CRM: ringelister, kundekort, tilbud, salg, provisjon | 18–23 uker | Sesamy, Telia, dagens CRM |
| **3.0+** | *(åpent)* | Fylles inn av OC | — | — |

\* Én utvikler med AI-assistanse. Sum 1.0–1.2: **12–18 uker**. Se §8 for hva det
betyr for 2.0.

---

## 3. Versjon 1.0 — roadmap-verktøyet

**Bruker:** OC, Magnus, Marina og de ~14 utførerne i Zagreb. Lesetilgang for
salg og kundeservice fra dag én.

**Innhold**

- Fundamentet: Postgres 16 + pgvector, Drizzle, pg-boss, Auth.js mot Google
  Workspace, revisjonslogg, OKD-deploy til staging og prod.
- **Domenemodellen og de 18 områdene** (`fa-engine-signalkoblingen.md` §5).
  Denne må være riktig nå; alt annet kan bygges om.
- Import av begge regnearkene — 439 punkter, 15 initiativer, 30 kilder — med
  gjennomgangsvisning for det importen ikke kan tolke selv.
- **Envegs lesesynk fra Jira.** Status, løsningsdato og utfører hentes; ingenting
  skrives tilbake, aldri. `CR`/`FT`/`On QA` speiles som `jiraSubstatus`.
- Én liste med filtrering, gruppering, inline redigering, bulk-endring,
  tastaturnavigasjon og delbar lenke til en filtrert visning.
- Epic-visning for de sju langsiktige arbeidsstrømmene.
- **Idébanken.** Det er `status = Idea` pluss en visning, ikke en modul
  (`fa-engine-idebank.md` §1). Koster timer, ikke uker, og den bør være med fra
  1.0 slik at konseptene har et sted å ligge før 1.1 gir dem tellere.

**Allerede gjort:** skjema, import og Jira-klient er verifisert mot ekte data
(`fa-engine-status.md`). Det er derfor estimatet er 4–6 og ikke 5–7 uker.

**Ferdig når:** null redigeringer i Google Sheetet i 14 dager, nytt punkt
registrert på under 20 sekunder, månedsarkiveringen er borte, og minst én fra
salg og én fra kundeservice har logget inn og funnet fram.

---

## 4. Versjon 1.1 — feedback og chatbot

**Bruker:** fortsatt produktteamet. Leserne møter to nye flater på Fa.no, men de
logger ikke inn i Fa Engine.

**Innhold**

- **Feedback-skjema på Fa.no.** Selvstendig bundle under 20 kB, egen node,
  feiler stille hvis Fa Engine er nede, og aldri en React-øy som omslutter en
  Zephr-feature-tag (`fa-engine-plan.md` §5).
- **Chatbot på Fa.no** — full versjon, per beslutning 12. august: kunnskapsbase,
  RAG over hjelpeinnhold, kildebelagte svar, tydelig eskalering til menneske.
- **E-postinntak fra kundeservice** og manuell registrering fra salg.
- **Triage-innboks** med kildefilter, og temaer med semantisk klynging.
- **Import av avvisningsgrunnene** telemarketing har samlet siden august (§9).

### Fire ting som må stå fast, ellers blir 1.1 dyrere enn planlagt

**1. Boten svarer, den handler ikke.** Feriestopp, adresseendring og oppsigelse
bygges mot Sesamy, ikke mot Zephr — det er §6 i hovedplanen, og den beslutningen
står. Konsekvensen er ubehagelig og må sies høyt: **1.1-boten kan svare på
spørsmål, men ikke løse saker.** Den delen av «Outperform the manual customer
service» som faktisk sparer kundeservice tid, kommer først når Sesamy er på
plass. Bygg det ikke to ganger.

**2. Kunnskapsbasen er den egentlige jobben.** RAG er noen dager. *Innholdet* er
ikke. Har Finansavisen hjelpesider som dekker abonnement, levering, innlogging,
eAvis og betaling — eller finnes svarene bare i hodet på kundeservice? Er det
siste, er 1.1 et innholdsprosjekt med et teknisk vedheng, og estimatet er for
lavt. **Dette er åpent spørsmål 1, og det bør besvares før 1.0 er ferdig.**

**3. DPIA før lansering, ikke etter.** Lesersamtaler er personopplysninger og
går gjennom en LLM. Vurderingen tar tid hos juridisk, og den bør startes
parallelt med 1.0 — ikke når koden er ferdig.

**4. Boten sier aldri noe om pris eller vilkår som ikke er kildebelagt.**
Improvisert policy fra en språkmodell til en forbruker er samme problem som en
selger som lover et ubesluttet produkt (`fa-engine-signalkoblingen.md` §9), bare
i skriftlig form og i stor skala.

**Ferdig når:** én uke med reell feedback er triagert og koblet til roadmapet, en
definert andel henvendelser løses uten menneske, og hver samtale er blitt et
signal.

---

## 5. Versjon 1.2 — ukesagenten

**Bruker:** fortsatt produktteamet. Dette er den delen hovedplanen kaller
*deres faktiske edge* — den det ikke finnes god hyllevare for.

**Hvorfor den er en egen versjon og ikke en del av 1.1:** agenten klynger
signaler. Uten et par ukers signaler å klynge er den ikke testbar, og en agent
som leverer tull første mandagen brenner tilliten en gang for alle. Den må komme
*etter* 1.1, ikke i den.

**Men den kan heller ikke vente lenge.** 1.1 gir dere en innboks. En innboks som
ingen rekker å triagere, dør på seks uker — det er samme mekanisme som drepte
estimatkolonnene i regnearket. **1.2 bør starte innen en måned etter 1.1.**

**Innhold:** embedding og klynging, semantisk matching mot roadmap *og
konsepter*, forslag med klikkbar evidens, ruting per område til riktig
Slack-kanal, godkjenn-UI, og måling av aksept-rate.

**Ferdig når:** første mandagsrapport blir faktisk lest, og aksept-raten måles.
Under 40 % skrus agenten av eller strammes inn — den tunes ikke i det uendelige.

---

## 6. Versjon 2.0 — CRM for telemarketing

**Bruker:** telemarketingavdelingen. Første hovedversjonssprang.

Spesifisert i sin helhet i `fa-engine-crm-krav.md`. Fem leveranser:

| | Innhold | Varighet |
|---|---|---|
| 2.0a | Kundegraf, kundekort, Sesamy-oppslag, identitetskobling, Brreg-berikelse | 3–4 uker |
| 2.0b | Ringelister, fordeling, låsing, resultatkoder, Telia, **hele det juridiske laget** | 4–5 uker |
| 2.0c | Tilbud, oppgaver, avtaler, maler, skriftlig aksept | 3 uker |
| 2.0d | Salg → Sesamy-ordre, betalingsspeiling, provisjonsgrunnlag, rapporter | 4–5 uker |
| 2.0e | B2B-pipeline, fornyelser, churn, oppsalg | 4–6 uker |

**2.0b er MVP.** Det er der telemarketing kan forlate dagens verktøy. Og det er
det ene punktet i hele planen som ikke er forhandlingsbart: **2.0b kan ikke
leveres uten reservasjonsvask, ringevinduer og sperrer.** Det er ikke en
2.0d-oppgave man tar senere.

---

## 7. Etter 2.0

*Venter på OC. Plassholderne under følger av deres egen 2026-plan og av
hovedplanen, og er ikke besluttet.*

Kandidater, i den rekkefølgen regelen i §1 tilsier:

- **Kundeservice får en arbeidsflate.** De blir bidragsytere i 1.1; en egen
  sakskø med abonnementshistorikk og skrivehandlinger mot Sesamy gjør dem til
  brukere. Dette er «Outperform the manual customer service» fullført.
- **B2B-selvbetjening.** Rad 143–144 i 2026-planen: *«extract data from Zephr
  into web page with login for b2b clients»* — nå Sesamy. Delvis dekket av 2.0e.
- **Annonse.** Egen interessent, egne inntekter, eget roadmap i dag.
- **Mockup-agenten.** Tema + evidens + designsystemet → et designforslag. Ikke en
  avdeling, så den er en underversjon et sted.

---

## 8. Konsekvensen ingen liker

Regn på det. Starter 1.0 nå:

```
aug 2026   1.0 starter
okt        1.0 ferdig          (4–6 uker)
des        1.1 ferdig          (6–9 uker)
jan 2027   1.2 ferdig          (2–3 uker)
jan        2.0 starter
mar–apr    2.0b — telemarketing kan ringe fra Fa Engine
aug–okt    2.0 komplett med provisjon og B2B
```

**Telemarketing får en fungerende arbeidsflate tidligst i mars 2027, og et
komplett CRM høsten 2027.**

Det er ikke et argument mot rekkefølgen — den er riktig, fordi hvert steg gjør
det neste billigere, og fordi CRM-et uten kundegrafen fra 1.0 og signalene fra
1.1 bare er et innkjøpt ringesystem med ekstra trinn.

Men det gjør beslutningsregelen i `fa-engine-crm-krav.md` §15 konkret og akutt:

> **Har dagens telemarketing-CRM under et år igjen å leve, holder ikke denne
> rekkefølgen.** Da må dere enten kjøpe en bro, eller kjøre to spor parallelt.

**De tre reelle håndtakene, i prioritert rekkefølge:**

1. **En utvikler til på 2.0-sporet.** 1.0–1.2 og 2.0a–b kan gå parallelt fra
   november, når domenemodellen står. Det flytter telemarketing fram til
   desember–januar. Dette er det billigste håndtaket, og det eneste som ikke
   koster kvalitet.
2. **Del 1.1.** Skjema og signalinntak er 1–2 uker; chatboten er 4–6 pluss DPIA.
   Leveres skjemaene som 1.1 og boten som 1.3, starter 2.0 fem uker tidligere.
   Kostnaden er at kundeservice ikke får avlastning før senere.
3. **Kjøp en bro.** Et innkjøpt ringesystem i mellomtiden, med en bevisst plan
   for å hente dataene inn i 2.0. Dyrest på lang sikt, tryggest på kort.

**Ikke gjør det fjerde:** å haste 2.0 foran 1.0 og 1.1. Da bygger dere CRM-et
uten kundegraf, uten områdetaksonomi og uten signalkobling — og da har dere kjøpt
et ringesystem til prisen av å bygge et.

---

## 9. Det som må skje uansett rekkefølge

Tre ting som ikke hører til noen versjon, og som taper verdi for hver uke de
utsettes:

1. **Telemarketing registrerer avvisningsgrunn fra denne uken**, med de ti
   kodene i `fa-engine-signalkoblingen.md` §6, i verktøyet de har i dag. Rundt
   1 300 datapunkter i måneden som ikke lar seg rekonstruere. Importeres i 1.1.
2. **Én ansvarlig og én Slack-kanal per av de 18 områdene.** Blokkerer ruting i
   1.0, forslag i 1.2 og eierskap i alt. Én ettermiddag.
3. **Sesamy-avklaringene** (`fa-engine-crm-krav.md` §13). Oppslag på
   telefonnummer avgjør om kundekortet i 2.0a er byggbart i det hele tatt, og
   webhook-katalogen avgjør provisjonsgrunnlaget i 2.0d. Spør nå — svaret tar
   uker å få.

---

## 10. Endringer mot `fa-engine-plan.md` §4

| Før | Nå | Hvorfor |
|---|---|---|
| Fase 0 + 1 | **1.0** | Fundament og roadmap er én leveranse, ikke to |
| Fase 2 + 4 | **1.1** | Chatboten er en signalkilde og hører sammen med skjemaene |
| Fase 3 | **1.2** | Uendret innhold, ny plassering etter 1.1 |
| Fase 5 | **2.0** | Estimatet hevet fra 6–8 til 18–23 uker (`fa-engine-crm-krav.md` §16) |
| Fase 6 | *fordelt* | Mockup-agenten er en underversjon, ikke en fase |

Prinsippet «ingen ny modul før den forrige har daglige brukere» står uendret. Det
er fortsatt den viktigste setningen i hele planen.

---

## 11. Åpne spørsmål

1. **Finnes hjelpeinnholdet chatboten skal svare fra?** Avgjør om 1.1 er 6 eller
   12 uker. Bør besvares før 1.0 er ferdig.
2. **Er det én eller to utviklere?** Avgjør om telemarketing får noe i desember
   eller i mars.
3. **Hvor lenge lever dagens telemarketing-CRM?** Avgjør om §8-håndtakene må tas.
4. **Skal kundeservice ha en egen arbeidsflate, og når?** De blir bidragsytere i
   1.1 uten å bli brukere. Det er en ærlig mellomtilstand, men den bør være
   villet.
5. **Versjonene etter 2.0.** Kommer fra OC.

---

*Se `fa-engine-plan.md` (helheten) · `fa-engine-roadmap-krav.md` (1.0) ·
`fa-engine-signalkoblingen.md` (skjøten) · `fa-engine-crm-krav.md` og
`fa-engine-crm-feltkatalog.md` (2.0) · `fa-engine-idebank.md` og
`fa-engine-konseptmal.md` (idébanken).*
