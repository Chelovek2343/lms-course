export const MAX_DOC_SIZE = 20 * 1024 * 1024 // 20 МБ

export const ALLOWED_DOC_TYPES = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/png': 'PNG',
    'image/webp': 'WEBP',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
}

export const ALLOWED_DOC_LABEL = 'PDF, JPG, PNG, WEBP, DOC, DOCX'
export const DOC_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx'

export const STATUS_META = {
    none: { label: 'Не загружено', bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' },
    pending: { label: 'На проверке', bg: 'rgba(111,163,224,0.18)', color: '#9cc0f0' },
    approved: { label: 'Одобрено', bg: 'rgba(52,211,153,0.16)', color: '#6ee7b7' },
    rejected: { label: 'Отклонено', bg: 'rgba(248,113,113,0.16)', color: '#fca5a5' },
}

export const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}
