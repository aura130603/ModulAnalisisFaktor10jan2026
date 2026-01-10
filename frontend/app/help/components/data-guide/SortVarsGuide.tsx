/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { ArrowUpDown, Settings } from 'lucide-react';

const SortVarsGuide = () => {
  const sections = [
    {
      id: 'functionality',
      title: 'Ringkasan Fitur',
      description: 'Penjelasan lengkap fitur Urutkan Variabel',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-sm mb-4">
            Fitur "Urutkan Variabel" memungkinkan Anda mengatur ulang variabel 
            dalam "Tampilan Variabel" berdasarkan properti dari kolom mana pun.
          </p>
          
          <div className="space-y-3">
            <HelpCard title="Pengurutan Berbasis Atribut" variant="feature">
              <p className="text-sm">
                Anda dapat memilih kolom mana pun dari grid tampilan variabel 
                (misalnya, "Nama", "Jenis", "Lebar") untuk digunakan sebagai kunci pengurutan.
              </p>
            </HelpCard>
            
            <HelpCard title="Arah Pengurutan" variant="feature">
              <p className="text-sm">
                Baik arah pengurutan naik maupun turun didukung.
              </p>
            </HelpCard>
            
            <HelpCard title="Pembaruan Dataset Lengkap" variant="feature">
              <p className="text-sm">
                Fitur ini melakukan pembaruan komprehensif. Ini mengurutkan ulang 
                array variabel dan secara fisik mengatur ulang kolom data agar sesuai
                dengan urutan variabel baru, memastikan integritas data.
              </p>
            </HelpCard>
            
            <HelpCard title="Aplikasi Langsung" variant="feature">
              <p className="text-sm">
                Pengurutan diterapkan langsung ke dataset Anda saat ini, dan perubahan
                disimpan dalam status aplikasi.
              </p>
            </HelpCard>
          </div>
          
          <HelpAlert variant="info" title="Catatan Penting">
            <p className="text-sm mt-2">
              Pengurutan variabel mengubah struktur fisik dataset Anda,
              termasuk urutan kolom dalam array data.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja',
      description: 'Proses pengurutan variabel langkah demi langkah',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpSection title="Langkah 1: Inisialisasi">
            <p className="text-sm">
              Anda membuka modal "Urutkan Variabel". UI menampilkan daftar
              atribut variabel yang dapat diurutkan.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Interaksi Pengguna">
            <p className="text-sm">
              Anda memilih atribut (misalnya, "Nama") dan arah pengurutan
              (misalnya, "Naik").
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 3: Eksekusi">
            <div className="space-y-2">
              <p className="text-sm mb-2">Proses eksekusi meliputi:</p>
              <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                <li>Anda mengklik tombol "OK"</li>
                <li>
                  Sistem mengurutkan array variabel berdasarkan atribut dan
                  arah yang Anda pilih. Posisi setiap variabel diperbarui
                  untuk mencerminkan lokasi barunya.
                </li>
                <li>
                  Sistem kemudian menghitung posisi baru untuk setiap kolom data
                  dan mengembalikan dataset yang baru diurutkan.
                </li>
                <li>
                  Status aplikasi diperbarui dengan daftar variabel baru
                  dan array data.
                </li>
              </ul>
            </div>
          </HelpSection>
          
          <HelpAlert variant="success" title="Hasil Akhir">
            <p className="text-sm mt-2">
              Dataset Anda akan memiliki urutan kolom baru berdasarkan
              kriteria pengurutan yang dipilih, dengan integritas data terjaga.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Pengurutan Efektif',
      content: 'Pilih atribut yang paling relevan dengan kebutuhan analisis Anda untuk hasil pengurutan yang optimal.'
    },
    {
      type: 'info' as const,
      title: 'Integritas Data',
      content: 'Fitur ini memastikan konsistensi data dengan menata ulang kolom secara fisik.'
    },
    {
      type: 'warning' as const,
      title: 'Perubahan Permanen',
      content: 'Pengurutan akan secara permanen mengubah struktur dataset Anda untuk sesi saat ini.'
    }
  ];

  const relatedTopics = [
    { title: 'Tampilan Variabel', href: '/help/data-guide/variable-view' },
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Restrukturisasi Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Urutkan Variabel"
      description="Panduan lengkap untuk menata ulang variabel dalam Tampilan Variabel berdasarkan properti kolom"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SortVarsGuide;