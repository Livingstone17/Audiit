import type { Rng } from '../lib/rng'
import { createRng } from '../lib/rng'
import {
  DEPARTMENTS,
  INACTIVE_VENDOR_ID,
  SITES,
  VENDORS,
  requiredApprover,
} from '../data/company'

export interface ColumnDef {
  key: string
  label: string
  numeric?: boolean
  width?: number
}

export interface DatasetSheet {
  name: string
  columns: ColumnDef[]
  rows: Record<string, string | number>[]
}

export interface BuiltDataset {
  id: string
  filename: string
  label: string
  description: string
  sheets: DatasetSheet[]
  recordCount: number
}

/* ------------------------------------------------------------------ */
/* Item catalogue                                                      */
/* ------------------------------------------------------------------ */

const ITEMS = [
  { name: 'Hot Rolled Steel Sheet', price: 148000 },
  { name: 'Galvanised Steel Coil', price: 176500 },
  { name: 'Aluminium Ingot', price: 245000 },
  { name: 'Industrial Epoxy Resin', price: 64000 },
  { name: 'Polypropylene Granules', price: 38500 },
  { name: 'Caustic Soda Flakes', price: 27400 },
  { name: 'Machine Gear Assembly', price: 420000 },
  { name: 'Hydraulic Pump Unit', price: 615000 },
  { name: 'Conveyor Belt 2m', price: 189000 },
  { name: 'Ball Bearing Set', price: 42500 },
  { name: 'Electric Motor 5kW', price: 520000 },
  { name: 'PLC Control Module', price: 735000 },
  { name: 'Corrugated Carton', price: 1450 },
  { name: 'Stretch Wrap Roll', price: 8900 },
  { name: 'Pallet Wooden Std', price: 12500 },
  { name: 'Adhesive Label Roll', price: 6200 },
  { name: 'Safety Helmet', price: 9800 },
  { name: 'Cut Resistant Gloves', price: 4200 },
  { name: 'Safety Boot Steel Toe', price: 23500 },
  { name: 'Hydraulic Oil 20L', price: 34800 },
  { name: 'Cutting Fluid 25L', price: 41200 },
  { name: 'Welding Rod 3.2mm', price: 17800 },
  { name: 'Industrial Degreaser', price: 22600 },
  { name: 'Compressor Filter', price: 58700 },
  { name: 'Diesel Fuel', price: 640 },
  { name: 'Office Paper A4', price: 5400 },
  { name: 'Printer Toner Cartridge', price: 48500 },
  { name: 'Forklift Battery 48V', price: 985000 },
  { name: 'Generator Spare Belt', price: 31700 },
  { name: 'Paint Thinner', price: 19300 },
  { name: 'Industrial Fuse 63A', price: 7600 },
  { name: 'Cable Tray 3m', price: 26400 },
  { name: 'Packaging Film 500mm', price: 11700 },
  { name: 'Steel Pallet Truck', price: 465000 },
  { name: 'Water Treatment Chemical', price: 88300 },
  { name: 'Fire Extinguisher 9kg', price: 32500 },
  { name: 'Office Chair Ergonomic', price: 145000 },
  { name: 'Air Conditioner 1.5HP', price: 385000 },
  { name: 'Bearing Grease 1kg', price: 8900 },
  { name: 'Steel Rivet Box', price: 15600 },
] as const

const APPROVER_RANK: Record<string, number> = {
  'Department Manager': 1,
  'Head of Procurement': 2,
  'Chief Financial Officer': 3,
  'Managing Director': 4,
}

export function approverRank(name: string): number {
  return APPROVER_RANK[name] ?? 0
}

/* ------------------------------------------------------------------ */
/* World generation                                                    */
/* ------------------------------------------------------------------ */

interface WorldConfig {
  seed: number
  invoiceCount: number
  poCount: number
  grnCoverage: number
  dupGroups: number
  dupCrossVendor: number
  noPoCount: number
  approvalViolations: number
  paidWithoutApproval: number
  splitPairs: number
  highPriceCount: number
  earlyPaymentCount: number
  duplicatePayments: number
}

