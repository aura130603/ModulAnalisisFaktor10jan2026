import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Shield } from 'lucide-react';

const DataQualityTab: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Validasi Data (Praktik)',
      items: [
        'Tidak ada menu khusus — lakukan pemeriksaan manual pada dataset',
        'Periksa konsistensi nilai dan aturan bisnis',
        'Gunakan output analisis untuk menemukan anomali'
      ]
    }
  ];

  const concepts = [
    {
      title: 'Dimensi Kualitas Data',
      description: 'Kualitas data dapat diukur dari berbagai dimensi yang saling terkait dan mempengaruhi validitas analisis.',
      tips: [
        'Akurasi: Seberapa benar data mencerminkan realitas',
        'Kelengkapan: Proporsi data yang tidak hilang',
        'Konsistensi: Keseragaman format dan nilai',
        'Validitas: Kesesuaian dengan aturan bisnis',
        'Ketepatan waktu: Seberapa up-to-date data tersebut',
        'Relevansi: Kesesuaian dengan tujuan analisis'
      ]
    },
    {
      title: 'Missing Data Patterns',
      description: 'Memahami pola data yang hilang penting untuk memilih strategi penanganan yang tepat.',
      tips: [
        'MCAR (Missing Completely at Random): Hilang secara acak',
        'MAR (Missing at Random): Hilang tergantung variabel lain',
        'MNAR (Missing Not at Random): Hilang karena nilai itu sendiri',
        'Analisis pola missing sebelum imputasi',
        'Dokumentasikan asumsi tentang mekanisme missing'
      ]
    },
    {
      title: 'Outlier Detection',
      description: 'Outlier dapat berupa kesalahan data atau informasi penting yang perlu dianalisis lebih lanjut.',
      tips: [
        'Gunakan multiple metode deteksi (IQR, Z-score, dll.)',
        'Visualisasi outlier dengan boxplot dan scatterplot',
        'Investigasi penyebab outlier sebelum menghapus',
        'Pertimbangkan robust statistics untuk data dengan outlier',
        'Dokumentasikan keputusan penanganan outlier'
      ]
    },
    {
      title: 'Data Validation Rules',
      description: 'Aturan validasi memastikan data memenuhi kriteria bisnis dan logika yang ditetapkan.',
      tips: [
        'Range checks: Nilai dalam rentang yang wajar',
        'Format checks: Sesuai dengan format yang diharapkan',
        'Consistency checks: Konsisten antar variabel terkait',
        'Business rules: Sesuai dengan aturan domain spesifik',
        'Referential integrity: Konsisten dengan data referensi'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Kualitas Data"
        description="Praktik pemeriksaan kualitas data yang direkomendasikan. Saat ini tidak ada menu khusus di Data untuk Missing Values/Outliers/Validation/Profiling/Audit Trail/Quality Metrics."
      />

      <div>
        <h3 className="text-lg font-semibold mb-1">Tools Kualitas Data</h3>
        <p className="text-sm text-muted-foreground mb-4">Jelajahi berbagai tools untuk memastikan dan meningkatkan kualitas data Anda</p>
        <FeatureGrid features={features} />
      </div>

      <ConceptSection
        title="Konsep Kualitas Data"
        concepts={concepts}
      />
    </div>
  );
};

export default DataQualityTab;