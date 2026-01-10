/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { ArrowUpDown, Settings } from 'lucide-react';

const SortCasesGuide = () => {
  const sections = [
    {
      id: 'interface',
      title: 'Antarmuka & Fungsionalitas Komponen',
      description: 'Komponen dalam dialog Urutkan Kasus',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Daftar Variabel Tersedia">
            <p className="text-sm">
              Menampilkan semua variabel yang tersedia untuk digunakan sebagai kunci pengurutan.
            </p>
          </HelpSection>
          
          <HelpSection title="Daftar Urutkan Berdasarkan">
            <p className="text-sm">
              Daftar ini menyimpan variabel yang dipilih sebagai kunci pengurutan.
              Urutan di sini menentukan prioritas pengurutan.
            </p>
          </HelpSection>
          
          <HelpSection title="Kontrol Pengurutan">
            <p className="text-sm mb-3">
              Ketika variabel dalam daftar "Urutkan Berdasarkan" disorot:
            </p>
            <div className="ml-4 space-y-2">
              <HelpCard title="Arah Pengurutan" variant="step">
                <p className="text-sm">
                  Pilih untuk mengurutkan dalam urutan naik atau turun.
                </p>
              </HelpCard>
              <HelpCard title="Prioritas Pengurutan" variant="step">
                <p className="text-sm">
                  Tombol untuk mengubah prioritas pengurutan variabel.
                </p>
              </HelpCard>
            </div>
          </HelpSection>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja & Contoh Penggunaan',
      description: 'Contoh praktis menggunakan Urutkan Kasus',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpCard title="Contoh 1: Pengurutan Tingkat Tunggal" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Tujuan</strong>: Urutkan seluruh dataset Anda berdasarkan Pendapatan 
                dari tertinggi ke terendah.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Langkah:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Buka dialog "Urutkan Kasus"</li>
                  <li>Pindahkan variabel Pendapatan ke daftar "Urutkan Berdasarkan"</li>
                  <li>Pilih Menurun untuk "Urutan Pengurutan"</li>
                  <li>Klik OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Contoh 2: Pengurutan Multi-Tingkat" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                <strong>Tujuan</strong>: Kelompokkan kasus berdasarkan Departemen, kemudian dalam 
                setiap departemen, urutkan berdasarkan Pendapatan dari tertinggi ke terendah.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-2">Langkah:</p>
                <ol className="list-decimal list-inside text-sm space-y-1">
                  <li>Pindahkan variabel Departemen ke "Urutkan Berdasarkan" (Menaik)</li>
                  <li>Pindahkan variabel Pendapatan ke "Urutkan Berdasarkan" di bawah Departemen</li>
                  <li>Ubah arah Pendapatan menjadi Menurun</li>
                  <li>Klik OK</li>
                </ol>
              </div>
            </div>
          </HelpCard>
          
          <HelpAlert variant="info" title="Tips Pengurutan Multi-Tingkat">
            <p className="text-sm mt-2">
              Urutan variabel dalam daftar "Urutkan Berdasarkan" menentukan prioritas pengurutan. 
              Variabel pertama memiliki prioritas tertinggi.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Urutan Prioritas',
      content: 'Variabel yang dipilih pertama memiliki prioritas tertinggi dalam pengurutan multi-tingkat.'
    },
    {
      type: 'info' as const,
      title: 'Arah Pengurutan',
      content: 'Menaik: dari terkecil ke terbesar. Menurun: dari terbesar ke terkecil.'
    },
    {
      type: 'warning' as const,
      title: 'Perubahan Urutan',
      content: 'Pengurutan akan mengubah urutan baris dalam dataset Anda secara permanen.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Pilih Kasus', href: '/help/data-guide/select-cases' },
    { title: 'Urutkan Variabel', href: '/help/data-guide/sort-vars' },
    { title: 'Persiapan Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Urutkan Kasus"
      description="Panduan ini menjelaskan fungsionalitas Urutkan Kasus, yang memungkinkan Anda mengatur ulang baris (kasus) dalam dataset Anda berdasarkan nilai dari satu atau lebih variabel."
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SortCasesGuide;