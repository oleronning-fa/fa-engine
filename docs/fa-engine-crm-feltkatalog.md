# Fa Engine fase 5 — feltkatalog for CRM-modulen

*v0.1 · 12. august 2026 · kontrakten mellom prototypen og den ekte implementasjonen*

Hvert felt i CRM-modulen med **type**, **eier** og **om det kan redigeres i
Fa Engine**. Katalogen er generert fra `src/modules/crm/domain/types.ts` i
prototypen, og de to skal holdes i takt: endrer du det ene, endrer du det andre.

**Slik brukes den.** Åpne prototypen, trykk «Vis datakilder», og gå gjennom
skjermbildene med selgerne og med selgerleder. Hvert felt viser eieren sin. To
spørsmål per felt: *trenger vi det?* og *hvor kommer det fra?* Det er billigere å
svare nå enn etter at en integrasjon er bygget.

## Eierkoder

| Kode | Betyr | Skriverett i Fa Engine |
|---|---|---|
| `FA` | Fa Engine eier feltet | Ja |
| `SES` | Speiles fra Sesamy | Nei — skriv gjennom Sesamys API |
| `TEL` | Speiles fra Telia Smart Connect | Nei |
| `BRR` | Brønnøysundregistrene (åpne data / Reservasjonsregisteret) | Nei |
| `UTL` | Utledet i kode av andre felt | Nei — beregnes |

---

## 1. `person`

Et prospekt er en `person` uten abonnement. Ingen egen prospekttabell — se
kravspec §4.1.

| Felt | Type | Eier | Red. | Merknad |
|---|---|---|---|---|
| `id` | Id | FA | – | |
| `pseudonymId` | string | FA | Nei | Primærnøkkel utad. Gjør GDPR enklere |
| `firstName` | string? | FA | Ja | |
| `lastName` | string? | FA | Ja | |
| `phoneE164` | string? | FA | Ja | **Fellesnøkkelen.** Normaliseres til `+47XXXXXXXX` |
| `phoneRaw` | string? | FA | Nei | Beholdes for sporbarhet ved import |
| `secondaryPhoneE164` | string? | FA | Ja | |
| `email` | string? | FA | Ja | Nøkkelen mot Sesamy i dag |
| `birthDate` | dato? | FA | Ja | Kreves for vask mot Reservasjonsregisteret |
| `address.street/postalCode/city` | string? | SES/FA | Ja | Sesamy for abonnenter, FA for prospekter |
| `accountId` | Id? | FA | Ja | Kobling til bedrift |
| `reservationStatus` | `ukjent`/`ikke_reservert`/`reservert` | BRR | Nei | |
| `reservationCheckedAt` | tidspunkt? | BRR | Nei | Eldre enn 7 døgn ⇒ hard sperre |
| `suppression.active` | bool | FA | Ja | Egen sperre |
| `suppression.reason` | string? | FA | Ja | |
| `suppression.createdAt/createdBy` | – | FA | Nei | |
| `suppression.permanent` | bool | FA | Ja | Standard `true` |
| `contactPolicy.minDaysBetweenCalls` | tall | FA | Ja | Fra kampanjen |
| `contactPolicy.lastContactedAt` | tidspunkt? | UTL | Nei | |
| `contactPolicy.nextEligibleAt` | tidspunkt? | UTL | Nei | |
| `contactPolicy.overriddenBy/overrideReason` | – | FA | Ja | Kun selgerleder, logges |
| `identityLink.sesamyUserId` | string? | FA | Nei | Se §11 |
| `identityLink.matchMethod` | `epost`/`telefon`/`navn_adresse`/`manuelt_bekreftet` | UTL | Nei | |
| `identityLink.confidence` | 0–1 | UTL | Nei | |
| `identityLink.confirmedBy/confirmedAt` | – | FA | Ja | Manuell bekreftelse |
| `origin` | `import`/`kampanje`/`manuelt`/`innkommende` | FA | Nei | |
| `createdAt` / `updatedAt` | tidspunkt | FA | Nei | |

**Åpent:** trengs fødselsdato på alle, eller bare på dem som skal vaskes? Det er
et dataminimeringsspørsmål og bør besvares av personvern, ikke av utvikling.

---

## 2. `subscription` — eies av Sesamy

Ingen av disse feltene skrives fra Fa Engine.

