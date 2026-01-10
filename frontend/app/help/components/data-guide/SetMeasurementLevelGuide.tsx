import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Ruler, Hash, Settings } from 'lucide-react';

export default function SetMeasurementLevelGuide() {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar fitur Atur Tingkat Pengukuran',
      icon: Ruler,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini membantu Anda dengan cepat mendefinisikan tingkat pengukuran untuk variabel Anda.
            Ketika dibuka, fitur ini secara otomatis mendeteksi dan menampilkan semua variabel dalam dataset Anda
            yang belum ditentukan tingkat pengukurannya. Anda dapat dengan mudah memindahkan
            variabel-variabel ini ke kategori yang sesuai menggunakan antarmuka yang intuitif.
          </p>
          
          <HelpAlert variant="info" title="Mengapa Ini Penting">
            <p className="text-sm mt-2">
              Tingkat pengukuran menentukan analisis statistik apa yang dapat Anda lakukan
              dan cara menginterpretasikan hasil Anda. Klasifikasi yang tepat sangat penting
              untuk analisis yang valid.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'interface',
      title: 'Antarmuka dan Komponen',
      description: 'Komponen dalam modal Atur Tingkat Pengukuran',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Daftar Variabel Tersedia" variant="feature">
            <p className="text-sm">
              Menampilkan semua variabel dengan tingkat pengukuran yang tidak diketahui.
              Variabel-variabel ini muncul secara otomatis ketika modal dibuka.
            </p>
          </HelpCard>
          
          <HelpCard title="Daftar Target" variant="feature">
            <p className="text-sm mb-3">
              Tiga kotak terpisah untuk menampung variabel berdasarkan tingkat pengukurannya:
            </p>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Nominal</p>
                <p className="text-xs">
                  Untuk data kategorikal tanpa urutan (misalnya, &apos;Jenis Kelamin&apos;, &apos;Kota&apos;).
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Ordinal</p>
                <p className="text-xs">
                  Untuk data kategorikal dengan urutan (misalnya, &apos;Tingkat Pendidikan&apos;, &apos;Kepuasan Pelanggan&apos;).
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-700 p-3 rounded-lg">
                <p className="font-semibold text-sm mb-1">Skala</p>
                <p className="text-xs">
                  Untuk data kuantitatif/numerik (misalnya, &apos;Umur&apos;, &apos;Pendapatan&apos;).
                </p>
              </div>
            </div>
          </HelpCard>
          
          <HelpCard title="Tombol Panah" variant="feature">
            <p className="text-sm">
              Memungkinkan Anda memindahkan variabel yang disorot dari daftar &quot;Tersedia&quot;
              ke daftar target yang sesuai. Pilih variabel terlebih dahulu, kemudian klik
              tombol panah yang menunjuk ke kategori yang Anda inginkan.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Alur Kerja dan Contoh Penggunaan',
      description: 'Panduan langkah demi langkah untuk menggunakan fitur ini',
      icon: Hash,
      content: (
        <div className="space-y-4">
          <HelpSection title="Langkah 1: Inisialisasi">
            <p className="text-sm">
              Ketika Anda membuka modal, semua variabel dengan tingkat pengukuran yang tidak diketahui
              secara otomatis dimuat ke dalam daftar &quot;Tersedia&quot;.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Interaksi Pengguna">
            <p className="text-sm">
              Pilih satu atau lebih variabel dari daftar &quot;Tersedia&quot;
              dan gunakan tombol panah untuk memindahkannya ke kategori yang sesuai
              yaitu Nominal, Ordinal, atau Skala.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 3: Simpan Perubahan">
            <p className="text-sm">
              Klik **OK** dan tingkat pengukuran untuk variabel yang dipindahkan
              akan diperbarui secara permanen dalam dataset Anda.
            </p>
          </HelpSection>
          
          <HelpAlert variant="success" title="Tips Penggunaan">
            <div className="text-sm mt-2 space-y-1">
              <p>• Anda dapat memilih beberapa variabel sekaligus melalui antarmuka pemilihan yang tersedia</p>
              <p>• Variabel dapat dipindahkan kembali jika Anda berubah pikiran tentang kategorinya</p>
              <p>• Perubahan hanya disimpan setelah mengklik OK</p>
            </div>
          </HelpAlert>
        </div>
      )
    }
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Identifikasi Cepat',
      content: 'Pertimbangkan sifat data Anda: apakah kategorikal (nominal/ordinal) atau numerik (skala)?'
    },
    {
      type: 'info' as const,
      title: 'Seleksi Berganda',
  content: 'Gunakan fitur seleksi berganda pada dialog untuk memilih beberapa variabel sekaligus dan memindahkannya bersamaan.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Hasil',
      content: 'Selalu periksa kembali kategori yang dipilih sebelum menyimpan perubahan.'
    }
  ];

  const relatedTopics = [
    { title: 'Properti Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Panduan Jenis Data', href: '/help/data-guide' },
    { title: 'Statistik Deskriptif', href: '/help/statistics-guide/descriptive' },
    { title: 'Validasi Data', href: '/help/data-guide/unusual-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Atur Tingkat Pengukuran"
      description="Panduan ini memberikan gambaran umum tentang fitur 'Atur Tingkat Pengukuran' yang memungkinkan Anda secara efisien mendefinisikan tingkat pengukuran (Nominal, Ordinal, atau Skala) untuk variabel yang saat ini memiliki tingkat pengukuran 'Tidak Diketahui'."
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
}