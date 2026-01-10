import React from 'react';
import { Database, Folder, Shield } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ExampleGrid 
} from '../../statistics-guide/shared/StandardizedContentLayout';

export const DataTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Kelola Data dengan Efisien"
      description="Pelajari cara mengelola, mengorganisir, dan memelihara data Anda dalam Statify untuk analisis yang optimal."
      variant="tip"
    />

    <FeatureGrid
      features={[
        {
          title: "Organisasi Data",
          icon: Folder,
          items: [
            "Gunakan nama variabel yang deskriptif",
            "Kelompokkan variabel terkait",
            "Buat backup data secara berkala",
            "Dokumentasikan sumber dan metodologi",
            "Simpan metadata untuk referensi"
          ]
        },
        {
          title: "Kualitas Data",
          icon: Shield,
          items: [
            "Periksa missing values secara rutin",
            "Validasi konsistensi data",
            "Identifikasi dan tangani outliers",
            "Standardisasi format data",
            "Verifikasi akurasi input data"
          ]
        }
      ]}
    />

    <ExampleGrid
      title="Dataset Contoh"
      icon={Database}
      examples={[
        {
          title: "Survey Kepuasan Pelanggan",
          description: "Data survei dengan skala Likert, demografi, dan feedback terbuka untuk analisis kepuasan."
        },
        {
          title: "Data Penjualan Retail",
          description: "Transaksi penjualan harian dengan kategori produk, lokasi, dan metrik performa."
        },
        {
          title: "Hasil Eksperimen Ilmiah",
          description: "Data eksperimen terkontrol dengan variabel independen dan dependen untuk analisis statistik."
        },
        {
          title: "Data Finansial",
          description: "Time series data keuangan dengan indikator ekonomi dan metrik performa investasi."
        }
      ]}
      columns={2}
    />
  </div>
);