| Felt | Type | Eier | Merknad |
|---|---|---|---|
| `sesamySubscriptionId` | string | SES | |
| `productId` / `productName` | string | SES | |
| `channel` | `papir`/`digital`/`papir_digital` | SES | Avgjør om avisunntaket gjelder — se kravspec §3.5 |
| `status` | `aktiv`/`pauset`/`kansellert`/`utlopt` | SES | |
| `startedAt` / `endedAt` / `renewsAt` | dato | SES | |
| `priceNok` | tall | SES | |
| `billingInterval` | `manedlig`/`kvartal`/`arlig` | SES | |
| `paymentMethod` | string? | SES | |
| `entitlements[]` | string[] | SES | |
| `deliveryAddress` | adresse? | SES | Beste identitetsnøkkel for papirabonnenter |
| `cancellationReason` | string? | SES | Selgerens viktigste enkeltfelt i en vinback-samtale |

**Åpent:** eksponerer Sesamy `cancellationReason`, eller må den fanges i
kanselleringsflyten deres? Uten den ringer selgeren blindt.

---

## 3. `account` — bedrift

| Felt | Type | Eier | Red. | Merknad |
|---|---|---|---|---|
| `orgNumber` | string | FA | Ja | Nøkkel mot Brreg |
| `name` | string | BRR | Nei | |
| `industryCode` / `industryName` | string? | BRR | Nei | Enhetsregisteret |
| `employees` | tall? | BRR | Nei | Enhetsregisteret |
| `revenueNok` / `revenueFiscalYear` | tall? | BRR | Nei | Regnskapsregisteret |
| `address` | adresse | BRR | Nei | |
| `roles[]` | navn + rolle | BRR | Nei | Dekning må verifiseres |
| `seats` / `seatsUsed` | tall? | SES | Nei | Sesamys B2B-setelisensiering |
| `renewalDate` | dato? | SES | Nei | |
| `enrichedAt` | tidspunkt? | UTL | Nei | Cachetidspunkt. Vises i kortet |

Berikelse kjøres som jobb i `worker`, aldri synkront i ringeløkken.

---

## 4. `campaign`

| Felt | Type | Eier | Merknad |
|---|---|---|---|
| `name` | string | FA | |
| `purpose` | `tidligere_abonnent`/`oppsalg`/`nysalg`/`egne_prospekter`/`b2b` | FA | |
| `productIds[]` | string[] | FA→SES | Peker inn i Sesamys katalog |
| `startsAt` / `endsAt` | dato | FA | |
| `priority` | tall | FA | Inngår i køsorteringen |
| `callWindow.fromHour/toHour` | tall | FA | **Kan bare være smalere enn 09–21** |
| `callWindow.weekdaysOnly` | `true` | UTL | Konstant. Loven, ikke et valg |
| `maxAttempts` | tall | FA | |
| `minMinutesBetweenAttempts` | tall | FA | |
| `frequencyPolicyDays` | tall | FA | |
| `status` | `kladd`/`aktiv`/`pauset`/`arkivert` | FA | Arkivering mister ikke historikk |
| `ownerId` | Id | FA | |

---

## 5. `call_list`, `list_membership`, `assignment`

### `call_list`

| Felt | Type | Eier | Merknad |
|---|---|---|---|
| `campaignId` | Id | FA | |
| `name` | string | FA | |
| `sourceType` | `utvalgsregel`/`importert_fil`/`manuell` | FA | |
| `sourceRef` | string? | FA | Selve regelen eller filnavnet. Sporbarhet |
| `total` / `remaining` | tall | UTL | |
| `status` | `aktiv`/`pauset`/`tom`/`arkivert` | UTL | |

### `list_membership`

| Felt | Type | Eier | Merknad |
|---|---|---|---|
| `status` | `urort`/`pabegynt`/`oppfolging`/`avtale`/`avsluttet` | UTL | Kapasitetsvisningen er en `GROUP BY` på dette |
| `attempts` | tall | UTL | |
| `lastAttemptAt` | tidspunkt? | UTL | |
| `closedReason` | resultatkode? | FA | Hvorfor raden er ute av listen |

### `assignment` — **én aktiv per person**

