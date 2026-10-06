/** Apex Manufacturing Group — the fictional audit client used across AuditLab. */

export const COMPANY = {
  name: 'Apex Manufacturing Group',
  shortName: 'Apex',
  industry: 'Manufacturing',
  tagline: 'Industrial equipment & consumer goods · Nigeria',
  fiscalPeriod: 'September 2025',
}

export const SITES = [
  'Lagos Manufacturing Plant',
  'Ibadan Warehouse',
  'Port Harcourt Distribution Centre',
] as const

export const DEPARTMENTS = [
  'Procurement',
  'Finance',
  'Production',
  'Warehouse',
  'Human Resources',
  'Sales',
  'Maintenance',
] as const

export type Department = (typeof DEPARTMENTS)[number]

export interface VendorSeed {
  id: string
  name: string
  category: string
  bank: string
  account: string
  taxId: string
  status: 'Active' | 'Inactive' | 'Under Review'
  regDate: string
}

/** The vendor master population. Anomalies are planted by the dataset engine. */
export const VENDORS: VendorSeed[] = [
  { id: 'V-1001', name: 'Delta Steel Supplies Ltd', category: 'Raw Materials', bank: 'Zenith Bank', account: '1014587293', taxId: 'TIN-8841209', status: 'Active', regDate: '2019-03-14' },
  { id: 'V-1002', name: 'Bluewater Chemicals Plc', category: 'Raw Materials', bank: 'GTBank', account: '0127749102', taxId: 'TIN-7719340', status: 'Active', regDate: '2018-07-02' },
  { id: 'V-1003', name: 'Kano Packaging Industries', category: 'Packaging', bank: 'Access Bank', account: '0771204498', taxId: 'TIN-6620184', status: 'Active', regDate: '2020-01-21' },
  { id: 'V-1004', name: 'Meridian Components Ltd', category: 'Spare Parts', bank: 'Zenith Bank', account: '1019983344', taxId: 'TIN-5531772', status: 'Active', regDate: '2017-11-09' },
  { id: 'V-1005', name: 'Northfield Lubricants Ltd', category: 'Consumables', bank: 'UBA', account: '3028817744', taxId: 'TIN-4408821', status: 'Active', regDate: '2021-05-30' },
  { id: 'V-1006', name: 'Atlas Logistics Services', category: 'Logistics', bank: 'GTBank', account: '0124499017', taxId: 'TIN-3397410', status: 'Active', regDate: '2019-09-12' },
  { id: 'V-1007', name: 'Crestview Electricals Ltd', category: 'Spare Parts', bank: 'First Bank', account: '3087741120', taxId: 'TIN-2284119', status: 'Active', regDate: '2020-06-18' },
  { id: 'V-1008', name: 'Sunrise Pallets & Crates', category: 'Packaging', bank: 'Access Bank', account: '0779931145', taxId: 'TIN-1173928', status: 'Active', regDate: '2022-02-04' },
  { id: 'V-1009', name: 'Timberline PPE Supplies', category: 'Safety Equipment', bank: 'UBA', account: '3021148867', taxId: 'TIN-9982017', status: 'Active', regDate: '2021-08-27' },
  { id: 'V-1010', name: 'Quantum IT Solutions Ltd', category: 'IT Services', bank: 'GTBank', account: '0128834471', taxId: 'TIN-8817345', status: 'Active', regDate: '2022-10-11' },
  { id: 'V-1011', name: 'Harbourview Metals Ltd', category: 'Raw Materials', bank: 'Zenith Bank', account: '1013390871', taxId: 'TIN-7741920', status: 'Active', regDate: '2018-04-25' },
  { id: 'V-1012', name: 'Eagle Paper Mills', category: 'Packaging', bank: 'First Bank', account: '3081129076', taxId: 'TIN-6655013', status: 'Active', regDate: '2019-12-03' },
  { id: 'V-1013', name: 'Rapidfix Engineering Ltd', category: 'Maintenance', bank: 'Access Bank', account: '0773348812', taxId: 'TIN-5561284', status: 'Active', regDate: '2020-09-16' },
  { id: 'V-1014', name: 'Greenfield Agro Inputs', category: 'Raw Materials', bank: 'GTBank', account: '0125571930', taxId: 'TIN-4478395', status: 'Active', regDate: '2021-01-28' },
  { id: 'V-1015', name: 'Prime Office Furnishings', category: 'Office Supplies', bank: 'UBA', account: '3026640159', taxId: 'TIN-3382146', status: 'Active', regDate: '2022-05-19' },
  { id: 'V-1016', name: 'Bluepeak Cleaning Services', category: 'Services', bank: 'First Bank', account: '3089905523', taxId: 'TIN-2293717', status: 'Active', regDate: '2023-03-07' },
  { id: 'V-1017', name: 'Zenith Safety Boots Co', category: 'Safety Equipment', bank: 'Zenith Bank', account: '1017728340', taxId: 'TIN-1104828', status: 'Active', regDate: '2020-11-30' },
  { id: 'V-1018', name: 'Westbridge Motors Ltd', category: 'Fleet', bank: 'Access Bank', account: '0775510298', taxId: 'TIN-9915939', status: 'Active', regDate: '2019-06-05' },
  { id: 'V-1019', name: 'Ironclad Fasteners Ltd', category: 'Spare Parts', bank: 'GTBank', account: '0123367744', taxId: 'TIN-8826050', status: 'Active', regDate: '2021-07-14' },
  { id: 'V-1020', name: 'Clearline Water Systems', category: 'Maintenance', bank: 'UBA', account: '3024482061', taxId: 'TIN-7737161', status: 'Active', regDate: '2022-08-22' },
  { id: 'V-1021', name: 'Trident Fittings Ltd', category: 'Raw Materials', bank: 'First Bank', account: '3086613947', taxId: 'TIN-6648272', status: 'Active', regDate: '2018-02-13' },
  { id: 'V-1022', name: 'Old oak Stationers Ltd', category: 'Office Supplies', bank: 'Zenith Bank', account: '1015538216', taxId: 'TIN-5559383', status: 'Inactive', regDate: '2016-10-08' },
  { id: 'V-1023', name: 'Falcon Security Services', category: 'Services', bank: 'GTBank', account: '0129948372', taxId: 'TIN-4460494', status: 'Active', regDate: '2020-04-17' },
  { id: 'V-1024', name: 'Nova Plastics Ltd', category: 'Packaging', bank: 'Access Bank', account: '0778805163', taxId: 'TIN-3371505', status: 'Active', regDate: '2021-11-25' },
  { id: 'V-1025', name: 'Redrock Quarry Products', category: 'Raw Materials', bank: 'UBA', account: '3027719480', taxId: 'TIN-2282616', status: 'Active', regDate: '2019-08-31' },
  { id: 'V-1026', name: 'Silverline Electronics Ltd', category: 'Spare Parts', bank: 'First Bank', account: '3084456038', taxId: 'TIN-1193727', status: 'Active', regDate: '2023-01-12' },
  { id: 'V-1027', name: 'Apex Guard Rentals Ltd', category: 'Services', bank: 'Zenith Bank', account: '1016649372', taxId: 'TIN-9904838', status: 'Under Review', regDate: '2023-06-29' },
  { id: 'V-1028', name: 'Delta Peak Chemicals Ltd', category: 'Raw Materials', bank: 'GTBank', account: '0127749102', taxId: 'TIN-8815949', status: 'Active', regDate: '2022-12-06' },
]

