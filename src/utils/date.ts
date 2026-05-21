export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1)
}

export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0)
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2)
}

export function isDateBetween(date: Date, start: Date, end: Date): boolean {
  const dateStr = formatDate(date)
  const startStr = formatDate(start)
  const endStr = formatDate(end)
  return dateStr >= startStr && dateStr <= endStr
}

export function getDaysBetween(start: Date, end: Date): number {
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function getMonthName(year: number, month: number): string {
  return `${year}年${month + 1}月`
}

export function generateDaysInMonth(year: number, month: number): string[] {
  const days = []
  const daysCount = getDaysInMonth(year, month)
  for (let i = 1; i <= daysCount; i++) {
    days.push(formatDate(new Date(year, month, i)))
  }
  return days
}
