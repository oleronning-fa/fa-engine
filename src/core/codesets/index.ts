/**
 * Fixed code sets — the vocabulary the whole system joins on.
 *
 * Every value here is "faste kodesett, endres i kode": no custom fields, no
 * user-editable enums, no free text where a code belongs. That rule is what
 * keeps aggregation working (roadmap-krav §3.3: 21 spellings of "Owner" for
 * two people).
 */

export * from './areas';
export * from './objections';
export * from './roadmap';
export * from './signals';