/** Seeded vendors sharing bank accounts (planted anomaly — V-1002 & V-1028). */
export const SHARED_BANK_ACCOUNT = '0127749102'
/** Vendor deactivated but still transacting (planted anomaly). */
export const INACTIVE_VENDOR_ID = 'V-1022'

export interface ApprovalRule {
  min: number
  max: number
  approver: string
}

/** Procurement approval matrix (Naira). */
export const APPROVAL_MATRIX: { department: string; rules: ApprovalRule[] }[] = [
  { department: 'All Departments', rules: [
    { min: 0, max: 500_000, approver: 'Department Manager' },
    { min: 500_001, max: 5_000_000, approver: 'Head of Procurement' },
    { min: 5_000_001, max: 25_000_000, approver: 'Chief Financial Officer' },
    { min: 25_000_001, max: 999_999_999, approver: 'Managing Director' },
  ]},
]

export function requiredApprover(amount: number): string {
  for (const { rules } of APPROVAL_MATRIX) {
    for (const r of rules) if (amount >= r.min && amount <= r.max) return r.approver
  }
  return 'Managing Director'
}

export const AUDIT_TEAM = [
  { name: 'You', role: 'Junior Internal Auditor' },
  { name: 'Adaeze Okonkwo', role: 'Audit Manager' },
  { name: 'Tunde Bakare', role: 'Senior Audit Analyst' },
  { name: 'Fatima Yusuf', role: 'Head of Internal Audit' },
] as const

/** Procurement policy document body — rendered to PDF as a supporting file. */
export const PROCUREMENT_POLICY: { heading: string; paragraphs: string[] }[] = [
  {
    heading: '1. Purpose',
    paragraphs: [
      'This policy governs the procurement of goods and services at Apex Manufacturing Group ("the Company") and applies to all departments across the Lagos Manufacturing Plant, Ibadan Warehouse and Port Harcourt Distribution Centre.',
      'The objective is to ensure that all expenditure is authorised, represents value for money, and is supported by adequate documentation.',
    ],
  },
  {
    heading: '2. Procure-to-Pay Controls',
    paragraphs: [
      'All purchases above ₦200,000 must be supported by an approved Purchase Order raised before the supplier delivers the goods or services.',
      'Payment may only be released when a three-way match exists between the Purchase Order, the Goods Received Note (GRN) and the supplier invoice.',
      'Invoices must be unique within the accounts payable ledger. Duplicate invoice numbers must be blocked and investigated before payment.',
    ],
  },
  {
    heading: '3. Approval Authority',
    paragraphs: [
      'Department Manager: up to ₦500,000.',
      'Head of Procurement: ₦500,001 to ₦5,000,000.',
      'Chief Financial Officer: ₦5,000,001 to ₦25,000,000.',
      'Managing Director: above ₦25,000,000.',
      'No transaction may be split across multiple purchase orders or invoices to avoid a higher approval level. Split purchasing is a disciplinary matter.',
    ],
  },
  {
    heading: '4. Vendor Management',
    paragraphs: [
      'All vendors must be recorded in the vendor master file with a valid Tax Identification Number and a unique bank account before their first payment.',
      'Vendors flagged as Inactive must not receive new purchase orders or payments.',
      'Two or more vendors sharing a single bank account is prohibited unless disclosed and approved by the Chief Financial Officer.',
    ],
  },
  {
    heading: '5. Pricing and Variance',
    paragraphs: [
      'Unit prices must not exceed the contracted price or the trailing three-month average price paid for the same item by more than 5% without written justification from the Head of Procurement.',
      'Price variances above tolerance must be reported in the monthly exception report.',
    ],
  },
  {
    heading: '6. Documentation Retention',
    paragraphs: [
      'Purchase orders, GRNs, invoices, approvals and payment records must be retained for seven years and be available for internal audit inspection on request.',
      'Missing documentation at the time of audit is treated as a control deficiency irrespective of whether the underlying transaction was valid.',
    ],
  },
]
