import {
  VENDORS,
  INACTIVE_VENDOR_ID,
  APPROVAL_MATRIX,
} from '../data/company'
import { createRng } from '../lib/rng'
import {
  approverRank,
  getWorld,
  purchaseRegisterSheet,
  type BuiltDataset,
  type DatasetSheet,
  type World,
  type WorldId,
} from './generators'

/* ------------------------------------------------------------------ */
/* Builders                                                            */
/* ------------------------------------------------------------------ */

function build(
  id: string,
  filename: string,
  label: string,
  description: string,
  sheets: DatasetSheet[],
): BuiltDataset {
  return {
    id,
    filename,
    label,
    description,
    sheets,
    recordCount: sheets.reduce((n, s) => n + s.rows.length, 0),
  }
}

const BUILDERS: Record<string, () => BuiltDataset> = {
  // ---- Purchase registers (one per world size) ----
  'pr-basic': () => {
    const w = getWorld('basic')
    return build(
      'pr-basic',
      'purchase_register.xlsx',
      'Purchase Register (September)',
      'AP purchase register for September 2025 — 320 records. The starting dataset for Excel foundations.',
      [purchaseRegisterSheet(w)],
    )
  },
  'pr-full': () => {
    const w = getWorld('full')
    return build(
      'pr-full',
      'purchase_register_sep.xlsx',
      'Purchase Register (Full Population)',
      'Complete September 2025 procurement population — 2,400 invoices across all sites.',
      [purchaseRegisterSheet(w)],
    )
  },
  'pr-boss': () => {
    const w = getWorld('boss')
    return build(
      'pr-boss',
      'purchase_transactions_10k.xlsx',
      'Procurement Population (10,000+ records)',
      'The full September 2025 procurement transaction population for the final audit case.',
      [purchaseRegisterSheet(w)],
    )
  },

  // ---- Invoice extract (lookup practice) ----
  'invoice-extract': () => {
    const w = getWorld('basic')
    const rows = w.invoices.slice(0, 200).map((inv) => ({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate,
      vendorId: inv.vendorId,
      department: inv.department,
      total: inv.total,
    }))
    return build(
      'invoice-extract',
      'invoice_extract.xlsx',
      'Invoice Extract',
      'Invoice extract without vendor names — practise looking them up from the vendor master.',
      [
        {
          name: 'Invoices',
          columns: [
            { key: 'invoiceNo', label: 'Invoice Number', width: 18 },
            { key: 'invoiceDate', label: 'Invoice Date', width: 13 },
            { key: 'vendorId', label: 'Vendor ID', width: 11 },
            { key: 'department', label: 'Department', width: 17 },
            { key: 'total', label: 'Total Amount', numeric: true, width: 15 },
          ],
          rows: rows as unknown as Record<string, string | number>[],
        },
      ],
    )
  },

  // ---- Vendor master ----
  'vendor-master': () =>
    build(
      'vendor-master',
      'vendor_master.xlsx',
      'Vendor Master',
      'Approved vendor master file for Apex Manufacturing Group.',
      [
        {
          name: 'Vendors',
          columns: [
            { key: 'id', label: 'Vendor ID', width: 11 },
            { key: 'name', label: 'Vendor Name', width: 30 },
            { key: 'category', label: 'Vendor Category', width: 18 },
            { key: 'bank', label: 'Bank', width: 15 },
            { key: 'account', label: 'Bank Account', width: 15 },
            { key: 'taxId', label: 'Tax ID', width: 14 },
            { key: 'status', label: 'Vendor Status', width: 14 },
            { key: 'regDate', label: 'Registration Date', width: 16 },
          ],
          rows: VENDORS as unknown as Record<string, string | number>[],
        },
      ],
    ),

  // ---- PO register ----
  'po-register': () => poDataset('full'),
  'po-register-boss': () => poDataset('boss'),

  // ---- GRN register ----
  'grn-register': () => grnDataset('full'),
  'grn-register-boss': () => grnDataset('boss'),

  // ---- Payment register ----
  'payment-register': () => paymentDataset('full'),
  'payment-register-boss': () => paymentDataset('boss'),

  // ---- Approval matrix ----
  'approval-matrix': () => {
    const rows: Record<string, string | number>[] = []
    for (const { department, rules } of APPROVAL_MATRIX) {
      for (const r of rules) {
        rows.push({
          department,
          min: r.min,
          max: r.max,
          approver: r.approver,
        })
      }
    }
    return build(
      'approval-matrix',
      'approval_matrix.xlsx',
      'Approval Matrix',
      'Delegated authority limits by amount band (Naira).',
      [
        {
          name: 'Approval Matrix',
          columns: [
            { key: 'department', label: 'Department', width: 20 },
            { key: 'min', label: 'Minimum Amount', numeric: true, width: 18 },
            { key: 'max', label: 'Maximum Amount', numeric: true, width: 18 },
            { key: 'approver', label: 'Required Approver', width: 26 },
          ],
          rows,
        },
      ],
    )
  },

  // ---- Petty cash (IF statements) ----
  'petty-cash-log': () => {
    const rng = createRng(910_244)
    const rows: Record<string, string | number>[] = []
    const descriptions = [
      'Cleaning supplies',
      'Staff transport reimbursement',
      'Courier service',
      'Office refreshments',
      'Plant security supplies',
      'Maintenance spares (minor)',
      'First aid restock',
      'Print cartridges',
      'Waste disposal fee',
      'Driver fuel reimbursement',
    ]
    for (let i = 1; i <= 150; i++) {
      const day = rng.int(1, 30)
      const amount =
        i % 17 === 0
          ? rng.float(52_000, 145_000, 2)
          : rng.float(1_500, 48_000, 2)
      rows.push({
        date: `2025-09-${String(day).padStart(2, '0')}`,
        voucher: `PC-09-${String(i).padStart(4, '0')}`,
        department: rng.pick([
          'Production',
          'Warehouse',
          'Maintenance',
          'Sales',
          'Human Resources',
          'Procurement',
        ]),
        description: rng.pick(descriptions),
        amount,
        requestedBy: rng.pick([
          'J. Adeyemi',
          'K. Musa',
          'B. Eze',
          'F. Bello',
          'C. Nwosu',
          'S. Danjuma',
        ]),
        approvedBy: amount > 50_000 ? 'Department Manager' : 'Supervisor',
      })
    }
    return build(
      'petty-cash-log',
      'petty_cash_log.xlsx',
      'Petty Cash Log',
      'September petty cash vouchers — 150 records for IF function practice.',
      [
        {
          name: 'Petty Cash',
          columns: [
            { key: 'date', label: 'Date', width: 12 },
            { key: 'voucher', label: 'Voucher No', width: 13 },
            { key: 'department', label: 'Department', width: 17 },
            { key: 'description', label: 'Description', width: 26 },
            { key: 'amount', label: 'Amount (₦)', numeric: true, width: 14 },
            { key: 'requestedBy', label: 'Requested By', width: 16 },
            { key: 'approvedBy', label: 'Approved By', width: 20 },
          ],
          rows,
        },
      ],
    )
  },

  // ---- Warehouse issues (Excel tables practice) ----
  'warehouse-issues': () => {
    const rng = createRng(331_907)
    const rows: Record<string, string | number>[] = []
    const purposes = [
      'Production line 1',
      'Production line 2',
      'Machine servicing',
      'Office use',
      'Safety compliance',
      'Packaging run',
    ]
    for (let i = 1; i <= 180; i++) {
      const qty = rng.int(1, 120)
      const cost = rng.float(1_200, 96_000, 2)
      rows.push({
        date: `2025-09-${String(rng.int(1, 30)).padStart(2, '0')}`,
        issueNo: `ISS-09-${String(i).padStart(4, '0')}`,
        item: rng.pick([
          'Hydraulic Oil 20L',
          'Cutting Fluid 25L',
          'Welding Rod 3.2mm',
          'Safety Helmet',
          'Cut Resistant Gloves',
          'Industrial Fuse 63A',
          'Bearing Grease 1kg',
          'Steel Rivet Box',
        ]),
        quantity: qty,
        unitCost: cost,
        total: Math.round(qty * cost),
        warehouse: rng.pick(['Ibadan Warehouse', 'Port Harcourt Distribution Centre']),
        issuedTo: rng.pick(['M. Obi', 'A. Bello', 'T. Okafor', 'R. Adeleke', 'P. Umeh']),
        purpose: rng.pick(purposes),
      })
    }
    return build(
      'warehouse-issues',
      'warehouse_issues.xlsx',
      'Warehouse Material Issues',
      'Material issue slips for September — 180 rows for table practice.',
      [
        {
          name: 'Issues',
          columns: [
            { key: 'date', label: 'Date', width: 12 },
            { key: 'issueNo', label: 'Issue No', width: 13 },
            { key: 'item', label: 'Item', width: 24 },
            { key: 'quantity', label: 'Quantity', numeric: true, width: 10 },
            { key: 'unitCost', label: 'Unit Cost', numeric: true, width: 13 },
            { key: 'total', label: 'Total Cost', numeric: true, width: 14 },
            { key: 'warehouse', label: 'Warehouse', width: 28 },
            { key: 'issuedTo', label: 'Issued To', width: 13 },
            { key: 'purpose', label: 'Purpose', width: 18 },
          ],
          rows,
        },
      ],
    )
  },
}

