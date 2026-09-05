import {
  ShieldCheck,
  UserRoundCheck,
  Receipt,
  Files,
  Pencil,
  FileSpreadsheet,
} from 'lucide-react'

const features = [
  {
    icon: ShieldCheck,
    title: 'Private',
    body: 'Files stay in your browser and are never uploaded to any server.',
  },
  {
    icon: UserRoundCheck,
    title: 'No Signup',
    body: 'Start converting immediately — no account, no email required.',
  },
  {
    icon: Receipt,
    title: 'GST Ready',
    body: 'Extract common GST fields like GSTIN, HSN/SAC, CGST, SGST and IGST.',
  },
  {
    icon: Files,
    title: 'Multiple Files',
    body: 'Process several invoices at once and combine them into one workbook.',
  },
  {
    icon: Pencil,
    title: 'Editable',
    body: 'Review and correct every extracted field before you export.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel Export',
    body: 'Download a real, formatted .xlsx file ready for accounting.',
  },
]

export default function Features() {
  return (
    <section className="container-page py-12 sm:py-16" aria-labelledby="features-heading">
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="features-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Everything you need to convert invoices
        </h2>
        <p className="mt-3 text-ink-500">
          A focused, private utility built for accountants, freelancers and small businesses.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <Icon size={22} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-ink-500">{body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
