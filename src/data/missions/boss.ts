import type { Mission } from '../../lib/types'
import {
  approvalViolations,
  countRows,
  duplicateInvoiceNumbers,
  duplicatePayments,
  earlyPayments,
  invoicesWithoutGrn,
  invoicesWithoutPo,
  paidWithoutApproval,
  rows,
} from '../../datasets/registry'
import { exceptionChoices } from './helpers'

const PR = 'pr-boss'
const PAY = 'payment-register-boss'

export const BOSS_MISSION: Mission = {
  id: 'm24',
  number: 24,
  levelId: 'L4',
  module: 'Final Case',
  category: 'Final Boss',
  title: 'THE PROCUREMENT AUDIT',
  difficulty: 'Advanced',
  xp: 1000,
  estMinutes: 90,
  summary:
    'The full engagement: 10,000+ transactions, six datasets, three findings and an audit conclusion. This is the real thing.',
  scenario: [
    'Apex Manufacturing Group has requested an internal audit review of its September procurement transactions.',
    'You are the analyst on the engagement. Adaeze is your reviewer: "Run the full programme — population, duplicates, approvals, three-way match, vendor spend, pricing, payments. Then document at least three findings and give me your overall conclusion."',
    'Everything you have learned in 23 missions comes together in this case. Work like an audit team: understand, test, correlate, document, conclude.',
    'The data does not look right. Investigate.',
  ],
  objective:
    'Execute the complete procurement audit programme over the September population: perform every core test, select a sample, document at least three findings in CCCCAR form, and issue an overall audit conclusion.',
  tasks: [
    'Understand the population (count and value).',
    'Perform duplicate invoice testing.',
    'Test approval compliance against the approval matrix.',
    'Match PO and invoice records in both directions.',
    'Test GRN completeness (three-way match).',
    'Analyse vendor spend concentration and vendor master integrity.',
    'Identify unusual pricing against item baselines.',
    'Identify potential duplicate payments.',
    'Select and document an audit sample.',
    'Document at least 3 audit findings in CCCCAR form.',
    'Produce an overall audit conclusion.',
  ],
  teaches: [
    {
      title: 'Audit programme discipline',
      explanation:
        'A programme is a checklist for a reason: every test must run, every exception must be quantified, every conclusion must trace to evidence. Skipping a step does not save time — it creates a gap in the opinion.',
    },
    {
      title: 'Findings are the product',
      explanation:
        'Nobody consumes your formulas. Management consumes findings: condition, criteria, cause, effect, recommendation. The audit exists to produce them.',
    },
  ],
  datasetIds: [PR, 'po-register-boss', 'grn-register-boss', PAY, 'vendor-master', 'approval-matrix'],
  docIds: ['procurement-policy'],
  hints: [
    {
      id: 'm24-h1',
      concept: 'status-bar',
      title: 'Start with the population',
      body: 'Count the records and total the value first. Every percentage, coverage figure and scoping decision you make today references these two numbers.',
      xpCost: 10,
    },
    {
      id: 'm24-h2',
      concept: 'countifs',
      title: 'Reuse, do not rebuild',
      body: 'Your COUNTIF duplicate test, COUNTIFS approval test and GRN anti-join from Missions 05–17 all run unchanged on this population — only the file has grown.',
      xpCost: 20,
    },
    {
      id: 'm24-h3',
      concept: 'audit-findings',
      title: 'Findings need all five elements',
      body: 'For each finding fill Condition, Criteria, Cause, Effect and Recommendation. A form with empty elements scores zero — write each one as a complete, verifiable statement.',
      xpCost: 40,
    },
  ],
  questions: [
    {
      id: 'm24-q1',
      type: 'numeric',
      prompt: 'How many purchase transactions are in the audit population?',
      answer: () => countRows(PR),
      unit: 'records',
      explanation:
        'Population count established — your scoping and coverage figures anchor to it. Anything tested is reported as a percentage of this number.',
      incorrectFeedback:
        'Select the Invoice Number column and read the record count in the status bar — remember to exclude the header row.',
    },
    {
      id: 'm24-q2',
      type: 'numeric',
      prompt: 'How many distinct invoice numbers appear more than once?',
      answer: () => duplicateInvoiceNumbers(PR).length,
      unit: 'invoice numbers',
      explanation:
        'Duplicate population quantified. These feed your first finding: duplicate invoices indicate a control gap in AP intake that can lead to double payment.',
      incorrectFeedback:
        'COUNTIF over the invoice number column, filter to values above 1, then count the UNIQUE invoice numbers — not the flagged rows.',
    },
    {
      id: 'm24-q3',
      type: 'numeric',
      prompt:
        'How many invoices were approved below the authority their amount required?',
      answer: () => approvalViolations(PR).length,
      unit: 'exceptions',
      explanation:
        'Delegated authority failures, quantified. Group them by required vs actual approver — the pattern tells management which approval level is being bypassed.',
      incorrectFeedback:
        'Compare each approved invoice\'s Approved By title against the approval matrix band for its amount. A helper column with the required approver makes the mismatches visible.',
    },
    {
      id: 'm24-q4',
      type: 'numeric',
      prompt: 'How many invoices have no purchase order?',
      answer: () => invoicesWithoutPo(PR).length,
      unit: 'invoices',
      explanation:
        'Authorisation bypass, quantified. Under policy section 2 every purchase above ₦200,000 needs a PO — each of these went straight to payment.',
      incorrectFeedback:
        '=COUNTBLANK over the PO Number column — but watch for cells containing a space or a dash, which look blank yet are not.',
    },
    {
      id: 'm24-q5',
      type: 'numeric',
      prompt:
        'How many invoices reference a PO with no goods received note?',
      answer: () => invoicesWithoutGrn(PR).length,
      unit: 'invoices',
      explanation:
        'The receipt leg of the three-way match failed for these — no independent evidence the goods arrived. This becomes your GRN completeness finding.',
      incorrectFeedback:
        'Match invoice PO numbers against the GRN register (COUNTIF = 0). Exclude invoices that have no PO at all — those are counted in the previous test.',
    },
    {
      id: 'm24-q6',
      type: 'numeric',
      prompt: 'How many invoice numbers were paid more than once?',
      answer: () => duplicatePayments(PAY).length,
      unit: 'invoices',
      explanation:
        'Duplicate payments are realised loss — cash out twice for one liability. Quantify the value (your Mission 21 technique) and this is your strongest financial finding.',
      incorrectFeedback:
        'Run the duplicate test on the payment register\'s Invoice Number column — payment IDs themselves are always unique.',
    },
    {
      id: 'm24-q7',
      type: 'exception-select',
      prompt:
        'Select eight payment IDs dated before the invoices they settle.',
      context: 'Correlate the payment register to the purchase register by invoice number.',
      choices: () =>
        exceptionChoices(
          earlyPayments(PAY, PR).slice(0, 8),
          rows(PAY).map((r) => String(r.paymentId)),
          8,
          2424,
        ),
      correctIds: () => earlyPayments(PAY, PR).slice(0, 8),
      explanation:
        'Cash released before the bill existed. Invoice backdating or pre-authorised disbursement — either way the payment control chain was circumvented.',
      incorrectFeedback:
        'XLOOKUP the invoice date next to each payment, then filter Payment Date < Invoice Date. There are more than eight in the register — the question asks for eight.',
    },
    {
      id: 'm24-q8',
      type: 'numeric',
      prompt:
        'How many invoices were paid while NOT approved? (Approval Status ≠ Approved, Payment Status = Paid)',
      answer: () => paidWithoutApproval(PR).length,
      unit: 'invoices',
      explanation:
        'Payment executed with no approval on file — the approval control bypassed entirely for these. Include it in the approval compliance finding.',
      incorrectFeedback:
        'COUNTIFS: Payment Status = "Paid" AND Approval Status <> "Approved". Note COUNTIFS has no direct "not equal" cell reference — use "<>Approved" as the criterion text.',
    },
    {
      id: 'm24-q9',
      type: 'text',
      prompt:
        'Write the executive summary of your procurement audit (minimum 40 words): what you tested, what you found, what you recommend.',
      keywords: ['exception', 'recommend'],
      minWords: 40,
      placeholderText:
        'An internal audit of the September 2025 procurement population (10,500 transactions) identified…',
      explanation:
        'The executive summary is what the audit committee reads. Population, key exception categories with counts, control implication, and a clear recommendation — that is a complete summary.',
      incorrectFeedback:
        'The summary must include: the population you tested, your exception counts, and a recommendation. Ensure the words "exception" and "recommend" both appear.',
    },
    {
      id: 'm24-q10',
      type: 'conclusion',
      prompt:
        'Multiple systemic control failures were identified across authorisation, receipt evidence and payments. Classify your overall audit conclusion.',
      correctConclusion: 'Significant finding',
      explanation:
        'Correct. Systemic failures across the procure-to-pay cycle — not isolated errors — constitute a significant finding requiring reporting to management with a remediation plan.',
      incorrectFeedback:
        'Weigh the pattern: failures span several controls across a whole population, with quantified financial exposure. Where does that sit on the severity scale?',
    },
  ],
  completion: [
    'All 11 programme steps executed',
    'At least 3 audit findings documented (all CCCCAR elements)',
    'Executive summary and overall conclusion submitted',
    'All 10 questions answered correctly',
  ],
}
