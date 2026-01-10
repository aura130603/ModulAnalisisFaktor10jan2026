import React from 'react';
import StandardizedContentLayout from '../../statistics-guide/shared/StandardizedContentLayout';
const { IntroSection, FeatureGrid, ConceptSection } = StandardizedContentLayout;
import { Database, FileText, Calendar, Settings, Users, BarChart } from 'lucide-react';

const DataManagementTab: React.FC = () => {
  const features = [
    {
      icon: Database,
      title: 'Properti Variabel',
      items: [
        'Lokasi: Data → Define Variable Properties',
        'Atur nama variabel, label, dan tipe data',
        'Gunakan label yang informatif untuk keterbacaan'
      ]
    },
    {
      icon: Calendar,
      title: 'Definisi Tanggal & Waktu',
      items: [
        'Lokasi: Data → Define Date and Time',
        'Set format dan komponen tanggal/waktu',
        'Siapkan time series dan pelaporan periodik'
      ]
    },
    {
      icon: BarChart,
      title: 'Tingkat Pengukuran',
      items: [
        'Lokasi: Data → Set Measurement Level',
        'Tentukan skala: nominal, ordinal, interval, rasio',
        'Meningkatkan akurasi pemilihan uji statistik'
      ]
    },
    {
      icon: Users,
      title: 'Bobot Kasus',
      items: [
        'Lokasi: Data → Weight Cases',
        'Terapkan bobot untuk representativitas',
        'Pastikan sumber bobot terdokumentasi'
      ]
    },
    {
      icon: FileText,
      title: 'Urutkan Variabel',
      items: [
        'Lokasi: Data → Sort Variables',
        'Atur urutan variabel untuk navigasi yang mudah',
        'Kelompokkan variabel terkait berdekatan'
      ]
    },
    {
      icon: Settings,
      title: 'Urutkan Kasus',
      items: [
        'Lokasi: Data → Sort Cases',
        'Susun ulang baris berdasarkan variabel kunci',
        'Gunakan pengurutan kronologis/alfabetis sesuai kebutuhan'
      ]
    }
  ];

  const concepts = [
    {
      title: 'Struktur Data yang Baik',
      description: 'Data yang terstruktur dengan baik memiliki variabel yang jelas, tipe data yang tepat, dan format yang konsisten. Ini memudahkan analisis dan mengurangi kesalahan.',
      tips: [
        'Gunakan nama variabel yang deskriptif dan konsisten',
        'Pastikan setiap variabel memiliki tipe data yang sesuai',
        'Tambahkan label yang informatif untuk variabel dan nilai',
        'Hindari karakter khusus dalam nama variabel'
      ]
    },
    {
      title: 'Manajemen Metadata',
      description: 'Metadata adalah informasi tentang data Anda, seperti label variabel, format, dan deskripsi. Metadata yang baik membuat data lebih mudah dipahami dan digunakan.',
      tips: [
        'Selalu berikan label yang jelas untuk setiap variabel',
        'Dokumentasikan unit pengukuran dan skala',
        'Catat sumber data dan tanggal pengumpulan',
        'Simpan kamus data untuk referensi'
      ]
    },
    {
      title: 'Organisasi Dataset',
      description: 'Dataset yang terorganisir dengan baik memiliki struktur yang logis, variabel yang dikelompokkan dengan tepat, dan urutan yang memudahkan analisis.',
      tips: [
        'Kelompokkan variabel terkait secara berdekatan',
        'Letakkan variabel identifikasi di awal',
        'Urutkan kasus secara logis (kronologis, alfabetis, dll.)',
        'Pisahkan data mentah dari variabel yang dihitung'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <IntroSection
        title="Kelola Data Anda"
        description="Fitur manajemen data membantu Anda mengatur, mengelola, dan mengoptimalkan struktur dataset untuk analisis yang lebih efektif. Dari pengaturan properti variabel hingga organisasi data, semua tools yang Anda butuhkan tersedia di sini."
      />

      <div>
        <h3 className="text-lg font-semibold mb-1">Fitur Manajemen Data</h3>
        <p className="text-sm text-muted-foreground mb-4">Jelajahi berbagai tools untuk mengelola dan mengoptimalkan dataset Anda</p>
        <FeatureGrid features={features} />
      </div>

      <ConceptSection
        title="Konsep Penting"
        concepts={concepts}
      />
    </div>
  );
};

export default DataManagementTab;