const WORLD_CONFIGS: Record<string, WorldConfig> = {
  basic: {
    seed: 20250901,
    invoiceCount: 320,
    poCount: 140,
    grnCoverage: 0.85,
    dupGroups: 7,
    dupCrossVendor: 2,
    noPoCount: 16,
    approvalViolations: 9,
    paidWithoutApproval: 6,
    splitPairs: 4,
    highPriceCount: 8,
    earlyPaymentCount: 3,
    duplicatePayments: 3,
  },
  full: {
    seed: 20250915,
    invoiceCount: 2400,
    poCount: 900,
    grnCoverage: 0.86,
    dupGroups: 14,
    dupCrossVendor: 5,
    noPoCount: 64,
    approvalViolations: 23,
    paidWithoutApproval: 17,
    splitPairs: 9,
    highPriceCount: 26,
    earlyPaymentCount: 8,
    duplicatePayments: 7,
  },
  boss: {
    seed: 20250930,
    invoiceCount: 10500,
    poCount: 4300,
    grnCoverage: 0.88,
    dupGroups: 38,
    dupCrossVendor: 14,
    noPoCount: 268,
    approvalViolations: 64,
    paidWithoutApproval: 55,
    splitPairs: 24,
    highPriceCount: 90,
    earlyPaymentCount: 27,
    duplicatePayments: 21,
  },
}

export type WorldId = keyof typeof WORLD_CONFIGS

export interface InvoiceRow {
  invoiceNo: string
  invoiceDate: string
  vendorId: string
  vendorName: string
  poNumber: string
  department: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  approvalStatus: string
  approvedBy: string
  paymentStatus: string
}

export interface PoRow {
  poNumber: string
  poDate: string
  vendorId: string
  department: string
  poAmount: number
  approvalStatus: string
}

export interface GrnRow {
  grnNumber: string
  grnDate: string
  poNumber: string
  vendorId: string
  quantityReceived: number
  warehouse: string
}

export interface PaymentRow {
  paymentId: string
  paymentDate: string
  invoiceNo: string
  vendorId: string
  amountPaid: number
  bankAccount: string
  paymentStatus: string
}

export interface World {
  id: WorldId
  invoices: InvoiceRow[]
  pos: PoRow[]
  grns: GrnRow[]
  payments: PaymentRow[]
  /** invoice numbers deliberately duplicated (same vendor) */
  duplicateGroups: string[][]
  /** invoice numbers reused across two vendors */
  crossVendorDuplicates: string[]
  /** split-purchase invoice numbers (each in the 400k–500k band) */
  splitInvoices: string[]
  /** invoice numbers with unit price materially above the item's norm */
  highPriceInvoices: string[]
}

const SEP_DAYS = 30

function sepDate(rng: Rng): string {
  const day = rng.int(1, SEP_DAYS)
  return `2025-09-${String(day).padStart(2, '0')}`
}

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function buildVendorBanks(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const v of VENDORS) map[v.id] = v.account
  return map
}

const worldCache = new Map<string, World>()

export function getWorld(id: WorldId): World {
  const cached = worldCache.get(id)
  if (cached) return cached
  const world = generateWorld(WORLD_CONFIGS[id]!, id)
  worldCache.set(id, world)
  return world
}

