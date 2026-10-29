import type { Mission } from '../../lib/types'
import {
  approvalViolations,
  countRows,
  duplicateInvoiceNumbers,
  duplicateRecordCount,
  rows,
  spendByDepartment,
  topDepartment,
  totalSpend,
  unpaidAbove,
} from '../../datasets/registry'
import { VENDORS } from '../company'
import { exceptionChoices } from './helpers'

const PR = 'pr-basic'

export const FOUNDATION_MISSIONS: Mission[] = [
  {
    id: 'm01',
    number: 1,
    levelId: 'L1',
    module: 'Audit Data Fundamentals',
    category: 'Excel Foundations',
    title: 'Understanding Audit Data',
    difficulty: 'Beginner',
    xp: 100,
    estMinutes: 10,
    summary:
      'Open your first audit dataset and learn to read a purchase register like an auditor.',
    scenario: [
      'You are a Junior Internal Auditor at Apex Manufacturing Group. You have just been added to the September procurement audit team.',
      'Your audit manager, Adaeze, has sent you the accounts payable purchase register and asked you to get familiar with the data before any testing begins.',
      'She warned you: "You cannot test what you do not understand. Know your population first."',
    ],
    objective:
      'Understand the structure of the purchase register: how many records exist, what each column means, and which field identifies each transaction.',
    tasks: [
      'Download the purchase register dataset.',
      'Open it in Excel and freeze the header row.',
      'Identify the column that uniquely identifies each invoice.',
      'Note the number of records in the population.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Population vs. sample',
        explanation:
          'The population is every transaction in scope for the audit. A sample is the subset you actually test. Always record the population size before you select a sample — otherwise nobody can tell whether your sample was complete.',
      },
      {
        title: 'Unique identifiers',
        explanation:
          'A unique identifier (like Invoice Number) lets you tie records together across files. If the key is not unique, lookups and counts become unreliable — which is exactly why duplicate invoice tests exist.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm01-h1',
        concept: 'status-bar',
        title: 'Where is the record count?',
        body: 'After the header row, click the first empty cell below the data and press Ctrl + Down (Windows) or Cmd + Down (Mac) — Excel jumps to the last record. Subtract the header row.',
        xpCost: 10,
      },
      {
        id: 'm01-h2',
        concept: 'unique-keys',
        title: 'What makes a good key?',
        body: 'Ask of each column: could two invoices share this value? Invoice dates repeat, vendors repeat, amounts repeat. Invoice Number is designed not to repeat — that is your key.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm01-q1',
        type: 'numeric',
        prompt: 'How many invoice records are in the purchase register population?',
        context: 'Count the data rows only — do not include the header.',
        answer: () => countRows(PR),
        unit: 'records',
        explanation:
          'The population is every invoice processed in September. Recording it up front is step one of any audit — your sample coverage is measured against it.',
        incorrectFeedback:
          'Recount including the very last row — it is easy to miss the final record. Select the whole column of invoice numbers and check the status bar count.',
      },
      {
        id: 'm01-q2',
        type: 'mcq',
        prompt: 'Which field uniquely identifies each invoice in this register?',
        options: [
          { id: 'a', label: 'Invoice Date' },
          { id: 'b', label: 'Vendor Name' },
          { id: 'c', label: 'Invoice Number' },
          { id: 'd', label: 'Total Amount' },
        ],
        correctOptionId: 'c',
        explanation:
          'Invoice Number is the primary key. Dates, vendors and amounts all repeat — only the invoice number is designed to identify one transaction.',
        incorrectFeedback:
          'Think about which value would repeat if two invoices were issued on the same day to the same vendor for the same amount.',
      },
      {
        id: 'm01-q3',
        type: 'mcq',
        prompt:
          'In audit terms, the full set of September invoices is called:',
        options: [
          { id: 'a', label: 'The sample' },
          { id: 'b', label: 'The population' },
          { id: 'c', label: 'The exception list' },
          { id: 'd', label: 'The control' },
        ],
        correctOptionId: 'b',
        explanation:
          'The population is everything in scope. You will later select a sample from it — and any conclusion you draw only applies to what you tested.',
        incorrectFeedback:
          'A sample is a subset. Something is either in scope for the audit (the whole set) or selected from it.',
      },
    ],
    completion: [
      'Downloaded the purchase register',
      'All 3 questions answered correctly',
    ],
  },

  {
    id: 'm02',
    number: 2,
    levelId: 'L1',
    module: 'Audit Data Fundamentals',
    category: 'Excel Foundations',
    title: 'Sorting and Filtering',
    difficulty: 'Beginner',
    xp: 100,
    estMinutes: 12,
    summary: 'Use sort and filter to isolate the transactions that deserve attention.',
    scenario: [
      'Adaeze wants a quick view of unpaid exposure before the audit meeting.',
      'She asks you: "How much of September is still sitting unpaid, and which of those invoices are material enough for me to care about?"',
      'Filters are your first analytical tool — used carelessly, they are also how auditors miss data.',
    ],
    objective:
      'Filter the register on multiple criteria at once, and understand the risks of sorting without expanding the selection.',
    tasks: [
      'Download the purchase register.',
      'Apply a filter to the header row.',
      'Filter Payment Status = Unpaid and Total Amount > ₦1,000,000.',
      'Record the count of matching invoices.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Multi-criteria filtering',
        explanation:
          'Excel filters combine criteria with AND within a row and OR across rows. Auditors use this constantly: "unpaid AND above threshold" is a standard exposure query.',
      },
      {
        title: 'Sort carefully',
        explanation:
          'If you sort one column without expanding the selection, that column detaches from its row — every other field now belongs to the wrong invoice. Always select the whole range (or use a Table) before sorting.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm02-h1',
        concept: 'filter',
        title: 'Turn on filters',
        body: 'Select any cell in the header, then press Ctrl + Shift + L (Windows) or Cmd + Shift + F (Mac).',
        xpCost: 10,
      },
      {
        id: 'm02-h2',
        concept: 'filter-multiple',
        title: 'Combining two criteria',
        body: 'Filter Payment Status to Unpaid first, then apply a Number Filter → Greater Than… on Total Amount. Both filters stay active together (AND).',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm02-q1',
        type: 'numeric',
        prompt:
          'How many invoices are BOTH unpaid AND greater than ₦1,000,000?',
        context: 'Payment Status = Unpaid, Total Amount > 1,000,000.',
        answer: () => unpaidAbove(PR, 1_000_000),
        unit: 'invoices',
        explanation:
          'This is a classic exposure query: money not yet paid, in material amounts. In a real audit these become your priority items for cut-off and authorisation testing.',
        incorrectFeedback:
          'Check both conditions are active at the same time — the second filter replaces the first if you dragged the same dropdown instead of adding to it.',
      },
      {
        id: 'm02-q2',
        type: 'mcq',
        prompt:
          'You sort only the Total Amount column, without selecting the rest of the data. What happens?',
        options: [
          { id: 'a', label: 'The other columns move with it — row integrity is broken' },
          { id: 'b', label: 'Excel automatically expands the selection' },
          { id: 'c', label: 'Nothing changes until you press Enter' },
          { id: 'd', label: 'The formulas recalculate' },
        ],
        correctOptionId: 'a',
        explanation:
          'Sorting one column in isolation detaches it from its row. Invoice amounts now sit against the wrong vendors — a silent data corruption that destroys the audit trail.',
        incorrectFeedback:
          'Excel only auto-expands the selection when the data is formatted as a Table. On a plain range, the choice is yours.',
      },
      {
        id: 'm02-q3',
        type: 'mcq',
        prompt: 'Which shortcut turns filtering on for the header row?',
        options: [
          { id: 'a', label: 'Ctrl + Shift + L' },
          { id: 'b', label: 'Ctrl + P' },
          { id: 'c', label: 'Ctrl + T (only difference: it also formats)' },
          { id: 'd', label: 'Ctrl + F' },
        ],
        correctOptionId: 'a',
        explanation:
          'Ctrl + Shift + L toggles the filter dropdowns. Ctrl + T creates a Table (which also includes filters — but that is a different mission).',
        incorrectFeedback:
          'Ctrl + F is Find, Ctrl + P is Print — think of the shortcut that starts with "Filter".',
      },
    ],
    completion: ['Filtered on two criteria simultaneously', 'All 3 questions answered correctly'],
  },

  {
    id: 'm03',
    number: 3,
    levelId: 'L1',
    module: 'Core Excel Skills',
    category: 'Excel Foundations',
    title: 'Excel Tables',
    difficulty: 'Beginner',
    xp: 100,
    estMinutes: 12,
    summary: 'Convert ranges into Tables and write structured references that never break.',
    scenario: [
      'The warehouse team keeps its material issue logs as plain ranges — no structure, no filters, totals that break when rows are added.',
      'Your manager has asked you to standardise the September issue log so future audits can rely on it.',
    ],
    objective:
      'Convert a data range into a structured Excel Table, use a totals row, and write a structured reference.',
    tasks: [
      'Download the warehouse issues log.',
      'Select the data and convert it to a Table (Ctrl + T).',
      'Name the table "Issues".',
      'Add a totals row for Total Cost.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Tables grow with your data',
        explanation:
          'A Table expands automatically when rows are added, keeps filters attached, and copies formulas down. Ranges do none of this — which is why audits built on plain ranges silently lose records.',
      },
      {
        title: 'Structured references',
        explanation:
          'Issues[Total Cost] always points at the Total Cost column of the Issues table, no matter where the formula sits. Unlike J:J, it cannot drift when columns are inserted.',
      },
    ],
    datasetIds: ['warehouse-issues'],
    hints: [
      {
        id: 'm03-h1',
        concept: 'tables',
        title: 'Creating the table',
        body: 'Click any cell inside the data and press Ctrl + T. Confirm "My table has headers", then use the Table Design tab to rename it Issues.',
        xpCost: 10,
      },
      {
        id: 'm03-h2',
        concept: 'sum-column',
        title: 'Totals row',
        body: 'With the table selected, tick "Total Row" in the Table Design tab, then choose Sum under the Total Cost column.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm03-q1',
        type: 'formula',
        prompt:
          'Write a formula that sums the Total Cost column of a table named Issues using a structured reference.',
        placeholder: '=SUM(...)',
        accepted: ['=sum(Issues[Total Cost])', '=sum(issues[total cost])'],
        explanation:
          'Issues[Total Cost] is a structured reference: it always points at that column, wherever the formula lives, and survives rows being added.',
        incorrectFeedback:
          'Structured references use the pattern TableName[Column Name] inside square brackets. Make sure the formula starts with =SUM(',
      },
      {
        id: 'm03-q2',
        type: 'mcq',
        prompt: 'What is the main benefit of a Table over a plain range?',
        options: [
          { id: 'a', label: 'It prints faster' },
          { id: 'b', label: 'It expands automatically and keeps formulas/filters intact as data grows' },
          { id: 'c', label: 'It locks cells against editing' },
          { id: 'd', label: 'It removes the need for headers' },
        ],
        correctOptionId: 'b',
        explanation:
          'Tables auto-expand, copy formulas down, keep filters attached and make structured references possible — everything an audit dataset needs.',
        incorrectFeedback:
          'Think about what happens the day someone appends 50 new rows below the data.',
      },
      {
        id: 'm03-q3',
        type: 'numeric',
        prompt: 'What is the total cost of all 180 issue slips? (Sum of Total Cost)',
        context: 'Total Cost = Quantity × Unit Cost for each row.',
        answer: () => {
          const rs = rows('warehouse-issues')
          return rs.reduce((s, r) => s + Number(r.total), 0)
        },
        unit: '₦',
        explanation:
          'A totals row over a Table gives you this instantly — and it recalculates when new slips are added. This is your control total for the file.',
        incorrectFeedback:
          'Check your formula references the whole Total Cost column of the table, not just the visible rows — or verify with =SUBTOTAL(109,...) so filtered rows are excluded.',
      },
    ],
    completion: ['Range converted to a named Table', 'All 3 questions answered correctly'],
  },

  {
    id: 'm04',
    number: 4,
    levelId: 'L1',
    module: 'Core Excel Skills',
    category: 'Excel Foundations',
    title: 'IF Statements',
    difficulty: 'Beginner',
    xp: 120,
    estMinutes: 15,
    summary: 'Teach Excel to make decisions: flag vouchers that breach the cash limit.',
    scenario: [
      'Apex allows petty cash vouchers up to ₦50,000 without extra sign-off. Anything above requires the Department Manager.',
      'Your manager wants the September petty cash log automatically flagged so she can see which vouchers need re-inspection.',
    ],
    objective:
      'Write an IF statement that classifies each voucher as above or within the approval limit, and count the breaches.',
    tasks: [
      'Download the petty cash log.',
      'Add a "Flag" column using IF.',
      'Set the threshold at ₦50,000.',
      'Count how many vouchers exceed the limit.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'IF(logical_test, value_if_true, value_if_false)',
        explanation:
          'IF returns one value when a condition is TRUE and another when FALSE. Auditors use it to classify transactions against a policy threshold — the core of any exception test.',
      },
      {
        title: 'Thresholds come from policy',
        explanation:
          'The ₦50,000 limit is not arbitrary — it is the control. Tests are only as good as the criteria behind them, so always tie your threshold to written policy.',
      },
    ],
    datasetIds: ['petty-cash-log'],
    hints: [
      {
        id: 'm04-h1',
        concept: 'if',
        title: 'The IF structure',
        body: 'Start with =IF( then your test, e.g. E2>50000, then what to show if TRUE, then what to show if FALSE — separated by commas.',
        xpCost: 10,
      },
      {
        id: 'm04-h2',
        concept: 'if',
        title: 'Text in formulas',
        body: 'Any text returned by IF must sit in double quotes, e.g. "ABOVE LIMIT". Numbers must not be quoted.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm04-q1',
        type: 'formula',
        prompt:
          'In the petty cash log, Amount is column E. Write an IF formula in F2 that shows "Above Limit" when the amount exceeds ₦50,000, otherwise "Within Limit".',
        placeholder: '=IF(...)',
        accepted: [
          '=if(E2>50000,"Above Limit","Within Limit")',
          '=if(E2>50000,"above limit","within limit")',
          '=if(e2>50000,"Above Limit","Within Limit")',
        ],
        explanation:
          '=IF(E2>50000,"Above Limit","Within Limit") tests each voucher against the policy threshold and labels it. Copy it down and the whole log classifies itself.',
        incorrectFeedback:
          'Check three things: the comparison points the right way (> not <), the threshold has no comma separators, and both text results sit inside double quotes.',
      },
      {
        id: 'm04-q2',
        type: 'numeric',
        prompt: 'How many petty cash vouchers exceed the ₦50,000 limit?',
        answer: () => rows('petty-cash-log').filter((r) => Number(r.amount) > 50_000).length,
        unit: 'vouchers',
        explanation:
          'Each of these needed the Department Manager. If any were signed off by a Supervisor only, that is an approval exception worth listing.',
        incorrectFeedback:
          'Use =COUNTIF(E:E,">50000") over the Amount column rather than counting your flags by eye — hidden rows are where eyeball counts fail.',
      },
      {
        id: 'm04-q3',
        type: 'mcq',
        prompt:
          'Where should the ₦50,000 threshold come from before you rely on your IF test?',
        options: [
          { id: 'a', label: 'From the written policy that defines the control' },
          { id: 'b', label: 'From the average of the voucher amounts' },
          { id: 'c', label: 'From whatever makes the flags look balanced' },
          { id: 'd', label: 'It does not matter — the test is about Excel, not policy' },
        ],
        correctOptionId: 'a',
        explanation:
          'An exception test is only defensible when its criteria trace to policy. Adjust thresholds until results "look right" is audit bias, not analysis.',
        incorrectFeedback:
          'Ask: if the audit manager challenged your threshold, what document would you show her?',
      },
    ],
    completion: ['IF formula written and copied down', 'All 3 questions answered correctly'],
  },

  {
    id: 'm05',
    number: 5,
    levelId: 'L1',
    module: 'Excel Functions for Audit',
    category: 'Excel Foundations',
    title: 'COUNTIF and COUNTIFS',
    difficulty: 'Beginner',
    xp: 150,
    estMinutes: 15,
    summary: 'Perform your first real audit test: find duplicate invoice numbers.',
    scenario: [
      'You are a Junior Internal Auditor at Apex Manufacturing Group.',
      'The Accounts Payable department processed thousands of invoices during September. Your audit manager wants you to perform an initial duplicate invoice test.',
      'Your objective is to identify invoice numbers appearing more than once and prepare an exception list for further investigation.',
    ],
    objective:
      'Build a duplicate invoice test with COUNTIF, count the affected records, and identify every duplicated invoice number.',
    tasks: [
      'Download the purchase register.',
      'Open it in Excel.',
      'Create a duplicate test column using COUNTIF.',
      'Identify duplicate invoice numbers.',
      'Count the affected records.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Counting occurrences',
        formula: '=COUNTIF($A:$A,A2)',
        explanation:
          'COUNTIF counts how many times a value appears in a range. Anchoring the range with $ signs keeps it fixed as the formula moves down — without the anchors, your results become wrong halfway down the sheet.',
      },
      {
        title: 'Labelling exceptions',
        formula: '=IF(COUNTIF($A:$A,A2)>1,"DUPLICATE","OK")',
        explanation:
          'Wrapping COUNTIF in IF turns the count into a flag: anything appearing more than once is labelled DUPLICATE. This pattern — count, then classify — is the backbone of most audit tests.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm05-h1',
        concept: 'countif',
        title: 'Counting occurrences',
        body: 'Which Excel function tells you how many times a value appears in a column? It takes a range and a criterion.',
        xpCost: 10,
      },
      {
        id: 'm05-h2',
        concept: 'countif',
        title: 'Think COUNTIF',
        body: 'COUNTIF(range, criteria). To count how often the value in A2 appears: COUNTIF with the whole invoice column as the range and A2 as the criterion. Anchor the range with $ so it does not slide.',
        xpCost: 20,
      },
      {
        id: 'm05-h3',
        concept: 'countif',
        title: 'Solution explanation',
        body: '=COUNTIF($A:$A,A2) counts every occurrence of the current row\'s invoice number in column A. If the result is greater than 1, the invoice is a duplicate. Add =IF(...>1,"DUPLICATE","OK") to flag each row automatically.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm05-q1',
        type: 'formula',
        prompt:
          'Write the formula that counts how many times the invoice number in A2 appears in column A. Invoice Number is column A.',
        context: 'Anchor the range so it does not shift as you copy the formula down.',
        placeholder: '=COUNTIF(...)',
        accepted: [
          '=countif($A:$A,A2)',
          '=countif($a:$a,a2)',
          '=countif(A:A,A2)',
          '=countif(a:a,a2)',
        ],
        explanation:
          '=COUNTIF($A:$A,A2) counts occurrences of each invoice number. The $ anchors stop the range sliding as the formula copies down — the #1 cause of broken audit tests.',
        incorrectFeedback:
          'Your formula counts values incorrectly if the lookup range changes as the formula moves down the worksheet. Anchor it with $ signs and make sure the criterion is the cell reference, not typed text.',
      },
      {
        id: 'm05-q2',
        type: 'numeric',
        prompt: 'How many duplicate invoice records did you identify?',
        context:
          'A "duplicate record" is any row whose invoice number appears more than once in the register.',
        answer: () => duplicateRecordCount(PR),
        unit: 'records',
        explanation:
          'You identified the duplicate population successfully. Every one of these rows could represent a double payment — this is the exception list you hand to the manager.',
        incorrectFeedback:
          'Count rows where the COUNTIF result is greater than 1 — use =COUNTIF(F:F,">1") over your test column, not the number of distinct invoice numbers.',
      },
      {
        id: 'm05-q3',
        type: 'exception-select',
        prompt: 'Select every invoice number that appears more than once.',
        context: 'Select all that apply — partial selections are marked incorrect.',
        choices: () =>
          exceptionChoices(duplicateInvoiceNumbers(PR), rows(PR).map((r) => String(r.invoiceNo)), 8, 505),
        correctIds: () => duplicateInvoiceNumbers(PR),
        explanation:
          'These invoice numbers were each submitted twice. In a real audit you would now trace both records to the PO, GRN and payment file to see whether either payment was released in error.',
        incorrectFeedback:
          'Re-run your COUNTIF column and filter it to values greater than 1 — the list should contain every invoice number flagged, and nothing else.',
      },
    ],
    completion: [
      'COUNTIF duplicate test built in Excel',
      'All 3 questions answered correctly',
    ],
  },

  {
    id: 'm06',
    number: 6,
    levelId: 'L1',
    module: 'Excel Functions for Audit',
    category: 'Excel Foundations',
    title: 'SUMIF and SUMIFS',
    difficulty: 'Beginner',
    xp: 130,
    estMinutes: 15,
    summary: 'Quantify spend by department — because an exception without a value is just noise.',
    scenario: [
      'Adaeze is preparing the audit planning memo. She needs spend by department to decide where the audit risk is concentrated.',
      '"Give me total September spend for Production," she says. "Then give me Procurement. I need both in the next hour."',
    ],
    objective:
      'Use SUMIF and SUMIFS to total invoice values by department, and understand when you need multiple criteria.',
    tasks: [
      'Download the purchase register.',
      'Write a SUMIF that totals Total Amount where Department = Production.',
      'Extend the logic to SUMIFS for multi-criteria questions.',
      'Record total Procurement spend.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'SUMIF(range, criteria, [sum_range])',
        formula: '=SUMIF(F:F,"Production",J:J)',
        explanation:
          'SUMIF adds up values in one column where a condition on another column is met. Department is column F, Total Amount is column J.',
      },
      {
        title: 'SUMIFS for multiple criteria',
        formula: '=SUMIFS(J:J,F:F,"Production",M:M,"Paid")',
        explanation:
          'SUMIFS takes the sum range FIRST, then pairs of criteria ranges and criteria. In audit terms: "how much did we pay Production — that was actually paid?" Two conditions, one answer.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm06-h1',
        concept: 'sumif',
        title: 'Argument order',
        body: 'SUMIF is (range to test, criterion, range to sum). SUMIFS flips it: (range to sum, test range, criterion, ...). Getting them mixed up is the classic mistake.',
        xpCost: 10,
      },
      {
        id: 'm06-h2',
        concept: 'cell-references',
        title: 'Column letters',
        body: 'In this register: Department = column F, Total Amount = column J, Payment Status = column M.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm06-q1',
        type: 'formula',
        prompt:
          'Write a SUMIF that totals Total Amount (column J) where Department (column F) equals Production.',
        placeholder: '=SUMIF(...)',
        accepted: [
          '=sumif(F:F,"Production",J:J)',
          '=sumif($F:$F,"Production",$J:$J)',
          '=sumif(F:F,"production",J:J)',
          '=sumif($F:$F,"production",$J:$J)',
        ],
        explanation:
          '=SUMIF(F:F,"Production",J:J) tests each Department cell and adds the matching Total Amount cells. Department-level spend is the first cut of audit scoping.',
        incorrectFeedback:
          'Check the argument order: range to test first (Department), then the criterion in quotes, then the range to sum (Total Amount).',
      },
      {
        id: 'm06-q2',
        type: 'numeric',
        prompt: 'What is the total Total Amount spend of the Procurement department?',
        context: 'Round to the nearest naira — no currency symbol or commas needed.',
        answer: () => spendByDepartment(PR).get('Procurement') ?? 0,
        unit: '₦',
        explanation:
          'Spend by department tells the audit team where the money is. Procurement spending against itself is also a classic conflict-of-interest area to probe.',
        incorrectFeedback:
          'Use SUMIF over the whole columns — a partial range (e.g. rows 2–200) misses records at the bottom of the sheet.',
      },
      {
        id: 'm06-q3',
        type: 'mcq',
        prompt: 'When do you need SUMIFS instead of SUMIF?',
        options: [
          { id: 'a', label: 'When more than one criterion must all be true at once' },
          { id: 'b', label: 'When the values are negative' },
          { id: 'c', label: 'When the data is in a Table' },
          { id: 'd', label: 'When you need an average instead of a total' },
        ],
        correctOptionId: 'a',
        explanation:
          'SUMIFS stacks criteria with AND logic: unpaid AND above threshold AND in Procurement. More conditions, more precision — exactly what targeted audit queries need.',
        incorrectFeedback:
          'Think about how you filtered two criteria in Mission 02 — SUMIFS does the same thing but returns a total.',
      },
    ],
    completion: ['SUMIF/SUMIFS formulas working', 'All 3 questions answered correctly'],
  },

  {
    id: 'm07',
    number: 7,
    levelId: 'L1',
    module: 'Excel Functions for Audit',
    category: 'Excel Foundations',
    title: 'XLOOKUP',
    difficulty: 'Intermediate',
    xp: 140,
    estMinutes: 15,
    summary: 'Join two datasets the modern way — invoice extract to vendor master.',
    scenario: [
      'You received an invoice extract that has vendor IDs but no vendor names, plus the vendor master file.',
      'Adaeze wants the vendor names filled in — and she wants to know if any extract rows reference a vendor that no longer exists.',
    ],
    objective:
      'Use XLOOKUP to return vendor names from the master file and detect records that fail to match.',
    tasks: [
      'Download invoice_extract.xlsx and vendor_master.xlsx.',
      'Write an XLOOKUP that returns the vendor name for each invoice.',
      'Set a "not found" message for unmatched IDs.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'XLOOKUP(lookup, lookup_array, return_array, [if_not_found])',
        formula: '=XLOOKUP(C2, Vendors[ID], Vendors[Name], "NOT IN MASTER")',
        explanation:
          'XLOOKUP finds a value in one column and returns the matching value from another — no sorting required, and the optional fourth argument handles unmatched records, which in audit is often the most interesting result.',
      },
      {
        title: 'Failed matches are findings',
        explanation:
          'A lookup that returns "not found" means your dataset references something that should not exist — an invoice from a vendor outside the approved master is an exception, not an Excel error.',
      },
    ],
    datasetIds: ['invoice-extract', 'vendor-master'],
    hints: [
      {
        id: 'm07-h1',
        concept: 'xlookup',
        title: 'Four arguments',
        body: 'First: what you are looking up (vendor ID in the extract). Second: where to look (Vendor ID column of the master). Third: what to return (Vendor Name). Fourth: what to show if missing.',
        xpCost: 10,
      },
      {
        id: 'm07-h2',
        concept: 'xlookup',
        title: 'The fourth argument matters',
        body: 'Leave the fourth argument out and #N/A errors pollute your sheet. Give it text like "NOT IN MASTER" — that text is itself an audit flag.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm07-q1',
        type: 'formula',
        prompt:
          'The extract has Vendor ID in column C. The vendor master sheet is named Vendors with columns ID and Name. Write an XLOOKUP returning the vendor name, showing "NOT IN MASTER" when there is no match.',
        placeholder: '=XLOOKUP(...)',
        accepted: [
          '=xlookup(C2,Vendors[ID],Vendors[Name],"NOT IN MASTER")',
          '=xlookup(C2,vendors[id],vendors[name],"not in master")',
        ],
        explanation:
          'XLOOKUP(C2, Vendors[ID], Vendors[Name], "NOT IN MASTER") joins the two files on vendor ID — and the fourth argument turns unmatched references into an explicit flag.',
        incorrectFeedback:
          'Check the order: lookup value, lookup array, return array, if-not-found. The return array is the column you want to bring back (Name), not the one you search.',
      },
      {
        id: 'm07-q2',
        type: 'mcq',
        prompt:
          'What does the 4th argument of XLOOKUP do, and why does it matter in an audit?',
        options: [
          { id: 'a', label: 'Specifies what to return when no match is found — turning errors into an exception flag' },
          { id: 'b', label: 'Rounds the result to two decimals' },
          { id: 'c', label: 'Searches backwards through the list' },
          { id: 'd', label: 'Chooses which sheet to look in' },
        ],
        correctOptionId: 'a',
        explanation:
          'The "if not found" argument means unmatched records are visible as data, not hidden behind #N/A. In audit terms: vendor references outside the master become findings you can filter.',
        incorrectFeedback:
          'Without that argument, Excel shows #N/A — which most people delete or ignore. Which of the options describes giving unmatched rows a meaningful label?',
      },
      {
        id: 'm07-q3',
        type: 'numeric',
        prompt:
          'How many rows in the invoice extract reference a vendor that is NOT Active in the vendor master?',
        context: 'Include Inactive and Under Review vendors.',
        answer: () => {
          const status = new Map(VENDORS.map((v) => [v.id, v.status]))
          return rows('invoice-extract').filter((r) => {
            const s = status.get(String(r.vendorId))
            return s !== undefined && s !== 'Active'
          }).length
        },
        unit: 'rows',
        explanation:
          'These invoices were billed by vendors that should not be transacting. After Mission 30 you will investigate exactly this pattern across the full population.',
        incorrectFeedback:
          'Cross-check every Vendor ID in the extract against the Vendor Status column of the master — do not assume all vendors are Active.',
      },
    ],
    completion: ['XLOOKUP joins extract to vendor master', 'All 3 questions answered correctly'],
  },

  {
    id: 'm08',
    number: 8,
    levelId: 'L1',
    module: 'Audit Testing Techniques',
    category: 'Excel Foundations',
    title: 'Conditional Formatting',
    difficulty: 'Beginner',
    xp: 120,
    estMinutes: 12,
    summary: 'Make risky transactions jump off the screen before you write a single formula.',
    scenario: [
      'Adaeze opens your file and says: "I do not want to read 320 rows. Show me where to look."',
      'Conditional formatting turns your test results into a visual map of risk — the auditor\'s version of highlighting the pages that matter.',
    ],
    objective:
      'Apply formula-based conditional formatting to flag material invoices, and explain what the highlight means.',
    tasks: [
      'Download the purchase register.',
      'Apply conditional formatting to Total Amount > ₦1,000,000.',
      'Use a formula-based rule so it works across columns.',
      'Count the flagged invoices.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Formula-based rules',
        formula: '=$J2>1000000',
        explanation:
          'A formula rule evaluates per row. Locking the column ($J) while leaving the row relative (2) lets one rule colour entire rows based on a value in a single column.',
      },
      {
        title: 'Highlighting is a screening tool',
        explanation:
          'Colour never replaces the test — it directs attention. The highlight says "examine me first"; the audit conclusion still needs evidence.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm08-h1',
        concept: 'conditional-formatting',
        title: 'Where the rule lives',
        body: 'Select the data (or just column J), Home → Conditional Formatting → New Rule → "Use a formula to determine which cells to format".',
        xpCost: 10,
      },
      {
        id: 'm08-h2',
        concept: 'absolute-references',
        title: 'Relative vs absolute in rules',
        body: 'Lock the column but not the row: $J2>1000000. The $ keeps every row looking at column J as the rule travels down.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm08-q1',
        type: 'mcq',
        prompt:
          'Which formula highlights an entire row when the Total Amount in column J exceeds ₦1,000,000?',
        options: [
          { id: 'a', label: '=$J2>1000000' },
          { id: 'b', label: '=J2>1000000 (no anchors — same effect)' },
          { id: 'c', label: '=$J$2>1000000' },
          { id: 'd', label: '=HIGHLIGHT(J2)' },
        ],
        correctOptionId: 'a',
        explanation:
          '$J2 locks the column so every row in the selection reads column J, while the relative row number lets the rule evaluate row by row. That is how whole rows get flagged correctly.',
        incorrectFeedback:
          'One of these anchors the column only, one anchors both column and row ($J$2 always points at the single cell J2), and one is not a function at all.',
      },
      {
        id: 'm08-q2',
        type: 'numeric',
        prompt: 'How many invoices have a Total Amount greater than ₦1,000,000?',
        answer: () => rows(PR).filter((r) => Number(r.total) > 1_000_000).length,
        unit: 'invoices',
        explanation:
          'That count is your high-value stratum — in a real engagement these would likely be 100% examined rather than sampled.',
        incorrectFeedback:
          'Use =COUNTIF(J:J,">1000000") to confirm — visual counts miss rows that are off-screen or filtered.',
      },
      {
        id: 'm08-q3',
        type: 'mcq',
        prompt: 'What does a highlight actually tell the auditor?',
        options: [
          { id: 'a', label: 'Where to focus attention first — it is screening, not conclusion' },
          { id: 'b', label: 'The transaction is definitely fraudulent' },
          { id: 'c', label: 'The control has failed' },
          { id: 'd', label: 'The invoice has been paid' },
        ],
        correctOptionId: 'a',
        explanation:
          'Good catch — but colour is only triage. A highlighted row still needs vouched evidence before any conclusion is drawn.',
        incorrectFeedback:
          'The format is produced by a rule about numbers, not by knowledge of the transaction. What can a colour prove on its own?',
      },
    ],
    completion: ['Formula-based rule applied', 'All 3 questions answered correctly'],
  },

  {
    id: 'm09',
    number: 9,
    levelId: 'L1',
    module: 'Audit Testing Techniques',
    category: 'Excel Foundations',
    title: 'PivotTables',
    difficulty: 'Intermediate',
    xp: 150,
    estMinutes: 18,
    summary: 'Summarise thousands of rows into one screen an audit manager will actually read.',
    scenario: [
      'The audit meeting starts in 20 minutes and Adaeze needs a spend profile: which departments, which vendors, what totals.',
      'PivotTables answer "summarise this" questions in seconds — they are the fastest analytical tool you will use all week.',
    ],
    objective:
      'Build a PivotTable that summarises spend by department, identify the largest spending department, and reconcile the grand total.',
    tasks: [
      'Download the purchase register.',
      'Insert a PivotTable on a new sheet.',
      'Put Department in Rows and Total Amount in Values.',
      'Record the largest department by spend and the grand total.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Rows, Columns, Values, Filters',
        explanation:
          'Rows = what you group by, Values = what you aggregate, Filters = what you slice by. Spend by department is literally: Department → Rows, Total Amount → Values (Sum).',
      },
      {
        title: 'Reconcile the grand total',
        explanation:
          'The PivotTable grand total must equal the plain sum of the source column. If they disagree, your source range has gaps — check for rows outside the selected range before you present anything.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm09-h1',
        concept: 'pivot',
        title: 'Building it',
        body: 'Click inside the data → Insert → PivotTable → New Worksheet. Drag Department to Rows and Total Amount to Values (make sure it says Sum, not Count).',
        xpCost: 10,
      },
      {
        id: 'm09-h2',
        concept: 'pivot-sum-count',
        title: 'Count vs Sum',
        body: 'Excel defaults to Count when the column contains any blanks or text. Click any value cell → Value Field Settings → Sum.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm09-q1',
        type: 'mcq',
        prompt:
          'To summarise total spend per department, which fields go where?',
        options: [
          { id: 'a', label: 'Department → Rows; Total Amount → Values (Sum)' },
          { id: 'b', label: 'Department → Values; Total Amount → Rows' },
          { id: 'c', label: 'Both → Columns' },
          { id: 'd', label: 'Invoice Number → Rows; Department → Values' },
        ],
        correctOptionId: 'a',
        explanation:
          'Group by Department, aggregate Total Amount. That single layout answers "who spent the most" — the first question of audit planning.',
        incorrectFeedback:
          'Rows are for grouping categories, Values are for aggregating numbers. Which field is the category here?',
      },
      {
        id: 'm09-q2',
        type: 'numeric',
        prompt: 'Which department has the highest total spend? Enter its spend, rounded to naira.',
        context: 'Values → Sum of Total Amount, largest row.',
        answer: () => topDepartment(PR).spend,
        unit: '₦',
        explanation:
          'The highest-spend department drives audit scoping: more money, more transactions, more exposure. This number becomes a documented planning decision.',
        incorrectFeedback:
          'Sort the PivotTable values descending (right-click → Sort → Largest to Smallest) so the top department is unambiguous.',
      },
      {
        id: 'm09-q3',
        type: 'numeric',
        prompt: 'What is the grand total of Total Amount across the whole register?',
        context: 'This must reconcile to =SUM(J:J) in the source data.',
        answer: () => totalSpend(PR),
        unit: '₦',
        explanation:
          'The PivotTable grand total should tie exactly to the source column. This reconciliation is what gives a manager confidence the analysis is complete.',
        incorrectFeedback:
          'If your total differs, your Pivot range is missing rows. Re-select the full data range including the very last record and refresh.',
      },
    ],
    completion: ['PivotTable built and reconciled', 'All 3 questions answered correctly'],
  },

  {
    id: 'm10',
    number: 10,
    levelId: 'L1',
    module: 'Audit Testing Techniques',
    category: 'Excel Foundations',
    title: 'Building an Audit Exception Test',
    difficulty: 'Intermediate',
    xp: 200,
    estMinutes: 20,
    summary:
      'Combine your skills into a complete test: criteria, condition, exception — the audit way.',
    scenario: [
      'This is your final task before Adaeze lets you loose on the procurement audit.',
      'She wants a complete approval test: "Show me every invoice approved below the authority level the amount required."',
      'You now have all the pieces: the approval matrix (criteria), the register (condition), and COUNTIFS (the test).',
    ],
    objective:
      'Design and execute a full exception test: define criteria from the approval matrix, write a COUNTIFS test, count the exceptions, and classify the result.',
    tasks: [
      'Download the purchase register and approval matrix.',
      'Read the approval bands — who can approve what.',
      'Write a COUNTIFS test for invoices approved by a lower authority than the amount requires.',
      'Count the exceptions.',
      'Classify the result.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'The anatomy of an exception test',
        explanation:
          'Every audit test has three parts: Criteria (what policy requires), Condition (what the data shows), Exception (where they disagree). Write all three down before touching Excel — the formula is the easy part.',
      },
      {
        title: 'Multi-condition counting',
        formula: '=COUNTIFS(K:K,"Approved",L:L,"Department Manager",J:J,">500000")',
        explanation:
          'COUNTIFS combines conditions with AND: status is Approved, approver is the Department Manager, amount is above their limit. One formula, three conditions — the shape of most real audit tests.',
      },
    ],
    datasetIds: [PR, 'approval-matrix'],
    hints: [
      {
        id: 'm10-h1',
        concept: 'countifs',
        title: 'Write the criteria first',
        body: 'From the approval matrix: Department Manager ≤ ₦500,000. So an exception is an invoice marked Approved, signed by the Department Manager, with an amount above ₦500,000.',
        xpCost: 10,
      },
      {
        id: 'm10-h2',
        concept: 'countifs',
        title: 'Three conditions, one function',
        body: 'COUNTIFS(range1, criteria1, range2, criteria2, range3, criteria3). Columns: K = Approval Status, L = Approved By, J = Total Amount.',
        xpCost: 20,
      },
      {
        id: 'm10-h3',
        concept: 'countifs',
        title: 'Solution explanation',
        body: '=COUNTIFS(K:K,"Approved",L:L,"Department Manager",J:J,">500000") finds invoices the Department Manager approved above their ₦500,000 authority. Each match is an exception requiring investigation.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm10-q1',
        type: 'formula',
        prompt:
          'Write the COUNTIFS that counts invoices where Approval Status (K) is Approved, Approved By (L) is Department Manager, and Total Amount (J) is above 500000.',
        placeholder: '=COUNTIFS(...)',
        accepted: [
          '=countifs(K:K,"Approved",L:L,"Department Manager",J:J,">500000")',
          '=countifs($K:$K,"Approved",$L:$L,"Department Manager",$J:$J,">500000")',
          '=countifs(K:K,"approved",L:L,"department manager",J:J,">500000")',
        ],
        explanation:
          'Three conditions, ANDed together: approved + low authority + high amount. This is a complete exception test in one formula — criteria straight from the approval matrix.',
        incorrectFeedback:
          'Check each pair (range, criterion). The amount criterion must be text with an operator — ">500000" — because COUNTIFS reads comparison operators as strings.',
      },
      {
        id: 'm10-q2',
        type: 'numeric',
        prompt: 'How many approval exceptions did your test identify?',
        answer: () => approvalViolations(PR).length,
        unit: 'exceptions',
        explanation:
          'Each of these transactions was approved by someone without the authority the policy requires. That is a control design/operating failure — now you quantify it and list it.',
        incorrectFeedback:
          'Your count must also catch any row where Approved By is a lower title than the amount requires — not only Department Manager rows. Cross-check with a helper column: required approver vs actual approver.',
      },
      {
        id: 'm10-q3',
        type: 'conclusion',
        prompt:
          'Classify the result of your approval threshold test.',
        context:
          'Consider: transactions approved beyond delegated authority indicate the approval control did not operate as designed.',
        correctConclusion: 'Exception requiring investigation',
        explanation:
          'Correct. Policy breaches are exceptions requiring investigation — you have evidence the control failed, but not (yet) evidence of intent or of what was actually purchased. Evidence first, conclusions later.',
        incorrectFeedback:
          'Nothing here proves fraud, and the transactions may well be valid — but a documented control breach cannot be signed off as "no exception". What is the middle path?',
      },
    ],
    completion: [
      'Exception test designed from the approval matrix',
      'COUNTIFS test executed',
      'All 3 questions answered correctly',
    ],
  },
]
