/**
 * Utils Module
 * Mengekspor fungsi-fungsi utilitas yang digunakan oleh modul lain
 */

importScripts('./utils.js');

// Ekspor fungsi-fungsi utils agar dapat digunakan oleh modul lain
if (typeof module !== 'undefined' && module.exports) {
    const utils = require('./utils.js');
    module.exports = utils;
} else if (typeof self !== 'undefined') {
    // utils.js already loads its functions into the global scope (self)
    // so no specific action is needed here if using importScripts.
    // However, for clarity, we can create a module-like object.
    self.UtilsModule = {
        isNumeric,
        checkIsMissing,
        mapValueLabel,
        applyValueLabels,
        toSPSSFixed,
        dateStringToSpssSeconds,
        spssSecondsToDateString,
        isDateString
    };
}