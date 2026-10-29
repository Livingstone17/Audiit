import type { Mission } from '../../lib/types'
import { rows } from '../../datasets/registry'

const PR = 'pr-basic'
const FULL = 'pr-full'
const VENDORS = 'vendor-master'

export const L3_GAP_MISSIONS: Mission[] = [
  {
    id: 'm36',
    number: 35,
    levelId: 'L3',
    module: 'Cross-Workbook Analysis',
    category: 'Excel Foundations',
    title: 'Follow the Links',
    difficulty: 'Intermediate',
    xp: 180,
    estMinutes: 20,
    summary:
      'Build workbook links, trace precedents and dependents, and diagnose broken references before they reach review.',
    scenario: [
      'Adaeze opens her review copy and finds #REF! down a column someone linked to a workbook that has since been renamed. "Links are promises," she says. "Show me where every number in this file comes from."',
      'You have to map the dependency chain with Excel\'s auditing tools, then rebuild the link to the invoice extract the right way.',
    ],
    objective:
      'Create workbook links with external references, trace precedents and dependents to map dependencies, and identify what broken links and formula errors actually mean.',
    tasks: [
      'Download the purchase register and the invoice extract.',
      'Link a cell to the invoice extract with an external reference.',
      'Trace precedents and dependents to map the dependency chain.',
      'Diagnose a #REF! error on a linked column.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Workbook links (external references)',
        formula: "='[invoice_extract.xlsx]Invoices'!A2",
        explanation:
          'Square brackets hold the workbook, the exclamation mark separates sheet from cell. Close the source and the formula gains its full path; move or rename the source and the link degrades to #REF!.',
      },
      {
        title: 'Trace Precedents and Trace Dependents',
        explanation:
          'Formulas → Trace Precedents draws arrows from the cells a formula reads; Trace Dependents shows which cells read this one. Blue arrows are healthy paths, red arrows lead into errors — follow the red.',
      },
      {
        title: 'Name the error before fixing it',
        explanation:
          '#REF! means a reference was destroyed (file moved, renamed, deleted); #VALUE! means the wrong type of value arrived; #N/A means a lookup found nothing. Auditing starts by reading the error code correctly.',
      },
    ],
    datasetIds: [PR, 'invoice-extract'],
    hints: [
      {
        id: 'm36-h1',
        concept: 'external-reference',
        title: 'Both files open, then type =',
        body: 'Open both workbooks, type = in the destination, click the source cell, press Enter. The pattern is =[workbook]Sheet!Cell — for example =[invoice_extract.xlsx]Invoices!A2.',
        xpCost: 10,
      },
      {
        id: 'm36-h2',
        concept: 'formula-auditing',
        title: 'Arrows into and out of the cell',
        body: 'Formulas → Trace Precedents shows what a cell reads; Trace Dependents shows who reads it. Click twice to walk further levels, Remove Arrows when finished.',
        xpCost: 20,
      },
      {
        id: 'm36-h3',
        concept: 'cell-references',
        title: 'Links arrive with dollars',
        body: 'Excel writes external references with absolute addresses ($A$2). Strip the $ signs before copying the link down, exactly as you would for a normal formula.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm36-q1',
        type: 'formula',
        prompt:
          'Both files are open. Write the external reference that pulls cell A2 of the Invoices sheet in invoice_extract.xlsx into your working sheet.',
        placeholder: '=...',
        accepted: [
          '=[invoice_extract.xlsx]Invoices!A2',
          "='[invoice_extract.xlsx]Invoices'!A2",
          '=[invoice_extract.xlsx]Invoices!$A$2',
          "='[invoice_extract.xlsx]Invoices'!$A$2",
        ],
        explanation:
          'The brackets name the workbook, the sheet follows, and ! separates sheet from cell. Excel adds quotes only when a name needs them, and dollar signs when the source was closed during linking.',
        incorrectFeedback:
          'Follow the pattern =[workbook]Sheet!Cell — the file name in square brackets, then the sheet name, an exclamation mark, then the cell address.',
      },
      {
        id: 'm36-q2',
        type: 'mcq',
        prompt: 'What do Trace Precedents arrows show?',
        options: [
          {
            id: 'a',
            label: 'Arrows flowing from the cells the formula reads into the formula cell',
          },
          {
            id: 'b',
            label: 'Arrows flowing from the formula cell to every cell that depends on it',
          },
          { id: 'c', label: 'A list of every formula on the worksheet' },
          { id: 'd', label: 'The version history of the workbook' },
        ],
        correctOptionId: 'a',
        explanation:
          'Precedent means "comes before" — the data the formula consumes. Trace Dependents is the reverse direction: what breaks if this cell changes.',
        incorrectFeedback:
          'Precedents are the inputs. Which direction do the arrows flow when Excel shows you what a formula consumes?',
      },
      {
        id: 'm36-q3',
        type: 'mcq',
        prompt:
          'A linked column suddenly shows #REF! after the source file was renamed. What happened, and how do you fix it?',
        options: [
          {
            id: 'a',
            label: 'The stored path no longer exists — relink via Data → Edit Links → Change Source',
          },
          { id: 'b', label: 'The source file simply has too many rows' },
          { id: 'c', label: 'The formulas were pasted as values' },
          { id: 'd', label: 'Excel converted the links into static numbers' },
        ],
        correctOptionId: 'a',
        explanation:
          '#REF! is literally "reference" gone. The link formula still points at the old name; Change Source re-points it at the renamed file and the values return.',
        incorrectFeedback:
          'What does the error code say about the reference itself — and what single action re-points a link at a renamed file?',
      },
      {
        id: 'm36-q4',
        type: 'numeric',
        prompt:
          'How many invoices were Paid despite never being Approved? This is the anomaly your dependency map should lead you to.',
        answer: () =>
          rows(PR).filter(
            (r) => r.paymentStatus === 'Paid' && r.approvalStatus !== 'Approved',
          ).length,
        unit: 'invoices',
        explanation:
          'Paid without approval breaks the authorisation control — and it is exactly the kind of exception you can only chase confidently once you can trace where each value came from.',
        incorrectFeedback:
          'Filter Payment Status to Paid and Approval Status to everything except Approved, or count the pair with COUNTIFS.',
      },
    ],
    completion: [
      'External reference built to the invoice extract',
      'Precedents and dependents traced',
      '#REF! diagnosis explained',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm37',
    number: 36,
    levelId: 'L3',
    module: 'Controls & Working Papers',
    category: 'Excel Foundations',
    title: 'Protect the Working Paper',
    difficulty: 'Intermediate',
    xp: 170,
    estMinutes: 18,
    summary:
      'Lock formulas, unlock inputs, switch on sheet protection — and document the control so it can be reviewed.',
    scenario: [
      'The working paper is about to go to the manager with live formulas and an unlocked source area. One accidental drag of the fill handle and the evidence is gone.',
      'Adaeze wants locked calculations, an editable input zone, a password only the preparer holds — and a note in the file saying exactly what was protected and why.',
    ],
    objective:
      'Set cell locks before enabling sheet protection, understand what protection does and does not guarantee, and document the control in the working paper itself.',
    tasks: [
      'Download the purchase register as your working paper base.',
      'Unlock the input area while keeping formula cells locked.',
      'Protect the sheet with a password.',
      'Document what was protected and where the password is held.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Lock is a property, protection is the switch',
        explanation:
          'Every cell starts locked, but locking does nothing until Review → Protect Sheet is switched on. Set the locks first — unlock the input cells — then throw the switch, or you will have locked yourself out of your own inputs.',
      },
      {
        title: 'Protection is not encryption',
        explanation:
          'Protection stops accidental edits and casual overrides; it does not stop anyone determined. Treat it as a control against mistakes, and say so honestly in the working paper rather than claiming security it cannot deliver.',
      },
      {
        title: 'Document the control',
        explanation:
          'A working paper records which sheet is protected, which range is unlocked, and where the password is filed. A control nobody can see or re-perform does not exist as far as review is concerned.',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm37-h1',
        concept: 'sheet-protection',
        title: 'Unlock inputs, then throw the switch',
        body: 'Select the input range → Ctrl+1 → Protection → clear Locked. Only then Review → Protect Sheet, and tick "Select unlocked cells" so reviewers land in the input area.',
        xpCost: 10,
      },
      {
        id: 'm37-h2',
        concept: 'data-validation',
        title: 'Protection stops edits, validation steers them',
        body: 'Put dropdown lists on the unlocked input cells so even allowed edits only accept approved values — the two controls work together.',
        xpCost: 20,
      },
      {
        id: 'm37-h3',
        concept: 'audit-findings',
        title: 'Write the control down',
        body: 'Note in the file: sheet protected, input range B2:B40 unlocked, password held in the audit file. The reviewer must be able to see and re-perform what you did.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm37-q1',
        type: 'mcq',
        prompt:
          'Reviewers must type estimates in C2:C20 but never change the formulas in column D. What is the correct sequence?',
        options: [
          { id: 'a', label: 'Unlock C2:C20, then Review → Protect Sheet' },
          { id: 'b', label: 'Protect the sheet first, then unlock C2:C20' },
          { id: 'c', label: 'Hide column D instead of locking it' },
          { id: 'd', label: 'Save the workbook as read-only' },
        ],
        correctOptionId: 'a',
        explanation:
          'Once the sheet is protected, the Locked checkbox is greyed out — the lock state has to be set before the switch is thrown. Hiding and read-only protect nothing about a specific range.',
        incorrectFeedback:
          'Which step becomes impossible after protection is on? Work out the order that keeps the input range editable.',
      },
      {
        id: 'm37-q2',
        type: 'mcq',
        prompt: 'What does a sheet protection password actually guarantee?',
        options: [
          {
            id: 'a',
            label: 'It prevents accidental edits — but it is not encryption and is easy to bypass',
          },
          {
            id: 'b',
            label: 'It encrypts the sheet so nobody can read the contents',
          },
          {
            id: 'c',
            label: 'It prevents other users from even opening the workbook',
          },
          {
            id: 'd',
            label: 'It converts formulas to values permanently',
          },
        ],
        correctOptionId: 'a',
        explanation:
          'Protection is a guard rail against mistakes, not a security boundary. The working paper should say exactly that — overstating a control is itself an audit finding waiting to happen.',
        incorrectFeedback:
          'Protection locks editing, not viewing. Which option describes a real, honest limitation of the feature?',
      },
      {
        id: 'm37-q3',
        type: 'text',
        prompt:
          'Explain how you would protect a completed working paper so its formulas cannot be changed while the input cells stay editable — name the steps and one thing protection does not do.',
        keywords: ['lock', 'protect', 'formula', 'input'],
        minWords: 30,
        explanation:
          'The full answer unlocks the input range first, enables Review → Protect Sheet with a password, verifies formulas stay locked, and admits protection guards against mistakes rather than attackers.',
        incorrectFeedback:
          'Cover both halves: the sequence (unlock inputs, then protect the sheet) and an honest limitation — protection is not encryption.',
      },
      {
        id: 'm37-q4',
        type: 'mcq',
        prompt: 'How do Data Validation and Protect Sheet differ?',
        options: [
          {
            id: 'a',
            label: 'Validation constrains what may be entered; protection controls whether cells can be edited at all',
          },
          {
            id: 'b',
            label: 'Validation works only on numbers, protection only on text',
          },
          {
            id: 'c',
            label: 'Protection validates the input, validation locks the sheet',
          },
          { id: 'd', label: 'They are two names for the same feature' },
        ],
        correctOptionId: 'a',
        explanation:
          'They are complementary controls: validation shapes the values that an unlocked cell will accept, protection decides which cells accept anything. Used together, the input area is both editable and constrained.',
        incorrectFeedback:
          'One control is about allowed values, the other about allowed edits. Which option separates them correctly?',
      },
    ],
    completion: [
      'Input area unlocked, formulas left locked',
      'Sheet protection enabled with a password',
      'Control documented for review',
      'All 4 questions answered correctly',
    ],
  },
]

