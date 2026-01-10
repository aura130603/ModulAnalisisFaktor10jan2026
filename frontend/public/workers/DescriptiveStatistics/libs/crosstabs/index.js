/**
 * Crosstabs Module
 * Mengekspor kelas CrosstabsCalculator untuk analisis tabulasi silang
 */

// Ekspor kelas CrosstabsCalculator agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    const { CrosstabsCalculator } = require('./crosstabs.js');
    module.exports = { CrosstabsCalculator };
} else if (typeof self !== 'undefined') {
    importScripts('./crosstabs.js');
    self.CrosstabsModule = { CrosstabsCalculator };
}