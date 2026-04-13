import { useHoursSummary } from './useHoursSummary'
import { useEmployees } from './useEmployees'

export interface EmployeeHoursReportRow {
  date: string
  jobHours: number
  workedHours: number
  specialHours: number
  finalPaidHours: number
  invoiceHours: number
  ratePerJob: number
  totalPay: number
  totalMinutes: number
  invoiceMinutes: number
  note: string | null
  rateType: 'weekday' | 'sunday' | 'holiday'
}

export interface EmployeeHoursReport {
  employeeId: string
  employeeAbn: string | null
  employeeName: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  reportNumber: string
  rows: EmployeeHoursReportRow[]
  finalTotalHours: number
  finalInvoiceHours: number
  finalTotalPay: number
  finalTotalMinutes: number
  finalInvoiceMinutes: number
}

function toCurrency(value: number): number {
  return Number(value.toFixed(2))
}

function toHours(minutes: number): number {
  return Number((minutes / 60).toFixed(2))
}

function calculateInvoiceMinutes(plannedMinutes: number, actualMinutes: number): number {
  return Math.max(plannedMinutes, actualMinutes)
}

function buildReportNumber(employeeId: string, startDate: string, endDate: string): string {
  const shortEmployee = employeeId.slice(0, 8).toUpperCase()
  const start = startDate.replace(/-/g, '')
  const end = endDate.replace(/-/g, '')
  return `HR-${shortEmployee}-${start}-${end}`
}

export function useHoursReport() {
  const { getHoursSummary } = useHoursSummary()
  const { getEmployeeById } = useEmployees()

  async function getEmployeeHoursReport(
    startDate: string,
    endDate: string,
    employeeId: string,
  ): Promise<EmployeeHoursReport | null> {
    if (!startDate || !endDate) {
      throw new Error('Start date and end date are required.')
    }

    if (!employeeId) {
      throw new Error('Employee is required to generate report.')
    }

    const summary = await getHoursSummary(startDate, endDate, employeeId)
    const employee = summary.employees.find((item) => item.employeeId === employeeId)

    if (!employee) {
      return null
    }

    const employeeProfile = await getEmployeeById(employeeId)

    const rows = employee.days.map((day) => {
      const invoiceMinutes = day.invoiceMinutes ?? calculateInvoiceMinutes(day.jobMinutes, day.workedMinutes)

      return {
        date: day.date,
        jobHours: day.jobHours,
        workedHours: day.workedHours,
        specialHours: day.specialHours,
        finalPaidHours: day.totalHours,
        invoiceHours: day.invoiceHours ?? toHours(invoiceMinutes),
        ratePerJob: day.appliedRate,
        totalPay: day.totalPay,
        totalMinutes: day.totalMinutes,
        invoiceMinutes,
        note: day.note,
        rateType: day.rateType,
      }
    })

    const finalTotalMinutes = rows.reduce((acc, row) => acc + row.totalMinutes, 0)
    const finalInvoiceMinutes = rows.reduce((acc, row) => acc + row.invoiceMinutes, 0)
    const finalTotalHours = toHours(finalTotalMinutes)
    const finalInvoiceHours = toHours(finalInvoiceMinutes)
    const finalTotalPay = toCurrency(rows.reduce((acc, row) => acc + row.totalPay, 0))

    return {
      employeeId: employee.employeeId,
      employeeAbn: employeeProfile?.abn?.trim() || null,
      employeeName: employee.employeeName,
      periodStart: startDate,
      periodEnd: endDate,
      generatedAt: new Date().toISOString(),
      reportNumber: buildReportNumber(employee.employeeId, startDate, endDate),
      rows,
      finalTotalHours,
      finalInvoiceHours,
      finalTotalPay,
      finalTotalMinutes,
      finalInvoiceMinutes,
    }
  }

  return {
    getEmployeeHoursReport,
  }
}
