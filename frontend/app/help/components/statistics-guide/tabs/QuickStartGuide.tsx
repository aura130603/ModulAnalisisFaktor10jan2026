import React from 'react';
import { BarChart3, Target, Play, Settings, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  StepList,
  ExampleGrid 
} from '../shared/StandardizedContentLayout';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <IntroSection
      title="Quick Start - Analisis Statistik dalam 3 Langkah"
      description="Ikuti panduan cepat ini untuk memulai analisis statistik di Statify dalam hitungan menit."
      variant="tip"
    />

    <StepList
      title="Langkah-langkah Analisis"
      icon={Play}
      steps={[
        {
          number: 1,
          title: "Pilih Analisis",
          description: "Tentukan jenis analisis yang sesuai dengan tipe data dan tujuan penelitian Anda."
        },
        {
          number: 2,
          title: "Atur Variabel",
          description: "Pilih dan atur variabel untuk analisis, tentukan peran masing-masing variabel."
        },
        {
          number: 3,
          title: "Interpretasi Hasil",
          description: "Pahami output analisis dan hubungkan dengan konteks penelitian Anda."
        }
      ]}
      variant="step"
    />

    <FeatureGrid
      features={[
        {
          title: "Jenis Analisis Tersedia",
          icon: BarChart3,
          items: [
            "Deskriptif - Mean, median, standar deviasi",
            "Frekuensi - Distribusi data kategorikal",
            "Crosstabs - Hubungan antar variabel kategorikal",
            "Explore - Analisis eksploratori mendalam",
            "Linear Regression - Hubungan linear antar variabel",
            "Univariate - ANOVA dan uji perbandingan grup"
          ]
        },
        {
          title: "Pengaturan Variabel",
          icon: Settings,
          items: [
            "Drag variabel dari daftar ke area analisis",
            "Tentukan peran variabel (dependent/independent)",
            "Atur opsi analisis sesuai kebutuhan",
            "Preview pengaturan sebelum menjalankan",
            "Simpan konfigurasi untuk analisis berulang",
            "Export pengaturan untuk dokumentasi"
          ]
        }
      ]}
      columns={2}
    />

    <ExampleGrid
      title="Jenis Analisis Populer"
      icon={Target}
      examples={[
        {
          title: "Analisis Deskriptif",
          description: "Ringkasan statistik dasar untuk memahami karakteristik data Anda"
        },
        {
          title: "Analisis Frekuensi",
          description: "Distribusi dan proporsi data kategorikal dengan tabel dan grafik"
        },
        {
          title: "Crosstabs",
          description: "Hubungan antara dua variabel kategorikal dengan uji chi-square"
        },
        {
          title: "Explore",
          description: "Analisis eksploratori mendalam dengan deteksi outlier dan normalitas"
        }
      ]}
      columns={2}
    />

    <ExampleGrid
      title="Tips Analisis Efektif"
      icon={FileText}
      examples={[
        {
          title: "Periksa Asumsi",
          description: "Validasi asumsi statistik sebelum menjalankan analisis untuk hasil yang akurat"
        },
        {
          title: "Visualisasi Data",
          description: "Gunakan grafik dan plot untuk memahami pola dan distribusi data"
        },
        {
          title: "Interpretasi Kontekstual",
          description: "Hubungkan hasil statistik dengan konteks penelitian dan domain knowledge"
        },
        {
          title: "Dokumentasi Lengkap",
          description: "Catat semua langkah analisis dan keputusan untuk reproducibility"
        }
      ]}
      columns={2}
    />
  </div>
);