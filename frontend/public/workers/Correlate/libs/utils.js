/**
 * @file /libs/utils.js
 * @description
 * Kumpulan fungsi utilitas terpusat yang digunakan oleh berbagai worker Compare Means.
 */

/**
 * Memeriksa apakah string adalah format tanggal dd-mm-yyyy.
 * @param {*} value - Nilai yang akan diperiksa.
 * @returns {boolean} True jika format dd-mm-yyyy, false jika tidak.
 */
export function isDateString(value) {
    if (typeof value !== 'string') return false;
    const datePattern = /^\d{2}-\d{2}-\d{4}$/;
    if (!datePattern.test(value)) return false;
    
    const [day, month, year] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && 
           date.getMonth() === month - 1 && 
           date.getDate() === day;
}

/**
 * Mengkonversi string tanggal dd-mm-yyyy ke SPSS seconds.
 * @param {string} dateString - String tanggal dalam format dd-mm-yyyy.
 * @returns {number} SPSS seconds (detik sejak 14 Oktober 1582).
 */
export function dateStringToSpssSeconds(dateString) {
    if (!isDateString(dateString)) return NaN;
    
    const [day, month, year] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const spssEpoch = new Date(1582, 9, 14); // 14 Oktober 1582
    return Math.floor((date.getTime() - spssEpoch.getTime()) / 1000);
}

/**
 * Mengkonversi SPSS seconds kembali ke string tanggal dd-mm-yyyy.
 * @param {number} spssSeconds - SPSS seconds.
 * @returns {string} String tanggal dalam format dd-mm-yyyy.
 */
export function spssSecondsToDateString(spssSeconds) {
    if (typeof spssSeconds !== 'number' || isNaN(spssSeconds)) return String(spssSeconds);
    
    const spssEpoch = new Date(1582, 9, 14); // 14 Oktober 1582
    const date = new Date(spssEpoch.getTime() + spssSeconds * 1000);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

/**
 * Memeriksa apakah sebuah nilai dapat dianggap numerik.
 * Mendukung angka, string yang merepresentasikan angka, dan format tanggal dd-mm-yyyy.
 * @param {*} value - Nilai yang akan diperiksa.
 * @returns {boolean} True jika numerik atau tanggal, false jika tidak.
 */
export function isNumeric(value) {
    if (typeof value === 'number' && !isNaN(value)) return true;
    if (typeof value === 'string' && value.trim() !== '') {
        // Cek apakah string adalah format tanggal dd-mm-yyyy
        if (isDateString(value)) return true;
        return !isNaN(parseFloat(value));
    }
    return false;
}

/**
 * Memeriksa apakah sebuah nilai dianggap 'missing' berdasarkan definisi variabel.
 * Mendukung missing diskrit (misal: [99, 98]) dan rentang missing (misal: {min: 90, max: 99}).
 * @param {*} value - Nilai yang akan diperiksa.
 * @param {object} definition - Objek definisi missing values dari variabel.
 * @param {boolean} isNumericType - True jika tipe variabel adalah numerik.
 * @returns {boolean} True jika nilai dianggap missing.
 */
export function checkIsMissing(value, definition, isNumericType) {
    if (value === null || value === undefined || (isNumericType && value === '')) return true;
    if (!definition) return false;

    if (definition.discrete && Array.isArray(definition.discrete)) {
        const valueToCompare = isNumericType && typeof value !== 'number' ? parseFloat(value) : value;
        for (const missingVal of definition.discrete) {
            const discreteMissingToCompare = isNumericType && typeof missingVal === 'string' ? parseFloat(missingVal) : missingVal;
            if (valueToCompare === discreteMissingToCompare || String(value) === String(missingVal)) return true;
        }
    }

    if (isNumericType && definition.range) {
        const numValue = typeof value === 'number' ? value : parseFloat(value);
        if (!isNaN(numValue)) {
            const min = parseFloat(definition.range.min);
            const max = parseFloat(definition.range.max);
            if (!isNaN(min) && !isNaN(max) && numValue >= min && numValue <= max) return true;
        }
    }
    return false;
}