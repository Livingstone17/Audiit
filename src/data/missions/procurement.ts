import type { Mission } from '../../lib/types'
import {
  approvalViolations,
  crossVendorDuplicates,
  duplicateInvoiceNumbers,
  duplicatePayments,
  highPriceInvoices,
  invoicesWithoutGrn,
  invoicesWithoutPo,
  paidWithoutApproval,
  poWithoutInvoice,
  rows,
  splitPurchases,
  topVendor,
  vendorsSharingBank,
} from '../../datasets/registry'
import { exceptionChoices } from './helpers'

const PR = 'pr-full'
const PO = 'po-register'
const GRN = 'grn-register'
const PAY = 'payment-register'

export const PROCUREMENT_MISSIONS: Mission[] = [
  {
    id: 'm11',
    number: 15,
    levelId: 'L2',
    module: 'Procure-to-Pay Testing',
    category: 'Procurement Audit',
    title: 'Understand the Procure-to-Pay Cycle',
    difficulty: 'Beginner',
    xp: 150,
    estMinutes: 15,
    summary: 'Learn how money moves from requisition to payment — and where controls sit.',
    scenario: [
      'Adaeze has assigned you a new case: the September procurement audit at Apex Manufacturing Group.',
      'Before testing anything, she wants you to understand the procure-to-pay (P2P) cycle and the documents that flow through it.',
      '"Every test you run maps to a control in this cycle," she says. "Know the cycle, and the tests write themselves."',
    ],
    objective:
      'Map the P2P document flow, identify the three-way match control, and recognise what a policy breach looks like.',
    tasks: [
      'Read the procurement policy supporting document.',
      'Open the PO register to see how orders are raised.',
      'Map the document flow: requisition → PO → GRN → invoice → payment.',
      'Identify where the three-way match happens.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'The P2P chain',
        explanation:
          'Requisition (we need it) → Purchase Order (we ordered it) → GRN (we received it) → Invoice (they billed us) → Payment (we paid). Each handover is a control point — and a place where things go missing.',
      },
      {
        title: 'The three-way match',
        explanation:
          'Payment should only happen when PO, GRN and invoice agree on item, quantity and price. Break any leg of the match and you have an exception — no PO means no authorisation; no GRN means no evidence of receipt.',
      },
    ],
    datasetIds: [PO],
    docIds: ['procurement-policy'],
    hints: [
      {
        id: 'm11-h1',
        concept: 'procure-to-pay',
        title: 'Follow the document trail',
        body: 'Think in order: what authorises the purchase, what proves delivery, what demands payment? The policy document section 2 states the required sequence.',
        xpCost: 10,
      },
      {
        id: 'm11-h2',
        concept: 'three-way-match',
        title: 'Three documents, one payment',
        body: 'The three-way match compares the Purchase Order, the Goods Received Note and the supplier Invoice before money moves.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm11-q1',
        type: 'mcq',
        prompt: 'What is the correct document sequence in the procure-to-pay cycle?',
        options: [
          { id: 'a', label: 'Invoice → PO → GRN → Payment → Requisition' },
          { id: 'b', label: 'Requisition → PO → GRN → Invoice → Payment' },
          { id: 'c', label: 'PO → Invoice → Requisition → GRN → Payment' },
          { id: 'd', label: 'Payment → Invoice → PO → Requisition → GRN' },
        ],
        correctOptionId: 'b',
        explanation:
          'Authorise first (requisition/PO), prove receipt (GRN), then validate the bill (invoice), then pay. Every audit test in this course sits somewhere along this chain.',
        incorrectFeedback:
          'Payment is always last, and something must authorise the purchase before it is ordered. Which option starts with intent and ends with money?',
      },
      {
        id: 'm11-q2',
        type: 'mcq',
        prompt: 'The three-way match compares which documents?',
        options: [
          { id: 'a', label: 'Purchase Order, Goods Received Note and Supplier Invoice' },
          { id: 'b', label: 'Requisition, Budget and Payment Voucher' },
          { id: 'c', label: 'Invoice, Bank Statement and Cheque' },
          { id: 'd', label: 'Contract, Timesheet and Expense Claim' },
        ],
        correctOptionId: 'a',
        explanation:
          'PO says what was ordered, GRN says what arrived, invoice says what is billed. Agreement across all three is the control that authorises payment.',
        incorrectFeedback:
          'The match is about the purchase itself — ordered vs received vs billed. Which option contains exactly those three?',
      },
      {
        id: 'm11-q3',
        type: 'conclusion',
        prompt:
          'An invoice for ₦1.4m with no purchase order was paid. Classify the result.',
        correctConclusion: 'Exception requiring investigation',
        explanation:
          'Correct. The payment bypassed the authorisation leg of P2P. It may be a legitimate emergency purchase — but it breached the documented control, so it must be investigated.',
        incorrectFeedback:
          'We know the control was bypassed, but nothing yet tells us the goods were never received or that anyone acted improperly. What fits evidence-so-far?',
      },
    ],
    completion: ['P2P document flow mapped', 'All 3 questions answered correctly'],
  },

  {
    id: 'm12',
    number: 16,
    levelId: 'L2',
    module: 'Procure-to-Pay Testing',
    category: 'Procurement Audit',
    title: 'Purchase Order Testing',
    difficulty: 'Intermediate',
    xp: 200,
    estMinutes: 25,
    summary: 'Match invoices to purchase orders and find the ones that wander in without one.',
    scenario: [
      'Your first substantive test: PO matching.',
      'Apex policy requires a purchase order for every purchase above ₦200,000. Your job is to find invoices without one, and purchase orders that were never invoiced.',
      '"Both directions matter," Adaeze reminds you. "Uninvoiced orders may mean goods received but never billed — or orders that should never have been raised."',
    ],
    objective:
      'Match the purchase register against the PO register in both directions and quantify unmatched records.',
    tasks: [
      'Download the purchase register and PO register.',
      'Add a helper column testing whether each invoice has a PO number.',
      'Count invoices without a PO.',
      'Count POs that no invoice references.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Matching in both directions',
        formula: '=IF(COUNTIF(PO!A:A, E2)=0, "NO PO", "OK")',
        explanation:
          'A one-way match only proves half the story. Test register→PO for missing authorisation, and PO→register for obligations entered but not billed. Unmatched on either side is an exception candidate.',
      },
      {
        title: 'IFNA / COUNTIF anti-join',
        explanation:
          'COUNTIF returning 0 is the simplest "does this exist in the other file" test in Excel. XLOOKUP with a not-found message does the same job with more context.',
      },
    ],
    datasetIds: [PR, PO],
    hints: [
      {
        id: 'm12-h1',
        concept: 'countblank',
        title: 'Counting blanks',
        body: 'To count invoices with no PO number: =COUNTBLANK(E:E) or =COUNTIF(E:E,""). Both count empty PO Number cells in column E.',
        xpCost: 10,
      },
      {
        id: 'm12-h2',
        concept: 'countif',
        title: 'The other direction',
        body: 'For POs with no invoice: put a COUNTIF on the PO list that counts how many times each PO number appears in the invoice register. Zero means never invoiced.',
        xpCost: 20,
      },
      {
        id: 'm12-h3',
        concept: 'countif',
        title: 'Solution explanation',
        body: 'In the invoice register use =COUNTBLANK(E:E). For the reverse test, in the PO register use =COUNTIF(PO!A:A, <invoice PO column>) = 0 to find orders with no invoice.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm12-q1',
        type: 'numeric',
        prompt: 'How many invoices have no PO Number at all?',
        answer: () => invoicesWithoutPo(PR).length,
        unit: 'invoices',
        explanation:
          'Every one of these bypassed the authorisation step of P2P — for a company with a written PO requirement, that is a control breach regardless of whether the spend was legitimate.',
        incorrectFeedback:
          'Make sure you count truly empty cells — a formula returning "" looks blank but =COUNTBLANK will not count it. Try =COUNTIF(E:E,"") as a cross-check.',
      },
      {
        id: 'm12-q2',
        type: 'numeric',
        prompt: 'How many purchase orders were raised but never invoiced?',
        answer: () => poWithoutInvoice(PO, PR).length,
        unit: 'POs',
        explanation:
          'Uninvoiced orders are the mirror exception: goods may have been received without billing (a liability understatement), or the order should never have been raised. Either way — follow up.',
        incorrectFeedback:
          'This is the reverse match: for each PO number, count its appearances in the invoice register. =COUNTIF(invoice PO column, PO number) = 0.',
      },
      {
        id: 'm12-q3',
        type: 'text',
        prompt:
          'Write a one-sentence audit observation for the invoices without purchase orders.',
        keywords: ['invoice', 'purchase order'],
        minWords: 12,
        placeholderText: 'e.g. A number of invoices were processed without…',
        explanation:
          'A good observation states condition and criteria together: "X invoices were paid without an approved PO, contrary to policy section 2." Fact first, evaluation second.',
        incorrectFeedback:
          'Your observation should name both what you found (invoices without POs) and the standard they failed (the PO requirement / authorisation policy).',
      },
    ],
    completion: ['Both match directions tested', 'All 3 questions answered correctly'],
  },

  {
    id: 'm13',
    number: 17,
    levelId: 'L2',
    module: 'Procure-to-Pay Testing',
    category: 'Procurement Audit',
    title: 'Duplicate Invoice Detection',
    difficulty: 'Intermediate',
    xp: 200,
    estMinutes: 20,
    summary: 'Find duplicate invoices — and the duplicate payments they can trigger.',
    scenario: [
      'Accounts Payable processed the September population at speed. Duplicate invoices are the classic cost of speed.',
      'Two of your tests matter here: invoice numbers used more than once, and invoice numbers reused across different vendors — the second pattern is far more suspicious than the first.',
      'You will also check whether any invoice was actually paid twice.',
    ],
    objective:
      'Detect duplicate invoice numbers (including cross-vendor reuse) and confirm whether any invoice was paid more than once.',
    tasks: [
      'Download the purchase register and payment register.',
      'Build the COUNTIF duplicate test from Mission 05.',
      'Identify invoice numbers shared by different vendors.',
      'Match the payment register for double payments.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Same number, different story',
        explanation:
          'Two rows with the same invoice number from the same vendor is often a resubmission. The same number from two different vendors means one of the records is mis-keyed, mis-assigned — or fabricated.',
      },
      {
        title: 'Duplicates do not stay in the register',
        explanation:
          'The register shows duplicate invoices; the payment register shows duplicate cash. Always push a duplicate test through to payment — that is where the actual loss sits.',
      },
    ],
    datasetIds: [PR, PAY],
    hints: [
      {
        id: 'm13-h1',
        concept: 'find-duplicates',
        title: 'Reuse your Mission 05 test',
        body: '=COUNTIF($A:$A,A2)>1 over the invoice number column flags every duplicate record. Same technique, bigger population.',
        xpCost: 10,
      },
      {
        id: 'm13-h2',
        concept: 'countifs',
        title: 'Cross-vendor duplicates',
        body: 'Add a second column: =COUNTIFS($A:$A,A2,$C:$C,C2) — occurrences of that invoice number AND that vendor ID. If the invoice count exceeds the invoice+vendor count, another vendor used the number.',
        xpCost: 20,
      },
      {
        id: 'm13-h3',
        concept: 'find-duplicates',
        title: 'Two payments, one invoice',
        body: 'In the payment register, COUNTIF over the Invoice Number column finds invoices paid more than once. Match those back to the purchase register for amounts.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm13-q1',
        type: 'numeric',
        prompt: 'How many distinct invoice numbers appear more than once in the register?',
        context: 'Count each duplicated invoice number once, not each record.',
        answer: () => duplicateInvoiceNumbers(PR).length,
        unit: 'invoice numbers',
        explanation:
          'Each duplicated number is a potential double payment. Distinct numbers (not records) is the right unit when you are sending a list of invoices to investigate.',
        incorrectFeedback:
          'Be careful which unit you counted: number of duplicated invoice numbers ≠ number of records carrying a duplicated number. Use a unique list of the flagged values.',
      },
      {
        id: 'm13-q2',
        type: 'exception-select',
        prompt: 'Select every invoice number used by MORE THAN ONE vendor.',
        context: 'These are the cross-vendor duplicates — a stronger red flag than plain duplicates.',
        choices: () =>
          exceptionChoices(
            crossVendorDuplicates(PR),
            rows(PR).map((r) => String(r.invoiceNo)),
            8,
            1313,
          ),
        correctIds: () => crossVendorDuplicates(PR),
        explanation:
          'The same invoice number billed by two different vendors cannot both be right. One record is wrong at best — at worst someone is using invoice numbers that are not theirs.',
        incorrectFeedback:
          'For each duplicated invoice number, check whether the Vendor ID column holds more than one value: =COUNTIFS(A:A,A2,C:C,C2) compared against =COUNTIF(A:A,A2).',
      },
      {
        id: 'm13-q3',
        type: 'numeric',
        prompt: 'How many invoice numbers were paid more than once in the payment register?',
        answer: () => duplicatePayments(PAY).length,
        unit: 'invoices',
        explanation:
          'Duplicate payments are quantified loss — cash that left the bank twice. This is the number you take to the audit manager, with the amounts attached.',
        incorrectFeedback:
          'Run the duplicate test on the payment register\'s Invoice Number column — not the payment ID, which is unique by design.',
      },
    ],
    completion: ['Duplicate tests run on both registers', 'All 3 questions answered correctly'],
  },

  {
    id: 'm14',
    number: 18,
    levelId: 'L2',
    module: 'Procure-to-Pay Testing',
    category: 'Procurement Audit',
    title: 'Approval Threshold Testing',
    difficulty: 'Intermediate',
    xp: 200,
    estMinutes: 25,
    summary: 'Test delegated authority — and catch purchases deliberately split below limits.',
    scenario: [
      'The approval matrix is the backbone of Apex\'s financial controls: Department Manager up to ₦500k, Head of Procurement to ₦5m, CFO to ₦25m, Managing Director beyond.',
      'Your case file includes a warning from a previous review: "Watch for split purchases — orders chopped up to stay under an approval limit."',
      'Two tests today: approvals granted below authority, and purchases split just under the ₦500,000 line.',
    ],
    objective:
      'Test every invoice against the approval matrix, quantify approval violations, and detect split purchases clustered just below the threshold.',
    tasks: [
      'Download the purchase register and approval matrix.',
      'For each invoice, determine the approver the amount requires.',
      'Flag invoices approved below the required authority.',
      'Group same-vendor, same-day invoices in the ₦400k–₦499k band to find splits.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Approval matrix lookup',
        formula: '=XLOOKUP(total, matrix[Min], matrix[Approver], , -1)',
        explanation:
          'A reverse (approximate) XLOOKUP against the minimum-amount column returns the authority band an amount falls into. Compare that to the actual approver: mismatch = exception.',
      },
      {
        title: 'Split purchasing',
        explanation:
          'Three invoices of ₦470,000 on the same day to the same vendor are one ₦1.4m purchase wearing a disguise. Group by vendor + date and count invoices each just below the limit — clusters reveal the intent.',
      },
    ],
    datasetIds: [PR, 'approval-matrix'],
    hints: [
      {
        id: 'm14-h1',
        concept: 'approval-matrix',
        title: 'Who should have approved?',
        body: 'Map amounts to authority: ≤500k Department Manager, ≤5m Head of Procurement, ≤25m CFO, above that MD. Flag rows where Approved By is a lower title than the amount requires.',
        xpCost: 10,
      },
      {
        id: 'm14-h2',
        concept: 'countifs',
        title: 'Finding the splits',
        body: 'Create helper columns for Vendor + Date, then count invoices per group where the amount is between 400,000 and 499,999. COUNTIFS with two criteria and ">400000" / "<500000" does it.',
        xpCost: 20,
      },
      {
        id: 'm14-h3',
        concept: 'countifs',
        title: 'Solution explanation',
        body: 'Approval violations: compare Approved By against the required approver per amount band. Splits: =COUNTIFS(vendorCol,vendor,dateCol,date,totalCol,">=400000",totalCol,"<500000") — groups of 2+ are candidate splits.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm14-q1',
        type: 'mcq',
        prompt: 'A purchase for ₦6,200,000 requires approval from:',
        options: [
          { id: 'a', label: 'Department Manager' },
          { id: 'b', label: 'Head of Procurement' },
          { id: 'c', label: 'Chief Financial Officer' },
          { id: 'd', label: 'Managing Director' },
        ],
        correctOptionId: 'c',
        explanation:
          '₦6.2m falls in the ₦5,000,001–₦25,000,000 band — CFO territory. Reading the matrix correctly is half the test; the other half is comparing it to what actually happened.',
        incorrectFeedback:
          'The Head of Procurement stops at ₦5,000,000. Check which band ₦6,200,000 falls into once you cross that line.',
      },
      {
        id: 'm14-q2',
        type: 'numeric',
        prompt: 'How many invoices were approved below the authority level their amount required?',
        answer: () => approvalViolations(PR).length,
        unit: 'exceptions',
        explanation:
          'Each row is a control failure with a value attached. List them with amount, approver and required approver — that is your exception schedule for this test.',
        incorrectFeedback:
          'Compare required vs actual per row. A helper column with the required approver (from the matrix) makes mismatches impossible to miss.',
      },
      {
        id: 'm14-q3',
        type: 'numeric',
        prompt:
          'How many split-purchase groups did you find? (Same vendor, same day, 2+ invoices each between ₦400,000 and ₦499,999)',
        answer: () => splitPurchases(PR).length,
        unit: 'groups',
        explanation:
          'Each group looks like normal sub-threshold spending — until you sum it and see it crossing the limit it was avoiding. Same vendor, same day, just under the line: that pattern is the finding.',
        incorrectFeedback:
          'Group first, count second: filter to the ₦400k–₦499k band, then count invoices sharing Vendor ID + Invoice Date. Only groups of 2 or more count.',
      },
      {
        id: 'm14-q4',
        type: 'mcq',
        prompt: 'What makes a cluster of small invoices a "split purchase" concern?',
        options: [
          { id: 'a', label: 'They are individually below the approval limit while the combined value exceeds it, defeating the control' },
          { id: 'b', label: 'They were issued by the same vendor' },
          { id: 'c', label: 'They are under ₦500,000' },
          { id: 'd', label: 'They were paid late' },
        ],
        correctOptionId: 'a',
        explanation:
          'Small is not suspicious — small, same vendor, same day, straddling the threshold is. The control is defeated by division, and policy explicitly prohibits it.',
        incorrectFeedback:
          'Plenty of genuine purchases are small. Which of these would let a ₦1.4m purchase avoid the CFO entirely?',
      },
    ],
    completion: ['Approval matrix tested line by line', 'Split purchases detected', 'All 4 questions answered correctly'],
  },

  {
    id: 'm15',
    number: 19,
    levelId: 'L2',
    module: 'Analytics & Reporting',
    category: 'Procurement Audit',
    title: 'Vendor Spend Analysis',
    difficulty: 'Intermediate',
    xp: 180,
    estMinutes: 20,
    summary: 'Rank vendors, measure concentration, and spot vendors that should not be paid.',
    scenario: [
      'Adaeze wants the vendor landscape: who gets the money, how concentrated it is, and whether any of them should not be getting paid at all.',
      'Two quick analytics — total spend per vendor and a vendor master integrity check — usually surface things the transaction tests miss.',
    ],
    objective:
      'Rank vendors by total spend, identify vendors sharing a bank account, and check vendor statuses against payments received.',
    tasks: [
      'Download the purchase register and vendor master.',
      'Summarise spend by vendor (PivotTable or SUMIF).',
      'Compare bank accounts across the vendor master.',
      'Cross-check vendor statuses.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Spend concentration',
        explanation:
          'If 40% of spend sits with one vendor, that vendor is both a negotiation lever and a single point of failure. Concentration is context — it tells management where relationships deserve attention.',
      },
      {
        title: 'Master file integrity',
        explanation:
          'Two vendors on one bank account, or an inactive vendor still being paid, are master-data failures. They are cheap to test and can conceal misdirected or fabricated payments.',
      },
    ],
    datasetIds: [PR, 'vendor-master'],
    hints: [
      {
        id: 'm15-h1',
        concept: 'pivot',
        title: 'Spend per vendor',
        body: 'Pivot: Vendor Name → Rows, Total Amount → Values (Sum), then sort descending. Or =SUMIF(D:D, vendor_name, J:J) per vendor.',
        xpCost: 10,
      },
      {
        id: 'm15-h2',
        concept: 'find-duplicates',
        title: 'Finding shared accounts',
        body: 'In the vendor master, sort or filter by Bank Account — any account number appearing on two rows is an exception worth listing.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm15-q1',
        type: 'numeric',
        prompt: 'What is the total September spend of the single highest-spending vendor?',
        context: 'Sum Total Amount per vendor, then report the largest — rounded to naira.',
        answer: () => topVendor(PR).spend,
        unit: '₦',
        explanation:
          'The top vendor defines your concentration risk and — if the relationship is managed by one buyer — your conflict-of-interest focus for the rest of the audit.',
        incorrectFeedback:
          'Make sure you grouped by Vendor Name (not Vendor ID) with Sum of Total Amount, then sorted descending. A Count instead of Sum will give a nonsense answer.',
      },
      {
        id: 'm15-q2',
        type: 'exception-select',
        prompt: 'Select every vendor ID that shares a bank account with another vendor.',
        context: 'Look in the vendor master — both sides of the shared account.',
        choices: () => {
          const shared = vendorsSharingBank().flat()
          return exceptionChoices(
            shared,
            rows('vendor-master').map((r) => String(r.id)),
            6,
            1515,
          )
        },
        correctIds: () => vendorsSharingBank().flat(),
        explanation:
          'Two "independent" vendors on one account is a master-data red flag: they may be related entities, or payments for one may be landing with the other. Either answer needs evidence.',
        incorrectFeedback:
          'Sort the vendor master by Bank Account descending — duplicates surface immediately. Select both vendor IDs involved, not just the first one.',
      },
      {
        id: 'm15-q3',
        type: 'mcq',
        prompt:
          'Why does vendor spend concentration matter to an audit?',
        options: [
          { id: 'a', label: 'A dominant vendor is both a key relationship risk and a possible dependency for operations' },
          { id: 'b', label: 'Because large vendors are always fraudulent' },
          { id: 'c', label: 'It does not — only small vendors hide irregularities' },
          { id: 'd', label: 'Concentration only matters for tax purposes' },
        ],
        correctOptionId: 'a',
        explanation:
          'Concentration informs risk assessment: dependency, pricing power, and the depth of scrutiny a relationship deserves. It is context for judgement, not a finding on its own.',
        incorrectFeedback:
          'Spend concentration is not an accusation — think about what it means for the business if that relationship sours, and where management attention should focus.',
      },
    ],
    completion: ['Vendor spend ranked', 'Vendor master integrity checked', 'All 3 questions answered correctly'],
  },

  {
    id: 'm16',
    number: 20,
    levelId: 'L2',
    module: 'Analytics & Reporting',
    category: 'Procurement Audit',
    title: 'Price Variance Analysis',
    difficulty: 'Advanced',
    xp: 200,
    estMinutes: 25,
    summary: 'Detect items priced abnormally against their own historical norm.',
    scenario: [
      'Same item, same month, wildly different unit prices? Something is off.',
      'Your manager has seen it before: "If we paid 40% more for a bearing than every other invoice that month, someone needs to explain why."',
      'You will build a baseline from the data itself and flag prices that drift beyond tolerance.',
    ],
    objective:
      'Compute a normal unit price per item, flag invoices priced more than 15% above it, and identify the specific outliers.',
    tasks: [
      'Download the purchase register.',
      'Summarise the typical Unit Price per Item Description (median or average).',
      'Compare each invoice\'s unit price against its item baseline.',
      'Flag prices more than 15% above baseline.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Baseline first, variance second',
        explanation:
          'Price tests need a reference point. The median price an item fetched across the month is robust — one crazy invoice does not drag it the way an average would.',
      },
      {
        title: 'Tolerance bands',
        explanation:
          'A 15% tolerance filters out ordinary noise (partial deliveries, freight recovery) so the exceptions that remain genuinely deserve explanation. Set the tolerance from policy or experience — and document it.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm16-h1',
        concept: 'median',
        title: 'Baseline per item',
        body: 'Pivot Item Description into Rows, Unit Price into Values, and set the summarisation to Median (Value Field Settings → More Options).',
        xpCost: 10,
      },
      {
        id: 'm16-h2',
        concept: 'vlookup',
        title: 'Comparing each row to its baseline',
        body: 'Helper column: =IF(I2 > 1.15 * VLOOKUP(G2, baseline_table, 2, FALSE), "VARIANCE", "OK"). Threshold at 1.15 = 15% above baseline.',
        xpCost: 20,
      },
      {
        id: 'm16-h3',
        concept: 'vlookup',
        title: 'Solution explanation',
        body: 'Median price per item via PivotTable, then flag rows where Unit Price > 1.15 × that median. The VARIANCE list is your exception schedule for pricing.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm16-q1',
        type: 'numeric',
        prompt:
          'How many invoices have a unit price more than 15% above the item\'s own median price?',
        answer: () => highPriceInvoices(PR).length,
        unit: 'invoices',
        explanation:
          'These are the invoices where the price paid bears little relation to what the same item cost everywhere else that month — each needs a written justification under policy section 5.',
        incorrectFeedback:
          'Compare like with like: each invoice against its OWN item\'s baseline. A global threshold across all items flags expensive items as "variances" unfairly.',
      },
      {
        id: 'm16-q2',
        type: 'exception-select',
        prompt: 'Select six invoice numbers with abnormal pricing.',
        context: 'The most material outliers from your variance test.',
        choices: () =>
          exceptionChoices(
            highPriceInvoices(PR).slice(0, 6),
            rows(PR).map((r) => String(r.invoiceNo)),
            8,
            1616,
          ),
        correctIds: () => highPriceInvoices(PR).slice(0, 6),
        explanation:
          'You would now pull the PO for each: was the contract price higher, was there a documented reason, or did someone simply pay what they were told to pay?',
        incorrectFeedback:
          'Sort your variance flags by how far the price sits above the baseline — the six worst offenders are the ones to select.',
      },
      {
        id: 'm16-q3',
        type: 'mcq',
        prompt: 'Which comparison gives the most reliable price-variance test?',
        options: [
          { id: 'a', label: 'Each invoice\'s unit price against the median price for the SAME item that month' },
          { id: 'b', label: 'Each invoice against the average of all items' },
          { id: 'c', label: 'The most expensive invoice of the month' },
          { id: 'd', label: 'Unit price against quantity ordered' },
        ],
        correctOptionId: 'a',
        explanation:
          'Same item, same period, robust statistic. Comparing across items measures nothing (a bearing is not a forklift battery), and averages distort when outliers exist.',
        incorrectFeedback:
          'The test only works like-for-like. Which option compares each invoice with its own kind, using a statistic one outlier cannot bend?',
      },
    ],
    completion: ['Item baselines computed', 'Variance exceptions identified', 'All 3 questions answered correctly'],
  },

  {
    id: 'm17',
    number: 21,
    levelId: 'L2',
    module: 'Analytics & Reporting',
    category: 'Procurement Audit',
    title: 'Missing Documentation',
    difficulty: 'Intermediate',
    xp: 180,
    estMinutes: 20,
    summary: 'Test GRN completeness — evidence that goods actually arrived.',
    scenario: [
      'Policy is explicit: no three-way match, no payment. The PO and invoice are usually easy to find — the GRN is the document that goes missing.',
      '"An invoice without a GRN," Adaeze says, "is a company paying for goods nobody has confirmed receiving."',
      'Your test: every invoiced PO must have a goods received note behind it.',
    ],
    objective:
      'Match invoiced POs against the GRN register, quantify missing GRNs, and document the control implication.',
    tasks: [
      'Download the purchase register, PO register and GRN register.',
      'Match invoice PO numbers against GRN PO numbers.',
      'Count invoiced POs with no GRN.',
      'Write an observation.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'GRN completeness test',
        formula: '=IF(COUNTIF(GRN!C:C, E2)=0, "NO GRN", "MATCHED")',
        explanation:
          'The receipt leg of the three-way match is tested by anti-join: does this PO number appear in the GRN register? No match means no independent evidence the goods arrived.',
      },
      {
        title: 'Missing evidence is itself a finding',
        explanation:
          'You do not need to prove the goods never arrived. Inability to produce the receipt document at audit is a control deficiency — that is what the finding says.',
      },
    ],
    datasetIds: [PR, GRN],
    docIds: ['procurement-policy'],
    hints: [
      {
        id: 'm17-h1',
        concept: 'countif',
        title: 'The anti-join pattern',
        body: 'On the purchase register, test each PO Number against the GRN file: =COUNTIF(GRN_PO_column, E2). A zero means no receipt note exists for that order.',
        xpCost: 10,
      },
      {
        id: 'm17-h2',
        concept: 'countif',
        title: 'Only invoices with POs',
        body: 'Invoices without any PO cannot be matched to a GRN either — keep those in a separate exception bucket so your counts do not double up.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm17-q1',
        type: 'numeric',
        prompt:
          'How many invoices reference a PO that has no goods received note?',
        answer: () => invoicesWithoutGrn(PR).length,
        unit: 'invoices',
        explanation:
          'Each of these paid without independent evidence of receipt. Some will be paperwork lapses — the exposure is that nobody can currently prove the goods came.',
        incorrectFeedback:
          'Match PO numbers (not invoice numbers) against the GRN file, and remember to exclude invoices with no PO at all — those are counted in Mission 16.',
      },
      {
        id: 'm17-q2',
        type: 'mcq',
        prompt: 'Under the procurement policy, supplier records must be retained for:',
        options: [
          { id: 'a', label: 'Seven years' },
          { id: 'b', label: 'Two years' },
          { id: 'c', label: 'Six months' },
          { id: 'd', label: 'There is no requirement' },
        ],
        correctOptionId: 'a',
        explanation:
          'Policy section 6: seven years, available for internal audit on request. If a document cannot be produced during the audit, the control failed — even if the transaction was valid.',
        incorrectFeedback:
          'Open the procurement policy PDF and check section 6, Documentation Retention.',
      },
      {
        id: 'm17-q3',
        type: 'text',
        prompt:
          'Write a one-sentence audit observation about the missing GRNs.',
        keywords: ['grn', 'missing'],
        minWords: 12,
        placeholderText: 'e.g. Goods received notes could not be located for…',
        explanation:
          'Strong observations are specific and factual: how many, which document, what control it supports. Your reader should grasp the issue without opening your workpapers.',
        incorrectFeedback:
          'Name the document (GRN) and the condition (missing/could not be located) explicitly — vague phrases like "supporting paperwork" bury the point.',
      },
    ],
    completion: ['GRN completeness test run', 'All 3 questions answered correctly'],
  },

  {
    id: 'm18',
    number: 22,
    levelId: 'L2',
    module: 'Analytics & Reporting',
    category: 'Procurement Audit',
    title: 'Exception Reporting',
    difficulty: 'Advanced',
    xp: 250,
    estMinutes: 30,
    summary: 'Consolidate every test into one de-duplicated exception report.',
    scenario: [
      'All your tests are done — duplicates, approvals, POs, GRNs, pricing. The manager does not want five spreadsheets; she wants one exception report.',
      '"De-duplicate the flags," Adaeze says, "so one invoice with three problems appears once, with all three problems listed. Then give me an executive summary and your overall classification."',
    ],
    objective:
      'Combine exception flags into a single de-duplicated list, quantify total exposure, and write an executive summary with an overall classification.',
    tasks: [
      'Run the no-PO, approval and paid-without-approval tests.',
      'Combine the three flag columns into one exception list.',
      'Remove invoices flagged more than once.',
      'Write an executive summary.',
      'Classify the overall result.',
    ],
    teaches: [
      {
        title: 'Consolidating flags',
        formula: '=IF(OR(NO_PO="EXC", APPROVAL="EXC", PAID_UNAPPROVED="EXC"), "EXCEPTION", "")',
        explanation:
          'OR merges multiple tests into one flag per transaction. The exception report counts transactions, not tests — otherwise one bad invoice inflates your statistics three times.',
      },
      {
        title: 'Executive summaries',
        explanation:
          'A manager reads three things: how many exceptions, how much money, what you recommend. Everything else is workpaper detail.',
      },
    ],
    datasetIds: [PR, 'approval-matrix'],
    hints: [
      {
        id: 'm18-h1',
        concept: 'if',
        title: 'One flag column',
        body: 'Build three helper columns first (NO PO / APPROVAL / PAID UNAPPROVED), then combine with OR — count rows where the combined flag fires.',
        xpCost: 10,
      },
      {
        id: 'm18-h2',
        concept: 'executive-summary',
        title: 'What belongs in the summary',
        body: 'Executive summary = population size, number of distinct exceptions, total value affected, and a recommended next step. Numbers first, narrative second.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm18-q1',
        type: 'numeric',
        prompt:
          'How many DISTINCT invoices are flagged by at least one of these tests: no PO · approval violation · paid without approval?',
        context: 'An invoice flagged by two tests counts once.',
        answer: () => {
          const set = new Set<string>()
          for (const id of invoicesWithoutPo(PR)) set.add(id)
          for (const id of approvalViolations(PR)) set.add(id)
          for (const id of paidWithoutApproval(PR)) set.add(id)
          return set.size
        },
        unit: 'invoices',
        explanation:
          'This is the number that goes in your report. Distinct transactions, not test hits — it is the honest measure of how much of the population has a problem.',
        incorrectFeedback:
          'You are double counting. Copy the three flag lists into one column, remove duplicates (Data → Remove Duplicates), then count what remains.',
      },
      {
        id: 'm18-q2',
        type: 'text',
        prompt:
          'Write the executive summary of your exception report in 2–3 sentences: what you tested, what you found, what you recommend.',
        keywords: ['exception', 'recommend'],
        minWords: 25,
        placeholderText: 'The September procurement population of X invoices was tested for…',
        explanation:
          'A strong summary quantifies the finding, states the control implication and proposes action. That paragraph is what reaches the audit committee.',
        incorrectFeedback:
          'Your summary needs a number (how many exceptions), the control that failed, and a recommended action — the word "recommend" should appear explicitly.',
      },
      {
        id: 'm18-q3',
        type: 'conclusion',
        prompt:
          'The tests identified systematic approval breaches, undocumented payments and duplicate risk across the September population. Classify the overall result.',
        correctConclusion: 'Significant finding',
        explanation:
          'Correct. Multiple control failures across the same cycle — systemic rather than isolated — make this a significant finding that belongs in the audit report, not just an exception schedule.',
        incorrectFeedback:
          'Consider scale and pattern: this is not one stray invoice, and we are not missing evidence — several controls failed across the population. Where does that sit on the severity scale?',
      },
    ],
    completion: ['Exception list de-duplicated', 'Executive summary written', 'All 3 questions answered correctly'],
  },
]
