import type { Mission } from '../../lib/types'
import {
  earlyPayments,
  inactiveVendorInvoices,
  invoicesWithoutGrn,
  paymentsToInactiveVendors,
  rows,
  totalSpend,
  vendorsSharingBank,
} from '../../datasets/registry'
import { exceptionChoices } from './helpers'

const PR = 'pr-full'
const PAY = 'payment-register'
const GRN = 'grn-register'
const PO = 'po-register'

export const INVESTIGATION_MISSIONS: Mission[] = [
  {
    id: 'm19',
    number: 19,
    levelId: 'L3',
    module: 'Investigation',
    category: 'Investigation',
    title: 'Investigate a Suspicious Vendor',
    difficulty: 'Advanced',
    xp: 300,
    estMinutes: 30,
    summary:
      'A vendor that should not be transacting. The data does not look right — investigate.',
    scenario: [
      'A tip-off from accounts payable lands on your desk: "Old oak Stationers stopped trading with us last year, but invoices keep coming."',
      'Your manager assigns you the case: "The data does not look right. Investigate — but bring me evidence, not suspicions."',
      'You have the purchase register, vendor master and payment register. Establish what happened, quantify it, and classify what you found.',
    ],
    objective:
      'Identify vendors transacting while not Active, quantify their invoices and payments, and classify the finding.',
    tasks: [
      'Download the purchase register, vendor master and payment register.',
      'Filter the vendor master to non-Active vendors.',
      'Trace those vendor IDs through invoices and payments.',
      'Quantify the exposure.',
      'Classify your result.',
    ],
    teaches: [
      {
        title: 'Status is a control, not a label',
        explanation:
          'Vendor status exists so the system can block transactions. If an Inactive vendor still receives orders and payments, either the status change never happened or the control was bypassed — both are findings.',
      },
      {
        title: 'Evidence before conclusions',
        explanation:
          'An inactive vendor being paid is an exception requiring investigation. Calling it fraud requires intent, evidence and process — never a spreadsheet. Classify carefully; escalate professionally.',
      },
    ],
    datasetIds: [PR, 'vendor-master', PAY],
    docIds: ['procurement-policy'],
    hints: [
      {
        id: 'm19-h1',
        concept: 'filter',
        title: 'Start with the master',
        body: 'Filter Vendor Status in the vendor master to anything that is not Active. That gives you the vendor IDs to hunt for.',
        xpCost: 10,
      },
      {
        id: 'm19-h2',
        concept: 'countif',
        title: 'Then follow the IDs',
        body: 'COUNTIF the purchase register\'s Vendor ID column for each flagged ID. Then do the same in the payment register — invoices prove activity, payments prove cost.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm19-q1',
        type: 'mcq',
        prompt: 'Which vendor in the master is flagged Inactive?',
        options: [
          { id: 'a', label: 'V-1027 · Apex Guard Rentals Ltd (Under Review)' },
          { id: 'b', label: 'V-1022 · Old oak Stationers Ltd (Inactive)' },
          { id: 'c', label: 'V-1028 · Delta Peak Chemicals Ltd (Active)' },
          { id: 'd', label: 'V-1016 · Bluepeak Cleaning Services (Active)' },
        ],
        correctOptionId: 'b',
        explanation:
          'Old oak Stationers is the Inactive vendor — and the tip-off named stationery invoices. Note V-1027 is "Under Review": not Active either, and worth the same scrutiny.',
        incorrectFeedback:
          'Filter the Vendor Status column to non-Active values. Two vendors are not Active — one is Inactive, the other Under Review.',
      },
      {
        id: 'm19-q2',
        type: 'numeric',
        prompt: 'How many invoices in the September register were billed by non-Active vendors?',
        context: 'Include both Inactive and Under Review vendors.',
        answer: () => inactiveVendorInvoices(PR).length,
        unit: 'invoices',
        explanation:
          'The master file said stop — the register ignored it. Each invoice is a transaction the vendor-status control should have blocked before it ever reached payment.',
        incorrectFeedback:
          'Filter the register\'s Vendor ID column against EVERY non-Active vendor ID from the master, not just the one named in the tip-off.',
      },
      {
        id: 'm19-q3',
        type: 'numeric',
        prompt: 'How many payments were released to non-Active vendors?',
        answer: () => paymentsToInactiveVendors(PAY).length,
        unit: 'payments',
        explanation:
          'Invoices prove the orders existed; payments prove the money moved. Cash to blocked vendors is the number that turns a paperwork issue into a live exposure.',
        incorrectFeedback:
          'Match the payment register\'s Vendor ID against the non-Active vendor list — remember payments can exist for invoices raised in different months.',
      },
      {
        id: 'm19-q4',
        type: 'conclusion',
        prompt:
          'Transactions exist with a vendor whose master status is Inactive. Classify the result.',
        correctConclusion: 'Exception requiring investigation',
        explanation:
          'Correct. A blocked vendor transacting means a preventive control did not operate. Investigation establishes why — deactivated in error, payment to a wrong account, or something worse.',
        incorrectFeedback:
          'We have a control breach, but no evidence yet of intent or loss. Which classification fits evidence that demands follow-up without overreaching?',
      },
    ],
    completion: ['Non-Active vendor activity quantified', 'All 4 questions answered correctly'],
  },

  {
    id: 'm20',
    number: 20,
    levelId: 'L3',
    module: 'Investigation',
    category: 'Investigation',
    title: 'Analyze Vendor Transactions',
    difficulty: 'Advanced',
    xp: 300,
    estMinutes: 35,
    summary:
      'Two vendors, one bank account, unusual payment timing. Build the transaction picture.',
    scenario: [
      'While tracing vendors, you notice two vendor records sharing a single bank account — and a handful of payments dated before the invoices they settle.',
      '"Each anomaly alone is explainable," says Adaeze. "Together they form a pattern. Quantify the pattern."',
      'Your job: analyse the transactions behind these vendors and surface the timing anomalies.',
    ],
    objective:
      'Confirm the shared bank account, quantify spend and payments for the linked vendors, and identify payments released before their invoices existed.',
    tasks: [
      'Download the vendor master, purchase register and payment register.',
      'Find the vendors sharing a bank account.',
      'Total the amounts paid to those vendors.',
      'Compare payment dates to invoice dates.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Relationships hide in master data',
        explanation:
          'Transaction tests alone never see vendor relationships. Bank account, tax ID, phone number — master data joins expose links no single register contains.',
      },
      {
        title: 'Payment before invoice is impossible',
        explanation:
          'A payment dated before its invoice means either a backdated invoice or a pre-approved disbursement. In a controlled environment, cash cannot precede the bill — that is your anomaly.',
      },
    ],
    datasetIds: ['vendor-master', PR, PAY],
    hints: [
      {
        id: 'm20-h1',
        concept: 'find-duplicates',
        title: 'Spot the shared account',
        body: 'Sort the vendor master by Bank Account — one account number appears on two rows. Both vendor IDs are the pair you need.',
        xpCost: 10,
      },
      {
        id: 'm20-h2',
        concept: 'xlookup',
        title: 'Comparing dates',
        body: 'XLOOKUP each payment\'s invoice number into the purchase register to fetch the invoice date, then =IF(payment_date < invoice_date, "EARLY", "OK").',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm20-q1',
        type: 'mcq',
        prompt: 'Which two vendors share bank account 0127749102?',
        options: [
          { id: 'a', label: 'V-1002 · Bluewater Chemicals Plc and V-1028 · Delta Peak Chemicals Ltd' },
          { id: 'b', label: 'V-1001 · Delta Steel Supplies Ltd and V-1011 · Harbourview Metals Ltd' },
          { id: 'c', label: 'V-1003 · Kano Packaging Industries and V-1024 · Nova Plastics Ltd' },
          { id: 'd', label: 'V-1010 · Quantum IT Solutions Ltd and V-1016 · Bluepeak Cleaning Services' },
        ],
        correctOptionId: 'a',
        explanation:
          'Bluewater Chemicals and Delta Peak Chemicals — similar trade, shared account. Either they are the same beneficial owner, or one set of bank details was copied. Both readings require follow-up.',
        incorrectFeedback:
          'Sort the vendor master by Bank Account and look for the duplicate account number — then read the two Vendor IDs sitting on those rows.',
      },
      {
        id: 'm20-q2',
        type: 'numeric',
        prompt:
          'What is the TOTAL amount paid to the two vendors sharing a bank account?',
        context: 'Sum Amount Paid in the payment register for both vendor IDs, rounded to naira.',
        answer: () => {
          const shared = new Set(vendorsSharingBank().flat())
          return rows(PAY)
            .filter((r) => shared.has(String(r.vendorId)))
            .reduce((s, r) => s + Number(r.amountPaid), 0)
        },
        unit: '₦',
        explanation:
          'The amount gives the investigation its materiality. Money flowing to two "separate" vendors on one account is the figure you put in front of management.',
        incorrectFeedback:
          'Sum Amount Paid (not Total Amount from the purchase register) across BOTH vendor IDs of the pair — one SUMIF per vendor, then add them.',
      },
      {
        id: 'm20-q3',
        type: 'exception-select',
        prompt:
          'Select every payment ID whose payment date is EARLIER than its invoice date.',
        context: 'You will need to match payments back to invoices to compare dates.',
        choices: () =>
          exceptionChoices(
            earlyPayments(PAY, PR),
            rows(PAY).map((r) => String(r.paymentId)),
            8,
            2020,
          ),
        correctIds: () => earlyPayments(PAY, PR),
        explanation:
          'Cash left the bank before the invoice existed — chronologically impossible under policy. Invoice dates may have been backdated after payment, which is exactly what the investigation must establish.',
        incorrectFeedback:
          'Join payment Invoice Number to the purchase register (XLOOKUP) to bring the invoice date alongside, then filter Payment Date < Invoice Date.',
      },
      {
        id: 'm20-q4',
        type: 'text',
        prompt:
          'Explain why two vendors sharing one bank account requires audit follow-up.',
        keywords: ['bank account'],
        minWords: 15,
        placeholderText: 'Two vendors sharing a bank account may indicate…',
        explanation:
          'Shared bank details suggest the vendors may not be independent — possible common ownership, duplicate vendor records, or payments diverted. It is a lead to verify, not a conclusion to announce.',
        incorrectFeedback:
          'Your answer must mention the shared bank account itself and what it could imply about the vendors\' independence or the destination of payments.',
      },
    ],
    completion: ['Shared-account vendors quantified', 'Timing anomalies identified', 'All 4 questions answered correctly'],
  },

  {
    id: 'm21',
    number: 21,
    levelId: 'L3',
    module: 'Investigation',
    category: 'Investigation',
    title: 'Correlate Vendor, PO, Invoice and Payment Data',
    difficulty: 'Advanced',
    xp: 400,
    estMinutes: 40,
    summary:
      'Join every register into one analytical view — where isolated anomalies become patterns.',
    scenario: [
      'Four files: purchase register, PO register, GRN register, payment register. Each holds part of the truth.',
      '"No single file will convict anyone," Adaeze says. "Correlate them. The audit answer is always in the joins."',
      'Today you build the end-to-end view: paid-but-undelivered, double-paid, and paid-before-invoiced.',
    ],
    objective:
      'Correlate all four registers to find paid invoices lacking GRNs, duplicate payments by value, and payments predating their invoices.',
    tasks: [
      'Download all four registers.',
      'Match invoice → PO → GRN → payment in a helper sheet.',
      'Find paid invoices whose PO has no GRN.',
      'Quantify the value of duplicate payments.',
      'Submit your results.',
    ],
    teaches: [
      {
        title: 'Joins are the audit',
        explanation:
          'Each register is a partial view: PO says ordered, GRN says received, invoice says billed, payment says paid. Correlating them reassembles the transaction — and every gap in the chain is a control failure.',
      },
      {
        title: 'XLOOKUP as a join key',
        formula: '=XLOOKUP(A2, Payments[Invoice Number], Payments[Amount Paid], "")',
        explanation:
          'One XLOOKUP per column turns a flat register into a correlated dataset. Fill down, and every transaction carries its PO, GRN and payment context with it.',
      },
    ],
    datasetIds: [PR, PO, GRN, PAY],
    hints: [
      {
        id: 'm21-h1',
        concept: 'countif',
        title: 'Paid + no GRN',
        body: 'Reuse the Mission 17 anti-join (PO not in GRN register), then filter those exceptions to Payment Status = "Paid".',
        xpCost: 10,
      },
      {
        id: 'm21-h2',
        concept: 'sumif',
        title: 'Value of duplicate payments',
        body: 'Find invoice numbers appearing twice in the payment register (COUNTIF > 1), then SUMIF the Amount Paid for those invoices and subtract the legitimate one — or simply sum the second occurrence of each.',
        xpCost: 20,
      },
      {
        id: 'm21-h3',
        concept: 'countif',
        title: 'Solution explanation',
        body: 'Correlate with helper columns: GRN match (COUNTIF into GRN), payment count (COUNTIF into payments), and date comparison (payment date < invoice date via XLOOKUP).',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm21-q1',
        type: 'numeric',
        prompt:
          'How many invoices were PAID even though their PO has no goods received note?',
        context: 'Missing GRN + Payment Status = Paid.',
        answer: () => {
          const noGrn = new Set(invoicesWithoutGrn(PR))
          return rows(PR).filter(
            (r) => noGrn.has(String(r.invoiceNo)) && r.paymentStatus !== 'Unpaid',
          ).length
        },
        unit: 'invoices',
        explanation:
          'Money out, no evidence of receipt. This is the three-way match failing at its most important leg — these become priority items for vouching to delivery evidence.',
        incorrectFeedback:
          'Start from the Mission 17 list (invoices whose PO lacks a GRN), then keep only rows where Payment Status is Paid or Partial.',
      },
      {
        id: 'm21-q2',
        type: 'numeric',
        prompt:
          'What is the total value of the DUPLICATE payments — the extra payments beyond the first for each invoice?',
        context: 'For invoices paid more than once, sum all payments after the first.',
        answer: () => {
          const byInvoice = new Map<string, { date: string; amount: number }[]>()
          for (const r of rows(PAY)) {
            const no = String(r.invoiceNo)
            if (!byInvoice.has(no)) byInvoice.set(no, [])
            byInvoice
              .get(no)!
              .push({ date: String(r.paymentDate), amount: Number(r.amountPaid) })
          }
          let total = 0
          for (const list of byInvoice.values()) {
            if (list.length < 2) continue
            const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
            for (const p of sorted.slice(1)) total += p.amount
          }
          return total
        },
        unit: '₦',
        explanation:
          'That figure is recoverable cash — money Apex can pursue from vendors who were paid twice. It is the headline number for the audit finding on duplicate payments.',
        incorrectFeedback:
          'For each duplicated invoice, count its payments: =COUNTIF(payments!C:C, invoice) > 1. The duplicate value is the sum of all payments EXCEPT the earliest one.',
      },
      {
        id: 'm21-q3',
        type: 'exception-select',
        prompt: 'Select every payment ID dated before its invoice.',
        context: 'Correlate payment register to purchase register by invoice number.',
        choices: () =>
          exceptionChoices(
            earlyPayments(PAY, PR),
            rows(PAY).map((r) => String(r.paymentId)),
            8,
            2121,
          ),
        correctIds: () => earlyPayments(PAY, PR),
        explanation:
          'Payment precedes invoice — impossible under a controlled P2P cycle. Either the invoice was created after the fact, or the payment was released against nothing. Both warrant management response.',
        incorrectFeedback:
          'XLOOKUP the invoice date next to each payment, then filter Payment Date < Invoice Date. Comparing dates visually across two files will miss rows.',
      },
      {
        id: 'm21-q4',
        type: 'formula',
        prompt:
          'In the purchase register (Invoice Number in A2), pull the matching Amount Paid from a sheet named Payments (Invoice Number and Amount Paid columns). Write the XLOOKUP.',
        placeholder: '=XLOOKUP(...)',
        accepted: [
          '=xlookup(A2,Payments[Invoice Number],Payments[Amount Paid],"")',
          '=xlookup(A2,Payments!C:C,Payments!E:E,"")',
          '=xlookup(A2,payments[invoice number],payments[amount paid],"not found")',
          '=xlookup(A2,Payments[Invoice Number],Payments[Amount Paid],"not found")',
          '=xlookup(a2,payments[invoice number],payments[amount paid],"")',
        ],
        explanation:
          'Lookup invoice number in the Payments sheet, return Amount Paid, supply "" for unmatched. That single formula correlates two registers row by row — the pattern behind every join you have run today.',
        incorrectFeedback:
          'Order check: lookup value (A2) → where to find it (invoice column of Payments) → what to return (amount column) → what to show if absent.',
      },
    ],
    completion: ['Four registers correlated', 'All 4 questions answered correctly'],
  },

  {
    id: 'm22',
    number: 22,
    levelId: 'L3',
    module: 'Judgement & Documentation',
    category: 'Investigation',
    title: 'Select an Audit Sample',
    difficulty: 'Intermediate',
    xp: 300,
    estMinutes: 25,
    summary: 'Choose evidence defensibly: method, size, coverage — documented.',
    scenario: [
      'You cannot vouch 2,400 invoices. You need a sample — and it must survive challenge from a manager who asks exactly how you chose it.',
      '"Random, documented, reconciled to the population," Adaeze says. "Then nobody can argue you cherry-picked."',
    ],
    objective:
      'Select an unbiased sample from the population, record the population value you sampled against, and justify the method.',
    tasks: [
      'Download the purchase register.',
      'Record the population count and total value.',
      'Choose a defensible selection method.',
      'Document why the method is unbiased.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Random beats convenient',
        explanation:
          'Taking the first or largest records invites bias. An Excel RAND() column, sorted, gives every record an equal chance — and a seed note lets another auditor repeat your exact selection.',
      },
      {
        title: 'Reconcile before you sample',
        explanation:
          'A sample is only meaningful against a defined population. Record count AND total value first; your sample results are reported as coverage of those figures.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm22-h1',
        concept: 'status-bar',
        title: 'Population first',
        body: 'Count rows and sum Total Amount before selecting anything — these are the coverage figures your workpaper must state.',
        xpCost: 10,
      },
      {
        id: 'm22-h2',
        concept: 'random-sample',
        title: 'Unbiased selection in Excel',
        body: 'Add a =RAND() column, sort by it ascending, take the first N rows. Document N and the date so the selection can be reperformed.',
        xpCost: 20,
      },
    ],
    questions: [
      {
        id: 'm22-q1',
        type: 'mcq',
        prompt:
          'Which selection method gives every invoice an equal chance of being picked?',
        options: [
          { id: 'a', label: 'Take the first 50 rows of the register' },
          { id: 'b', label: 'Add a =RAND() column, sort by it, and take the first N rows' },
          { id: 'c', label: 'Pick the largest invoices — they matter most' },
          { id: 'd', label: 'Choose records the previous auditor flagged' },
        ],
        correctOptionId: 'b',
        explanation:
          'Random selection removes your discretion — nobody can claim you chose records to reach a conclusion. Keying off prior flags or size deliberately samples bias.',
        incorrectFeedback:
          'Which option gives the auditor zero choice over which records land in the sample?',
      },
      {
        id: 'm22-q2',
        type: 'numeric',
        prompt:
          'Record the population value: what is the total of Total Amount across all invoices?',
        context: 'This is the coverage figure your sample will be measured against.',
        answer: () => totalSpend(PR),
        unit: '₦',
        explanation:
          'Population count + value are the anchors of every sampling workpaper. Your conclusion will read: "we tested X records representing ₦Y of the ₦Z population."',
        incorrectFeedback:
          '=SUM over the Total Amount column of the full population — make sure no rows are filtered out before you total.',
      },
      {
        id: 'm22-q3',
        type: 'mcq',
        prompt: 'Why must the sampling method be documented?',
        options: [
          { id: 'a', label: 'So another auditor can reperform the identical selection and reach the same sample' },
          { id: 'b', label: 'Because the audit standard requires neat handwriting' },
          { id: 'c', label: 'So the vendor cannot challenge the invoice' },
          { id: 'd', label: 'Documentation is only needed for random samples' },
        ],
        correctOptionId: 'a',
        explanation:
          'Reperformance is how audit work is reviewed. Method, size, date and population — documented, the sample is reproducible; undocumented, it is just a list you chose.',
        incorrectFeedback:
          'Think about the review process: a senior reopens your workpaper weeks later and must arrive at the same 30 invoices. What does he need from you?',
      },
    ],
    completion: ['Population reconciled', 'Sampling method documented', 'All 3 questions answered correctly'],
  },

  {
    id: 'm23',
    number: 23,
    levelId: 'L3',
    module: 'Judgement & Documentation',
    category: 'Investigation',
    title: 'Document an Audit Finding',
    difficulty: 'Advanced',
    xp: 400,
    estMinutes: 35,
    summary:
      'Write it the way an audit report reads: condition, criteria, cause, effect, recommendation.',
    scenario: [
      'Your tests are finished. Now the part that actually gets things changed: writing the finding.',
      '"Anyone can find an anomaly," Adaeze says. "A finding tells management exactly what is wrong, against what standard, and what to do about it. Structure is what makes it actionable."',
      'You will practise the five elements: Condition, Criteria, Cause, Effect and Recommendation.',
    ],
    objective:
      'Structure an audit finding using CCCAR: state the condition, cite the criteria, and write an actionable recommendation.',
    tasks: [
      'Review the procurement policy for the criteria.',
      'Draft the condition (what you found).',
      'Draft the criteria (what policy requires).',
      'Draft the recommendation (what management should do).',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'CCCAR in one line each',
        explanation:
          'Condition: what is (2 invoices paid without GRN). Criteria: what should be (policy requires three-way match). Cause: why it happened (no system block). Effect: so what (goods unverified, loss risk). Recommendation: fix this.',
      },
      {
        title: 'Findings without judgement words',
        explanation:
          'Write facts, not adjectives. "Could not be located" is evidence; "suspicious" is opinion. The report\'s credibility rests on language anyone can verify.',
      },
    ],
    datasetIds: [],
    docIds: ['procurement-policy'],
    hints: [
      {
        id: 'm23-h1',
        concept: 'audit-findings',
        title: 'Condition = observation + quantity',
        body: 'Start with numbers: how many, which document, what period. "During the September audit, 2 of 25 sampled invoices had no GRN."',
        xpCost: 10,
      },
      {
        id: 'm23-h2',
        concept: 'audit-findings',
        title: 'Criteria comes from policy, not from you',
        body: 'Open the procurement policy — section 2 requires a three-way match before payment. Cite the section: criteria must be the standard the organisation set for itself.',
        xpCost: 20,
      },
      {
        id: 'm23-h3',
        concept: 'audit-findings',
        title: 'Solution explanation',
        body: 'Condition: invoices paid without GRN. Criteria: policy section 2, three-way match required. Cause: no system validation. Effect: no evidence of receipt, overpayment risk. Recommendation: enforce GRN matching in the payment workflow with exceptions escalated to Finance.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm23-q1',
        type: 'mcq',
        prompt:
          'Which CCCCAR element states the control or policy the transaction failed to meet?',
        options: [
          { id: 'a', label: 'Condition' },
          { id: 'b', label: 'Criteria' },
          { id: 'c', label: 'Cause' },
          { id: 'd', label: 'Effect' },
        ],
        correctOptionId: 'b',
        explanation:
          'Criteria is the standard: policy, law, control expectation. Without it, a condition is just an observation — the finding loses its authority to demand change.',
        incorrectFeedback:
          'Condition is what IS; criteria is what SHOULD BE. Which element provides the benchmark for comparison?',
      },
      {
        id: 'm23-q2',
        type: 'text',
        prompt:
          'Draft the CONDITION: two invoices totalling ₦1.8m were paid without a goods received note. Write it as one professional sentence (min. 20 words).',
        keywords: ['invoice', 'grn'],
        minWords: 20,
        placeholderText: 'During the September 2025 procurement audit, we identified…',
        explanation:
          'A strong condition states quantity, value, period and the missing evidence — all verifiable facts your reader can trace back to workpapers.',
        incorrectFeedback:
          'The sentence must name the invoices and the missing GRN explicitly, with the numbers (count and value) included as evidence.',
      },
      {
        id: 'm23-q3',
        type: 'text',
        prompt:
          'Draft the RECOMMENDATION: what should management do about unpaid three-way matches? (min. 20 words)',
        keywords: ['should', 'control'],
        minWords: 20,
        placeholderText: 'Management should…',
        explanation:
          'Recommendations must be actionable: who does what, in what timeframe, to which control. "Improve compliance" changes nothing; "block payment release without GRN matching in the ERP" changes behaviour.',
        incorrectFeedback:
          'A recommendation names an action management SHOULD take and refers to the CONTROL being strengthened — vague advice like "be more careful" is not a recommendation.',
      },
      {
        id: 'm23-q4',
        type: 'conclusion',
        prompt:
          'During fieldwork, a sampled invoice\'s GRN could not be located by the warehouse team, though the PO and invoice exist. Classify the result.',
        correctConclusion: 'Exception requiring investigation',
        explanation:
          'Correct. Evidence of receipt is unavailable — a documented control deficiency requiring follow-up. You are not claiming the goods never arrived; you are reporting that nothing proves they did.',
        incorrectFeedback:
          'We have PO and invoice but missing receipt evidence — that is a control failure to investigate, not a closed matter, and not proof of fraud either.',
      },
    ],
    completion: ['CCCAR elements drafted', 'All 4 questions answered correctly'],
  },
]