function poDataset(worldId: WorldId): BuiltDataset {
  const w = getWorld(worldId)
  const id = worldId === 'boss' ? 'po-register-boss' : 'po-register'
  const filename = worldId === 'boss' ? 'po_register_sep_10k.xlsx' : 'po_register_sep.xlsx'
  return build(
    id,
    filename,
    'Purchase Order Register',
    'All purchase orders raised during September 2025.',
    [
      {
        name: 'POs',
        columns: [
          { key: 'poNumber', label: 'PO Number', width: 17 },
          { key: 'poDate', label: 'PO Date', width: 13 },
          { key: 'vendorId', label: 'Vendor ID', width: 11 },
          { key: 'department', label: 'Department', width: 17 },
          { key: 'poAmount', label: 'PO Amount', numeric: true, width: 15 },
          { key: 'approvalStatus', label: 'Approval Status', width: 16 },
        ],
        rows: w.pos as unknown as Record<string, string | number>[],
      },
    ],
  )
}

function grnDataset(worldId: WorldId): BuiltDataset {
  const w = getWorld(worldId)
  const id = worldId === 'boss' ? 'grn-register-boss' : 'grn-register'
  const filename = worldId === 'boss' ? 'grn_register_sep_10k.xlsx' : 'grn_register_sep.xlsx'
  return build(
    id,
    filename,
    'Goods Received Notes',
    'Goods received notes raised against purchase orders in September 2025.',
    [
      {
        name: 'GRNs',
        columns: [
          { key: 'grnNumber', label: 'GRN Number', width: 16 },
          { key: 'grnDate', label: 'GRN Date', width: 13 },
          { key: 'poNumber', label: 'PO Number', width: 17 },
          { key: 'vendorId', label: 'Vendor ID', width: 11 },
          { key: 'quantityReceived', label: 'Quantity Received', numeric: true, width: 17 },
          { key: 'warehouse', label: 'Warehouse', width: 30 },
        ],
        rows: w.grns as unknown as Record<string, string | number>[],
      },
    ],
  )
}