function generateWorld(cfg: WorldConfig, id: WorldId): World {
  const rng = createRng(cfg.seed)
  const vendorBanks = buildVendorBanks()
  const activeVendors = VENDORS.filter((v) => v.id !== INACTIVE_VENDOR_ID)
  const world: World = {
    id,
    invoices: [],
    pos: [],
    grns: [],
    payments: [],
    duplicateGroups: [],
    crossVendorDuplicates: [],
    splitInvoices: [],
    highPriceInvoices: [],
  }

  /* ---------------- Purchase orders ---------------- */
  const pad = id === 'boss' ? 5 : 4
  for (let i = 0; i < cfg.poCount; i++) {
    const vendor = rng.pick(VENDORS)
    const poNumber = `PO-2025-${String(i + 1).padStart(pad, '0')}`
    const poAmount = Math.round(rng.float(250_000, 24_000_000, 0) / 1000) * 1000
    world.pos.push({
      poNumber,
      poDate: sepDate(rng),
      vendorId: vendor.id,
      department: rng.pick(DEPARTMENTS),
      poAmount,
      approvalStatus: rng.chance(0.94) ? 'Approved' : rng.chance(0.6) ? 'Pending' : 'Rejected',
    })
  }

  /* ---------------- Invoices ---------------- */
  const openPos = world.pos.map((p) => ({ ...p, remaining: p.poAmount }))
  const invoices: InvoiceRow[] = []
  let seq = 1
  const nextInvoiceNo = () => `INV-2025-${String(seq++).padStart(6, '0')}`

  const makeInvoice = (opts: { vendorId?: string; forceAmount?: number } = {}): InvoiceRow => {
    const vendor = opts.vendorId
      ? VENDORS.find((v) => v.id === opts.vendorId)!
      : rng.pick(cfg.seed % 7 === 0 ? activeVendors : VENDORS)
    const item = rng.pick(ITEMS)
    const jitter = 1 + rng.float(-0.02, 0.02, 4)
    const unitPrice = Math.round(item.price * jitter)
    const quantity = Math.max(1, Math.round(rng.float(1, Math.min(400, Math.max(2, 2_000_000 / item.price)), 0)))
    const total = opts.forceAmount ?? unitPrice * quantity

    let poNumber = ''
    if (!opts.forceAmount) {
      const eligible = openPos.filter((p) => p.vendorId === vendor.id && p.remaining >= total)
      const pool = eligible.length > 0 && rng.chance(0.86) ? eligible : []
      if (pool.length > 0) {
        const po = rng.pick(pool)
        poNumber = po.poNumber
        po.remaining -= total
      }
    }

    const department = rng.pick(DEPARTMENTS)
    const amountForApproval = total
    const required = requiredApprover(amountForApproval)
    const approvalStatus = rng.chance(0.9) ? 'Approved' : rng.chance(0.55) ? 'Pending' : 'Rejected'
    const approvedBy =
      approvalStatus === 'Approved'
        ? required
        : approvalStatus === 'Pending'
          ? ''
          : ''

    const paymentStatus =
      approvalStatus === 'Approved'
        ? rng.chance(0.72)
          ? 'Paid'
          : rng.chance(0.5)
            ? 'Partial'
            : 'Unpaid'
        : rng.chance(0.2)
          ? 'Paid'
          : 'Unpaid'

    return {
      invoiceNo: nextInvoiceNo(),
      invoiceDate: sepDate(rng),
      vendorId: vendor.id,
      vendorName: vendor.name,
      poNumber,
      department,
      item: item.name,
      quantity,
      unitPrice,
      total: Math.round(total),
      approvalStatus,
      approvedBy,
      paymentStatus,
    }
  }

  for (let i = 0; i < cfg.invoiceCount; i++) invoices.push(makeInvoice())

  /* Force the inactive vendor to have transacted (planted anomaly). */
  const inactiveForce = Math.max(3, Math.round(cfg.invoiceCount * 0.004))
  for (let i = 0; i < inactiveForce; i++) {
    const idx = Math.floor((i + 1) * (cfg.invoiceCount / (inactiveForce + 1)))
    invoices[idx % invoices.length]!.vendorId = INACTIVE_VENDOR_ID
    invoices[idx % invoices.length]!.vendorName =
      VENDORS.find((v) => v.id === INACTIVE_VENDOR_ID)!.name
    invoices[idx % invoices.length]!.paymentStatus = 'Paid'
    invoices[idx % invoices.length]!.approvalStatus = 'Approved'
    invoices[idx % invoices.length]!.approvedBy = requiredApprover(
      invoices[idx % invoices.length]!.total,
    )
  }

  /* Planted: duplicate invoice numbers, same vendor & amount. */
  for (let g = 0; g < cfg.dupGroups; g++) {
    const base = invoices[Math.floor((g + 1) * (cfg.invoiceCount / (cfg.dupGroups + 1)))!]
    if (!base) continue
    const dupTarget = invoices[(invoices.indexOf(base) + 1) % invoices.length]!
    const dupNo = base.invoiceNo
    const twinNo = dupTarget.invoiceNo
    dupTarget.invoiceNo = dupNo
    dupTarget.vendorId = base.vendorId
    dupTarget.vendorName = base.vendorName
    dupTarget.total = base.total
    dupTarget.quantity = base.quantity
    dupTarget.unitPrice = base.unitPrice
    dupTarget.item = base.item
    world.duplicateGroups.push([dupNo, twinNo])
  }

  /* Planted: same invoice number across two different vendors. */
  for (let g = 0; g < cfg.dupCrossVendor; g++) {
    const a = invoices[Math.floor((g + 0.5) * (cfg.invoiceCount / (cfg.dupCrossVendor + 1)))!]
    if (!a) continue
    const otherVendor = VENDORS.find(
      (v) => v.id !== a.vendorId && v.category !== a.vendorName,
    )!
    const b = invoices[(invoices.indexOf(a) + Math.ceil(cfg.invoiceCount / (cfg.dupCrossVendor * 2))) % invoices.length]!
    if (b === a) continue
    b.invoiceNo = a.invoiceNo
    b.vendorId = otherVendor.id
    b.vendorName = otherVendor.name
    b.total = a.total
    world.crossVendorDuplicates.push(a.invoiceNo)
  }

  /* Planted: invoices with no purchase order. */
  for (let i = 0; i < cfg.noPoCount; i++) {
    const inv = invoices[Math.floor((i + 1) * (cfg.invoiceCount / (cfg.noPoCount + 1)))!]
    if (inv) inv.poNumber = ''
  }

  /* Planted: approved below required authority (approval violation). */
  for (let i = 0; i < cfg.approvalViolations; i++) {
    const inv = invoices[Math.floor((i + 0.7) * (cfg.invoiceCount / (cfg.approvalViolations + 1)))!]
    if (!inv) continue
    inv.approvalStatus = 'Approved'
    inv.approvedBy = 'Department Manager'
    if (inv.total <= 500_000) {
      // Push the amount above the manager's limit while staying realistic.
      const qtyNeeded = Math.ceil(520_000 / inv.unitPrice)
      inv.quantity = qtyNeeded
      inv.total = Math.round(inv.unitPrice * qtyNeeded)
    }
  }

  /* Planted: paid while not approved. */
  for (let i = 0; i < cfg.paidWithoutApproval; i++) {
    const inv = invoices[Math.floor((i + 1.3) * (cfg.invoiceCount / (cfg.paidWithoutApproval + 1)))!]
    if (!inv) continue
    inv.approvalStatus = 'Pending'
    inv.approvedBy = ''
    inv.paymentStatus = 'Paid'
  }

  /* Planted: split purchases — invoices in the 400k–500k band, same vendor & day. */
  const splitVendor = VENDORS[3]!
  for (let p = 0; p < cfg.splitPairs; p++) {
    const i1 = Math.floor((p + 1) * (cfg.invoiceCount / (cfg.splitPairs + 1)))
    const i2 = Math.min(i1 + 1, cfg.invoiceCount - 1)
    const day = sepDate(rng)
    const a = invoices[i1]!
    const b = invoices[i2]!
    const price = a.unitPrice || 100_000
    a.vendorId = splitVendor.id
    a.vendorName = splitVendor.name
    a.invoiceDate = day
    a.quantity = Math.max(1, Math.floor(460_000 / price))
    a.total = Math.round(a.quantity * price)
    if (a.total >= 500_000) {
      a.quantity = Math.max(1, a.quantity - 1)
      a.total = Math.round(a.quantity * price)
    }
    if (a.total < 400_000) {
      a.quantity = Math.ceil(430_000 / price)
      a.total = Math.round(a.quantity * price)
    }
    a.approvalStatus = 'Approved'
    a.approvedBy = 'Department Manager'
    a.paymentStatus = 'Paid'

    const price2 = b.unitPrice || 100_000
    b.vendorId = splitVendor.id
    b.vendorName = splitVendor.name
    b.invoiceDate = day
    b.quantity = Math.max(1, Math.floor(470_000 / price2))
    b.total = Math.round(b.quantity * price2)
    if (b.total >= 500_000) {
      b.quantity = Math.max(1, b.quantity - 1)
      b.total = Math.round(b.quantity * price2)
    }
    if (b.total < 400_000) {
      b.quantity = Math.ceil(440_000 / price2)
      b.total = Math.round(b.quantity * price2)
    }
    b.approvalStatus = 'Approved'
    b.approvedBy = 'Department Manager'
    b.paymentStatus = 'Paid'
    world.splitInvoices.push(a.invoiceNo, b.invoiceNo)
  }

  /* Planted: unit price materially above the item's normal price. */
  for (let i = 0; i < cfg.highPriceCount; i++) {
    const inv = invoices[Math.floor((i + 0.3) * (cfg.invoiceCount / (cfg.highPriceCount + 1)))]
    if (!inv) continue
    const base = ITEMS.find((it) => it.name === inv.item)?.price ?? inv.unitPrice
    inv.unitPrice = Math.round(base * (1 + rng.float(0.18, 0.55, 4)))
    inv.total = Math.round(inv.unitPrice * inv.quantity)
    world.highPriceInvoices.push(inv.invoiceNo)
  }

  world.invoices = invoices

  /* ---------------- GRNs ---------------- */
  let grnSeq = 1
  for (const po of world.pos) {
    if (!rng.chance(cfg.grnCoverage)) continue
    world.grns.push({
      grnNumber: `GRN-2025-${String(grnSeq++).padStart(5, '0')}`,
      grnDate: addDays(po.poDate, rng.int(2, 18)),
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      quantityReceived: rng.int(10, 900),
      warehouse: rng.pick(SITES.slice(1)),
    })
  }

  /* ---------------- Payments ---------------- */
  const vendorAccounts = vendorBanks
  let paySeq = 1
  const paidInvoices = invoices.filter((inv) => inv.paymentStatus !== 'Unpaid')
  for (const inv of paidInvoices) {
    const paidInFull = inv.paymentStatus === 'Paid'
    world.payments.push({
      paymentId: `PMT-2025-${String(paySeq++).padStart(5, '0')}`,
      paymentDate: addDays(inv.invoiceDate, rng.int(6, 28)),
      invoiceNo: inv.invoiceNo,
      vendorId: inv.vendorId,
      amountPaid: paidInFull ? inv.total : Math.round(inv.total * 0.5),
      bankAccount: vendorAccounts[inv.vendorId] ?? '0000000000',
      paymentStatus: 'Completed',
    })
  }

  /* Planted: payments dated before the invoice. */
  for (let i = 0; i < cfg.earlyPaymentCount; i++) {
    const idx = Math.floor((i + 1) * (world.payments.length / (cfg.earlyPaymentCount + 1)))
    const pmt = world.payments[idx]
    const inv = invoices.find((x) => x.invoiceNo === pmt?.invoiceNo)
    if (pmt && inv) pmt.paymentDate = addDays(inv.invoiceDate, -rng.int(1, 6))
  }

  /* Planted: duplicate payments for the same invoice. */
  for (let i = 0; i < cfg.duplicatePayments; i++) {
    const idx = Math.floor((i + 1) * (world.payments.length / (cfg.duplicatePayments + 1)))
    const pmt = world.payments[idx]
    if (!pmt) continue
    world.payments.push({
      ...pmt,
      paymentId: `PMT-2025-${String(paySeq++).padStart(5, '0')}`,
      paymentDate: addDays(pmt.paymentDate, rng.int(1, 4)),
    })
  }

  return world
}

