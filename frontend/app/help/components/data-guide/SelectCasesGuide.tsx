/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { Filter, Settings, FileText } from 'lucide-react';

const SelectCasesGuide = () => {
  const sections = [
    {
      id: 'selection-methods',
  title: 'Metode Seleksi (Select) ',
      description: 'Berbagai cara untuk memilih kasus dalam dataset Anda',
      icon: Filter,
      content: (
        <div className="space-y-4">
          <HelpCard title="Semua Kasus" variant="feature">
            <p className="text-sm">
              Pilih opsi ini untuk menyertakan semua kasus dalam dataset Anda. Ini secara efektif
              menghapus filter yang diterapkan sebelumnya.
            </p>
          </HelpCard>
          
          <HelpCard title="Jika kondisi terpenuhi (If condition is satisfied)" variant="feature">
            <p className="text-sm mb-3">
              Buat ekspresi logis untuk memfilter kasus. Hanya kasus yang memenuhi
              kondisi Anda yang akan dipilih.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-sm mb-1">Operator yang tersedia:</p>
              <p className="text-xs font-mono">&gt;, &lt;, ==, != (perbandingan)</p>
              <p className="text-xs font-mono">& (DAN), | (ATAU), ~ (TIDAK)</p>
            </div>
          </HelpCard>
          
          <HelpCard title="Sampel acak kasus (Random sample of cases)" variant="feature">
            <p className="text-sm mb-3">Pilih subset acak dari kasus:</p>
            <div className="space-y-2 text-sm">
              <div><strong>Kurang Lebih</strong>: Memilih sekitar persentase tertentu dari total kasus.</div>
              <div><strong>Tepat</strong>: Memilih jumlah kasus yang tepat dari N kasus pertama.</div>
            </div>
          </HelpCard>
          
          <HelpCard title="Berdasarkan waktu atau rentang kasus (Based on time or case range)" variant="feature">
            <p className="text-sm">
              Pilih kasus berdasarkan posisi mereka dalam dataset Anda (indeks berbasis 1).
            </p>
          </HelpCard>
          
          <HelpCard title="Gunakan variabel filter (Use filter variable)" variant="feature">
            <p className="text-sm">
              Gunakan variabel yang ada sebagai filter. Nilai non-nol/non-kosong akan dipilih.
            </p>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'output-options',
  title: 'Output',
      description: 'Opsi untuk menangani kasus yang tidak dipilih',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Saring kasus yang tidak dipilih (Filter out unselected cases)" variant="step">
            <p className="text-sm">
              Filter diterapkan untuk menyembunyikan kasus yang tidak dipilih sementara. Variabel filter 
              (<code className="text-xs bg-gray-100 px-1 rounded">filter_$</code>) akan dibuat atau diperbarui. 
              Dataset asli Anda tetap utuh.
            </p>
          </HelpCard>
          
          <HelpCard title="Hapus kasus yang tidak dipilih (Delete unselected cases)" variant="step">
            <p className="text-sm">
              Kasus yang tidak dipilih akan{' '}
              <strong>dihapus secara permanen</strong> dari dataset Anda. Operasi ini
              tidak dapat dibatalkan.
            </p>
          </HelpCard>
          
          <HelpAlert variant="warning" title="Penting">
            <p className="text-sm mt-2">
              Selalu backup data Anda sebelum menggunakan opsi hapus permanen.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'usage-examples',
      title: 'Contoh Penggunaan',
      description: 'Contoh praktis menggunakan fitur Pilih Kasus',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <HelpSection title="Filter berdasarkan Kondisi">
            <p className="text-sm mb-2">
              Untuk memilih kasus di mana umur &gt; 30 DAN pendapatan &gt;= 50000:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <code className="text-sm font-mono">age &gt; 30 & income &gt;= 50000</code>
            </div>
          </HelpSection>
          
          <HelpSection title="Random sample">
            <p className="text-sm mb-2">
              Untuk membuat sampel acak 10%:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              1. Pilih "Sampel acak"<br/>
              2. Pilih "Kurang lebih"<br/>
              3. Masukkan "10"
            </div>
          </HelpSection>
          
      <HelpSection title="Case range">
            <p className="text-sm mb-2">
              Untuk memilih kasus 100 sampai 500:
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
        1. Pilih "Based on time or case range"<br/>
              2. Masukkan "100" di "Kasus Pertama"<br/>
              3. Masukkan "500" di "Kasus Terakhir"
            </div>
          </HelpSection>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Sintaks Kondisi',
      content: 'Gunakan tanda kutip untuk nilai string dan pastikan nama variabel dieja dengan benar.'
    },
    {
      type: 'warning' as const,
      title: 'Operasi Permanen',
      content: 'Hati-hati dengan opsi hapus permanen - operasi ini tidak dapat dibatalkan.'
    },
    {
      type: 'info' as const,
      title: 'Variabel Filter',
      content: 'Variabel filter_$ akan dibuat secara otomatis untuk melacak kasus yang dipilih.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Urutkan Kasus', href: '/help/data-guide/sort-cases' },
    { title: 'Bobot Kasus', href: '/help/data-guide/weight-cases' },
    { title: 'Pisah File', href: '/help/data-guide/split-file' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Pilih Kasus"
      description="Panduan ini menjelaskan fitur Pilih Kasus, yang memungkinkan Anda memfilter atau menghapus baris (kasus) berdasarkan berbagai kriteria."
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default SelectCasesGuide;