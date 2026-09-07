import type { BankProcessingStageId, BankExcelFormat, ExcelFormat, ProcessingStage } from './types'

export const SITE = {
  name: 'Sheetora',
  tagline: 'Bank Statements In. Excel Out.',
  url: 'https://sheetora.online',
  maxFileSizeMB: 10,
  maxStatementSizeMB: 50,
} as const

export const NAV_LINKS = [
  { label: 'Bank Statement to Excel', to: '/bank-statement-to-excel' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Features', to: '/#features' },
  { label: 'FAQ', to: '/faq' },
] as const

export const NAV_MORE_LINKS = [
  { label: 'Invoice to Excel', to: '/invoice-to-excel' },
  { label: 'Bank Statement to CSV', to: '/bank-statement-to-csv' },
  { label: 'Privacy', to: '/privacy' },
] as const

export const BANK_PROCESSING_STAGES: { id: BankProcessingStageId; label: string }[] = [
  { id: 'reading', label: 'Reading PDF' },
  { id: 'structure', label: 'Detecting statement structure' },
  { id: 'transactions', label: 'Extracting transactions' },
  { id: 'narrations', label: 'Processing narrations' },
  { id: 'validating', label: 'Validating transactions' },
  { id: 'excel', label: 'Preparing Excel' },
]

export interface BankFormatOption {
  id: BankExcelFormat
  name: string
  description: string
}

export const BANK_EXCEL_FORMATS: BankFormatOption[] = [
  {
    id: 'standard',
    name: 'Standard Excel',
    description: 'A clean transaction sheet with all detected columns.',
  },
  {
    id: 'accounting',
    name: 'Accounting Excel',
    description: 'Date, Narration, Reference, Debit, Credit, Balance — tuned for bookkeeping.',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Choose exactly which columns to export.',
  },
]

export const PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'reading', label: 'Reading document' },
  { id: 'detecting', label: 'Detecting text' },
  { id: 'invoice', label: 'Finding invoice details' },
  { id: 'gst', label: 'Finding GST information' },
  { id: 'items', label: 'Reading items' },
  { id: 'spreadsheet', label: 'Preparing spreadsheet' },
]

export interface FormatOption {
  id: ExcelFormat
  name: string
  description: string
}

export const EXCEL_FORMATS: FormatOption[] = [
  {
    id: 'basic',
    name: 'Basic Invoice',
    description: 'Date, Invoice No, Supplier, Customer, Description, Qty, Rate, Taxable, Tax, Total.',
  },
  {
    id: 'gst-purchase',
    name: 'GST Purchase Register',
    description: 'Supplier GSTIN, HSN/SAC, Taxable Value, CGST, SGST, IGST, Total.',
  },
  {
    id: 'gst-sales',
    name: 'GST Sales Register',
    description: 'Customer GSTIN, HSN/SAC, Taxable Value, CGST, SGST, IGST, Total.',
  },
  {
    id: 'accounting',
    name: 'Accounting Format',
    description: 'Voucher No, Party Name, Description, Debit, Credit, Tax, Total.',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Pick exactly the columns you want to export.',
  },
]

export const CUSTOM_COLUMNS = [
  'Invoice Date',
  'Invoice Number',
  'Due Date',
  'Supplier Name',
  'Supplier GSTIN',
  'Customer Name',
  'Customer GSTIN',
  'Description',
  'HSN/SAC',
  'Quantity',
  'Unit',
  'Rate',
  'Taxable Amount',
  'GST Rate',
  'CGST',
  'SGST',
  'IGST',
  'Cess',
  'Total',
] as const