/* ------------------------------------------------------------------ */
/* Dataset builders                                                    */
/* ------------------------------------------------------------------ */

export function purchaseRegisterSheet(world: World): DatasetSheet {
  return {
    name: 'Purchase Register',
    columns: [
      { key: 'invoiceNo', label: 'Invoice Number', width: 18 },
      { key: 'invoiceDate', label: 'Invoice Date', width: 13 },
      { key: 'vendorId', label: 'Vendor ID', width: 11 },
      { key: 'vendorName', label: 'Vendor Name', width: 30 },
      { key: 'poNumber', label: 'PO Number', width: 16 },
      { key: 'department', label: 'Department', width: 17 },
      { key: 'item', label: 'Item Description', width: 28 },
      { key: 'quantity', label: 'Quantity', numeric: true, width: 10 },
      { key: 'unitPrice', label: 'Unit Price', numeric: true, width: 13 },
      { key: 'total', label: 'Total Amount', numeric: true, width: 15 },
      { key: 'approvalStatus', label: 'Approval Status', width: 16 },
      { key: 'approvedBy', label: 'Approved By', width: 22 },
      { key: 'paymentStatus', label: 'Payment Status', width: 15 },
    ],
    rows: world.invoices as unknown as Record<string, string | number>[],
  }
}
