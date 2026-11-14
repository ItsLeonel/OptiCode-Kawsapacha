/**
 * Reporte exportable de Bitácora. Los datos provienen de entradas reales
 * cargadas en la interfaz; no certifica su validez ni genera evidencias.
 */
export type CsvActivityRow = Readonly<{
  id: string
  date: string
  name: string
  responsible: string
  target: string
  notes: string
  source: 'local' | 'server'
  photoCount: number
  voided: boolean
  details: string
}>

const columns = ['ID', 'Fecha', 'Actividad', 'Responsable', 'Ubicación', 'Observaciones', 'Origen', 'Fotografías', 'Anulada', 'Detalles documentados']

/** Neutraliza fórmulas interpretadas por Excel/Sheets sin alterar el texto mostrado. */
function csvCell(value: unknown): string {
  let raw = String(value ?? '').replace(/\u0000/g, '')
  if (/^[\s]*[=+@\-\t\r]/.test(raw)) raw = "'" + raw
  return '"' + raw.replace(/"/g, '""') + '"'
}

/** UTF-8 BOM facilita abrir el reporte en Excel en español. */
export function createActivityCsv(rows: readonly CsvActivityRow[]) {
  const lines = [
    columns.map(csvCell).join(';'),
    ...rows.map(row => [
      row.id, row.date, row.name, row.responsible, row.target, row.notes,
      row.source === 'server' ? 'Servidor (cuidados básicos)' : 'Bitácora local',
      row.photoCount, row.voided ? 'Sí' : 'No', row.details,
    ].map(csvCell).join(';')),
  ]
  return '\ufeff' + lines.join('\r\n') + '\r\n'
}
