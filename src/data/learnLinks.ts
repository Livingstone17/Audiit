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
  'trim-clean': {
    label: 'cleaning messy data with TRIM and CLEAN',
    url: 'https://support.microsoft.com/en-us/excel/top-ten-ways-to-clean-your-data',
    kind: 'guide',
  },
  'find-replace': {
    label: 'Find and Replace across a worksheet',
    url: 'https://support.microsoft.com/en-us/excel/get-started/find-or-replace-text-and-numbers-on-a-worksheet',
    kind: 'guide',
  },
  'text-extract': {
    label: 'extracting text with LEFT, RIGHT and MID',
    url: 'https://www.youtube.com/watch?v=KGFH5fTRhak',
    kind: 'video',
  },
  'data-validation': {
    label: 'data validation dropdown lists',
    url: 'https://support.microsoft.com/en-us/excel/get-started/apply-data-validation-to-cells',
    kind: 'guide',
  },
  'date-values': {
    label: 'converting dates stored as text into real dates',
    url: 'https://support.microsoft.com/en-us/excel/convert-dates-stored-as-text-to-dates',
    kind: 'guide',
  },
  eomonth: {
    label: 'the EOMONTH function for month-end dates',
    url: 'https://www.youtube.com/watch?v=8ARyOhaMiXA',
    kind: 'video',
  },
  iferror: {
    label: 'the IFERROR function',
    url: 'https://www.youtube.com/watch?v=bKLvtgP8XSs',
    kind: 'video',
  },
  ifs: {
    label: 'the IFS function for multi-condition tests',
    url: 'https://www.youtube.com/watch?v=AOO1AoTNdZk',
    kind: 'video',
  },
  'and-or': {
    label: 'the AND and OR functions inside IF',
    url: 'https://support.microsoft.com/en-us/excel/using-if-with-and-or-and-not-functions-in-excel',
    kind: 'guide',
  },
  'index-match': {
    label: 'INDEX and MATCH lookups',
    url: 'https://www.youtube.com/watch?v=F264FpBDX28',
    kind: 'video',
  },
  'named-ranges': {
    label: 'naming cell ranges to make formulas readable',
    url: 'https://support.microsoft.com/en-us/excel/get-started/define-and-use-names-in-formulas',
    kind: 'guide',
  },
  'aging-buckets': {
    label: 'ageing invoices by calculating days between dates',
    url: 'https://support.microsoft.com/en-us/excel/get-started/calculate-the-difference-between-two-dates',
    kind: 'guide',
  },
  'dynamic-arrays': {
    label: 'the FILTER function and dynamic array formulas',
    url: 'https://support.microsoft.com/en-us/excel/filter-function',
    kind: 'guide',
  },
  textjoin: {
    label: 'the TEXTJOIN function for joining ranges of text',
    url: 'https://support.microsoft.com/en-us/excel/textjoin-function',
    kind: 'guide',
  },
  'text-function': {
    label: 'the TEXT function for formatting numbers as report text',
    url: 'https://support.microsoft.com/en-us/excel/text-function',
    kind: 'guide',
  },
  'csv-import': {
    label: 'importing data from a CSV file with Get & Transform',
    url: 'https://support.microsoft.com/en-us/excel/import-data-from-a-csv-html-or-text-file',
    kind: 'guide',
  },
  subtotal: {
    label: 'the SUBTOTAL function for filtered lists',
    url: 'https://support.microsoft.com/en-us/excel/subtotal-function',
    kind: 'guide',
  },
  'advanced-filter': {
    label: 'filtering by using advanced criteria',
    url: 'https://support.microsoft.com/en-us/excel/filter-by-using-advanced-criteria',
    kind: 'guide',
  },
  'running-total': {
    label: 'calculating a running total with mixed references',
    url: 'https://support.microsoft.com/en-us/excel/calculate-a-running-total-in-excel',
    kind: 'guide',
  },
  stdev: {
    label: 'the STDEV.S function for sample standard deviation',
    url: 'https://support.microsoft.com/en-us/excel/stdev-function',
    kind: 'guide',
  },
  'what-if': {
    label: 'What-If Analysis: Goal Seek and Scenario Manager',
    url: 'https://support.microsoft.com/en-us/excel/introduction-to-what-if-analysis',
    kind: 'guide',
  },
  'chart-types': {
    label: 'choosing the right chart type',
    url: 'https://support.microsoft.com/en-us/excel/get-started/create-a-chart-from-start-to-finish',
    kind: 'guide',
  },
  'pivot-chart': {
    label: 'creating a PivotChart',
    url: 'https://support.microsoft.com/en-us/excel/get-started/create-a-pivotchart',
    kind: 'guide',
  },
  'external-reference': {
    label: 'workbook links (external references) between files',
    url: 'https://support.microsoft.com/en-us/excel/create-workbook-links',
    kind: 'guide',
  },
  'formula-auditing': {
    label: 'tracing precedents and dependents to audit formulas',
    url: 'https://support.microsoft.com/en-us/excel/display-the-relationships-between-formulas-and-cells',
    kind: 'guide',
  },
  'sheet-protection': {
    label: 'protecting a worksheet and locking cells',
    url: 'https://support.microsoft.com/en-us/excel/protect-a-worksheet',
    kind: 'guide',
  },
  'power-query-merge': {
    label: 'merging queries (joining tables) in Power Query',
    url: 'https://support.microsoft.com/en-us/excel/merge-queries-power-query',
    kind: 'guide',
  },
  'power-query-append': {
    label: 'appending queries to stack rows in Power Query',
    url: 'https://support.microsoft.com/en-us/excel/append-queries-power-query',
    kind: 'guide',
  },
  'data-model': {
    label: 'relationships between tables in a Data Model',
    url: 'https://support.microsoft.com/en-us/excel/relationships-between-tables-in-a-data-model',
    kind: 'guide',
  },
  'dax-basics': {
    label: 'DAX basics for Power Pivot measures',
    url: 'https://support.microsoft.com/en-us/excel/quickstart-learn-dax-basics-in-30-minutes',
    kind: 'guide',
  },
  'record-macro': {
    label: 'recording macros with the Macro Recorder',
    url: 'https://support.microsoft.com/en-us/excel/automate-tasks-with-the-macro-recorder',
    kind: 'guide',
  },
  'vba-basics': {
    label: 'VBA in Excel — objects, subs and the editor',
    url: 'https://learn.microsoft.com/en-us/office/vba/api/overview/excel',
    kind: 'guide',
  },
  'macro-security': {
    label: 'macro security settings in the Trust Center',
    url: 'https://support.microsoft.com/en-us/office/change-macro-security-settings-in-excel-a97c09d2-c082-46b8-b19f-e8621e8fe373',
    kind: 'guide',
  },
}

export const LEARN_CONCEPTS = Object.keys(LEARN_LINKS) as LearnConcept[]
