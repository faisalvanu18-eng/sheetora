import * as XLSX from 'xlsx'
import type { ExcelFormat, InvoiceData } from '../types'
import { parseAmount } from './utils'

type Row = (string | number)[]

const CURRENCY_FMT = '#,##0.00'

function num(v: string): number | string {
  const n = parseAmount(v)
  return n == null ? '' : n
}

/** Build rows (header + data) for a given format across all invoices. */
function buildSheet(invoices: InvoiceData[], format: ExcelFormat, customColumns: string[]) {
  const rows: Row[] = []

  const pushItemRows = (
    header: Row,
    mapper: (inv: InvoiceData, item: InvoiceData['items'][number]) => Row,
  ) => {
    rows.push(header)
    for (const inv of invoices) {
      if (inv.items.length === 0) {
        // Still emit one summary row so the invoice is represented.
        rows.push(mapper(inv, {
          id: '', description: '', hsnSac: '', quantity: '', unit: '', rate: '',
          discount: '', taxableAmount: inv.subtotal, gstRate: '', cgst: '', sgst: '',
          igst: '', cess: '', total: inv.grandTotal,
        }))
      } else {
        for (const item of inv.items) rows.push(mapper(inv, item))
      }
    }
  }

  switch (format) {
    case 'basic':
      pushItemRows(
        ['Date', 'Invoice No', 'Supplier', 'Customer', 'Description', 'Qty', 'Rate', 'Taxable Amount', 'Tax', 'Total'],
        (inv, it) => [
          inv.invoiceDate, inv.invoiceNumber, inv.supplierName, inv.customerName,
          it.description, num(it.quantity), num(it.rate), num(it.taxableAmount),
          num(it.cgst || it.igst) || '', num(it.total),
        ],
      )
      break

    case 'gst-purchase':
      pushItemRows(
        ['Date', 'Invoice No', 'Supplier', 'Supplier GSTIN', 'HSN/SAC', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'],
        (inv, it) => [
          inv.invoiceDate, inv.invoiceNumber, inv.supplierName, inv.supplierGstin,
          it.hsnSac, num(it.taxableAmount), num(it.cgst), num(it.sgst), num(it.igst), num(it.total),
        ],
      )
      break

    case 'gst-sales':
      pushItemRows(
        ['Date', 'Invoice No', 'Customer', 'Customer GSTIN', 'HSN/SAC', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'],
        (inv, it) => [
          inv.invoiceDate, inv.invoiceNumber, inv.customerName, inv.customerGstin,
          it.hsnSac, num(it.taxableAmount), num(it.cgst), num(it.sgst), num(it.igst), num(it.total),
        ],
      )
      break

    case 'accounting':
      rows.push(['Date', 'Voucher No', 'Party Name', 'Description', 'Debit', 'Credit', 'Tax', 'Total'])
      for (const inv of invoices) {
        rows.push([
          inv.invoiceDate, inv.invoiceNumber, inv.supplierName || inv.customerName,
          inv.items.map((i) => i.description).filter(Boolean).join(', ') || 'Invoice',
          num(inv.grandTotal), '', num(inv.totalTax), num(inv.grandTotal),
        ])
      }
      break

    case 'custom': {
      rows.push(customColumns)
      for (const inv of invoices) {
        if (inv.items.length === 0) {
          rows.push(customColumns.map((c) => customValue(inv, null, c)))
        } else {
          for (const it of inv.items) rows.push(customColumns.map((c) => customValue(inv, it, c)))
        }
      }
      break
    }
  }

  return rows
}

function customValue(
  inv: InvoiceData,
  it: InvoiceData['items'][number] | null,
  column: string,
): string | number {
  switch (column) {
    case 'Invoice Date': return inv.invoiceDate
    case 'Invoice Number': return inv.invoiceNumber
    case 'Due Date': return inv.dueDate
    case 'Supplier Name': return inv.supplierName
    case 'Supplier GSTIN': return inv.supplierGstin
    case 'Customer Name': return inv.customerName
    case 'Customer GSTIN': return inv.customerGstin
    case 'Description': return it?.description ?? ''
    case 'HSN/SAC': return it?.hsnSac ?? ''
    case 'Quantity': return it ? num(it.quantity) : ''
    case 'Unit': return it?.unit ?? ''
    case 'Rate': return it ? num(it.rate) : ''
    case 'Taxable Amount': return it ? num(it.taxableAmount) : num(inv.subtotal)
    case 'GST Rate': return it?.gstRate ?? ''
    case 'CGST': return it ? num(it.cgst) : ''
    case 'SGST': return it ? num(it.sgst) : ''
    case 'IGST': return it ? num(it.igst) : ''
    case 'Cess': return it ? num(it.cess) : ''
    case 'Total': return it ? num(it.total) : num(inv.grandTotal)
    default: return ''
  }
}

function autoWidths(rows: Row[]): XLSX.ColInfo[] {
  if (!rows.length) return []
  const colCount = Math.max(...rows.map((r) => r.length))
  const widths: XLSX.ColInfo[] = []
  for (let c = 0; c < colCount; c++) {
    let max = 8
    for (const r of rows) {
      const cell = r[c]
      if (cell != null) max = Math.max(max, String(cell).length + 2)
    }
    widths.push({ wch: Math.min(max, 40) })
  }
  return widths
}

function applyCurrencyFormat(ws: XLSX.WorkSheet, rows: Row[]) {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let r = 1; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n'
        cell.z = CURRENCY_FMT
      }
    }
  }
  void rows
}