| Felt | Type | Eier | Merknad |
|---|---|---|---|
| `personId` + `releasedAt IS NULL` | – | FA | **Unik indeks.** Personen låses, ikke listen |
| `sellerId` | Id | FA | |
| `assignedAt` / `assignedBy` | – | FA | |
| `expiresAt` | tidspunkt | FA | TTL. Dette er også omfordeling ved fravær |
| `transferredFromSellerId` / `transferReason` | – | FA | Overføring beholder historikken |

---

## 6. `call_attempt` og `call`

Forsøket eies av Fa Engine. Samtalen eies av Telia. De kobles, de er ikke det
samme.

### `call_attempt` — FA

`personId` · `listId` · `sellerId` · `attemptNo` · `startedAt` · `outcomeCode` ·
`outcomeReason` · `note` · `teliaCallId` · `signalId`

`signalId` settes når resultatkoden skal bli et signal i feedback-modulen.

### `call` — TEL, speilet

`teliaCallId` · `direction` · `fromNumber` · `toNumber` · `startedAt` ·
`answeredAt` · `endedAt` · `durationSeconds` · `queue` · `agentExtension` ·
`matchedAttemptId` · `matchStatus` (`paret`/`uparet`/`flertydig`)

**`matchStatus` er ikke pynt.** Kobling på nummer + tidsvindu + selger kommer til
å feile av og til. Uparede samtaler skal i en kø noen ser på, ikke forsvinne.

---

## 7. Resultatkoder — fast kodesett

Endres i kode. Hver kode må ha svar på alle seks kolonnene.

| Kode | Hurtigtast | Kontakt | Ut av liste | Sperre | Nytt forsøk | Signal |
|---|---|---|---|---|---|---|
| Ikke svar | 1 | Nei | Nei | – | Etter pause | Nei |
| Opptatt | 2 | Nei | Nei | – | Etter pause | Nei |
| Feil eller ugyldig nummer | 3 | Nei | **Ja** | – | Aldri | Nei |
| Talt med feil person | 4 | Nei | Nei | – | Ja | Nei |
| Avtalt ny samtale | 5 | **Ja** | Nei | – | På avtalt tid | Nei |
| Ikke interessert | 6 | **Ja** | **Ja** | Frekvens | Neste kampanje | **Ja** |
| Vil ikke kontaktes | 7 | **Ja** | **Ja** | **Permanent** | Aldri | Nei |
| Interessert — tilbud sendt | 8 | **Ja** | Nei | – | Ja | Nei |
| Salg | 9 | **Ja** | **Ja** | – | – | Nei |
| Allerede kunde | a | **Ja** | **Ja** | – | – | **Ja** |
| Klage | k | **Ja** | **Ja** | Vurderes | Etter håndtering | **Ja** |
| Utenfor målgruppe | u | Nei | **Ja** | – | Aldri | Nei |

Kolonnen «Kontakt» er definisjonen av kontaktgrad. Den finnes ett sted i koden
og brukes av alle rapporter og alle eksporter.

---

## 8. `offer`, `task`, `note`, `message`, `template`

### `offer`

| Felt | Eier | Merknad |
|---|---|---|
| `productId` / `productName` / `priceNok` | FA→SES | Valgt fra Sesamys katalog |
| `campaignCode` | FA | |
| `validUntil` | FA | Gjør «åpne tilbud uten neste aktivitet» mulig |
| `channel` / `sentAt` / `status` | FA | |
| `requiresWrittenAcceptance` | FA | **Settes per produkt av juridisk**, ikke av utvikling |
| `writtenAcceptance.receivedAt/channel/messageId/verifiedBy` | FA | Dokumentasjonen |

### `task`

`type` (`oppfolging`/`avtalt_samtale`/`intern`) · `title` · `dueAt` · `priority` ·
`reminderMinutesBefore` · `status` · `createdAt/By` · `completedAt` ·
`transferredFromSellerId` — alle FA.

### `note` — FA
`authorId` · `body` · `createdAt`. Vises adskilt fra faktafelt og systemhendelser.

### `message` — FA
`channel` · `templateId` · **`templateVersion`** · `subject` · `sentAt` ·
`deliveredAt` · `status` · `sentBy`.

En sendt melding peker på malversjonen som faktisk gikk ut.

### `template` — FA
`name` · `channel` · `version` · `approvedBy` · `approvedAt` · `active`.

---

