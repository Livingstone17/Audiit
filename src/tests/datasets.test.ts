import { describe, expect, it } from 'vitest'
import {
  approvalViolations,
  countRows,
  crossVendorDuplicates,
  duplicateInvoiceNumbers,
  duplicatePayments,
  duplicateRecordCount,
  earlyPayments,
  getDataset,
  highPriceInvoices,
  inactiveVendorInvoices,
  invoicesWithoutGrn,
  invoicesWithoutPo,
  paidWithoutApproval,
  poWithoutInvoice,
  splitPurchases,
  topDepartment,
  topVendor,
  totalSpend,
  vendorsSharingBank,
} from '../datasets/registry'

describe('dataset engine', () => {
  it('generates registers at the documented sizes', () => {
    expect(countRows('pr-basic')).toBe(320)
    expect(countRows('pr-full')).toBe(2400)
    expect(countRows('pr-boss')).toBe(10500)
    expect(getDataset('vendor-master').recordCount).toBe(28)
    expect(getDataset('petty-cash-log').recordCount).toBe(150)
    expect(getDataset('warehouse-issues').recordCount).toBe(180)
  })

  it('exposes Invoice Number as the first column (column A semantics)', () => {
    const sheet = getDataset('pr-basic').sheets[0]!
    expect(sheet.columns[0]!.key).toBe('invoiceNo')
    expect(sheet.columns[0]!.label).toBe('Invoice Number')
  })

  it('plants every anomaly category the missions test for', () => {
    expect(duplicateInvoiceNumbers('pr-basic').length).toBeGreaterThan(0)
    expect(duplicateRecordCount('pr-basic')).toBeGreaterThan(0)
    expect(crossVendorDuplicates('pr-full').length).toBeGreaterThan(0)
    expect(invoicesWithoutPo('pr-full').length).toBeGreaterThan(0)
    expect(approvalViolations('pr-full').length).toBeGreaterThan(0)
    expect(paidWithoutApproval('pr-full').length).toBeGreaterThan(0)
    expect(splitPurchases('pr-full').length).toBeGreaterThan(0)
    expect(highPriceInvoices('pr-full').length).toBeGreaterThan(0)
    expect(invoicesWithoutGrn('pr-full').length).toBeGreaterThan(0)
    expect(poWithoutInvoice('po-register', 'pr-full').length).toBeGreaterThan(0)
    expect(duplicatePayments('payment-register').length).toBeGreaterThan(0)
    expect(earlyPayments('payment-register', 'pr-full').length).toBeGreaterThan(0)
    expect(inactiveVendorInvoices('pr-full').length).toBeGreaterThan(0)
  })

  it('keeps V-1002 and V-1028 on one bank account', () => {
    const shared = vendorsSharingBank()
    expect(shared.length).toBeGreaterThan(0)
    const pair = shared.find((ids) => ids.includes('V-1002') && ids.includes('V-1028'))
    expect(pair).toBeTruthy()
  })

  it('is deterministic across calls (stable expected answers)', () => {
    const a = duplicateInvoiceNumbers('pr-full')
    const b = duplicateInvoiceNumbers('pr-full')
    expect(a).toEqual(b)
    expect(totalSpend('pr-full')).toBe(totalSpend('pr-full'))
    expect(topVendor('pr-full')).toEqual(topVendor('pr-full'))
    expect(topDepartment('pr-basic')).toEqual(topDepartment('pr-basic'))
  })

  it('boss population carries anomalies too', () => {
    expect(duplicateInvoiceNumbers('pr-boss').length).toBeGreaterThan(0)
    expect(approvalViolations('pr-boss').length).toBeGreaterThan(0)
    expect(invoicesWithoutPo('pr-boss').length).toBeGreaterThan(0)
    expect(duplicatePayments('payment-register-boss').length).toBeGreaterThan(0)
  })
})
