/**
 * Frequency Analysis Module
 * Mengekspor kelas FrequencyCalculator untuk analisis frekuensi dan persentil
 */

importScripts('./frequency.js');

// Ekspor kelas FrequencyCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FrequencyCalculator };
} else if (typeof self !== 'undefined') {
    self.FrequencyModule = { FrequencyCalculator };
}