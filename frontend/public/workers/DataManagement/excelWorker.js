// Web Worker for parsing Excel files
self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

self.onmessage = (e) => {
  const { binaryStr } = e.data;
  try {
    const wb = XLSX.read(binaryStr, { type: 'binary' });
    const result = wb.SheetNames.map((name) => {
      const sheet = wb.Sheets[name];
      // Convert sheet to array of arrays
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
      return { sheetName: name, data };
    });
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message || 'Unknown parse error' });
  }
};