function paymentDataset(worldId: WorldId): BuiltDataset {
  const w = getWorld(worldId)
  const id = worldId === 'boss' ? 'payment-register-boss' : 'payment-register'
  const filename = worldId === 'boss' ? 'payment_register_sep_10k.xlsx' : 'payment_register_sep.xlsx'
  return build(
    id,
    filename,
    'Payment Register',
    'Supplier payments released during September 2025.',
    [
      {
        name: 'Payments',
        columns: [
          { key: 'paymentId', label: 'Payment ID', width: 17 },
          { key: 'paymentDate', label: 'Payment Date', width: 14 },
          { key: 'invoiceNo', label: 'Invoice Number', width: 18 },
          { key: 'vendorId', label: 'Vendor ID', width: 11 },
          { key: 'amountPaid', label: 'Amount Paid', numeric: true, width: 15 },
          { key: 'bankAccount', label: 'Bank Account', width: 15 },
          { key: 'paymentStatus', label: 'Payment Status', width: 15 },
        ],
        rows: w.payments as unknown as Record<string, string | number>[],
      },
    ],
  )
}

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

const cache = new Map<string, BuiltDataset>()

export function getDataset(id: string): BuiltDataset {
  const hit = cache.get(id)
  if (hit) return hit
  const builder = BUILDERS[id]
  if (!builder) throw new Error(`Unknown dataset: ${id}`)
  const built = builder()
  cache.set(id, built)
  return built
}

export function hasDataset(id: string): boolean {
  return id in BUILDERS
}

export const DATASET_IDS = Object.keys(BUILDERS)

export function getWorldFor(datasetId: string): World {
  if (datasetId === 'pr-basic') return getWorld('basic')
  if (datasetId === 'pr-full') return getWorld('full')
  if (datasetId === 'pr-boss') return getWorld('boss')
  if (datasetId === 'po-register' || datasetId === 'grn-register' || datasetId === 'payment-register')
    return getWorld('full')
  if (
    datasetId === 'po-register-boss' ||
    datasetId === 'grn-register-boss' ||
    datasetId === 'payment-register-boss'
  )
    return getWorld('boss')
  throw new Error(`Dataset ${datasetId} has no world`)
}

