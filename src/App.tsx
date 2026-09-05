import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import Home from './pages/Home'

// Lazy-load routes that pull in heavy libraries (OCR, PDF, XLSX)
const BankConverter = lazy(() => import('./pages/BankConverter'))
const Converter = lazy(() => import('./pages/Converter'))
const GstInvoice = lazy(() => import('./pages/landing/GstInvoice'))
const PdfInvoice = lazy(() => import('./pages/landing/PdfInvoice'))
const BillToExcel = lazy(() => import('./pages/landing/BillToExcel'))
const ReceiptToExcel = lazy(() => import('./pages/landing/ReceiptToExcel'))
const PdfBankStatement = lazy(() => import('./pages/landing/PdfBankStatement'))
const BankStatementPdf = lazy(() => import('./pages/landing/BankStatementPdf'))
const ConvertBankStatement = lazy(() => import('./pages/landing/ConvertBankStatement'))
const BankStatementCsv = lazy(() => import('./pages/landing/BankStatementCsv'))
const HowItWorks = lazy(() => import('./pages/HowItWorks'))
const Faq = lazy(() => import('./pages/Faq'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageFallback() {
  return (
    <div className="container-page flex min-h-[40vh] items-center justify-center py-20">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500"
        role="status"
        aria-label="Loading"
      />
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/bank-statement-to-excel" element={<BankConverter />} />
          <Route path="/pdf-bank-statement-to-excel" element={<PdfBankStatement />} />
          <Route path="/bank-statement-pdf-to-excel" element={<BankStatementPdf />} />
          <Route path="/convert-bank-statement-to-excel" element={<ConvertBankStatement />} />
          <Route path="/bank-statement-to-csv" element={<BankStatementCsv />} />
          <Route path="/invoice-to-excel" element={<Converter />} />
          <Route path="/gst-invoice-to-excel" element={<GstInvoice />} />
          <Route path="/pdf-invoice-to-excel" element={<PdfInvoice />} />
          <Route path="/bill-to-excel" element={<BillToExcel />} />
          <Route path="/receipt-to-excel" element={<ReceiptToExcel />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
