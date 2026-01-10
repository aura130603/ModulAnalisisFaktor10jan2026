/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Settings, FileText } from 'lucide-react';

const DefineVarPropsGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar fitur Definisi Properti Variabel',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p>
            Fitur Definisi Properti Variabel membantu Anda meninjau dan mengatur 
            variabel data Anda dengan benar. Ini bekerja dalam dua langkah sederhana:
          </p>
          
          <HelpCard title="Proses Dua Langkah" variant="feature">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                <strong>Tinjau</strong>: Pilih variabel dari dataset Anda dan 
                tinjau properti dan nilai mereka saat ini.
              </li>
              <li>
                <strong>Edit</strong>: Perbarui nama variabel, label, jenis, dan 
                properti lainnya untuk membuat data Anda siap untuk analisis.
              </li>
            </ol>
          </HelpCard>
          
          <HelpAlert variant="info" title="Tujuan Utama">
            <p className="text-sm mt-2">
              Fitur ini membantu memastikan data Anda diberi label dan diorganisir dengan benar, 
              yang penting untuk analisis yang akurat.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'workflow',
      title: 'Cara Kerjanya',
      description: 'Proses langkah demi langkah untuk menggunakan fitur',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini memandu Anda melalui proses dua langkah sederhana untuk mengatur variabel Anda.
          </p>
          
          <HelpSection title="Langkah 1: Pilih Variabel">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                Anda akan melihat dua daftar: "Variabel Tersedia" dan "Variabel untuk Ditinjau".
              </li>
              <li>
                Pindahkan variabel yang ingin Anda kerjakan dari "Tersedia" ke "Tinjau".
              </li>
              <li>
                Anda dapat menetapkan batas pada:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Berapa banyak baris yang akan ditinjau (berguna untuk dataset besar).</li>
                  <li>Berapa banyak nilai unik yang ditampilkan per variabel.</li>
                </ul>
              </li>
              <li>
                Klik "Lanjutkan" untuk pindah ke langkah berikutnya.
              </li>
            </ul>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Edit Properti">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>
                <strong>Grid Variabel</strong>: Variabel yang dipilih muncul dalam grid yang dapat diedit.
              </li>
              <li>
                <strong>Yang Dapat Anda Edit</strong>:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li><strong>Nama</strong>: Nama variabel.</li>
                  <li><strong>Label</strong>: Label deskriptif untuk variabel.</li>
                  <li><strong>Tingkat Pengukuran</strong>: Atur ke Nominal, Ordinal, atau Skala.</li>
                  <li><strong>Peran</strong>: Tentukan bagaimana variabel digunakan (Input, Target, dll.).</li>
                  <li><strong>Jenis</strong>: Atur jenis data (Numerik, String, Tanggal).</li>
                </ul>
              </li>
              <li>
                <strong>Saran Otomatis</strong>: Gunakan tombol "Sarankan Tingkat Pengukuran" 
                untuk mendapatkan rekomendasi berdasarkan data Anda.
              </li>
              <li>
                <strong>Label Nilai</strong>: Untuk setiap nilai unik yang ditemukan dalam data Anda, Anda dapat:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Menambahkan label teks deskriptif.</li>
                  <li>Menandai nilai tertentu sebagai "Hilang".</li>
                </ul>
              </li>
              <li>
                <strong>Simpan Perubahan</strong>: Klik "OK" untuk menyimpan perubahan Anda.
              </li>
            </ul>
          </HelpSection>
          
          <HelpAlert variant="success" title="Manfaat">
            <p className="text-sm mt-2">
              Proses ini memastikan variabel Anda diberi label dan diorganisir dengan benar, 
              membuat data Anda siap untuk analisis yang akurat.
            </p>
          </HelpAlert>
        </div>
      )
    },
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Tips Kinerja',
      content: 'Gunakan batas yang wajar untuk dataset besar agar proses berjalan dengan lancar.'
    },
    {
      type: 'info' as const,
      title: 'Saran Otomatis',
      content: 'Gunakan fitur "Sarankan Tingkat Pengukuran" untuk mendapatkan rekomendasi yang berguna.'
    },
    {
      type: 'warning' as const,
      title: 'Periksa Pekerjaan Anda',
      content: 'Selalu periksa kembali pengaturan nilai yang hilang untuk memastikan analisis yang akurat.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Atur Tingkat Pengukuran', href: '/help/data-guide/set-measurement-level' },
    { title: 'Definisi Tanggal Waktu', href: '/help/data-guide/define-date-time' },
    { title: 'Pilih Kasus', href: '/help/data-guide/select-cases' }
  ];

  return (
    <HelpGuideTemplate
      title="Definisi Properti Variabel"
      description="Panduan lengkap untuk meninjau dan mengatur variabel data Anda"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DefineVarPropsGuide;