## 9. `sale`, `payment_event`, `commission_entry`, `commission_period`

### `sale`

| Felt | Eier | Merknad |
|---|---|---|
| `personId` / `sellerId` / `listId` / `campaignId` | FA | Attribusjonen |
| `productId` / `priceNok` | FA→SES | |
| `registeredAt` | FA | |
| `sesamyOrderId` | SES | Uten den finnes ikke salget |
| `sesamySyncError` | FA | Feilkø, ikke stille tap |
| `status` | UTL | `venter_skriftlig_aksept` → `venter_sesamy` → `sendt_til_sesamy` → `aktivert` → `betalt`, eller `kansellert`/`kreditert`/`feilet` |
| `activatedAt` | **SES** | |
| `firstPaymentAt` | **SES** | Utløser provisjon |
| `commissionEligible` | UTL | Aldri satt for hånd |
| `disclosure.*` (6 avkrysninger + `confirmedAt`) | FA | Muntlig opplysningsplikt, kravspec §3.6 |
| `offerId` | FA | |

### `payment_event` — SES, append-only
`type` (`forste_betaling`/`mislykket_betaling`/`kansellering`/`kreditering`/`fornyelse`) ·
`occurredAt` · `amountNok`.

### `commission_entry` — FA, uforanderlig
`saleId?` · `sellerId` · `periodId` · **`ruleVersion`** · `type`
(`salg`/`tilbakeforing`/`manuell`) · `amountNok` · `status`
(`forelopig`/`last`/`utbetalt`) · `approvedBy` · `reason`.

Rettelser er motposter. Ingen `UPDATE` på beløp, noensinne.

### `commission_period` — FA
`label` · `from` · `to` · `status` (`apen`/`last`/`sendt_til_lonn`) · `lockedAt` ·
`lockedBy`.

---

## 10. `user` og roller

`name` · `initials` · `role` · `teliaExtension` · `active`.

`teliaExtension` er koblingen til Telia-hendelsene og må vedlikeholdes — feil
internnummer gir uparede samtaler.

Fem roller: `selger` · `selgerleder` · `okonomi` · `analytiker` · `admin`.
Se kravspec §11 for hvorfor økonomi er skilt fra selgerleder.

---

## 11. Felter vi ikke vet om finnes ennå

Disse står i katalogen fordi kravspec'en trenger dem, ikke fordi vi har bekreftet
at kilden leverer dem. Hvert av dem er et konkret spørsmål å stille.

| Felt | Til | Spørsmål |
|---|---|---|
| Oppslag på telefonnummer | Sesamy | Kan en bruker slås opp på telefon, eller bare på e-post og ID? **Blokker nr. 1** |
| `cancellationReason` | Sesamy | Eksponeres den i API-et? |
| Webhook for første betaling | Sesamy | Hvilke hendelsestyper finnes konkret? |
| Ordre med selger- og kampanjereferanse | Sesamy | Kan attribusjonen følge ordren, i stedet for å gjenskapes med tidsstempler? |
| Sandkassemiljø | Sesamy | Uten det kan ikke provisjonslogikken testes forsvarlig |
| Samtalehendelser med internnummer | Telia | Følger agentidentitet med, eller må vi pare på nummer og tid alene? |
| Roller og styreverv | Brreg | Dekning og bruksvilkår for visning i kundekort |
| Reservasjonsfilens feltsett | Brreg | Teknisk beskrivelse må bestilles sammen med avtalen |

---

## 12. Felter vi bevisst ikke har

- **Egendefinerte felt.** Faste felt, endres i kode. Samme konklusjon som i
  roadmap-modulen.
- **Fritt konfigurerbare resultatkoder.** §7.
- **Timeestimater og aktivitetsmål per selger.** Ikke etterspurt, og
  regnearkerfaringen fra roadmap-modulen sier at slike felt dør.
- **Lead-score.** Prioriteringen er deterministisk og forklarbar. Kom tilbake
  når det finnes seks måneder med resultatkoder.
- **Samtaleopptak.** Hører hjemme i telefonilaget, ikke her.
- **Egen kopi av produkt- og priskatalogen.** Sesamy eier den.

---

*Genereres fra `src/modules/crm/domain/types.ts`. Endrer du typene, oppdater
denne — og motsatt. Se `fa-engine-crm-krav.md` for begrunnelsene.*
