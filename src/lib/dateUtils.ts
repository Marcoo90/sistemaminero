
export const toPeruTime = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return d.toLocaleString('es-PE', {
            timeZone: 'America/Lima',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    } catch (e) {
        return '';
    }
};

export const toPeruDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return d.toLocaleDateString('es-PE', {
            timeZone: 'America/Lima',
            weekday: undefined,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return '';
    }
}

export const peruDateToInputDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
};

