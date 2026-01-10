/**
 * Examine Module
 * Mengekspor kelas ExamineCalculator untuk analisis examine dengan robust statistics
 */

importScripts('./examine.js');

// Ekspor kelas ExamineCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ExamineCalculator };
} else if (typeof self !== 'undefined') {
    self.ExamineModule = { ExamineCalculator };
}