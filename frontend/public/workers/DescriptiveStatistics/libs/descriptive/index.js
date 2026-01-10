/**
 * Descriptive Statistics Module
 * Mengekspor kelas DescriptiveCalculator untuk perhitungan statistik deskriptif
 */

importScripts('./descriptive.js');

// Ekspor kelas DescriptiveCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    const { DescriptiveCalculator } = require('./descriptive.js');
    module.exports = { DescriptiveCalculator };
} else if (typeof self !== 'undefined') {
    // descriptive.js already attaches DescriptiveCalculator to self
    // No further action is needed here.
}