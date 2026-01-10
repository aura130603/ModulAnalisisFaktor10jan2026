/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Copy, Search, Filter } from 'lucide-react';

const DuplicateCasesGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Pengantar fitur Identifikasi Kasus Duplikat',
      icon: Copy,
      content: (
        <div className="space-y-4">
          <p>
            Fitur ini membantu Anda menemukan dan mengelola kasus duplikat dalam dataset Anda berdasarkan variabel pencocokan yang Anda pilih.
          </p>
          
          <HelpAlert variant="info" title="Apa yang Dilakukannya">
            <ul className="list-disc list-inside text-sm space-y-1 mt-2">
              <li>Mengidentifikasi kasus duplikat berdasarkan nilai identik dalam satu atau lebih variabel</li>
              <li>Membuat variabel indikator baru untuk menandai kasus mana yang "primer" dan mana yang "duplikat"</li>
              <li>Mengurutkan kasus dalam kelompok duplikat untuk menentukan kasus primer</li>
              <li>Membantu Anda mengelola hasil dengan mengatur ulang data atau memfilter kasus duplikat</li>
            </ul>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'specifications',
  title: 'Fitur & Opsi',
      description: 'Fitur dan opsi yang tersedia',
      icon: Search,
      content: (
        <div className="space-y-4">
          <HelpCard title="Tab Variabel (Variables)" variant="feature">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><strong>Define matching cases by</strong>: daftar variabel kunci untuk mendeteksi grup duplikat.</li>
              <li><strong>Sort within matching groups by</strong>: variabel pengurutan dalam grup; pilih Ascending/Descending.</li>
            </ul>
          </HelpCard>
          <HelpCard title="Variabel Indikator Baru" variant="feature">
            <p className="text-sm mb-3">
              Fitur ini dapat membuat dua variabel baru untuk membantu analisis duplikat:
            </p>
            
            <HelpSection title="1. Primary Case Indicator">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Function</strong>: Creates a variable (default: <code>PrimaryLast</code>) that marks each case as primary (value 1) or duplicate (value 0)</li>
                <li><strong>Choice</strong>: You can choose whether the <strong>first</strong> or <strong>last</strong> case in each duplicate group is considered primary</li>
                <li><strong>Custom Name</strong>: You can change the variable name to suit your needs</li>
              </ul>
            </HelpSection>
            
            <HelpSection title="2. Penghitung Urutan">
              <ul className="list-disc list-inside text-sm space-y-1">
                <li><strong>Fungsi</strong>: Membuat variabel (default: <code>MatchSequence</code>) yang memberikan nomor urutan untuk setiap kasus dalam kelompok duplikat (1, 2, 3, ...)</li>
                <li><strong>Penggunaan</strong>: Membantu Anda melihat berapa banyak duplikat yang ada dalam setiap kelompok</li>
                <li><strong>Nama Kustom</strong>: Anda dapat mengubah nama variabel sesuai kebutuhan</li>
              </ul>
            </HelpSection>
          </HelpCard>
          
          <HelpCard title="Tab Opsi (Options) — File Management & Output" variant="feature">
            <div className="space-y-3">
              <HelpSection title="1. Pindahkan Kasus Duplikat ke Atas">
                <p className="text-sm">
      Label UI: <em>Move matching cases to the top of the file</em>. Memindahkan grup duplikat ke bagian atas dataset.
                </p>
              </HelpSection>
              
              <HelpSection title="2. Filter Kasus Duplikat">
                <p className="text-sm">
      Label UI: <em>Filter out duplicate cases after processing</em>. Menyaring non-primer (indikator = 0) dari tampilan.
                </p>
              </HelpSection>
              
              <HelpSection title="3. Tampilkan Frekuensi">
                <p className="text-sm">
      Label UI: <em>Display frequencies for created variables</em>.
                </p>
              </HelpSection>
            </div>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Contoh Penggunaan',
      description: 'Skenario praktis untuk menggunakan fitur ini',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <HelpCard title="Contoh 1: Temukan Duplikat Persis" variant="step">
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Pindahkan <strong>semua</strong> variabel ke dalam daftar "Definisikan kasus yang cocok berdasarkan"</li>
              <li>Pilih apakah kasus pertama atau terakhir yang harus menjadi primer</li>
              <li>Klik OK</li>
            </ol>
            <HelpAlert variant="success" title="Hasil">
              <p className="text-sm mt-2">
                Variabel <code>PrimaryLast</code> akan memiliki nilai 0 untuk setiap baris yang merupakan duplikat persis dari baris lain.
              </p>
            </HelpAlert>
          </HelpCard>
          
          <HelpCard title="Contoh 2: Buat Dataset Bebas Duplikat" variant="step">
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Pindahkan variabel kunci (seperti ID Pelanggan, Email) ke daftar "Definisikan kasus yang cocok berdasarkan"</li>
              <li>Di tab <strong>Opsi</strong>, centang "Filter kasus duplikat setelah pemrosesan"</li>
              <li>Klik OK</li>
            </ol>
            <HelpAlert variant="success" title="Hasil">
              <p className="text-sm mt-2">
                Tampilan data Anda akan segera diperbarui untuk menampilkan hanya baris unik/primer.
              </p>
            </HelpAlert>
          </HelpCard>
        </div>
      )
    },
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Cadangkan Data Anda',
      content: 'Selalu cadangkan dataset Anda sebelum memproses duplikat untuk mencegah kehilangan data.'
    },
    {
      type: 'info' as const,
      title: 'Pilih Variabel Kunci',
      content: 'Pilih variabel kunci yang tepat untuk mendefinisikan kriteria duplikasi yang sesuai dengan kebutuhan analisis Anda.'
    },
    {
      type: 'warning' as const,
      title: 'Tinjau Hasil',
      content: 'Selalu tinjau hasil deteksi duplikat sebelum menghapus atau memfilter data secara permanen.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Pilih Kasus', href: '/help/data-guide/select-cases' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Properti Variabel', href: '/help/data-guide/define-var-props' }
  ];

  return (
    <HelpGuideTemplate
      title="Identifikasi Kasus Duplikat"
      description="Panduan lengkap untuk menemukan dan menandai kasus duplikat dalam dataset Anda berdasarkan variabel yang cocok"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default DuplicateCasesGuide;