export function buildWorkerInvoiceFileName(workerName: string, invoiceNumber: string | number): string {
  const safeName = (workerName || 'Worker')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '')

  const safeInvoice = String(invoiceNumber || '0000').trim() || '0000'

  return `${safeName}_Invoice-${safeInvoice}.pdf`
}
