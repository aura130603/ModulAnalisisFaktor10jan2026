import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Shuffle, RotateCcw, Calculator, Filter } from 'lucide-react';

const DataTransformationTab: React.FC = () => {
  const features = [
    {
      icon: Calculator,
      title: 'Agregasi Data',
      items: [
        'Lokasi: Data → Aggregate',
        'Buat statistik ringkasan per kelompok (mean, sum, max, dll.)',
        'Gunakan variabel break untuk pengelompokan'
      ]
    },
    {
      icon: Shuffle,
      title: 'Restrukturisasi Data',
      items: [
        'Lokasi: Data → Restructure',
        'Ubah format wide ↔ long sesuai kebutuhan analisis',
        'Pastikan ID tetap konsisten'
      ]
    },
    {
      icon: RotateCcw,
      title: 'Transpose Data',
      items: [
        'Lokasi: Data → Transpose',
        'Tukar baris dan kolom untuk ubah orientasi dataset',
        'Gunakan pada tabel ringkas tertentu'
      ]
    },
    {
      icon: Filter,
      title: 'Pilih Kasus',
      items: [
        'Lokasi: Data → Select Cases',
        'Filter subset data berdasarkan kriteria',
        'Simpan filter yang sering dipakai'
      ]
    },
    {
      icon: Filter,
      title: 'Identifikasi Duplikat',
      items: [
        'Lokasi: Data → Identify Duplicate Cases',
        'Temukan dan tangani duplikat',
        'Dokumentasikan keputusan penanganan'
      ]
    }
  ];

  const concepts = [
    {
      title: 'Agregasi dan Ringkasan',
      description: 'Agregasi memungkinkan Anda membuat statistik ringkasan dari data mentah, seperti rata-rata penjualan per bulan atau total transaksi per kategori.',
      tips: [
        'Pilih variabel break yang tepat untuk pengelompokan',
        'Tentukan fungsi agregasi yang sesuai (mean, sum, count, dll.)',
        'Pertimbangkan missing values dalam perhitungan',
        'Validasi hasil agregasi dengan data asli'
      ]
    },
    {
      title: 'Restrukturisasi Data',
      description: 'Mengubah format data dari wide (banyak kolom) ke long (banyak baris) atau sebaliknya, tergantung kebutuhan analisis.',
      tips: [
        'Wide format: satu baris per subjek, multiple variabel',
        'Long format: multiple baris per subjek, satu variabel',
        'Pilih format berdasarkan jenis analisis yang akan dilakukan',
        'Pastikan identifikasi subjek tetap konsisten'
      ]
    },
    {
      title: 'Filtering dan Seleksi',
      description: 'Memilih subset data berdasarkan kriteria tertentu untuk fokus pada analisis yang spesifik.',
      tips: [
        'Definisikan kriteria seleksi dengan jelas',
        'Gunakan operator logika untuk kondisi kompleks',
        'Simpan filter yang sering digunakan',
        'Dokumentasikan alasan filtering untuk reproducibility'
      ]
    },
    {
      title: 'Penanganan Duplikat',
      description: 'Identifikasi dan tangani kasus duplikat yang dapat mempengaruhi validitas analisis statistik.',
      tips: [
        'Tentukan kriteria untuk mendefinisikan duplikat',
        'Periksa apakah duplikat adalah kesalahan atau data valid',
        'Pilih strategi penanganan: hapus, gabung, atau tandai',
        'Dokumentasikan keputusan penanganan duplikat'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Transformasi Data"
        description="Tools transformasi data memungkinkan Anda mengubah, memanipulasi, dan merestrukturisasi dataset untuk memenuhi kebutuhan analisis yang berbeda. Dari agregasi sederhana hingga restrukturisasi kompleks, semua tersedia di sini."
      />

      <div>
        <h3 className="text-lg font-semibold mb-1">Tools Transformasi</h3>
        <p className="text-sm text-muted-foreground mb-4">Jelajahi berbagai tools untuk mentransformasi dan memanipulasi data Anda</p>
        <FeatureGrid features={features} />
      </div>

      <ConceptSection
        title="Konsep Transformasi Data"
        concepts={concepts}
      />
    </div>
  );
};

export default DataTransformationTab;