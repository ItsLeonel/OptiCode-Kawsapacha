export interface ReviewBadgeInfo {
  label: string
  color: string
  bg: string
  border: string
}

export function reviewBadge(status?: string): ReviewBadgeInfo | null {
  switch (status) {
    case 'PENDING':
      return {
        label: '🕐 Pendiente de aprobación por el MSP',
        color: '#92400e',
        bg: '#fef3c7',
        border: '#fde68a',
      }
    case 'APPROVED':
      return {
        label: '✅ Verificada por MSP',
        color: '#166534',
        bg: '#dcfce7',
        border: '#bbf7d0',
      }
    case 'NEEDS_CHANGES':
      return {
        label: '✏️ Requiere correcciones',
        color: '#9a3412',
        bg: '#ffedd5',
        border: '#fed7aa',
      }
    case 'REJECTED':
      return {
        label: '❌ No aprobada',
        color: '#991b1b',
        bg: '#fee2e2',
        border: '#fecaca',
      }
    default:
      return null
  }
}
