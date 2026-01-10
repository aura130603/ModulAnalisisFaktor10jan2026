/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert } from '../../ui/HelpLayout';
import { Calendar, Clock, Settings } from 'lucide-react';

const DefineDateTimeGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Panduan lengkap untuk mengatur struktur tanggal dan waktu untuk data Anda',
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p>
            Fitur Definisi Tanggal membantu Anda membuat struktur berbasis waktu untuk data Anda. 
            Ketika Anda memilih format tanggal (seperti "Tahun, kuartal, bulan"), sistem secara otomatis:
          </p>
          <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
            <li>
              <strong>Membuat variabel baru</strong> untuk setiap komponen waktu yang Anda butuhkan
              (seperti YEAR_, QUARTER_, MONTH_).
            </li>
            <li>
              <strong>Membangun variabel tanggal yang diformat</strong> yang disebut DATE_ yang menampilkan
              tanggal lengkap dalam format yang mudah dibaca.
            </li>
            <li>
              <strong>Menampilkan pratinjau</strong> dengan contoh data sehingga Anda dapat melihat
              persis bagaimana struktur tanggal Anda akan terlihat.
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'functionality',
      title: 'Cara Kerjanya',
      description: 'Memahami proses langkah demi langkah',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Pengaturan Otomatis">
            <p className="text-sm mt-2">
              Setelah Anda memilih format tanggal, sistem secara otomatis mengatur variabel Anda 
              sehingga analisis deret waktu akan bekerja dengan benar dengan data Anda.
            </p>
          </HelpAlert>
          
          <div className="space-y-4">
            <h4 className="font-semibold">Contoh: Tahun dan Bulan</h4>
            <HelpCard title="Yang Akan Anda Dapatkan" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pilihan Anda</strong>: Tahun, bulan</li>
                <li><strong>Nilai awal</strong>: Tahun: 2022, Bulan: 11</li>
                <li><strong>Variabel baru yang dibuat</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>YEAR_</code> - menampilkan tahun (2022)</li>
                    <li><code>MONTH_</code> - menampilkan bulan (11)</li>
                    <li><code>DATE_</code> - menampilkan tanggal terformat (2022-11)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
            
            <h4 className="font-semibold">Contoh: Minggu dan Hari Kerja</h4>
            <HelpCard title="Yang Akan Anda Dapatkan" variant="feature">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Pilihan Anda</strong>: Minggu, hari kerja (minggu 5 hari)</li>
                <li><strong>Nilai awal</strong>: Minggu: 51, Hari kerja: 4</li>
                <li><strong>Variabel baru yang dibuat</strong>:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code>WEEK_</code> - menampilkan nomor minggu (51)</li>
                    <li><code>WDAY_</code> - menampilkan hari kerja (4)</li>
                    <li><code>DATE_</code> - menampilkan tanggal terformat (51-4)</li>
                  </ul>
                </li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    },
    {
      id: 'supported-formats',
      title: 'Format yang Tersedia',
      description: 'Pilih format tanggal yang tepat untuk data Anda',
      icon: Clock,
      content: (
        <div className="space-y-4">
          <p>
            Berikut adalah semua format tanggal yang dapat Anda pilih. Setiap opsi membuat
            variabel yang tepat dan variabel DATE_ terformat untuk kebutuhan Anda.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <HelpCard title="Format Dasar" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Tahun saja</li>
                <li>Tahun, kuartal</li>
                <li>Tahun, bulan</li>
                <li>Year, quarter, month</li>
                <li>Day only</li>
                <li>Week, day</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Workday Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Week, workday (5-day week)</li>
                <li>Week, workday (6-day week)</li>
                <li>Day, work hours (8-hour)</li>
                <li>Week, workday, hour</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="Time Formats" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Hour only</li>
                <li>Day, hour</li>
                <li>Week, day, hour</li>
                <li>Minute only</li>
                <li>Hour, minute</li>
                <li>Day, hour, minute</li>
              </ul>
            </HelpCard>
            
            <HelpCard title="High Precision" variant="step">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Second only</li>
                <li>Minute, second</li>
                <li>Hour, minute, second</li>
                <li>Remove date (clears existing date definition)</li>
              </ul>
            </HelpCard>
          </div>
        </div>
      )
    },
  ];



  const tips = [
    {
      type: 'tip' as const,
      title: 'Rencanakan Format Anda',
      content: 'Pikirkan struktur tanggal Anda sebelum memulai analisis deret waktu untuk hasil terbaik.'
    },
    {
      type: 'info' as const,
      title: 'Pratinjau Data Anda',
      content: 'Sistem menampilkan contoh data sehingga Anda dapat melihat persis bagaimana tanggal Anda akan terlihat.'
    },
    {
      type: 'warning' as const,
      title: 'Simpan Pekerjaan Anda',
      content: 'Pengaturan tanggal Anda mempengaruhi semua analisis deret waktu, jadi simpan dataset Anda setelah mengatur tanggal.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Analisis Deret Waktu', href: '/help/statistics-guide' },
    { title: 'Properti Variabel', href: '/help/data-guide/define-var-props' },
    { title: 'Restrukturisasi Data', href: '/help/data-guide/restructure' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Definisi Tanggal"
      description="Panduan lengkap untuk mengatur struktur berbasis waktu untuk dataset Anda"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DefineDateTimeGuide;