export const L5_GAP_MISSIONS: Mission[] = [
  {
    id: 'm38',
    number: 38,
    levelId: 'L5',
    module: 'Power Query',
    category: 'Excel Foundations',
    title: 'Power Query: Merge and Append',
    difficulty: 'Advanced',
    xp: 220,
    estMinutes: 25,
    summary:
      'Join tables with a merge query, stack files with append, and make the whole thing re-runnable with Refresh.',
    scenario: [
      'The XLOOKUP join that was fine on 320 rows has to run on the group consolidation — copy a formula down a million rows and the workbook stops answering.',
      'Adaeze wants it as a query instead: merge vendor attributes onto the register, append the two monthly files, and next month the job is Refresh, not rebuild.',
    ],
    objective:
      'Merge two tables on a key with the right join kind, append same-shaped registers into one query, and refresh the result rather than copying data.',
    tasks: [
      'Download the full register and the vendor master.',
      'Merge the vendor master onto the register (Left Outer).',
      'Append the two register files into one query.',
      'Refresh and confirm the row count.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Merge is a join',
        explanation:
          'A merge lines up rows by a key column, exactly like a database join. Left Outer keeps every register row and adds vendor attributes where they match — unmatched rows survive with blanks, which makes them your exception list.',
      },
      {
        title: 'Append is stacking',
        explanation:
          'Append puts the rows of one table under another. Columns line up by name, so headers must match; extra columns fill with null. Two monthly files become one query in a single step.',
      },
      {
        title: 'Refresh, do not rebuild',
        explanation:
          'The query stores each step as a recipe. Drop in next month\'s file and press Refresh: the same import, merge and append re-run automatically — no formulas to fill, no joins to repair.',
      },
    ],
    datasetIds: [FULL, VENDORS],
    hints: [
      {
        id: 'm38-h1',
        concept: 'power-query-merge',
        title: 'Pick the left table carefully',
        body: 'Data → Get Data → combine → Merge: register on the left, vendors on the right, Vendor ID as the key, join kind Left Outer. The left table is the one whose rows must all survive.',
        xpCost: 10,
      },
      {
        id: 'm38-h2',
        concept: 'power-query-append',
        title: 'Stack, do not interleave',
        body: 'Home → Append Queries → Two or more tables. Rows go under each other; columns match by header name, so identical headers are a requirement, not a coincidence.',
        xpCost: 20,
      },
      {
        id: 'm38-h3',
        concept: 'csv-import',
        title: 'Every step is recorded',
        body: 'The Applied Steps pane is the recipe. Delete a step to undo it, reorder to debug, and Refresh re-runs the whole chain against whatever file is at the source path now.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm38-q1',
        type: 'numeric',
        prompt:
          'You append the full register (2,400 rows) and the foundation register (320 rows) into one query. How many rows does the combined query return?',
        answer: () => rows(FULL).length + rows(PR).length,
        unit: 'rows',
        explanation:
          'Append stacks — no matching, no deduplication. Confirming the combined row count equals the parts added together is the first control you run on any append.',
        incorrectFeedback:
          'Read each file\'s record count and add them: append only stacks rows, it never merges or removes them.',
      },
      {
        id: 'm38-q2',
        type: 'mcq',
        prompt:
          'Which join kind keeps every invoice row and adds vendor columns only where the vendor exists in the master?',
        options: [
          { id: 'a', label: 'Left Outer' },
          { id: 'b', label: 'Right Outer' },
          { id: 'c', label: 'Full Outer' },
          { id: 'd', label: 'Inner' },
        ],
        correctOptionId: 'a',
        explanation:
          'Left Outer preserves the left table completely — the audit population never shrinks because of a failed match. The blanks it leaves behind are precisely the unmatched keys you want to investigate.',
        incorrectFeedback:
          'Which join guarantees the first (left) table keeps all of its rows whatever happens on the right?',
      },
      {
        id: 'm38-q3',
        type: 'mcq',
        prompt:
          'Why use a query merge instead of XLOOKUP filled down 100,000 rows?',
        options: [
          {
            id: 'a',
            label: 'The steps re-run on Refresh, so new data flows through without copying formulas',
          },
          { id: 'b', label: 'XLOOKUP cannot return text values' },
          { id: 'c', label: 'Queries refuse to process more than 256 rows' },
          { id: 'd', label: 'XLOOKUP only works inside a single worksheet' },
        ],
        correctOptionId: 'a',
        explanation:
          'The query is a recorded procedure, not a grid of formulas. Next month\'s file arrives, Refresh re-applies every step, and there is no fill-handle maintenance or broken references to chase.',
        incorrectFeedback:
          'What changes next month when the source file is replaced — a grid of formulas, or a re-run recipe?',
      },
      {
        id: 'm38-q4',
        type: 'text',
        prompt:
          'Describe how you would append last month\'s register to this month\'s into one query, and what happens when next month\'s file arrives.',
        keywords: ['append', 'query', 'refresh'],
        minWords: 25,
        explanation:
          'A complete answer loads both files, appends them into one query with matching headers, and explains that next month means pointing the source at the new file and pressing Refresh — every step re-runs untouched.',
        incorrectFeedback:
          'Mention the append step itself, the fact that it is a query rather than pasted data, and how the next file gets in (Refresh).',
      },
    ],
    completion: [
      'Left Outer merge built on Vendor ID',
      'Two registers appended into one query',
      'Refresh-driven workflow understood',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm39',
    number: 39,
    levelId: 'L5',
    module: 'Data Modelling',
    category: 'Excel Foundations',
    title: 'Power Pivot and DAX Basics',
    difficulty: 'Advanced',
    xp: 220,
    estMinutes: 25,
    summary:
      'Relate tables in a Data Model, build measures instead of helper columns, and meet row and filter context.',
    scenario: [
      'The vendor join now exists in fourteen workbooks, each with its own helper column, each one a maintenance liability Adaeze has to review.',
      'The Data Model ends that: relate the register to the vendors once, write measures, and every PivotTable shares the same definitions — no helper columns anywhere.',
    ],
    objective:
      'Create a one-to-many relationship in the Data Model, write a measure that aggregates in context, and explain why measures scale better than calculated columns.',
    tasks: [
      'Download the full register and the vendor master.',
      'Load both tables to the Data Model and relate them on Vendor ID.',
      'Write a Total Spend measure.',
      'Answer the modelling questions.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Relationships, not lookups',
        explanation:
          'Relate register (many side) to vendors (one side) on Vendor ID. The lookup column must be unique — that is the rule that makes the join trustworthy — and PivotTables can then pull fields from both tables without a helper column.',
      },
      {
        title: 'Measures vs calculated columns',
        formula: 'Total Spend:=SUM(Invoice[Total Amount])',
        explanation:
          'A measure is evaluated when the PivotTable asks, inside whatever filters are active — it stores almost nothing. A calculated column stores a value for every row forever. Measures scale; calculated columns consume memory.',
      },
      {
        title: 'Row context and filter context',
        formula: 'Large Invoices:=SUMX(Invoice, IF(Invoice[Total Amount]>1000000, Invoice[Total Amount], 0))',
        explanation:
          'SUM aggregates a whole column; SUMX walks the table row by row, evaluating the expression for each row before aggregating — that per-row walk is row context. Filters applied by the PivotTable are filter context. Context is the idea that separates DAX from Excel formulas.',
      },
    ],
    datasetIds: [FULL, VENDORS],
    hints: [
      {
        id: 'm39-h1',
        concept: 'data-model',
        title: 'One side must be unique',
        body: 'Data → Relationships: vendors (lookup, unique Vendor ID) to register (many side). Every register row points at exactly one vendor — the uniqueness of the lookup column is what the relationship depends on.',
        xpCost: 10,
      },
      {
        id: 'm39-h2',
        concept: 'dax-basics',
        title: 'The measure inherits the filters',
        body: 'Total Spend:=SUM(Invoice[Total Amount]) — in an unfiltered Pivot it is the grand total; drop a Department slicer on and the same measure returns just that slice. That is filter context.',
        xpCost: 20,
      },
      {
        id: 'm39-h3',
        concept: 'pivot',
        title: 'Both tables, one PivotTable',
        body: 'Once related, drag fields from both tables into the same PivotTable — vendor category beside invoice totals, no VLOOKUP column in sight.',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm39-q1',
        type: 'mcq',
        prompt:
          'In a vendors-to-register relationship, how many invoices can one vendor have?',
        options: [
          { id: 'a', label: 'Many — it is a one-to-many relationship' },
          { id: 'b', label: 'Exactly one' },
          { id: 'c', label: 'None — models only allow one-to-one' },
          { id: 'd', label: 'Only rows that match by name, never by ID' },
        ],
        correctOptionId: 'a',
        explanation:
          'The vendors side is the unique lookup; the register is the many side where each key can repeat freely. That uniqueness requirement is exactly why you check Vendor ID for duplicates before relating.',
        incorrectFeedback:
          'Which side of the relationship must be unique, and how many fact rows may then point at each key?',
      },
      {
        id: 'm39-q2',
        type: 'mcq',
        prompt:
          'What is the main advantage of a measure over a calculated column?',
        options: [
          {
            id: 'a',
            label: 'It is calculated at query time and uses almost no stored memory',
          },
          { id: 'b', label: 'It can only be used inside PivotTables' },
          { id: 'c', label: 'It stores a value for every row of the table' },
          { id: 'd', label: 'It only works on text columns' },
        ],
        correctOptionId: 'a',
        explanation:
          'Measures exist as formulas, not data — the PivotTable evaluates them under its current filters. Calculated columns commit a value per row, which is fine occasionally and ruinous at scale.',
        incorrectFeedback:
          'Where does each option live — stored in every row, or computed only when the PivotTable asks?',
      },
      {
        id: 'm39-q3',
        type: 'numeric',
        prompt:
          'A Total Spend measure over the unfiltered full register (2,400 invoices) would return what value, rounded to the nearest naira?',
        answer: () =>
          Math.round(
            rows(FULL).reduce((sum, r) => sum + Number(r.total), 0),
          ),
        unit: 'naira',
        explanation:
          'A measure is a named aggregation: with no filters applied it equals the plain column total. Every filtered view of the same measure is just that total re-evaluated under different filters.',
        incorrectFeedback:
          'The measure sums the Total Amount column — add up the register\'s totals and round to the nearest naira.',
      },
      {
        id: 'm39-q4',
        type: 'mcq',
        prompt: 'How do SUM and SUMX differ?',
        options: [
          {
            id: 'a',
            label: 'SUM aggregates a column; SUMX evaluates an expression row by row, then aggregates',
          },
          { id: 'b', label: 'They are identical functions with two names' },
          { id: 'c', label: 'SUMX adds two separate columns together' },
          { id: 'd', label: 'SUM only works inside calculated columns' },
        ],
        correctOptionId: 'a',
        explanation:
          'SUMX walks the table in row context, evaluating its expression for each row before summing the results — which is how conditional or per-row calculations become possible at all.',
        incorrectFeedback:
          'Which function walks the table one row at a time with an expression you provide?',
      },
    ],
    completion: [
      'Data Model relationship built on Vendor ID',
      'Total Spend measure written',
      'Row and filter context explained',
      'All 4 questions answered correctly',
    ],
  },

  {
    id: 'm40',
    number: 40,
    levelId: 'L5',
    module: 'Automation',
    category: 'Excel Foundations',
    title: 'Macros and VBA Foundations',
    difficulty: 'Advanced',
    xp: 220,
    estMinutes: 25,
    summary:
      'Record your first macro, read the VBA it writes, hand-code the decisions the recorder cannot make, and handle macro security.',
    scenario: [
      'Every month the same six formatting and export steps are performed by hand — and every month someone forgets one, usually the step that matters.',
      'Adaeze wants the routine recorded, the generated code read and cleaned, and a hard rule: macros only run where they are trusted and only where they save real time.',
    ],
    objective:
      'Record a macro from the Developer tab, read and extend the VBA it produces, choose when hand-written code is required, and apply macro security defaults honestly.',
    tasks: [
      'Enable the Developer tab and record the formatting routine.',
      'Open the generated code in the VBA editor.',
      'Identify what needs hand-written code.',
      'Confirm the Trust Center macro settings.',
      'Submit your answers.',
    ],
    teaches: [
      {
        title: 'Record first, then read',
        explanation:
          'The Macro Recorder writes VBA as you click — the fastest route to learning the syntax and automating a linear task. Always read the code it produced: recorded macros carry dead lines you can delete.',
      },
      {
        title: 'When you must write code',
        explanation:
          'Decisions, loops and messages cannot be clicked into existence. If…Then, For Each…Next and MsgBox live in hand-written VBA inside the VBE — the recorder only captures keystrokes and mouse clicks.',
      },
      {
        title: 'Macro security is not optional',
        explanation:
          'A macro is a program running with your permissions. Files from others open with macros disabled and a notification bar; the safe default is "disable with notification", enabled per file you trust — never "enable all".',
      },
    ],
    datasetIds: [PR],
    hints: [
      {
        id: 'm40-h1',
        concept: 'record-macro',
        title: 'Developer → Record → act → Stop',
        body: 'Enable the Developer tab, Record Macro, perform the steps, Stop Recording. Then Developer → Macros → Edit to see exactly what Excel wrote for you.',
        xpCost: 10,
      },
      {
        id: 'm40-h2',
        concept: 'vba-basics',
        title: 'Sub, End Sub, F5',
        body: 'In the VBE a macro is Sub Name() … End Sub; F5 runs it. Objects like Range("A1") or ActiveSheet are what your code acts on — the recorder just translated your clicks into them.',
        xpCost: 20,
      },
      {
        id: 'm40-h3',
        concept: 'macro-security',
        title: 'Notification, not blanket trust',
        body: 'Trust Center → Macro Settings: "Disable all macros with notification" is the safe default. Enable content only for files you trust and expect — never switch to "Enable all".',
        xpCost: 40,
      },
    ],
    questions: [
      {
        id: 'm40-q1',
        type: 'mcq',
        prompt:
          'Excel shows no Record Macro button anywhere on the ribbon. What is the first step?',
        options: [
          {
            id: 'a',
            label: 'Enable the Developer tab in Ribbon customization',
          },
          { id: 'b', label: 'Save the workbook as .xlsm' },
          { id: 'c', label: 'Open the Trust Center and allow macros' },
          { id: 'd', label: 'Insert a module in the VBA editor' },
        ],
        correctOptionId: 'a',
        explanation:
          'The recorder lives on the Developer tab, which is hidden by default: File → Options → Customize Ribbon → check Developer. Saving as .xlsm stores the macro afterwards; it does not make the button appear.',
        incorrectFeedback:
          'Which ribbon setting has to be switched on before any recording tools exist?',
      },
      {
        id: 'm40-q2',
        type: 'mcq',
        prompt:
          'The recorder cannot capture a decision — "if the cell is blank, skip it". What do you use?',
        options: [
          { id: 'a', label: 'Hand-written VBA with If…Then in the module' },
          { id: 'b', label: 'A second recorded macro' },
          { id: 'c', label: 'A worksheet formula beside the data' },
          { id: 'd', label: 'Conditional formatting rules' },
        ],
        correctOptionId: 'a',
        explanation:
          'Control flow — conditionals, loops, message boxes — is written by hand in the VBE. The recorder only translates clicks and keystrokes, so anything requiring judgement never appears in a recording.',
        incorrectFeedback:
          'What feature lets the code make decisions that were never clicked through?',
      },
      {
        id: 'm40-q3',
        type: 'mcq',
        prompt:
          'A colleague emails a workbook with macros; Excel disables them behind a yellow security bar. What is the safe practice?',
        options: [
          {
            id: 'a',
            label: 'Enable content only if you trust the source and expect those macros',
          },
          { id: 'b', label: 'Click Enable Content so the file simply works' },
          {
            id: 'c',
            label: 'Turn on Enable All Macros permanently in Trust Center',
          },
          { id: 'd', label: 'Rename the file extension to .xlsx' },
        ],
        correctOptionId: 'a',
        explanation:
          'Macros run with your permissions, which is why the default disables them with notification. Trust is per file and per source; blanket enabling removes the only control standing between a downloaded file and your machine.',
        incorrectFeedback:
          'Which choice keeps the Trust Center default working for you instead of against you?',
      },
      {
        id: 'm40-q4',
        type: 'text',
        prompt:
          'Describe a task in this audit you would automate with a macro rather than a formula, and explain why a formula is not enough.',
        keywords: ['macro', 'formula', 'automate'],
        minWords: 25,
        explanation:
          'Strong answers name a multi-step routine — format, export, file, notify — that formulas cannot perform at all, and make the distinction: formulas calculate values inside cells, macros drive actions across the application.',
        incorrectFeedback:
          'Name a concrete multi-step task, and be explicit about what formulas simply cannot do (actions outside the cell, loops, saving files).',
      },
    ],
    completion: [
      'Macro recorded from the Developer tab',
      'Generated VBA read in the editor',
      'Trust Center settings confirmed',
      'All 4 questions answered correctly',
    ],
  },
]
