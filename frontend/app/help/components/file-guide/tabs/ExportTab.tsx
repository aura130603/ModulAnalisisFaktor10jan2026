import React from 'react';
import { Download, FileSpreadsheet, Settings } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../statistics-guide/shared/StandardizedContentLayout';

export const ExportTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Export Data dari Statify"
      description="Simpan hasil analisis dan data Anda dalam berbagai format untuk digunakan di aplikasi lain atau untuk berbagi dengan kolega."
      variant="success"
    />

    <FeatureGrid
      features={[
        {
          title: "Format Export yang Tersedia",
          icon: FileSpreadsheet,
          items: [
            "CSV - Format universal untuk data",
            "Excel - Dengan formatting dan multiple sheets",
            "PDF - Untuk laporan dan presentasi",
            "PNG/SVG - Untuk grafik dan visualisasi",
            "Print - Cetak langsung ke printer"
          ]
        },
        {
          title: "Opsi Export Lanjutan",
          icon: Settings,
          items: [
            "Pilih kolom yang akan diekspor",
            "Atur format angka dan tanggal",
            "Sertakan atau hilangkan header",
            "Pilih separator untuk CSV",
            "Atur kualitas dan ukuran gambar"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Panduan Export"
      icon={Download}
      concepts={[
        {
          title: "Export ke CSV",
          description: "Format terbaik untuk kompatibilitas maksimum. Klik File → Export → CSV Data, atur separator dan format angka sesuai kebutuhan."
        },
        {
          title: "Export ke Excel",
          description: "Mempertahankan formatting dan mendukung multiple worksheets. Ideal untuk laporan yang memerlukan presentasi yang baik."
        },
        {
          title: "Export Grafik",
          description: "Simpan visualisasi dalam format PNG atau SVG. SVG direkomendasikan untuk kualitas terbaik dan skalabilitas."
        },
        {
          title: "Print & PDF",
          description: "Cetak langsung atau simpan sebagai PDF untuk dokumentasi dan arsip. Atur layout dan orientasi sesuai kebutuhan."
        }
      ]}
    />
  </div>
);