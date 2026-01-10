/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { ArrowUpDown, Database, Settings } from 'lucide-react';

const TransposeGuide = () => {
  const sections = [
    {
      id: 'interface',
      title: 'Antarmuka & Fungsionalitas Komponen',
      description: 'Komponen utama dalam fitur transpose',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Daftar Variabel Tersedia" variant="feature">
            <p className="text-sm">
              Menampilkan semua variabel yang tersedia dalam dataset Anda saat ini.
            </p>
          </HelpCard>
          
          <HelpCard title="Variabel untuk Ditranspose" variant="feature">
            <p className="text-sm">
              Daftar ini menyimpan variabel yang telah Anda pilih untuk menjadi baris
              dalam dataset baru Anda.
            </p>
          </HelpCard>
          
          <HelpCard title="Variabel Nama (Opsional)" variant="feature">
            <p className="text-sm">
              Bidang ini bersifat opsional. Anda dapat memindahkan <strong>satu</strong>{' '}
              variabel ke sini. Nilai dari setiap baris variabel ini akan
              digunakan sebagai nama untuk variabel baru (kolom) yang akan dibuat.
            </p>
          </HelpCard>
          
          <HelpAlert variant="info" title="Tips Penggunaan">
            <p className="text-sm mt-2">
              Seret dan lepas variabel antar komponen untuk mengkonfigurasi pengaturan transpose Anda.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'new-variables',
      title: 'Variabel Baru yang Dibuat',
      description: 'Variabel yang akan dibuat setelah transpose',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpCard title="case_lbl" variant="feature">
            <p className="text-sm">
              Variabel ini dibuat secara otomatis. Kolom ini akan berisi
              nama-nama variabel asli yang Anda pilih untuk ditranspose.
            </p>
          </HelpCard>
          
          <HelpCard title="Variabel Kasus Baru" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                Variabel baru (kolom) akan dibuat, satu untuk setiap kasus (baris) dalam data asli Anda.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HelpCard title="Tanpa Variabel Nama" variant="step">
                  <p className="text-sm">
                    Nama kolom baru akan menjadi `Var1`, `Var2`, `Var3`, dan seterusnya.
                  </p>
                </HelpCard>
                
                <HelpCard title="Dengan Variabel Nama" variant="step">
                  <p className="text-sm">
                    Nama kolom baru akan diambil dari nilai dalam variabel tersebut.
                  </p>
                </HelpCard>
              </div>
            </div>
          </HelpCard>
          
          <HelpAlert variant="success" title="Hasil Transpose">
            <p className="text-sm mt-2">
              Struktur data Anda akan berubah dari format lebar ke format panjang atau sebaliknya.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'examples',
      title: 'Contoh Penggunaan',
      description: 'Skenario praktis penggunaan transpose',
      icon: ArrowUpDown,
      content: (
        <div className="space-y-4">
          <HelpCard title="Skenario 1: Transpose Sederhana (Lebar ke Panjang)" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                Anda memiliki data penjualan kuartalan dengan kolom `Q1`, `Q2`, `Q3`, `Q4`. 
                Anda ingin setiap kuartal menjadi baris.
              </p>
              
              <HelpSection title="Langkah:">
                <ol className="list-decimal list-inside ml-4 text-sm space-y-1">
                  <li>Pindahkan variabel `Q1`, `Q2`, `Q3`, dan `Q4` ke daftar "Variabel".</li>
                  <li>Biarkan "Variabel Nama" kosong.</li>
                  <li>Klik OK.</li>
                </ol>
              </HelpSection>
            </div>
          </HelpCard>
          
          <HelpCard title="Skenario 2: Menggunakan Nilai sebagai Nama Kolom" variant="feature">
            <div className="space-y-3">
              <p className="text-sm">
                Anda memiliki data tahunan dengan kolom `Product_ID`, `Year_2020`, `Year_2021`, `Year_2022`. 
                Anda ingin setiap tahun menjadi baris dan menggunakan `Product_ID` sebagai nama kolom baru.
              </p>
              
              <HelpSection title="Langkah:">
                <ol className="list-decimal list-inside ml-4 text-sm space-y-1">
                  <li>Move `Year_2020`, `Year_2021`, `Year_2022` to the "Variable(s)" list.</li>
                  <li>Move `Product_ID` to the "Name Variable" list.</li>
                  <li>Click OK.</li>
                </ol>
              </HelpSection>
            </div>
          </HelpCard>
          
          <HelpAlert variant="warning" title="Important">
            <p className="text-sm mt-2">
              Ensure selected variables have compatible data types for transposition.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];


  const tips = [
    {
      type: 'tip' as const,
      title: 'Variabel Nama',
      content: 'Gunakan variabel nama untuk memberikan nama yang bermakna untuk kolom baru.'
    },
    {
      type: 'info' as const,
      title: 'case_lbl',
      content: 'Variabel case_lbl akan dibuat secara otomatis untuk menyimpan nama variabel asli.'
    },
    {
      type: 'warning' as const,
      title: 'Jenis Data',
      content: 'Pastikan variabel yang ditranspose memiliki jenis data yang konsisten.'
    }
  ];

  const relatedTopics = [
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Restrukturisasi Data', href: '/help/data-guide/restructure' },
    { title: 'Urutkan Variabel', href: '/help/data-guide/sort-vars' },
    { title: 'Gabung Data', href: '/help/data-guide/merge' }
  ];

  return (
    <HelpGuideTemplate
      title="Fitur Transpose Data"
      description="Panduan ini menjelaskan fungsionalitas 'Transpose', alat yang kuat untuk merestrukturisasi dataset Anda dengan menukar baris dan kolom."
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};

export default TransposeGuide;