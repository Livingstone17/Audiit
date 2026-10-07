import type { Mission } from '../../lib/types'
import { rows } from '../../datasets/registry'

const PR = 'pr-basic'
const EXTRACT = 'invoice-extract'
const VENDORS = 'vendor-master'
const BOSS = 'pr-boss'

const PERIOD_END = Date.UTC(2025, 8, 30)

function daysOutstanding(iso: string): number {
  return Math.round((PERIOD_END - Date.parse(iso)) / 86_400_000)
}

export const ANALYST_GAP_MISSIONS: Mission[] = [
  {
    id: 'm29',
    number: 23,
    levelId: 'L2',
    module: 'Advanced Analysis Techniques',
    category: 'Excel Foundations',
    title: 'Age the Open Balances',
    difficulty: 'Intermediate',
    xp: 160,
    estMinutes: 18,
    summary:
      'Age unpaid invoices against a fixed period end, bucket them with IFS and flag the oldest balances.',
    scenario: [
      'Month-end close: the CFO asks Adaeze for an ageing of the unpaid population as at 30 September 2025 — buckets of 0–30, 31–60, 61–90 and 90+ days outstanding.',
      'A junior built the table with TODAY(). Monday\'s numbers moved by Tuesday, and the audit committee pack no longer tied to the working paper. Ageing has to be reproducible: same date, same answer, every time.',
    ],
    objective:
      'Calculate days outstanding by subtracting dates against a fixed period end, classify invoices into ageing buckets with IFS, and highlight the oldest balances with conditional formatting.',
    tasks: [
      'Download the purchase register.',
      'Add a days-outstanding column calculated against 30 September 2025.',
      'Classify each invoice into 0–30, 31–60, 61–90 or 90+ days with IFS.',
      'Apply conditional formatting to the 90+ bucket.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Age against a fixed date',
        formula: '=DATE(2025,9,30)-B2',
        explanation:
          'Dates are serial numbers, so subtracting returns whole days. Building the period end with DATE(2025,9,30) pins the ageing to the reporting date — TODAY() would silently shift every bucket tomorrow.',
      },
      {
        title: 'Bucket with IFS',
        formula: '=IFS(days<=30,"0-30",days<=60,"31-60",days<=90,"61-90",TRUE,"90+")',
        explanation:
          'Tests are evaluated top-down and the first TRUE wins, so the smallest bucket goes first and TRUE catches everything above 90 days. Every invoice gets a label — no unmatched residue.',
      },
      {
        title: 'Make the exceptions jump out',
        explanation:
          'Conditional formatting paints the 90+ rows without anyone re-filtering, so the oldest balances are impossible to miss when the working paper is reviewed.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm29-h1',
        concept: 'aging-buckets',
        title: 'Days outstanding, not TODAY',
        body: 'Pin the report date: =DATE(2025,9,30)-B2 in your helper column. Subtracting dates returns days — do not use TODAY(), or the ageing shifts every time the file is opened.',
        xpCost: 10,
      },
      {
        id: 'm29-h2',
        concept: 'ifs',
        title: 'Smallest bucket first',
        body: '=IFS(N2<=30,"0-30",N2<=60,"31-60",N2<=90,"61-90",TRUE,"90+") — conditions run top-down, the first TRUE wins, and TRUE is the catch-all.',
        xpCost: 20,
      },
      {
        id: 'm29-h3',
        concept: 'conditional-formatting',
        title: 'Flag the oldest rows',
        body: 'Select the bucket column → Home → Conditional Formatting → Highlight Cells Rules → Text that Contains → type 90+.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm29-q1',
        type: 'numeric',
        prompt: 'How many invoices in the purchase register are still Unpaid?',
        context: 'Payment Status is column M.',
        answer: () =>
          rows(PR).filter((r) => r.paymentStatus === 'Unpaid').length,
        unit: 'invoices',
        explanation:
          'The unpaid population is where ageing matters most — these are open balances still sitting in trade payables at period end.',
        incorrectFeedback:
          'Filter Payment Status (column M) to Unpaid and read the count from the status bar, or use =COUNTIF(M:M,"Unpaid").',
      },
      {
        id: 'm29-q2',
        type: 'formula',
        prompt:
          'Add a days-outstanding helper in column N. Write the formula for N2 that ages the invoice date in B2 against period end 30 September 2025.',
        placeholder: '=...',
        accepted: ['=DATE(2025,9,30)-B2', '=DAYS(DATE(2025,9,30),B2)'],
        explanation:
          'Dates are serial numbers, so subtraction returns whole days; DAYS(end_date, start_date) says the same thing with the arguments in reading order.',
        incorrectFeedback:
          'Build the period end with DATE(2025,9,30) and subtract the invoice date in B2 — do not type a text date and do not use TODAY().',
      },
      {
        id: 'm29-q3',
        type: 'formula',
        prompt:
          'Days outstanding sits in N2. Classify it into the buckets 0–30, 31–60, 61–90 and 90+ using IFS.',
        context: 'Write the formula for cell O2.',
        accepted: [
          '=IFS(N2<=30,"0-30",N2<=60,"31-60",N2<=90,"61-90",TRUE,"90+")',
        ],
        explanation:
          'Each test-result pair is checked in order: a 45-day balance fails the first test, passes the second, and stops there. The final TRUE guarantees no invoice falls through.',
        incorrectFeedback:
          'IFS pairs every condition with its result — test, "bucket", test, "bucket" — and closes with TRUE plus the catch-all bucket.',
      },
      {
        id: 'm29-q4',
        type: 'numeric',
        prompt:
          'How many Unpaid invoices fall in the 31–60 day bucket as at 30 September 2025?',
        answer: () =>
          rows(PR).filter(
            (r) =>
              r.paymentStatus === 'Unpaid' &&
              daysOutstanding(String(r.invoiceDate)) >= 31 &&
              daysOutstanding(String(r.invoiceDate)) <= 60,
          ).length,
        unit: 'invoices',
        explanation:
          'Mid-age unpaid balances are where the payment cycle starts to look late — old enough to question, not yet so old that the vendor has chased payment.',
        incorrectFeedback:
          'Compute days outstanding for every row (=DATE(2025,9,30)-B2), then count unpaid rows between 31 and 60 days — or use COUNTIFS with two bounds and subtract the under-31 count.',
      },
      {
        id: 'm29-q5',
        type: 'mcq',
        prompt:
          'Why does the ageing use DATE(2025,9,30) instead of the volatile TODAY() function?',
        options: [
          {
            id: 'a',
            label: 'The report must reproduce identical figures whenever it is re-run',
          },
          { id: 'b', label: 'TODAY() can only be used inside Excel tables' },
          {
            id: 'c',
            label: 'DATE() automatically applies the financial year end',
          },
          { id: 'd', label: 'TODAY() returns text rather than a date serial' },
        ],
        correctOptionId: 'a',
        explanation:
          'A working paper has to tie back to the date it was issued. TODAY() moves every bucket the day after the audit committee meets — an ageing table that changes on its own cannot be reviewed.',
        incorrectFeedback:
          'What happens to your ageing table if someone re-opens the file next month with TODAY() still in it?',
      },
    ],
    completion: [
      'Days outstanding calculated against a fixed period end',
      'IFS ageing buckets built',
      '90+ bucket highlighted with conditional formatting',
      'All 5 questions answered correctly',
    ],
  },

  {
    id: 'm30',
    number: 24,
    levelId: 'L2',
    module: 'Advanced Analysis Techniques',
    category: 'Excel Foundations',
    title: 'Spill Logic: Dynamic Arrays',
    difficulty: 'Intermediate',
    xp: 160,
    estMinutes: 15,
    summary:
      'Filter, deduplicate and sort whole lists with FILTER, UNIQUE and SORT — one formula, no copy-down.',
    scenario: [
      'Adaeze wants answers as single formulas: "If your test needs a helper column copied down 200 rows, you have already lost the reviewer."',
      'The invoice extract spans 200 rows across seven departments. FILTER spills the matching rows, UNIQUE lists each department once, and SORT orders the result — all from one cell.',
    ],
    objective:
      'Return matching rows with FILTER, produce distinct value lists with UNIQUE, sort them with SORT, and diagnose a blocked spill range.',
    tasks: [
      'Download the invoice extract.',
      'Spill every Warehouse invoice total with FILTER.',
      'List the distinct departments with UNIQUE, sorted with SORT.',
      'Count the departments and recognise a #SPILL! error.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'FILTER returns whole sets',
        formula: '=FILTER(E2:E201,D2:D201="Warehouse")',
        explanation:
          'One formula spills every matching row into the cells below — no copy-down, no Ctrl+Shift+Enter. Both ranges must be the same height, and the criterion must match the column values exactly.',
      },
      {
        title: 'UNIQUE shows what is really there',
        formula: '=UNIQUE(D2:D201)',
        explanation:
          'Before you trust a COUNTIF, see the actual value list. UNIQUE exposes surprises — trailing spaces, mixed case, a typo creating an eighth department — that counts quietly hide.',
      },
      {
        title: 'Spills need room',
        explanation:
          'A spill range must be empty. Anything sitting in its path produces #SPILL! — clear the blocker or move the formula. The error is Excel protecting your data, not losing it.',
      },
    ],
    datasetIds: [EXTRACT],
    hints: [
      {
        id: 'm30-h1',
        concept: 'dynamic-arrays',
        title: 'One formula, all rows',
        body: '=FILTER(E2:E201,D2:D201="Warehouse") spills every matching total. The two ranges must be the same height, and the word in quotes must match the column exactly.',
        xpCost: 10,
      },
      {
        id: 'm30-h2',
        concept: 'unique-keys',
        title: 'List the values first',
        body: '=UNIQUE(D2:D201) returns each department once. Checking the real values beats guessing what to type inside the quotes.',
        xpCost: 20,
      },
      {
        id: 'm30-h3',
        concept: 'sort',
        title: 'Deduplicate, then order',
        body: '=SORT(UNIQUE(D2:D201)) spills the distinct list alphabetically — nest the two functions in either order.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm30-q1',
        type: 'formula',
        prompt:
          'Spill the Total Amount (column E) for every Warehouse invoice (column D). Data runs from row 2 to row 201.',
        placeholder: '=FILTER(...)',
        accepted: [
          '=FILTER(E2:E201,D2:D201="Warehouse")',
          '=FILTER($E$2:$E$201,$D$2:$D$201="Warehouse")',
          '=FILTER(E:E,D:D="Warehouse")',
        ],
        explanation:
          'FILTER returns the values where the condition is TRUE and spills them down the column — the whole subset from a single formula in a single cell.',
        incorrectFeedback:
          'FILTER takes two equal-height ranges: what to return, then the condition. Use the department spelling exactly as it appears — "Warehouse".',
      },
      {
        id: 'm30-q2',
        type: 'numeric',
        prompt: 'How many distinct departments appear in the extract?',
        answer: () => new Set(rows(EXTRACT).map((r) => String(r.department))).size,
        unit: 'departments',
        explanation:
          'This is how many rows UNIQUE would spill. Knowing the true value list is the sanity check that comes before any COUNTIF or PivotTable you build on the column.',
        incorrectFeedback:
          'Spill =UNIQUE(D2:D201) and count the rows it returns — or copy the column and use Data → Remove Duplicates.',
      },
      {
        id: 'm30-q3',
        type: 'formula',
        prompt:
          'Return each distinct department in the extract exactly once, sorted alphabetically. Data runs to row 201, department is column D.',
        accepted: [
          '=SORT(UNIQUE(D2:D201))',
          '=UNIQUE(SORT(D2:D201))',
          '=SORT(UNIQUE($D$2:$D$201))',
          '=UNIQUE(SORT($D$2:$D$201))',
        ],
        explanation:
          'UNIQUE removes repeats and SORT orders what is left; nesting them produces a clean value list you can paste into a Data Validation list or a report.',
        incorrectFeedback:
          'Nest the two functions — SORT around UNIQUE, or UNIQUE around SORT — and close one parenthesis for each function.',
      },
      {
        id: 'm30-q4',
        type: 'mcq',
        prompt:
          'A colleague types a note into F5, directly beneath your FILTER result. What does Excel show?',
        options: [
          { id: 'a', label: '#SPILL! — the formula cannot overwrite the note' },
          { id: 'b', label: 'The formula silently replaces the note' },
          {
            id: 'c',
            label: 'The spill returns only the rows above the note',
          },
          { id: 'd', label: 'Excel asks whether to merge the cells' },
        ],
        correctOptionId: 'a',
        explanation:
          'Spill ranges refuse to write over anything. The error clears the moment the blocker is removed — nothing has been lost, the formula is just waiting for room.',
        incorrectFeedback:
          'What does Excel do when a dynamic formula needs to write results somewhere that is already occupied?',
      },
      {
        id: 'm30-q5',
        type: 'numeric',
        prompt: 'How many Warehouse invoices are in the extract?',
        answer: () =>
          rows(EXTRACT).filter((r) => r.department === 'Warehouse').length,
        unit: 'invoices',
        explanation:
          'This is exactly the set FILTER spills for you — the count is simply the number of rows the formula returns.',
        incorrectFeedback:
          'Add a condition to your count: =COUNTIFS(D:D,"Warehouse") — or spill the FILTER and count its result rows.',
      },
    ],
    completion: [
      'FILTER spill working on the extract',
      'UNIQUE + SORT value list built',
      'All 5 questions answered correctly',
    ],
  },

  {
    id: 'm31',
    number: 25,
    levelId: 'L2',
    module: 'Advanced Analysis Techniques',
    category: 'Excel Foundations',
    title: 'Text Reports with TEXTJOIN',
    difficulty: 'Intermediate',
    xp: 150,
    estMinutes: 15,
    summary:
      'Join ranges into readable strings with TEXTJOIN, format naira amounts with TEXT, and check names before publishing.',
    scenario: [
      'For the vendor file review, Adaeze wants every Raw Materials vendor ID in a single cell she can paste straight into the review note.',
      'Joining cells with & and commas works until someone inserts a row — then your hand-built string is quietly wrong. One formula over the range stays right forever.',
    ],
    objective:
      'Join filtered ranges into one delimited string with TEXTJOIN, convert numbers to report-ready text with TEXT, and clean values before they are concatenated.',
    tasks: [
      'Download the vendor master and the purchase register.',
      'Join the Raw Materials vendor IDs into one cell with TEXTJOIN.',
      'Check vendor name lengths with a helper.',
      'Format a naira total for the report with TEXT.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'TEXTJOIN(delimiter, ignore_empty, range)',
        formula: '=TEXTJOIN(", ",TRUE,IF(C2:C29="Raw Materials",A2:A29,""))',
        explanation:
          'TEXTJOIN takes whole ranges, inserts your delimiter, and skips blanks when ignore_empty is TRUE. Wrapped around an IF it joins only the qualifying rows — the filtered list in one cell.',
      },
      {
        title: 'TEXT turns numbers into report text',
        formula: '=TEXT(J2,"₦#,##0")',
        explanation:
          'Report text wants "₦1,240,000" — symbol, separators, no decimals. TEXT converts the number once, and the string keeps that presentation wherever it is pasted.',
      },
      {
        title: 'Clean before you join',
        explanation:
          'Stray spaces multiply when values are concatenated. TRIM first, so the joined string does not carry invisible baggage into a document that will be read by someone else.',
      },
    ],
    datasetIds: [VENDORS, PR],
    hints: [
      {
        id: 'm31-h1',
        concept: 'textjoin',
        title: 'One formula, one cell',
        body: '=TEXTJOIN(", ",TRUE,IF(C2:C29="Raw Materials",A2:A29,"")) — delimiter first, ignore-blanks flag second, then the IF-filtered range.',
        xpCost: 10,
      },
      {
        id: 'm31-h2',
        concept: 'trim-clean',
        title: 'Trim before you join',
        body: 'TEXTJOIN concatenates exactly what it is given — spaces included. Wrap label cells in TRIM first if the source is typed data.',
        xpCost: 20,
      },
      {
        id: 'm31-h3',
        concept: 'text-function',
        title: 'Numbers that present themselves',
        body: '=TEXT(J2,"₦#,##0") converts the amount into naira-formatted text: the cell format changes, the string does not.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm31-q1',
        type: 'formula',
        prompt:
          'On the Vendors sheet, Vendor ID is column A and Vendor Category is column C, rows 2 to 29. Join every Raw Materials vendor ID into one comma-separated cell using TEXTJOIN.',
        placeholder: '=TEXTJOIN(...)',
        accepted: [
          '=TEXTJOIN(", ",TRUE,IF(C2:C29="Raw Materials",A2:A29,""))',
          '=TEXTJOIN(",",TRUE,IF(C2:C29="Raw Materials",A2:A29,""))',
        ],
        explanation:
          'The IF supplies a filtered array of IDs and blanks; TEXTJOIN glues the qualifying IDs together and ignores the blanks — one cell that stays correct when rows are inserted.',
        incorrectFeedback:
          'TEXTJOIN takes delimiter, ignore_empty, then the values — and the IF filter sits inside it, joining only the rows whose category matches.',
      },
      {
        id: 'm31-q2',
        type: 'mcq',
        prompt: 'Why is TEXTJOIN better than & with manually typed commas?',
        options: [
          {
            id: 'a',
            label: 'It takes whole ranges, applies one delimiter and can ignore blanks',
          },
          { id: 'b', label: 'The & operator does not exist in modern Excel' },
          { id: 'c', label: 'TEXTJOIN automatically sorts the values it joins' },
          { id: 'd', label: 'TEXTJOIN returns a number that can be summed' },
        ],
        correctOptionId: 'a',
        explanation:
          'A range argument means inserted rows are picked up automatically, and ignore_empty stops double commas. The & version has to be rebuilt every time the data changes.',
        incorrectFeedback:
          'Which advantage matters when the underlying list grows or shrinks?',
      },
      {
        id: 'm31-q3',
        type: 'numeric',
        prompt:
          'How many vendor names in the master are longer than 20 characters?',
        answer: () =>
          rows(VENDORS).filter((r) => String(r.name).length > 20).length,
        unit: 'vendors',
        explanation:
          'Long names are the ones that silently truncate when a list is pasted into a fixed-width report column — worth knowing before the pack goes out.',
        incorrectFeedback:
          'Add a helper column with =LEN(B2) and count the values above 20 — visual scanning misses the names that only just overrun.',
      },
      {
        id: 'm31-q4',
        type: 'formula',
        prompt:
          'In the register, Total Amount is column J. Write the TEXT formula for cell N2 that formats J2 as naira text with no decimals, using the format string "₦#,##0".',
        accepted: ['=TEXT(J2,"₦#,##0")'],
        explanation:
          'TEXT takes the cell and a format string and returns presentation-ready text — the symbol and thousands separators survive any paste, which a raw number format does not.',
        incorrectFeedback:
          'TEXT has two arguments: the cell and the format string in double quotes — for example =TEXT(J2,"₦#,##0").',
      },
    ],
    completion: [
      'Raw Materials vendor IDs joined with TEXTJOIN',
      'Vendor name lengths checked with LEN',
      'Naira amounts formatted with TEXT',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm32',
    number: 26,
    levelId: 'L2',
    module: 'Advanced Analysis Techniques',
    category: 'Excel Foundations',
    title: 'Large Data, Repeatable Imports',
    difficulty: 'Intermediate',
    xp: 170,
    estMinutes: 20,
    summary:
      'Import CSVs with Get & Transform, turn the range into a table, and answer population questions on 10,500 rows.',
    scenario: [
      'The AP system export finally arrives in full: 10,500 September transactions. Your colleague opened it, waited, then asked whether "this thing has a row limit".',
      'Adaeze has one rule for big files — table first, filter never scroll, and keep the import repeatable so next month is a refresh, not a rebuild.',
    ],
    objective:
      'Load CSV source files with Get & Transform so they can be refreshed, convert large ranges to Excel Tables, and answer population questions with COUNTIFS.',
    tasks: [
      'Download the 10,500-row purchase transactions file.',
      'Convert the range to a table with Ctrl+T.',
      'Count paid invoices above ₦500,000 with COUNTIFS.',
      'Answer the population questions.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Import CSVs with Power Query',
        explanation:
          'Data → Get Data → From File → From Text/CSV loads the file as a query. Next month you press Data → Refresh: the same delimiter, typing and header steps re-apply automatically to the new export.',
      },
      {
        title: 'Ctrl+T before you analyse',
        formula: '=COUNTIFS(M:M,"Paid",J:J,">500000")',
        explanation:
          'A table auto-expands with new rows, adds filters, and enables structured references. Analysing a raw range means every formula needs manual range maintenance — on 10,500 rows that is where errors hide.',
      },
      {
        title: 'COUNTIFS beats scrolling',
        explanation:
          'One formula answers population questions instantly and can be re-performed by a reviewer. Filter-and-eyeball scales badly and leaves no evidence of how the number was reached.',
      },
    ],
    datasetIds: [BOSS],
    hints: [
      {
        id: 'm32-h1',
        concept: 'csv-import',
        title: 'Make the import repeatable',
        body: 'Data → Get Data → From File → From Text/CSV → Load. Next month it is Data → Refresh — same steps, new file, identical result.',
        xpCost: 10,
      },
      {
        id: 'm32-h2',
        concept: 'tables',
        title: 'Table before formulas',
        body: 'Select any cell and press Ctrl+T, confirm "My table has headers". Filters arrive, the range expands with new rows, and structured references become available.',
        xpCost: 20,
      },
      {
        id: 'm32-h3',
        concept: 'countifs',
        title: 'Count without touching the data',
        body: '=COUNTIFS(M:M,"Paid",J:J,">500000") — whole columns are fine, and the quotes keep the comparison as a condition rather than a formula.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm32-q1',
        type: 'numeric',
        prompt:
          'How many transaction rows does the population contain, excluding the header row?',
        answer: () => rows(BOSS).length,
        unit: 'rows',
        explanation:
          'Population size is the first figure a working paper records — it is the denominator for every sample rate and projection that follows.',
        incorrectFeedback:
          'Ctrl+↓ from the header jumps to the last row; subtract the header row, or select the column and read the count from the status bar.',
      },
      {
        id: 'm32-q2',
        type: 'mcq',
        prompt:
          'AP re-exports the CSV every month. How do you get next month\'s data in without rebuilding your analysis?',
        options: [
          {
            id: 'a',
            label: 'Data → Get Data → From File → From Text/CSV, then Refresh',
          },
          { id: 'b', label: 'Copy-paste the new rows over the old ones' },
          { id: 'c', label: 'Re-type the headers so they match the old file' },
          { id: 'd', label: 'Save the old file as .xls and paste from it' },
          {
            id: 'e',
            label: 'Rebuild the workbook from scratch each month',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'The query remembers the import steps — delimiter, column types, header promotion — so Refresh re-applies them to the new file. Copy-paste re-introduces every data-entry error the query avoids.',
        incorrectFeedback:
          'Which option re-applies the same import steps automatically instead of trusting someone to paste carefully?',
      },
      {
        id: 'm32-q3',
        type: 'mcq',
        prompt:
          'Why convert the 10,500-row range to an Excel Table before analysing it?',
        options: [
          {
            id: 'a',
            label: 'Filters and structured references come built in, and the range expands as rows are added',
          },
          { id: 'b', label: 'It lifts the 1,048,576-row worksheet limit' },
          {
            id: 'c',
            label: 'It converts every text column into numbers automatically',
          },
          { id: 'd', label: 'It is required before any SUM formula will work' },
        ],
        correctOptionId: 'a',
        explanation:
          'Tables keep formulas correct as the population grows: new rows join the table, references follow, and filters travel with the data. None of that happens to a raw range.',
        incorrectFeedback:
          'What does Ctrl+T actually give you that a plain range lacks?',
      },
      {
        id: 'm32-q4',
        type: 'numeric',
        prompt: 'How many rows in the population are Unpaid?',
        answer: () =>
          rows(BOSS).filter((r) => r.paymentStatus === 'Unpaid').length,
        unit: 'invoices',
        explanation:
          'Unpaid volume on the full population is the starting point for both ageing and payment-cycle testing — and it changes every time AP re-exports.',
        incorrectFeedback:
          'Filter Payment Status to Unpaid and read the count, or use =COUNTIF(M:M,"Unpaid").',
      },
      {
        id: 'm32-q5',
        type: 'formula',
        prompt:
          'Write a COUNTIFS that counts rows where Payment Status (column M) is Paid AND Total Amount (column J) is above 500000.',
        placeholder: '=COUNTIFS(...)',
        accepted: ['=COUNTIFS(M:M,"Paid",J:J,">500000")'],
        explanation:
          'COUNTIFS applies both conditions to the same row — paid AND material — which is exactly the population a payment authorisation test targets.',
        incorrectFeedback:
          'COUNTIFS pairs each range with its criteria: range, criterion, range, criterion. Keep ">500000" inside quotes so it is read as a comparison.',
      },
    ],
    completion: [
      'Range converted to an Excel Table',
      'Population questions answered with COUNTIFS',
      'Repeatable CSV import understood',
      'All 5 questions answered correctly',
    ],
  },

  {
    id: 'm33',
    number: 27,
    levelId: 'L2',
    module: 'Reporting & Visualisation',
    category: 'Excel Foundations',
    title: 'Totals That Survive a Filter',
    difficulty: 'Intermediate',
    xp: 160,
    estMinutes: 18,
    summary:
      'Subtotal filtered lists, build a mixed-reference running total, and extract complex subsets with Advanced Filter.',
    scenario: [
      'The manager wants spend figures shown in the file itself — this working paper must display its mechanics, not just a PivotTable screenshot.',
      'A plain SUM keeps totalling rows her filter has hidden, and the board pack also needs a cumulative column showing value building through the register.',
    ],
    objective:
      'Sum only visible rows with SUBTOTAL, build a running total using a mixed reference, and extract multi-condition subsets with Advanced Filter.',
    tasks: [
      'Download the purchase register.',
      'Subtotal the Total Amount column so filtered rows are excluded.',
      'Build a running total with an anchored reference.',
      'Extract rejected-and-material rows with Advanced Filter.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'SUBTOTAL follows the filter',
        formula: '=SUBTOTAL(9,J2:J321)',
        explanation:
          'Function number 9 means SUM, and SUBTOTAL automatically excludes rows hidden by a filter — so the total always matches what the reviewer can actually see on screen.',
      },
      {
        title: 'Mixed references build a running total',
        formula: '=SUM($J$2:J2)',
        explanation:
          'The start of the range is locked ($J$2) while the end stays relative and grows as you copy down — each row adds itself to everything above it. Anchor-and-grow is the pattern to remember.',
      },
      {
        title: 'Advanced Filter for complex subsets',
        explanation:
          'In a criteria range, conditions on the same row are AND; conditions on different rows are OR. Advanced Filter extracts the matches to a separate area — a reproducible subset instead of filter-and-hope.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm33-h1',
        concept: 'subtotal',
        title: 'Sum what is visible',
        body: '=SUBTOTAL(9,J2:J321) — 9 means SUM and filtered-out rows are excluded automatically. Use 109 if manually hidden rows should be ignored too.',
        xpCost: 10,
      },
      {
        id: 'm33-h2',
        concept: 'running-total',
        title: 'Lock the start, free the end',
        body: '=SUM($J$2:J2) — the absolute anchor stays on the first row, the relative end grows when you copy the formula down.',
        xpCost: 20,
      },
      {
        id: 'm33-h3',
        concept: 'advanced-filter',
        title: 'Same row = AND, different row = OR',
        body: 'Data → Advanced: put Approval Status = Rejected and Total > 1000000 on the same criteria row for AND, then Copy to another location.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm33-q1',
        type: 'numeric',
        prompt:
          'What is the total value of the register, rounded to the nearest naira?',
        answer: () =>
          Math.round(
            rows(PR).reduce((sum, r) => sum + Number(r.total), 0),
          ),
        unit: 'naira',
        explanation:
          'The grand total is the first figure any reviewer re-computes — it has to tie the register to the numbers in the pack before anything else can be relied on.',
        incorrectFeedback:
          'Select the Total Amount column and read the sum from the status bar, or use =SUM(J2:J321) and round to the nearest naira.',
      },
      {
        id: 'm33-q2',
        type: 'formula',
        prompt:
          'Write the SUBTOTAL that sums Total Amount (data in J2:J321) while ignoring rows hidden by a filter.',
        placeholder: '=SUBTOTAL(...)',
        accepted: ['=SUBTOTAL(9,J2:J321)', '=SUBTOTAL(109,J2:J321)'],
        explanation:
          'Both 9 and 109 mean SUM; they differ only in how manually hidden rows are treated. Either way the figure responds to the filter — unlike plain SUM.',
        incorrectFeedback:
          'SUBTOTAL starts with its function number: 9 for SUM, then the range J2:J321, then the closing parenthesis.',
      },
      {
        id: 'm33-q3',
        type: 'mcq',
        prompt:
          'You filter the register to Unpaid rows. Which formula reports only the unpaid value?',
        options: [
          { id: 'a', label: '=SUBTOTAL(9,J2:J321) — it follows the filter' },
          {
            id: 'b',
            label: '=SUM(J2:J321) — it totals every row regardless of the filter',
          },
          { id: 'c', label: '=COUNTIF(J:J,">0") — it counts matching cells' },
          { id: 'd', label: '=AVERAGE(J2:J321) — it ignores blanks' },
        ],
        correctOptionId: 'a',
        explanation:
          'SUBTOTAL was built to respond to filters; SUM keeps counting hidden rows, which is exactly how a working paper ends up disagreeing with its own screenshot.',
        incorrectFeedback:
          'Which function was designed to skip rows a filter has hidden?',
      },
      {
        id: 'm33-q4',
        type: 'formula',
        prompt:
          'Build a running total of Total Amount in column N: N2 must show J2, N3 must show J2+J3, and so on. Write the formula for N2.',
        accepted: ['=SUM($J$2:J2)', '=SUM(J$2:J2)'],
        explanation:
          'The anchored first cell and growing second cell give each row the cumulative sum of everything above and including itself — copy it down once and the whole column is right.',
        incorrectFeedback:
          'Use SUM with a mixed reference: lock the first J ($J$2) and leave the second J relative so the range grows when copied.',
      },
      {
        id: 'm33-q5',
        type: 'numeric',
        prompt: 'How many invoices are both Rejected and above ₦1,000,000?',
        answer: () =>
          rows(PR).filter(
            (r) => r.approvalStatus === 'Rejected' && Number(r.total) > 1_000_000,
          ).length,
        unit: 'invoices',
        explanation:
          'Material invoices that failed authorisation are the ones to trace first — large enough to require senior approval, and the most expensive if they were paid anyway.',
        incorrectFeedback:
          'Both conditions must hold on the same row: filter Approval Status to Rejected, then add a number filter above 1000000 — or use COUNTIFS with both pairs.',
      },
    ],
    completion: [
      'SUBTOTAL that follows the filter',
      'Mixed-reference running total built',
      'Advanced Filter extraction explained',
      'All 5 questions answered correctly',
    ],
  },

  {
    id: 'm34',
    number: 28,
    levelId: 'L2',
    module: 'Reporting & Visualisation',
    category: 'Excel Foundations',
    title: 'Statistics and What-If',
    difficulty: 'Intermediate',
    xp: 160,
    estMinutes: 18,
    summary:
      'Describe the population with mean, median and standard deviation, then model questions with Goal Seek and scenarios.',
    scenario: [
      'Adaeze asks whether the register\'s big invoices are genuinely unusual: "Mean, median and spread — not vibes." She wants the answer to survive review.',
      'Then the follow-up: if 10% of unpaid invoices turned out to be missed entirely, what happens to the reported exposure? Model it — do not edit the data.',
    ],
    objective:
      'Measure a population with AVERAGE, MEDIAN and STDEV.S, identify values beyond one standard deviation, and use What-If Analysis to model outcomes without touching source data.',
    tasks: [
      'Download the purchase register.',
      'Compute the sample standard deviation of the totals.',
      'Count invoices above the average total.',
      'Choose the right What-If tool for a target-result question.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'STDEV.S is for samples',
        formula: '=STDEV.S(J2:J321)',
        explanation:
          'STDEV.S divides by n−1 and is the right default when the register represents a sample of purchasing activity; STDEV.P belongs only to a complete population.',
      },
      {
        title: 'Outliers beyond one sigma',
        formula: '=COUNTIF(J2:J321,">"&AVERAGE(J2:J321)+STDEV.S(J2:J321))',
        explanation:
          'Concatenating ">" to a calculated value turns a statistic into a criterion — values more than one standard deviation above the mean become a defensible high-value review pool.',
      },
      {
        title: 'What-If Analysis',
        explanation:
          'Goal Seek works backwards from a known result to the input that produces it; Scenario Manager stores whole sets of inputs and swaps between them. Neither approach edits your source data.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm34-h1',
        concept: 'stdev',
        title: 'Sample, not population',
        body: '=STDEV.S(J2:J321) measures how spread out the totals are around the mean. A wide spread means the mean alone hides a lot — which is why you report both.',
        xpCost: 10,
      },
      {
        id: 'm34-h2',
        concept: 'countif',
        title: 'Turn a statistic into a criterion',
        body: '=COUNTIF(J2:J321,">"&AVERAGE(J2:J321)) — the & glues the comparison to the calculated value, so the count updates with the data.',
        xpCost: 20,
      },
      {
        id: 'm34-h3',
        concept: 'what-if',
        title: 'Backwards from the answer',
        body: 'Data → What-If Analysis: Goal Seek sets a result cell to a target by changing one input; Scenario Manager saves several input sets and swaps between them.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm34-q1',
        type: 'formula',
        prompt:
          'Write the sample standard deviation of Total Amount (data in J2:J321).',
        placeholder: '=STDEV.S(...)',
        accepted: ['=STDEV.S(J2:J321)', '=STDEV(J2:J321)'],
        explanation:
          'STDEV.S returns the sample spread in naira: how far typical totals sit from the mean. Together with the mean it tells a reviewer whether "average invoice" means anything useful.',
        incorrectFeedback:
          'STDEV.S takes a single range — =STDEV.S(J2:J321) — and note the dot between STDEV and S.',
      },
      {
        id: 'm34-q2',
        type: 'numeric',
        prompt: 'How many invoices have a Total Amount above the average total?',
        answer: () => {
          const totals = rows(PR).map((r) => Number(r.total))
          const mean = totals.reduce((s, t) => s + t, 0) / totals.length
          return totals.filter((t) => t > mean).length
        },
        unit: 'invoices',
        explanation:
          'Everything above the mean is the upper part of the population by value — the natural starting pool for high-value testing before you apply any other criterion.',
        incorrectFeedback:
          'Compute =AVERAGE(J2:J321), then count the rows above it: =COUNTIF(J2:J321,">"&AVERAGE(J2:J321)).',
      },
      {
        id: 'm34-q3',
        type: 'mcq',
        prompt:
          'The register is being used as a sample of the group\'s purchasing activity. Which function measures its spread?',
        options: [
          { id: 'a', label: 'STDEV.S — sample standard deviation' },
          { id: 'b', label: 'STDEV.P — population standard deviation' },
          { id: 'c', label: 'MEDIAN — the middle value' },
          { id: 'd', label: 'AVERAGE — the arithmetic mean' },
        ],
        correctOptionId: 'a',
        explanation:
          'STDEV.S divides by n−1, correcting the bias you introduce when estimating a population from a sample. STDEV.P would understate the spread you actually observed.',
        incorrectFeedback:
          'Which function divides by n−1 rather than n?',
      },
      {
        id: 'm34-q4',
        type: 'mcq',
        prompt:
          'You know the average invoice must rise to exactly ₦600,000 and need the implied average quantity. Which What-If tool solves that?',
        options: [
          { id: 'a', label: 'Goal Seek — it solves backwards from a target result' },
          {
            id: 'b',
            label: 'Scenario Manager — it stores multiple input sets',
          },
          { id: 'c', label: 'Data Table — it tabulates one or two variables' },
          { id: 'd', label: 'COUNTIF — it counts matching cells' },
        ],
        correctOptionId: 'a',
        explanation:
          'Goal Seek takes a result cell, a target value, and finds the single input that gets there — exactly the "what quantity gives this average" question.',
        incorrectFeedback:
          'Which tool starts from the answer you want and works backwards to the input?',
      },
    ],
    completion: [
      'Standard deviation computed with STDEV.S',
      'Above-mean population counted with COUNTIF',
      'Goal Seek identified for target-driven questions',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm35',
    number: 29,
    levelId: 'L2',
    module: 'Reporting & Visualisation',
    category: 'Excel Foundations',
    title: 'Charts and PivotCharts',
    difficulty: 'Intermediate',
    xp: 150,
    estMinutes: 15,
    summary:
      'Pick the chart that answers the question, build an interactive PivotChart, and keep value fields on Sum.',
    scenario: [
      'The audit committee does not read 320 rows. Adaeze wants two visuals: how spend moved through September, and which departments carried the value.',
      'She wants them interactive — click a department, see its slice — which means PivotCharts with live filters, not static pictures pasted into slides.',
    ],
    objective:
      'Choose chart types that match the message, build a PivotChart connected to the data, and correct a PivotTable that summarises values with Count instead of Sum.',
    tasks: [
      'Download the purchase register.',
      'Identify the right chart for a daily spend trend and for department comparison.',
      'Create a PivotChart of spend by department.',
      'Verify the value field shows Sum of Total Amount.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Match the chart to the message',
        explanation:
          'Trend over time is a line; comparison across categories is a column or bar; composition is a pie only when there are a handful of slices. A technically correct chart that answers the wrong question still fails review.',
      },
      {
        title: 'PivotChart with live controls',
        explanation:
          'Insert → PivotChart builds the table and the chart together. The field buttons on the chart are filters the committee can click themselves — the visual stays connected to the data.',
      },
      {
        title: 'Sum, not Count',
        formula: '=GETPIVOTDATA("Total Amount",$A$3,"Department","Warehouse")',
        explanation:
          'When a value field shows Count of instead of Sum of, a text value has crept into the column — or the summarisation was set wrong. Right-click → Summarize Values By → Sum, and pull figures reliably with GETPIVOTDATA.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm35-h1',
        concept: 'chart-types',
        title: 'Time gets a line, categories get columns',
        body: 'Spend day by day through September is a trend — line chart. Seven departments compared by value — clustered column. Recommended Charts will suggest both.',
        xpCost: 10,
      },
      {
        id: 'm35-h2',
        concept: 'pivot-chart',
        title: 'Chart and slicers together',
        body: 'Insert → PivotChart creates the PivotTable too. The field buttons on the chart let a reader filter departments without touching your data.',
        xpCost: 20,
      },
      {
        id: 'm35-h3',
        concept: 'pivot-sum-count',
        title: 'Fix Count of Total Amount',
        body: 'Right-click any value → Summarize Values By → Sum. It happens when a stray text value sits in the numeric column — fix that too.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm35-q1',
        type: 'mcq',
        prompt:
          'Which chart best shows how total spend moved day by day through September?',
        options: [
          { id: 'a', label: 'Line chart — time on the horizontal axis' },
          { id: 'b', label: 'Pie chart — one slice per day' },
          { id: 'c', label: 'Scatter chart — two measures plotted' },
          { id: 'd', label: 'Radar chart — cyclic comparison' },
        ],
        correctOptionId: 'a',
        explanation:
          'A line connects points in order, so the shape of the trend — spikes, dips, the month-end rush — reads instantly and invites the follow-up question.',
        incorrectFeedback:
          'Which chart type is designed to show change along an ordered time axis?',
      },
      {
        id: 'm35-q2',
        type: 'mcq',
        prompt:
          'Which chart best compares total spend across the seven departments?',
        options: [
          { id: 'a', label: 'Clustered column — one bar per department' },
          {
            id: 'b',
            label: 'Pie chart with all seven slices and data labels',
          },
          { id: 'c', label: 'Line chart connecting the departments' },
          { id: 'd', label: 'Stock chart — high and low values' },
        ],
        correctOptionId: 'a',
        explanation:
          'Length is the comparison people judge most accurately, and a shared baseline makes the ranking obvious. Seven pie slices force angle comparisons, which readers do badly.',
        incorrectFeedback:
          'Which chart lets a reader compare category magnitudes most accurately?',
      },
      {
        id: 'm35-q3',
        type: 'numeric',
        prompt:
          'Build a PivotTable of Total Amount by Department. Which department totals the most — enter that total, rounded to the nearest naira.',
        answer: () => {
          const byDept = new Map<string, number>()
          for (const r of rows(PR)) {
            const key = String(r.department)
            byDept.set(key, (byDept.get(key) ?? 0) + Number(r.total))
          }
          return Math.round(Math.max(...byDept.values()))
        },
        unit: 'naira',
        explanation:
          'The top department by value is where a control failure costs most — it is the natural first stop for detailed testing and for where you spend your sampling budget.',
        incorrectFeedback:
          'Insert → PivotTable with Department in Rows and Total Amount in Values as Sum, then sort Values descending and read the largest figure.',
      },
      {
        id: 'm35-q4',
        type: 'mcq',
        prompt:
          'Your PivotTable shows "Count of Total Amount" instead of "Sum of Total Amount". Why does this happen, and what fixes it?',
        options: [
          {
            id: 'a',
            label: 'Non-numeric values in the column — right-click → Summarize Values By → Sum',
          },
          {
            id: 'b',
            label: 'The PivotTable is filtered — clear the filters to restore Sum',
          },
          {
            id: 'c',
            label: 'Count is always the default — drag the field in twice',
          },
          {
            id: 'd',
            label: 'The source range is too large — shrink it to 1,000 rows',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'PivotTables fall back to Count when a column contains text — one stray "N/A" is enough. Clean the source or override the summarisation so the value field adds up again.',
        incorrectFeedback:
          'What makes Excel doubt that a column is numeric?',
      },
    ],
    completion: [
      'Right chart types chosen for trend and comparison',
      'PivotChart built with live field filters',
      'Value field confirmed as Sum of Total Amount',
      'All 4 questions answered correctly',
    ],
  },
]
