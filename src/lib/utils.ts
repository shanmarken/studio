import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Task } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv(tasks: Task[], filename: string) {
  const headers = [
    'Phase',
    'Task',
    'Assigned To',
    'Status',
    '%',
    'Start Date',
    'End Date',
    'Dependencies',
    'Notes',
  ]

  const csvContent = [
    headers.join(','),
    ...tasks.map(task => [
      `"${task.phase}"`,
      `"${task.name.replace(/"/g, '""')}"`,
      `"${task.assignedTo}"`,
      `"${task.status}"`,
      task.percentComplete,
      task.startDate.toISOString().split('T')[0],
      task.endDate.toISOString().split('T')[0],
      `"${task.dependencies?.replace(/"/g, '""') ?? ''}"`,
      `"${task.notes?.replace(/"/g, '""') ?? ''}"`,
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.href) {
    URL.revokeObjectURL(link.href)
  }
  const url = URL.createObjectURL(blob)
  link.href = url
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
