import type { LearnConcept } from '../lib/types'

export type LearnKind = 'video' | 'guide'

export interface LearnLink {
  /** phrase used in the CTA: "Are you new to {label}? Click to learn the concept" */
  label: string
  url: string
  /** video = curated YouTube tutorial, guide = official tutorial page */
  kind: LearnKind
}

/**
 * Curated "learn the concept" resources, one per Excel/audit concept the
 * missions teach. Hints reference these by key; the link is only shown in the
 * hint panel after the learner reveals that hint.
 */
export const LEARN_LINKS: Record<LearnConcept, LearnLink> = {
  'status-bar': {
    label: 'counting records and totals with the Excel status bar',
    url: 'https://support.microsoft.com/en-us/excel/view-summary-data-on-the-status-bar',
    kind: 'guide',
  },
  'unique-keys': {
    label: 'unique key columns and duplicate values in Excel',
    url: 'https://support.microsoft.com/en-us/excel/get-started/filter-for-unique-values-or-remove-duplicate-values',
    kind: 'guide',
  },
  filter: {
    label: 'filters in Excel',
    url: 'https://www.youtube.com/watch?v=f7W4qIMBbBg',
    kind: 'video',
  },
  sort: {
    label: 'sorting data in Excel',
    url: 'https://www.youtube.com/watch?v=Bm_uWOUiUFI',
    kind: 'video',
  },
  tables: {
    label: 'Excel tables (Ctrl+T)',
    url: 'https://support.microsoft.com/en-us/excel/get-started/create-and-format-tables',
    kind: 'guide',
  },
  if: {
    label: 'the IF formula in Excel',
    url: 'https://www.youtube.com/watch?v=2mzGsJtJvLc',
    kind: 'video',
  },
  countif: {
    label: 'the COUNTIF formula in Excel',
    url: 'https://www.youtube.com/watch?v=if4i55JB58M',
    kind: 'video',
  },
  countifs: {
    label: 'the COUNTIFS formula in Excel',
    url: 'https://www.youtube.com/watch?v=OFqQqdr9R44',
    kind: 'video',
  },
  sumif: {
    label: 'the SUMIF and SUMIFS formulas in Excel',
    url: 'https://www.youtube.com/watch?v=dI8w0utjUc0',
    kind: 'video',
  },
  countblank: {
    label: 'the COUNTBLANK formula in Excel',
    url: 'https://www.youtube.com/watch?v=FGbH3C_u_jg',
    kind: 'video',
  },
  xlookup: {
    label: 'the XLOOKUP formula in Excel',
    url: 'https://www.youtube.com/watch?v=Gfu26nNvrsk',
    kind: 'video',
  },
  vlookup: {
    label: 'the VLOOKUP formula in Excel',
    url: 'https://www.youtube.com/watch?v=DX0V7D0GWwI',
    kind: 'video',
  },
  'conditional-formatting': {
    label: 'formula-based conditional formatting in Excel',
    url: 'https://support.microsoft.com/en-us/excel/use-conditional-formatting-to-highlight-information-in-excel',
    kind: 'guide',
  },
  pivot: {
    label: 'PivotTables in Excel',
    url: 'https://www.youtube.com/watch?v=igSovq_H24A',
    kind: 'video',
  },
  'random-sample': {
    label: 'random sampling with the RAND function',
    url: 'https://www.youtube.com/watch?v=LpZqdvaJQAQ',
    kind: 'video',
  },
  'three-way-match': {
    label: 'the three-way match (PO, GRN and invoice)',
    url: 'https://www.youtube.com/watch?v=YANPlu1mbhQ',
    kind: 'video',
  },
  'audit-findings': {
    label: 'writing audit findings (the CCCCAR elements)',
    url: 'https://www.youtube.com/watch?v=04IIAY5-laE',
    kind: 'video',
  },
  'executive-summary': {
    label: 'writing an executive summary',
    url: 'https://www.youtube.com/watch?v=SE-wnHBtP1s',
    kind: 'video',
  },
  'approval-matrix': {
    label: 'delegation-of-authority approval matrices',
    url: 'https://www.youtube.com/watch?v=9O3LxhhF-iQ',
    kind: 'video',
  },
  'sum-column': {
    label: 'summing a column of numbers with AutoSum',
    url: 'https://www.youtube.com/watch?v=xkOe8Vm6onM',
    kind: 'video',
  },
  'cell-references': {
    label: 'cell references (column letters and row numbers)',
    url: 'https://www.youtube.com/watch?v=_4LIyPNt4M8',
    kind: 'video',
  },
  'absolute-references': {
    label: 'absolute ($) references when copying formulas',
    url: 'https://www.youtube.com/watch?v=DIkBBIo0thw',
    kind: 'video',
  },
  'find-duplicates': {
    label: 'finding duplicate values in Excel',
    url: 'https://www.youtube.com/watch?v=GIizCafj-1I',
    kind: 'video',
  },
  'filter-multiple': {
    label: 'combining multiple filter criteria',
    url: 'https://www.youtube.com/watch?v=rgATdkyLey8',
    kind: 'video',
  },
  'pivot-sum-count': {
    label: 'fixing Count instead of Sum in a PivotTable',
    url: 'https://www.youtube.com/watch?v=n47zd1VYEqM',
    kind: 'video',
  },
  median: {
    label: 'calculating the median in a PivotTable',
    url: 'https://www.youtube.com/watch?v=W_URHz6kb0I',
    kind: 'video',
  },
  'procure-to-pay': {
    label: 'the procure-to-pay document flow',
    url: 'https://www.youtube.com/watch?v=VvUXZJVoR8g',
    kind: 'video',
  },
}

export const LEARN_CONCEPTS = Object.keys(LEARN_LINKS) as LearnConcept[]
