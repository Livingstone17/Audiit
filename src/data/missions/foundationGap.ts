import type { Mission } from '../../lib/types'
import { rows } from '../../datasets/registry'

const RAW = 'ap-extract-raw'
const PR = 'pr-basic'

/** True when TRIM would change the value — leading, trailing or doubled spaces. */
function hasStraySpaces(value: string): boolean {
  return value.trim().replace(/ {2,}/g, ' ') !== value
}

export const FOUNDATION_GAP_MISSIONS: Mission[] = [
  {
    id: 'm25',
    number: 11,
    levelId: 'L1',
    module: 'Data Cleaning Fundamentals',
    category: 'Excel Foundations',
    title: 'Scrub the Data First',
    difficulty: 'Beginner',
    xp: 150,
    estMinutes: 18,
    summary:
      'Clean messy vendor names, inconsistent invoice numbers and stray case before any test can be trusted.',
    scenario: [
      'Adaeze hands you a raw export from the AP system: "Use this one, not the tidy file. If your COUNTIF does not agree with mine, the data is lying to you."',
      'Vendor names carry stray spaces, invoice numbers are formatted three different ways, and departments are typed in mixed case. Every lookup and count you have learned breaks silently on values that only look identical.',
      'Before any audit testing starts, the extract has to be scrubbed — and kept clean.',
    ],
    objective:
      'Remove stray whitespace with TRIM and CLEAN, normalise inconsistent invoice numbers with SUBSTITUTE, and stop bad values entering the file with Data Validation.',
    tasks: [
      'Download the raw AP extract and open it in Excel.',
      'Add a helper column that cleans Vendor Name with TRIM and CLEAN.',
      'Normalise the invoice numbers so every one reads INV-2025-000000.',
      'Apply a Data Validation list to the Department column.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'TRIM and CLEAN',
        formula: '=TRIM(CLEAN(D2))',
        explanation:
          'TRIM strips leading and trailing spaces and collapses repeated spaces to one; CLEAN removes non-printing characters pasted in from other systems. Lookups and COUNTIF compare exact text, so two names that look identical but differ by a space are different values.',
      },
      {
        title: 'SUBSTITUTE for pattern cleanup',
        formula: '=SUBSTITUTE(TRIM(A2)," - ","-")',
        explanation:
          'SUBSTITUTE swaps one text pattern for another throughout the cell. Here it collapses "INV - 2025 - 000042" back to "INV-2025-000042". For a one-off bulk fix the same job is done with Ctrl+H — Find " - ", Replace "-".',
      },
      {
        title: 'Prevent, do not just repair',
        explanation:
          'Cleaning fixes this file; Data Validation stops the next one. A dropdown list on Department means nobody can type "logistics" or "LOGISTICS" again — controls beat heroic cleanup.',
      },
    ],
    datasetIds: [RAW],
    hints: [
      {
        id: 'm25-h1',
        concept: 'trim-clean',
        title: 'Strip the stray spaces',
        body: 'TRIM removes leading, trailing and repeated spaces; CLEAN removes non-printing characters. Wrap the cell: =TRIM(CLEAN(D2)) and copy it down the column.',
        xpCost: 10,
      },
      {
        id: 'm25-h2',
        concept: 'find-replace',
        title: 'Fix the dash spacing in bulk',
        body: 'Normalise each invoice number with =SUBSTITUTE(TRIM(A2)," - ","-") — or press Ctrl+H, find " - " (with a space either side) and replace it with "-" across the whole column.',
        xpCost: 20,
      },
      {
        id: 'm25-h3',
        concept: 'data-validation',
        title: 'Stop it happening again',
        body: 'Select the Department column → Data → Data Validation → List, and type the approved department names. Free typing is exactly how inconsistent values get in.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm25-q1',
        type: 'numeric',
        prompt:
          'How many Vendor Name entries contain stray whitespace — leading spaces, trailing spaces, or double spaces between words?',
        context: 'A name is dirty if TRIM would change it.',
        answer: () =>
          rows(RAW).filter((r) => hasStraySpaces(String(r.vendorName))).length,
        unit: 'names',
        explanation:
          'Every one of these breaks an exact-match lookup or COUNTIF against the clean vendor master — the values look identical but are not. Clean them before you trust any count.',
        incorrectFeedback:
          'Click a suspect cell and read the formula bar — trailing spaces are invisible in the grid. Add a helper column with =TRIM(D2)<>D2 and count the TRUE results.',
      },
      {
        id: 'm25-q2',
        type: 'formula',
        prompt:
          'Vendor Name is column D. Write the formula that cleans the vendor name in D2 — removing stray and repeated spaces and any non-printing characters.',
        placeholder: '=TRIM(...)',
        accepted: ['=trim(clean(d2))', '=clean(trim(d2))', '=trim(d2)'],
        explanation:
          'TRIM collapses repeated spaces and strips the ones at each end; CLEAN removes non-printing characters. Together they give your lookups the text they expect.',
        incorrectFeedback:
          'Both functions must wrap the cell reference — =TRIM(CLEAN(D2)) — and the reference must point at the Vendor Name column, not the invoice number.',
      },
      {
        id: 'm25-q3',
        type: 'numeric',
        prompt:
          'How many Invoice Number entries contain stray spaces — either around the whole value or around the dashes?',
        answer: () => rows(RAW).filter((r) => /\s/.test(String(r.invoiceNo))).length,
        unit: 'invoices',
        explanation:
          'These are the rows where a duplicate test on the raw invoice number silently misses matches: "INV - 2025 - 000042" and "INV-2025-000042" are different text values.',
        incorrectFeedback:
          'Filter the Invoice Number column for values containing a space (search " ") — eyeballing the column never reveals spaces embedded in the middle of the text.',
      },
      {
        id: 'm25-q4',
        type: 'formula',
        prompt:
          'Normalise the invoice numbers in column A: strip stray spaces and turn "INV - 2025 - 000042" into "INV-2025-000042". Write the formula for cell A2.',
        placeholder: '=SUBSTITUTE(...)',
        accepted: [
          '=substitute(trim(a2)," - ","-")',
          '=trim(substitute(a2," - ","-"))',
        ],
        explanation:
          'TRIM removes the stray spaces and SUBSTITUTE swaps every " - " for "-", giving one consistent invoice number format your COUNTIF duplicate test can rely on.',
        incorrectFeedback:
          'You need both operations: TRIM to remove the spaces and SUBSTITUTE to collapse the spaced dashes — for example =SUBSTITUTE(TRIM(A2)," - ","-").',
      },
      {
        id: 'm25-q5',
        type: 'mcq',
        prompt:
          'A row displays the invoice number INV - 2025 - 000042, yet =COUNTIF(A:A,"INV-2025-000042") does not count it. Why?',
        options: [
          {
            id: 'a',
            label: 'The cell text contains extra spaces — COUNTIF matches exact text',
          },
          { id: 'b', label: 'COUNTIF can only count numbers, not text' },
          { id: 'c', label: 'COUNTIF ignores cells formatted as Text' },
          { id: 'd', label: 'The range must be formatted as an Excel Table' },
        ],
        correctOptionId: 'a',
        explanation:
          'COUNTIF compares the underlying text exactly, and the extra spaces make it a different value from "INV-2025-000042". This is why cleaning always comes before counting.',
        incorrectFeedback:
          'COUNTIF searches text happily — the problem is the value it searches for. What invisible characters could make two identical-looking strings unequal?',
      },
    ],
    completion: [
      'Vendor names cleaned with TRIM and CLEAN',
      'Invoice numbers normalised with SUBSTITUTE',
      'Data Validation list applied to Department',
      'All 5 questions answered correctly',
    ],
  },

  {
    id: 'm26',
    number: 12,
    levelId: 'L1',
    module: 'Data Cleaning Fundamentals',
    category: 'Excel Foundations',
    title: 'Dates Never Lie',
    difficulty: 'Beginner',
    xp: 130,
    estMinutes: 15,
    summary:
      'Convert text dates with DATEVALUE, spot the sorting trap, and compute period end with EOMONTH.',
    scenario: [
      'The raw extract stores Invoice Date as text: 5/09/2025, 17/09/2025, 28/09/2025. Sorting the column A→Z puts 5/09/2025 after 17/09/2025 — and 4/09/2025 after 30/09/2025.',
      'Adaeze wants a cut-off test: which invoices arrived in the last ten days of the period? On text dates the filter returns the wrong rows, and no date arithmetic works at all.',
    ],
    objective:
      'Convert text dates into real dates with DATEVALUE, flag late invoices with IF, and return period end with EOMONTH.',
    tasks: [
      'Download the raw AP extract.',
      'Add a converted-date column using DATEVALUE.',
      'Flag invoices dated 21 September or later as LATE.',
      'Write the month-end formula for the period.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Text dates are not dates',
        formula: '=DATEVALUE(B2)',
        explanation:
          'Excel sorts text character by character, so "5/09/2025" starts with a 5 and lands after "30/09/2025". DATEVALUE parses the text into a real date serial you can sort, filter and subtract — but it uses your regional settings, so confirm your workbook reads dates day-month-year before you rely on it.',
      },
      {
        title: 'Month end in one step',
        formula: '=EOMONTH(DATEVALUE(B2),0)',
        explanation:
          'EOMONTH returns the last day of the month N months away; 0 means the date\'s own month. Cut-off testing depends on knowing the exact period end, and this gives it for any invoice in one copyable formula.',
      },
    ],
    datasetIds: [RAW],
    hints: [
      {
        id: 'm26-h1',
        concept: 'date-values',
        title: 'Convert first, sort second',
        body: 'Wrap the text date: =DATEVALUE(B2) turns "21/09/2025" into a real date serial you can sort, filter and subtract. Copy it down before you touch the sort.',
        xpCost: 10,
      },
      {
        id: 'm26-h2',
        concept: 'sort',
        title: 'Why the sort lied',
        body: 'Excel sorts text character by character: "5/09/2025" begins with "5" and lands after "30/09/2025". Real dates sort chronologically; text only ever sorts alphabetically.',
        xpCost: 20,
      },
      {
        id: 'm26-h3',
        concept: 'eomonth',
        title: 'Period end in one formula',
        body: '=EOMONTH(DATEVALUE(B2),0) returns the last day of the invoice month — the 0 means "no months to add". Wrap B2 in DATEVALUE first, because the cell is still text.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm26-q1',
        type: 'numeric',
        prompt: 'How many invoices are dated 21 September 2025 or later?',
        context:
          'Dates are stored as text in day/month/year order — read the day from each value.',
        answer: () =>
          rows(RAW).filter((r) => Number(String(r.invoiceDate).split('/')[0]) >= 21)
            .length,
        unit: 'invoices',
        explanation:
          'This is your end-of-period cut-off population. In a real audit these late invoices get checked for recording in the right period and for timely authorisation.',
        incorrectFeedback:
          'Read the first number in each date (the day) and count days 21 to 30. Sorting the text column will not help — convert with DATEVALUE first, then filter.',
      },
      {
        id: 'm26-q2',
        type: 'formula',
        prompt:
          'Invoice Date is column B, stored as text. Write the formula that converts the value in B2 into a real date.',
        placeholder: '=DATEVALUE(...)',
        accepted: ['=datevalue(b2)'],
        explanation:
          'DATEVALUE parses the text into a date serial number. Once converted you can sort chronologically, filter by range, and subtract dates for ageing.',
        incorrectFeedback:
          'The function that converts text into a date takes a single argument — the cell holding the text. Check the spelling: DATEVALUE, not DATE.',
      },
      {
        id: 'm26-q3',
        type: 'formula',
        prompt:
          'Flag the cut-off: in cell C2 write an IF formula that returns "LATE" when the text date in B2 is 21 September 2025 or later, otherwise "OK".',
        accepted: [
          '=if(datevalue(b2)>=date(2025,9,21),"late","ok")',
          '=if(datevalue(b2)>date(2025,9,20),"late","ok")',
        ],
        explanation:
          'DATEVALUE converts the text first, then DATE(2025,9,21) builds a comparable date serial. The IF labels every invoice in the final ten days of the period — your cut-off exception population.',
        incorrectFeedback:
          'Compare like with like: convert B2 with DATEVALUE before comparing it to DATE(2025,9,21). Both text results need double quotes, and the threshold cannot be typed as "21/09/2025".',
      },
      {
        id: 'm26-q4',
        type: 'formula',
        prompt:
          'Write a formula that returns the last day of the month for the invoice date in B2 — the period end that invoice is measured against.',
        placeholder: '=EOMONTH(...)',
        accepted: ['=eomonth(datevalue(b2),0)'],
        explanation:
          'EOMONTH(date, months) returns the final day of the month, and 0 months means the date\'s own month. Every September invoice returns 30/09/2025 — the cut-off date your test measures against.',
        incorrectFeedback:
          'EOMONTH needs a real date as its first argument, so wrap B2 in DATEVALUE; the second argument 0 means "same month". Do not forget the closing parenthesis.',
      },
    ],
    completion: [
      'Text dates converted with DATEVALUE',
      'LATE/OK cut-off flag written with IF',
      'Month-end formula built with EOMONTH',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm27',
    number: 13,
    levelId: 'L1',
    module: 'Robust Formulas & Lookups',
    category: 'Excel Foundations',
    title: 'Formulas That Never Show #N/A',
    difficulty: 'Intermediate',
    xp: 150,
    estMinutes: 18,
    summary:
      'Guard lookups with IFERROR, replace nested IFs with IFS, and combine conditions with AND.',
    scenario: [
      'Adaeze reviews your working paper and finds #N/A errors scattered down the vendor name column. "An error is not an answer," she says. "Label it or suppress it — but do not show me #N/A in a deliverable."',
      'She also wants a required-approver label for every invoice without four levels of nested IF, and a two-condition flag for material balances still awaiting approval.',
    ],
    objective:
      'Wrap a lookup in IFERROR, classify amounts with IFS, and combine two conditions with AND inside IF.',
    tasks: [
      'Download the purchase register, invoice extract and vendor master.',
      'Wrap the vendor lookup in IFERROR so failures read NOT IN MASTER.',
      'Classify each invoice amount into an approval band with IFS.',
      'Flag invoices that are both awaiting approval and material using AND.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'IFERROR(value, value_if_error)',
        formula: '=IFERROR(XLOOKUP(...), "NOT IN MASTER")',
        explanation:
          'IFERROR returns the first argument, unless that formula raises an error — then it returns the second. It catches every error type (#N/A, #REF!, #DIV/0!), and in audit a failed match is a finding you can filter, not an error you scroll past.',
      },
      {
        title: 'IFS for clean multi-condition tests',
        formula: '=IFS(test1, result1, test2, result2, ..., TRUE, fallback)',
        explanation:
          'IFS checks each condition in order and returns the result beside the first TRUE — readable policy logic instead of nested IFs. Finish with TRUE plus a catch-all result so every value is covered.',
      },
      {
        title: 'AND / OR inside IF',
        formula: '=IF(AND(K2="Pending",J2>500000),"FLAG","")',
        explanation:
          'AND returns TRUE only when every test is TRUE; OR needs just one. Two-condition audit tests are almost always AND — this row AND that condition — because OR floods the list with noise.',
      },
    ],
    datasetIds: [PR, 'invoice-extract', 'vendor-master'],
    hints: [
      {
        id: 'm27-h1',
        concept: 'iferror',
        title: 'Wrap the whole lookup',
        body: 'Put IFERROR in front of the lookup: =IFERROR(XLOOKUP(C2,Vendors[ID],Vendors[Name]),"NOT IN MASTER"). The first argument is your formula; the second is what shows when it errors.',
        xpCost: 10,
      },
      {
        id: 'm27-h2',
        concept: 'ifs',
        title: 'Condition, result, condition, result',
        body: 'IFS(test1, result1, test2, result2, ..., TRUE, fallback). Tests are evaluated top-down and the first TRUE wins — put the smallest band first, and finish with TRUE plus the catch-all.',
        xpCost: 20,
      },
      {
        id: 'm27-h3',
        concept: 'and-or',
        title: 'Both conditions must hold',
        body: 'AND(...) returns TRUE only when every test is TRUE; OR needs just one. Inside IF: =IF(AND(K2="Pending",J2>500000),"FLAG","").',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm27-q1',
        type: 'formula',
        prompt:
          'The extract has Vendor ID in column C. Write the vendor-name lookup from the Vendors table (columns ID and Name) wrapped in IFERROR so any failed match shows "NOT IN MASTER".',
        placeholder: '=IFERROR(...)',
        accepted: [
          '=iferror(xlookup(C2,Vendors[ID],Vendors[Name]),"NOT IN MASTER")',
          '=iferror(xlookup(C2,vendors[id],vendors[name]),"not in master")',
        ],
        explanation:
          'IFERROR wraps the XLOOKUP and substitutes your label whenever the lookup raises an error. Failed matches become filterable text — an exception you can count, not an error you hide.',
        incorrectFeedback:
          'IFERROR takes two arguments: the formula that might fail, and the replacement value. Keep the XLOOKUP inside it and put "NOT IN MASTER" in double quotes as the second argument.',
      },
      {
        id: 'm27-q2',
        type: 'formula',
        prompt:
          'Total Amount is column J. Using IFS, classify the required approver: up to 500000 → "Department Manager", up to 5000000 → "Head of Procurement", up to 25000000 → "Chief Financial Officer", anything higher → "Managing Director".',
        context: 'Write the formula for cell K2. Bands are checked top-down — first TRUE wins.',
        accepted: [
          '=ifs(J2<=500000,"Department Manager",J2<=5000000,"Head of Procurement",J2<=25000000,"Chief Financial Officer",TRUE,"Managing Director")',
        ],
        explanation:
          'IFS evaluates each pair in order: an invoice of 700000 fails the first test, passes the second, and stops there. The final TRUE acts as IF\'s value_if_false — no nesting required.',
        incorrectFeedback:
          'Each IFS argument is a test followed by its result. Start with J2<=500000, then the next larger band, and close with TRUE plus the highest authority so every amount is covered.',
      },
      {
        id: 'm27-q3',
        type: 'mcq',
        prompt:
          'Which formula flags invoices that are BOTH still Unpaid AND above ₦1,000,000? (Payment Status is column M, Total Amount is column J.)',
        options: [
          { id: 'a', label: '=IF(AND(M2="Unpaid",J2>1000000),"FLAG","")' },
          { id: 'b', label: '=IF(OR(M2="Unpaid",J2>1000000),"FLAG","")' },
          { id: 'c', label: '=IF(M2="Unpaid",J2>1000000,"FLAG","")' },
          { id: 'd', label: '=IF(M2="Unpaid" AND J2>1000000,"FLAG","")' },
        ],
        correctOptionId: 'a',
        explanation:
          'AND requires both conditions to be true on the same row — unpaid AND material. OR would flag every unpaid invoice however small, flooding the list with noise.',
        incorrectFeedback:
          'Look for the version where both tests must hold together. OR accepts either one, IF cannot take four arguments, and AND is a function — not a word written between the tests.',
      },
      {
        id: 'm27-q4',
        type: 'numeric',
        prompt:
          'How many invoices are BOTH awaiting approval (Approval Status = Pending) AND above ₦500,000?',
        context: 'Approval Status is column K, Total Amount is column J.',
        answer: () =>
          rows(PR).filter((r) => r.approvalStatus === 'Pending' && Number(r.total) > 500_000)
            .length,
        unit: 'invoices',
        explanation:
          'Material balances still awaiting approval are where the authorisation control is most exposed — the money is committed but nobody with authority has signed for it yet.',
        incorrectFeedback:
          'Both conditions must be true on the same row: filter Approval Status to Pending first, then add a number filter >500000 on Total Amount — or count the pair with COUNTIFS.',
      },
    ],
    completion: [
      'IFERROR guard applied to the lookup',
      'IFS approval bands written',
      'AND two-condition flag built',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm28',
    number: 14,
    levelId: 'L1',
    module: 'Robust Formulas & Lookups',
    category: 'Excel Foundations',
    title: 'The Classic Lookup: INDEX + MATCH',
    difficulty: 'Intermediate',
    xp: 150,
    estMinutes: 18,
    summary:
      'Look up by position and name: INDEX with MATCH, named ranges, and why column order cannot break it.',
    scenario: [
      'Not every system you meet will have XLOOKUP — client machines run older Excel, and interviews still ask for the classic combination.',
      'Adaeze asks you to rebuild the vendor join with INDEX and MATCH, then name your ranges "so I can read your formula without asking you what column 3 is".',
    ],
    objective:
      'Return values with INDEX and MATCH on exact matches, apply named ranges to make formulas readable, and explain why column order cannot break this lookup.',
    tasks: [
      'Download the invoice extract and vendor master.',
      'Write the INDEX + MATCH vendor-name lookup for column C.',
      'Name the key and return ranges, then rewrite the lookup with the names.',
      'Count the distinct vendors your extract references.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'INDEX returns, MATCH locates',
        formula: '=INDEX(Vendors[Name],MATCH(C2,Vendors[ID],0))',
        explanation:
          'MATCH returns the position of a value within a range; INDEX returns the value at that position in another range. Nesting them searches one column and returns from another — no hard-coded column number anywhere.',
      },
      {
        title: 'Named ranges as documentation',
        formula: '=INDEX(VendorNames,MATCH(C2,VendorIDs,0))',
        explanation:
          'VendorIDs and VendorNames turn addresses like $A$2:$A$29 into words an audit reviewer can follow. Names live in Formulas → Name Manager, survive row inserts, and make peer review far faster.',
      },
      {
        title: 'Exact match or nothing',
        explanation:
          'The 0 in MATCH forces an exact match. Leave it out (or use 1) and MATCH returns an approximate position for unsorted data — a silent wrong answer, which is worse than #N/A.',
      },
    ],
    datasetIds: ['invoice-extract', 'vendor-master'],
    hints: [
      {
        id: 'm28-h1',
        concept: 'index-match',
        title: 'Two halves',
        body: 'MATCH(C2,Vendors[ID],0) finds the row position of the vendor ID (0 = exact). INDEX(Vendors[Name], row) returns the name at that position. Nest MATCH inside INDEX.',
        xpCost: 10,
      },
      {
        id: 'm28-h2',
        concept: 'named-ranges',
        title: 'Name the ranges first',
        body: 'Select the ID column → Formulas → Define Name → VendorIDs; do the same for the names column as VendorNames. Then =INDEX(VendorNames,MATCH(C2,VendorIDs,0)) reads like English.',
        xpCost: 20,
      },
      {
        id: 'm28-h3',
        concept: 'vlookup',
        title: 'Why not VLOOKUP?',
        body: 'VLOOKUP needs the return column counted from the left edge — a hard-coded number that breaks when columns move. INDEX + MATCH reference each column by name, so inserting columns cannot break them.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm28-q1',
        type: 'formula',
        prompt:
          'The extract has Vendor ID in column C; the vendor master sheet is Vendors with columns ID and Name. Return the vendor name using INDEX and MATCH with an exact match.',
        placeholder: '=INDEX(...,MATCH(...))',
        accepted: ['=INDEX(Vendors[Name],MATCH(C2,Vendors[ID],0))'],
        explanation:
          'MATCH(C2,Vendors[ID],0) returns the position of the extract\'s vendor ID inside the master, and INDEX(Vendors[Name], position) returns the name at that same row. The 0 forces an exact match.',
        incorrectFeedback:
          'Nest the MATCH inside the INDEX: MATCH needs its own exact-match 0. The return range is the column you want (Name); the lookup range is the column you search (ID).',
      },
      {
        id: 'm28-q2',
        type: 'mcq',
        prompt:
          'A colleague inserts a brand-new column at the front of the vendor master. Which lookup still returns the right vendor name without edits?',
        options: [
          {
            id: 'a',
            label: '=INDEX(Vendors[Name],MATCH(C2,Vendors[ID],0)) — column names, not positions',
          },
          { id: 'b', label: '=VLOOKUP(C2,Vendors,2,FALSE) — the 2 points at Name' },
          { id: 'c', label: '=VLOOKUP(C2,Vendors,TRUE) — approximate match ignores columns' },
          { id: 'd', label: '=HLOOKUP(C2,Vendors,2,FALSE) — same logic, sideways' },
        ],
        correctOptionId: 'a',
        explanation:
          'INDEX + MATCH address columns by structured name, so inserting, moving or deleting columns cannot change what they return. VLOOKUP\'s hard-coded column number silently points at the wrong field after any insertion.',
        incorrectFeedback:
          'Think about which formula hard-codes a column position. Inserting a column shifts every position — which of these formulas would still be pointing at Name afterwards?',
      },
      {
        id: 'm28-q3',
        type: 'formula',
        prompt:
          'You have named the master\'s Vendor ID column VendorIDs and Vendor Name column VendorNames. Rewrite the lookup for C2 using those names with INDEX and MATCH.',
        accepted: ['=INDEX(VendorNames,MATCH(C2,VendorIDs,0))'],
        explanation:
          'Named ranges turn cell addresses into words: the formula now says "return the vendor name whose vendor ID matches C2" — readable in a review, and still position-independent.',
        incorrectFeedback:
          'Same nesting as before, but replace both ranges with the names you defined: VendorIDs is the lookup column, VendorNames is the return column. Keep the exact-match 0.',
      },
      {
        id: 'm28-q4',
        type: 'numeric',
        prompt: 'How many distinct Vendor IDs does the invoice extract reference?',
        context: 'Count each vendor ID once, however many invoices it has.',
        answer: () => new Set(rows('invoice-extract').map((r) => String(r.vendorId))).size,
        unit: 'vendors',
        explanation:
          'A distinct count is the MATCH question in disguise: how many unique keys must exist in the master for every row to resolve. Anything absent from the master is a failed match you must chase.',
        incorrectFeedback:
          'Remove duplicates before counting — copy the Vendor ID column, use Data → Remove Duplicates, then count the rows that are left.',
      },
    ],
    completion: [
      'INDEX + MATCH lookup working',
      'Named ranges applied to the lookup',
      'All 4 questions answered correctly',
    ],
  },
]
