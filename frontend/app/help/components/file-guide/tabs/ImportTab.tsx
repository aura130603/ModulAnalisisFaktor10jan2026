import React from 'react';
import { Upload, FileSpreadsheet, Database } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../statistics-guide/shared/StandardizedContentLayout';

export const ImportTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Import Data ke Statify"
      description="Statify mendukung berbagai format file untuk memudahkan Anda mengimpor data dari berbagai sumber. Pilih format yang sesuai dengan kebutuhan Anda."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Format File yang Didukung",
          icon: FileSpreadsheet,
          items: [
            "File CSV (Comma Separated Values)",
            "File Excel (.xlsx, .xls)",
            "File SPSS (.sav)",
            "Data dari Clipboard",
            "Dataset contoh bawaan"
          ]
        },
        {
          title: "Tips Import yang Efektif",
          icon: Upload,
          items: [
            "Pastikan data memiliki header kolom",
            "Periksa format tanggal dan angka",
            "Hindari karakter khusus dalam nama variabel",
            "Backup data asli sebelum import",
            "Validasi data setelah import"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Langkah-langkah Import"
      icon={Database}
      concepts={[
        {
          title: "CSV Files",
          description: "Format paling umum dan kompatibel. Klik File → Import Data → CSV Data, lalu pilih file dan atur pengaturan."
        },
        {
          title: "Excel Files",
          description: "Import langsung dari spreadsheet Excel. Klik File → Import Data → Excel, lalu pilih worksheet yang diinginkan."
        },
        {
          title: "SPSS Files",
          description: "Import data dari SPSS dengan metadata lengkap. Klik File → Open SAV untuk mempertahankan label dan format."
        },
        {
          title: "Clipboard Data",
          description: "Copy data dari aplikasi lain dan paste langsung ke Statify melalui menu: File → Import Data → From Clipboard."
        }
      ]}
    />
  </div>
);