/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { RefreshCw, ArrowRightLeft, Settings, FileText } from 'lucide-react';

const RestructureGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar wizard restrukturisasi data',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini menyediakan wizard langkah demi langkah untuk dengan mudah merestrukturisasi dataset Anda. 
            Anda dapat mengubah data Anda antara format lebar dan panjang, atau mentranspose seluruh dataset Anda. 
            Ini berguna ketika format data Anda saat ini tidak sesuai dengan persyaratan analisis yang Anda inginkan.
          </p>
          
          <HelpAlert variant="info" title="Kapan Menggunakan Restrukturisasi Data">
            <p className="text-sm mt-2">
              Gunakan restrukturisasi data ketika format Anda saat ini tidak sesuai dengan kebutuhan analisis Anda. 
              Misalnya, analisis pengukuran berulang biasanya memerlukan format panjang, 
              sedangkan beberapa analisis multivariat bekerja lebih baik dengan data format lebar.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'restructure-methods',
      title: 'Metode Restrukturisasi',
      description: 'Opsi restrukturisasi data yang tersedia',
      icon: ArrowRightLeft,
      content: (
        <div className="space-y-4">
          <HelpCard title="Variabel ke Kasus" variant="feature">
            <p className="text-sm">
              Mengubah beberapa variabel (kolom) menjadi lebih sedikit variabel dengan membuat kasus baru (baris). 
              Ini mengonversi data format lebar ke format panjang, umumnya diperlukan untuk analisis pengukuran berulang.
            </p>
          </HelpCard>
          
          <HelpCard title="Kasus ke Variabel" variant="feature">
            <p className="text-sm">
              Kebalikan dari metode sebelumnya - mengubah beberapa kasus (baris) menjadi variabel (kolom). 
              Ini mengonversi data format panjang ke format lebar.
            </p>
          </HelpCard>
          
          <HelpCard title="Transpose All Data" variant="feature">
            <p className="text-sm">
              Menukar semua baris dan kolom pada seluruh dataset. Tidak memerlukan pemilihan variabel.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'wizard-flow',
      title: 'Alur Wizard',
      description: 'Panduan langkah demi langkah menggunakan wizard restrukturisasi',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p>
            Wizard memandu Anda melalui 3 langkah: Method → Variables → Options. Selesaikan tiap langkah
            sebelum melanjutkan.
          </p>
          
          <HelpSection title="Langkah 1: Pilih Metode Restrukturisasi (Method)">
            <p className="text-sm">
              Pilih salah satu dari tiga metode restrukturisasi yang dijelaskan di atas berdasarkan kebutuhan Anda.
            </p>
          </HelpSection>
          
          <HelpSection title="Langkah 2: Variabel (Variables)">
            <p className="text-sm mb-3">
              Berdasarkan metode yang dipilih, konfigurasikan variabel menggunakan antarmuka drag-and-drop:
            </p>
            
            <div className="space-y-3">
              <HelpCard title='Variables ke Kasus (Variables to Cases) — Target lists' variant="step">
                <ul className="text-sm space-y-1 mt-2">
          <li>• Variables to Restructure: variabel yang akan dikonversi jadi baris.</li>
          <li>• Index Variables: variabel pengelompokan (mis. Subject ID).</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='Kasus ke Variabel (Cases to Variables) — Target lists' variant="step">
                <ul className="text-sm space-y-1 mt-2">
          <li>• Variables to Restructure: variabel sumber nilai yang akan dipecah ke kolom.</li>
          <li>• Index Variables: variabel pengelompokan (mis. Subject ID).</li>
          <li>• Identifier Variables: variabel pembeda (mis. Time) — maksimal 1.</li>
                </ul>
              </HelpCard>
              
              <HelpCard title='Transpose Semua Data (Transpose All Data)' variant="step">
                <ul className="text-sm space-y-1 mt-2">
                  <li>• Tidak diperlukan konfigurasi tambahan</li>
                  <li>• Sistem akan menukar semua baris dan kolom secara otomatis</li>
                </ul>
              </HelpCard>
            </div>
          </HelpSection>
          <HelpSection title="Langkah 3: Opsi (Options)">
            <div className="space-y-3 text-sm">
              <p>
                Opsi yang tersedia mengikuti metode yang dipilih:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Variables to Cases</strong>: Create count variable; Create index variable.</li>
                <li><strong>Cases to Variables</strong>: Drop empty variables.</li>
                <li>Transpose All Data: Tidak ada opsi tambahan.</li>
              </ul>
            </div>
          </HelpSection>
          
          <HelpAlert variant="warning" title="Penting">
            <p className="text-sm mt-2">
              Restrukturisasi data dapat mengubah struktur dataset Anda secara signifikan. 
              Pastikan Anda memahami implikasinya sebelum menerapkan perubahan.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'best-practices',
      title: 'Tips dan Praktik Terbaik',
      description: 'Praktik terbaik untuk restrukturisasi data yang efektif',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpCard title="Cadangkan Data Anda" variant="step">
              <p className="text-sm">
                Selalu buat cadangan dataset Anda sebelum restrukturisasi besar 
                untuk mencegah kehilangan data.
              </p>
            </HelpCard>
            
            <HelpCard title="Validasi Hasil" variant="step">
              <p className="text-sm">
                Periksa hasil untuk memastikan tidak ada data yang hilang atau terdistorsi selama proses.
              </p>
            </HelpCard>
            
            <HelpCard title="Uji dengan Subset" variant="step">
              <p className="text-sm">
                Coba restrukturisasi dengan subset kecil data Anda terlebih dahulu 
                sebelum menerapkan ke seluruh dataset.
              </p>
            </HelpCard>
            
            <HelpCard title="Dokumentasikan Perubahan" variant="step">
              <p className="text-sm">
                Catat langkah-langkah restrukturisasi Anda untuk reproduktibilitas dan referensi masa depan.
              </p>
            </HelpCard>
          </div>
          
          <HelpAlert variant="success" title="Tips Pro">
            <p className="text-sm mt-2">
              Tinjau ringkasan di langkah Options (Method dan jumlah variabel terpilih) sebelum mengeksekusi.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Rencanakan Format Anda',
      content: 'Rencanakan struktur data yang diinginkan sebelum memulai restrukturisasi untuk hasil yang optimal.'
    },
    {
      type: 'info' as const,
      title: 'Kompatibilitas Analisis',
      content: 'Pastikan format data yang dihasilkan kompatibel dengan jenis analisis yang Anda rencanakan.'
    },
    {
      type: 'warning' as const,
      title: 'Validasi Integritas',
      content: 'Selalu validasi integritas data setelah restrukturisasi untuk memastikan tidak ada data yang hilang.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Transpose Data', href: '/help/data-guide/transpose' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Agregasi Data', href: '/help/statistics-guide/descriptive' }
  ];

  return (
    <HelpGuideTemplate
      title="Panduan Restrukturisasi Data"
      description="Wizard langkah demi langkah untuk merestrukturisasi dataset Anda dengan mudah"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default RestructureGuide;