/* ------------------------------------------------------------------ */
/* Audit analysis — the answers are computed the same way a learner    */
/* would compute them in Excel (deterministic datasets → stable marks). */
/* ------------------------------------------------------------------ */

export function rows(datasetId: string): Record<string, string | number>[] {
  return getDataset(datasetId).sheets[0]!.rows
}

export function countRows(datasetId: string): number {
  return rows(datasetId).length
}

/** Invoice numbers that appear more than once. */
export function duplicateInvoiceNumbers(datasetId: string): string[] {
  const counts = new Map<string, number>()
  for (const r of rows(datasetId)) {
    const no = String(r.invoiceNo)
    counts.set(no, (counts.get(no) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([no]) => no).sort()
}

/** Total records that carry a duplicated invoice number. */
export function duplicateRecordCount(datasetId: string): number {
  const dupes = new Set(duplicateInvoiceNumbers(datasetId))
  return rows(datasetId).filter((r) => dupes.has(String(r.invoiceNo))).length
}

/** Invoice numbers used by more than one vendor. */
export function crossVendorDuplicates(datasetId: string): string[] {
  const map = new Map<string, Set<string>>()
  for (const r of rows(datasetId)) {
    const no = String(r.invoiceNo)
    if (!map.has(no)) map.set(no, new Set())
    map.get(no)!.add(String(r.vendorId))
  }
  return [...map.entries()].filter(([, s]) => s.size > 1).map(([no]) => no).sort()
}

export function invoicesWithoutPo(datasetId: string): string[] {
  return rows(datasetId)
    .filter((r) => !String(r.poNumber).trim())
    .map((r) => String(r.invoiceNo))
}

/** Approved by someone below the required authority for the amount. */
export function approvalViolations(datasetId: string): string[] {
  return rows(datasetId)
    .filter((r) => {
      if (r.approvalStatus !== 'Approved' || !r.approvedBy) return false
      const required = requiredApproverFor(Number(r.total))
      return approverRank(String(r.approvedBy)) < approverRank(required)
    })
    .map((r) => String(r.invoiceNo))
    .sort()
}

function requiredApproverFor(amount: number): string {
  if (amount <= 500_000) return 'Department Manager'
  if (amount <= 5_000_000) return 'Head of Procurement'
  if (amount <= 25_000_000) return 'Chief Financial Officer'
  return 'Managing Director'
}

/** Paid even though the invoice is not approved. */
export function paidWithoutApproval(datasetId: string): string[] {
  return rows(datasetId)
    .filter((r) => r.paymentStatus === 'Paid' && r.approvalStatus !== 'Approved')
    .map((r) => String(r.invoiceNo))
    .sort()
}

/** Invoices whose PO has no goods received note. */
export function invoicesWithoutGrn(datasetId: string): string[] {
  const world = getWorldFor(datasetId)
  const received = new Set(world.grns.map((g) => g.poNumber))
  return rows(datasetId)
    .filter((r) => String(r.poNumber).trim() && !received.has(String(r.poNumber)))
    .map((r) => String(r.invoiceNo))
    .sort()
}

/** POs with no invoice against them. */
export function poWithoutInvoice(poDatasetId: string, invoiceDatasetId: string): string[] {
  const world = getWorldFor(poDatasetId)
  const invoiced = new Set(
    rows(invoiceDatasetId)
      .map((r) => String(r.poNumber))
      .filter(Boolean),
  )
  return world.pos.filter((p) => !invoiced.has(p.poNumber)).map((p) => p.poNumber)
}

/** Invoices billed by inactive vendors. */
export function inactiveVendorInvoices(datasetId: string): string[] {
  return rows(datasetId)
    .filter((r) => String(r.vendorId) === INACTIVE_VENDOR_ID)
    .map((r) => String(r.invoiceNo))
    .sort()
}

/** Unit prices materially (≥15%) above the item's own median price. */
export function highPriceInvoices(datasetId: string): string[] {
  const all = rows(datasetId)
  const byItem = new Map<string, number[]>()
  for (const r of all) {
    const item = String(r.item)
    if (!byItem.has(item)) byItem.set(item, [])
    byItem.get(item)!.push(Number(r.unitPrice))
  }
  const medians = new Map<string, number>()
  for (const [item, prices] of byItem) {
    const sorted = [...prices].sort((a, b) => a - b)
    medians.set(item, sorted[Math.floor(sorted.length / 2)]!)
  }
  return all
    .filter((r) => Number(r.unitPrice) > medians.get(String(r.item))! * 1.15)
    .map((r) => String(r.invoiceNo))
    .sort()
}

/** Split purchases: 2+ invoices, same vendor & day, each ₦400k–₦499,999. */
export function splitPurchases(datasetId: string): string[][] {
  const groups = new Map<string, Record<string, string | number>[]>()
  for (const r of rows(datasetId)) {
    const total = Number(r.total)
    if (total < 400_000 || total >= 500_000) continue
    const key = `${r.vendorId}|${r.invoiceDate}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return [...groups.values()]
    .filter((g) => g.length >= 2)
    .map((g) => g.map((r) => String(r.invoiceNo)))
}

/** Invoices paid more than once. */
export function duplicatePayments(datasetId: string): string[] {
  const counts = new Map<string, number>()
  for (const r of rows(datasetId)) {
    const no = String(r.invoiceNo)
    counts.set(no, (counts.get(no) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([no]) => no).sort()
}

/** Payments made to vendors whose status is not Active. */
export function paymentsToInactiveVendors(paymentDatasetId: string): string[] {
  const status = new Map(VENDORS.map((v) => [v.id, v.status]))
  return rows(paymentDatasetId)
    .filter((r) => status.get(String(r.vendorId)) !== 'Active')
    .map((r) => String(r.paymentId))
    .sort()
}

/** Payments dated before their invoice. */
export function earlyPayments(paymentDatasetId: string, invoiceDatasetId: string): string[] {
  const invoiceDate = new Map(
    rows(invoiceDatasetId).map((r) => [String(r.invoiceNo), String(r.invoiceDate)]),
  )
  return rows(paymentDatasetId)
    .filter((r) => {
      const inv = invoiceDate.get(String(r.invoiceNo))
      return inv !== undefined && String(r.paymentDate) < inv
    })
    .map((r) => String(r.paymentId))
    .sort()
}

export function totalSpend(datasetId: string): number {
  return rows(datasetId).reduce((sum, r) => sum + Number(r.total), 0)
}

export function spendByVendor(datasetId: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rows(datasetId)) {
    const key = `${r.vendorId} · ${r.vendorName}`
    map.set(key, (map.get(key) ?? 0) + Number(r.total))
  }
  return map
}

export function topVendor(datasetId: string): { vendor: string; spend: number } {
  let best = { vendor: '', spend: -Infinity }
  for (const [vendor, spend] of spendByVendor(datasetId)) {
    if (spend > best.spend) best = { vendor, spend }
  }
  return best
}

export function spendByDepartment(datasetId: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const r of rows(datasetId)) {
    map.set(String(r.department), (map.get(String(r.department)) ?? 0) + Number(r.total))
  }
  return map
}

export function topDepartment(datasetId: string): { department: string; spend: number } {
  let best = { department: '', spend: -Infinity }
  for (const [department, spend] of spendByDepartment(datasetId)) {
    if (spend > best.spend) best = { department, spend }
  }
  return best
}

export function departmentCount(datasetId: string, department: string): number {
  return rows(datasetId).filter((r) => r.department === department).length
}

/**
 * Count invoices strictly unpaid above a value threshold.
 *
 * Matches the Excel filter learners are told to apply: Payment Status = "Unpaid"
 * AND Total > threshold. "Partial" payments are excluded — they are not unpaid.
 */
export function unpaidAbove(datasetId: string, threshold: number): number {
  return rows(datasetId).filter(
    (r) => r.paymentStatus === 'Unpaid' && Number(r.total) > threshold,
  ).length
}

export function countPaid(datasetId: string): number {
  return rows(datasetId).filter((r) => r.paymentStatus === 'Paid').length
}

export function sumByApprovalStatus(datasetId: string, status: string): number {
  return rows(datasetId)
    .filter((r) => r.approvalStatus === status)
    .reduce((s, r) => s + Number(r.total), 0)
}

/** Vendor IDs that share a bank account with another vendor. */
export function vendorsSharingBank(): string[][] {
  const byAccount = new Map<string, Set<string>>()
  for (const v of VENDORS) {
    if (!byAccount.has(v.account)) byAccount.set(v.account, new Set())
    byAccount.get(v.account)!.add(v.id)
  }
  return [...byAccount.values()].filter((s) => s.size > 1).map((s) => [...s])
}
