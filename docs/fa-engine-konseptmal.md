# Konseptmalen — levert som skill

*v0.1 · august 2026 · hører til `fa-engine-idebank.md` §3*

Malen fra idébank-notatet er pakket som en installerbar skill, `fa-concept`, og testet på tre realistiske innleveringer. Dette notatet holder beslutningene som ble tatt underveis, og de to hullene testene avdekket — begge i *våre egne* dokumenter, ikke i skillen.

---

## 1. Hva skillen gjør

Utløses når noen begynner å beskrive en idé til FA — «jeg har en idé», «lag et konsept av dette», «kan du skrive dette opp ordentlig». Den intervjuer forfatteren i seks steg (problem før løsning), håndhever områdelista, og leverer én mappe med to filer:

```
2026-08-magnus-portfolio-alerts/
├── concept.md      # fast schema, engelsk, front matter som kan importeres
└── mockup.html     # selvstendig, FA-tokens, obligatorisk
```

**Tre beslutninger, etter avklaring med OC:**

| Beslutning | Valgt | Konsekvens |
|---|---|---|
| Omfang | Mal **og** mockup | Én skill dekker hele leveransen |
| Mockup | **Obligatorisk** | Løst slik at det ikke utelukker idéer uten UI — se under |
| Utfylling | **Intervju til komplett** | Skillen presser på problem, omfang og måling før den skriver |

**Obligatorisk mockup uten å utelukke ikke-visuelle idéer.** En datamodell, en integrasjon eller en prosessendring har ingen skjerm. Skillen krever likevel `mockup.html`, men da som **før/etter-diagram**: dagens flyt ved siden av foreslått flyt, samme tokens, samme typografi. Vedlagt eksempel (abonnementshistorikk for kundeservice) viser at et før/etter ofte argumenterer bedre enn et grensesnitt ville gjort. Regelen blir dermed «hvert konsept har en visuell forklaring», ikke «hvert konsept har en skjerm».

**To ting er ikke valgfrie i mockupen.** Et gult `Concept — not committed`-banner, og en synlig merknad om at tallene er illustrasjon. Gult `#FCCA27` brukes ingen andre steder i produktet, så det leses som kommentar til designet framfor del av det. Det andre punktet kom fra testene: i et designsystem bygget rundt markedsdata leses `AKRBP +62,4 % hittil i år` i en velsatt tabell som en måling, ikke som pynt. Det er en større risiko enn feil tallformat.

**Skillen nekter når den ikke kan spørre.** Fra «vi burde ha noe AI-greier i forumet» leverer den *spørsmål*, ikke konsept — pluss en oppdeling av idéen i kandidater. Begrunnelsen er at attribusjon følger konseptet hele veien til levering: et oppdiktet konsept sendt inn under Magnus' navn koster en områdeeier ekte tid, og Magnus står ansvarlig for resonnement som aldri var hans. Testen bekreftet at oppførselen fungerer.

---

## 2. To hull i våre egne dokumenter

Testene fant disse, og de bør avgjøres av mennesker framfor å gjettes på hver gang.

**Områdetaksonomien finnes i to versjoner.** `fa-engine-plan.md` §2 har én liste (`Betaling & faktura`, `Papiravis & distribusjon`, `eAvis`, `Søk`, `Nyhetsbrev & varsler` …), skrevet før noe var telt. `fa-engine-roadmap-krav.md` §7 har en annen, utledet fra nøkkelordmatching over alle 356 punktene. Skillen bruker §7-lista, siden den har tall bak seg. Men den som har hovedplanen åpen vil velge feil, og det er nøyaktig den stille driften hele formatet finnes for å hindre. **Lista bør konsolideres på ett sted, og hovedplanens §2 rettes.**

**MERK: Løst i `fa-engine-signalkoblingen.md` §5.** Begge lister er erstattet av en konsolidert 18-verdis-liste. Se det dokumentet for den gjeldende taksonomien.

**Ingen områdeverdi passer for Fa Engines egne interne flater.** En kundeservicevisning av abonnementshistorikk er verken `Infrastruktur & teknisk gjeld` (definert som arbeid uten synlig flate), `AI & Investorchat` eller `Annet` (som er en kirkegård uten eier). Skillen løser det midlertidig: **bruk området til forretningsdomenet den interne flaten betjener** — abonnementshistorikk blir `Abonnement & betaling`, fordi det er eieren som skal avgjøre om den bygges, og temaklyngen kundeevidensen kommer inn i. Det er en fornuftig regel, men den er min, ikke deres. Verdt fem minutter.

**MERK: Løst.** Den konsoliderte 18-listen i `fa-engine-signalkoblingen.md` §5 inkluderer `Interne verktøy` som eget område.

En tredje, mindre: hovedplanen skriver statusverdier på norsk (`Ny`, `Under arbeid`), roadmap-kravene på norsk (`Ny` → `Under vurdering`), mens verktøyet skal være på engelsk. Skillen skriver `status: Idea`. Statusnavnene bør oversettes én gang, i `DESIGN.md`.

---

## 3. Språkdelingen, konkretisert

Roadmap-kravene §10 slår fast interne flater på engelsk, kundevendte på norsk. Skillen gjør det operativt:

- **`concept.md` på engelsk.** Punktet ender i roadmapet, og Zagreb leser det. Snakker forfatteren norsk, foregår intervjuet på norsk og Claude tilbyr et norsk sammendrag i samtalen — ikke som en tredje fil i mappa.
- **Kundevendte mockuper helt på norsk bokmål**, ekte tickere og norske tallformater.
- **Interne mockuper med engelsk chrome og engelske kolonneoverskrifter, men norske data**: kundenavn, fakturatekst, produktnavn (`eAvis`, `Bedriftsabonnement`), norske dato- og tallformater. En intern skjerm med oversatte kundedata ser ut som et annet selskaps produkt.

---

## 4. Neste steg

1. **Avgjør de to hullene over**, og oppdater skillen med én linje hver. *(Begge er nå avgjort — se merknadene i §2.)*
2. **Distribuer skillen** til Magnus og de andre bidragsyterne, sammen med `fa-design-system.md`.
3. **La de første tre-fire konseptene komme inn** før noe bygges, og se om formatet holder mot ekte idéer. Malen er billig å justere nå og dyr etter at femti konsepter er skrevet i den.
4. **Når fase 1 importerer**, les `concept.md`-front matter direkte. Feltene er valgt for å mappe rett på `roadmap_item` slik den er spesifisert i roadmap-krav §4.

---

*Se `fa-engine-idebank.md` for hvorfor idébanken ser slik ut, og `fa-engine-roadmap-krav.md` §4 for feltmodellen konseptene importeres inn i. Se `fa-engine-signalkoblingen.md` §5 for den gjeldende, konsoliderte områdelisten.*