/** Build the Summary sheet across all invoices. */
function buildSummary(invoices: InvoiceData[]): Row[] {
  const rows: Row[] = [
    ['Invoice No', 'Date', 'Supplier', 'Customer', 'Subtotal', 'Total Tax', 'Grand Total'],
  ]
  let gTaxable = 0
  let gTax = 0
  let gTotal = 0
  for (const inv of invoices) {
    const sub = parseAmount(inv.subtotal) ?? 0
    const tax = parseAmount(inv.totalTax) ?? 0
    const tot = parseAmount(inv.grandTotal) ?? 0
    gTaxable += sub
    gTax += tax
    gTotal += tot
    rows.push([inv.invoiceNumber, inv.invoiceDate, inv.supplierName, inv.customerName, sub, tax, tot])
  }
  rows.push(['', '', '', 'Grand Total', gTaxable, gTax, gTotal])
  return rows
}

function buildItemDetails(invoices: InvoiceData[]): Row[] {
  const rows: Row[] = [
    ['Invoice No', 'Description', 'HSN/SAC', 'Qty', 'Unit', 'Rate', 'Taxable', 'GST %', 'CGST', 'SGST', 'IGST', 'Cess', 'Total'],
  ]
  for (const inv of invoices) {
    for (const it of inv.items) {
      rows.push([
        inv.invoiceNumber, it.description, it.hsnSac, num(it.quantity), it.unit, num(it.rate),
        num(it.taxableAmount), it.gstRate, num(it.cgst), num(it.sgst), num(it.igst), num(it.cess), num(it.total),
      ])
    }
  }
  return rows
}

export interface ExportOptions {
  format: ExcelFormat
  customColumns?: string[]
  fileName?: string
}

/**
 * Generate and trigger download of a real .xlsx workbook.
 * Includes the chosen format sheet plus Item Details and Summary sheets.
 */
export function exportToExcel(invoices: InvoiceData[], opts: ExportOptions): string {
  const wb = XLSX.utils.book_new()
  const customColumns = opts.customColumns ?? []

  // Main data sheet
  const mainRows = buildSheet(invoices, opts.format, customColumns)
  const mainWs = XLSX.utils.aoa_to_sheet(mainRows)
  mainWs['!cols'] = autoWidths(mainRows)
  applyCurrencyFormat(mainWs, mainRows)
  XLSX.utils.book_append_sheet(wb, mainWs, 'Invoice Data')

  // Item details
  const itemRows = buildItemDetails(invoices)
  if (itemRows.length > 1) {
    const itemWs = XLSX.utils.aoa_to_sheet(itemRows)
    itemWs['!cols'] = autoWidths(itemRows)
    applyCurrencyFormat(itemWs, itemRows)
    XLSX.utils.book_append_sheet(wb, itemWs, 'Item Details')
  }

  // Summary
  const sumRows = buildSummary(invoices)
  const sumWs = XLSX.utils.aoa_to_sheet(sumRows)
  sumWs['!cols'] = autoWidths(sumRows)
  applyCurrencyFormat(sumWs, sumRows)
  XLSX.utils.book_append_sheet(wb, sumWs, 'Summary')

  const fileName = opts.fileName || 'Sheetora_Invoice_Data.xlsx'
  XLSX.writeFile(wb, fileName)
  return fileName
}
