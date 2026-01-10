/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Scale, Settings } from 'lucide-react';

const WeightCasesGuide = () => {
  const sections = [
    {
      id: 'functionality',
      title: 'Ringkasan Fitur',
      description: 'Penjelasan fitur pembobotan kasus',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <HelpCard title="Pembobotan Berbasis Variabel" variant="feature">
            <p className="text-sm">
              Anda dapat memilih satu variabel numerik dari daftar yang tersedia.
              Nilai dari variabel ini akan digunakan untuk membobot setiap kasus.
            </p>
          </HelpCard>
          
          <HelpCard title="Validasi Jenis" variant="feature">
            <p className="text-sm">
              Dialog secara otomatis memfilter daftar untuk hanya menampilkan variabel numerik
              sebagai kandidat yang valid untuk pembobotan.
            </p>
          </HelpCard>
          
          <HelpCard title="Pengecualian Kasus" variant="feature">
            <p className="text-sm">
              Setiap kasus dengan nilai nol, negatif, atau hilang untuk variabel
              pembobotan yang dipilih akan secara otomatis dikecualikan dari analisis
              yang menggunakan bobot ini.
            </p>
          </HelpCard>
          
          <HelpCard title="Pengaturan Global" variant="feature">
            <p className="text-sm">
              Konfigurasi pembobotan adalah pengaturan global. Dialog menampilkan
              variabel pembobotan yang sedang aktif, atau "Jangan membobot kasus"
              jika tidak ada yang dipilih.
            </p>
          </HelpCard>
          
          <HelpCard title="Menonaktifkan Pembobotan" variant="feature">
            <p className="text-sm">
              Untuk mematikan pembobotan, cukup hapus variabel dari
              daftar "Bobot kasus berdasarkan" dan konfirmasi dengan mengklik "OK".
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Catatan Penting">
            <p className="text-sm mt-2">
              Pembobotan kasus mempengaruhi semua analisis statistik yang dilakukan setelah aktivasi.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja',
      description: 'Penggunaan fitur langkah demi langkah',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Langkah 1: Inisialisasi">
            <p className="text-sm">
              Modal menginisialisasi, mengambil daftar variabel dan status bobot saat ini.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Tampilan">
            <p className="text-sm">
              UI merender dialog dengan variabel yang tersedia dan
              variabel bobot yang dipilih saat ini (jika ada).
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 3: Seleksi">
            <p className="text-sm">
              Anda memindahkan variabel numerik ke dalam daftar target "Bobotkan kasus berdasarkan".
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 4: Konfirmasi">
            <p className="text-sm">
              Anda mengklik "OK". Ini memicu penyimpanan status bobot global.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 5: Pembaruan Global">
            <p className="text-sm">
              Penyimpanan global diperbarui dengan nama variabel bobot baru
              (atau string kosong jika tidak ada yang dipilih).
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 6: Penyelesaian">
            <p className="text-sm">
              Dialog tertutup.
            </p>
          </HelpSection>
          
          <HelpAlert variant="success" title="Proses Selesai">
            <p className="text-sm mt-2">
              Setelah selesai, pembobotan akan aktif untuk semua analisis berikutnya.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Validasi Variabel',
      content: 'Pastikan variabel pembobot yang dipilih adalah variabel numerik yang valid.'
    },
    {
      type: 'warning' as const,
      title: 'Nilai Tidak Valid',
      content: 'Kasus dengan nilai nol, negatif, atau hilang akan dikecualikan dari analisis.'
    },
    {
      type: 'info' as const,
      title: 'Pengaturan Global',
      content: 'Pembobotan adalah pengaturan global yang mempengaruhi semua analisis.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Analisis Statistik', href: '/help/statistics-guide' },
    { title: 'Jenis Variabel', href: '/help/data-guide/variable-types' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Pembobotan Kasus"
      description="Panduan ini menjelaskan fungsionalitas Pembobotan Kasus, yang memungkinkan Anda menerapkan bobot kasus pada dataset berdasarkan nilai dari variabel numerik"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default WeightCasesGuide;