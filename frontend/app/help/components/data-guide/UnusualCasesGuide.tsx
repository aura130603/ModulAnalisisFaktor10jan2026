/* eslint-disable react/no-unescaped-entities */
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpSection } from '../../ui/HelpLayout';
import { SearchCheck, Settings, SlidersHorizontal } from 'lucide-react';

const UnusualCasesGuide = () => {
  const sections = [
    {
      id: 'overview',
      title: 'Ringkasan',
      description: 'Mengidentifikasi kasus yang tidak biasa berdasarkan indeks anomali',
      icon: SearchCheck,
      content: (
        <div className="space-y-4">
          <p>
            Fitur Identify Unusual Cases membantu menemukan kasus yang berbeda secara signifikan
            dari rekan-rekannya. Anda memilih variabel analisis dan (opsional) variabel pengenal kasus,
            lalu menetapkan kriteria identifikasi di tab Options.
          </p>
          <HelpAlert variant="info" title="Catatan">
            Saat ini panduan ini mencakup konfigurasi variabel dan kriteria di tab Options.
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'variables',
      title: 'Konfigurasi Variabel',
      description: 'Mengatur variabel analisis dan pengenal kasus',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpSection title="Analysis Variables">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Seret variabel dari daftar Available ke Analysis Variables.</li>
              <li>Anda dapat menyusun ulang urutan dengan drag-and-drop.</li>
              <li>Minimal pilih satu variabel analisis. Jika tidak, akan muncul pesan: "Please select at least one analysis variable."</li>
            </ul>
          </HelpSection>
          <HelpSection title="Case Identifier Variable (opsional)">
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Letakkan satu variabel di kotak Case Identifier Variable untuk mengelompokkan kasus (misal: Subject ID).</li>
              <li>Kotak ini hanya menerima satu variabel.</li>
            </ul>
          </HelpSection>
          <HelpCard title="Tips Pemilihan Variabel" variant="step">
            <ul className="text-sm space-y-1">
              <li>Gunakan variabel numerik bertipe scale untuk perhitungan indeks anomali yang stabil.</li>
              <li>Hindari memasukkan terlalu banyak variabel sekaligus agar hasil lebih fokus.</li>
            </ul>
          </HelpCard>
        </div>
      )
    },
    {
      id: 'options',
      title: 'Kriteria Identifikasi',
      description: 'Menentukan ambang dan batasan untuk kasusu tidak biasa',
      icon: SlidersHorizontal,
      content: (
        <div className="space-y-6">
          <HelpCard title="Criteria for Identifying Unusual Cases" variant="feature">
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Metode pemilihan</div>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li><strong>Percentage</strong>: Pilih persentase teratas berdasarkan nilai indeks anomali (input "Percentage").</li>
                  <li><strong>Fixed number</strong>: Pilih sejumlah kasus teratas (input "Number").</li>
                </ul>
              </div>
              <div>
                <div className="font-medium">Ambang minimum (opsional)</div>
                <p>Centang "Identify only cases whose anomaly index value meets or exceeds a minimum value" lalu isi "Cutoff".</p>
              </div>
            </div>
          </HelpCard>
          <HelpCard title="Peer Groups" variant="feature">
            <p className="text-sm">Atur batas minimum dan maksimum jumlah peer group yang digunakan saat pembandingan.</p>
          </HelpCard>
          <HelpCard title="Reasons" variant="feature">
            <p className="text-sm">Batasi maksimum jumlah alasan per kasus untuk pelaporan penyebab anomali.</p>
          </HelpCard>
        </div>
      )
    }
  ];

  const prerequisites = [
    'Data telah dimuat dan variabel memiliki pengukuran yang sesuai (scale/nominal/ordinal).',
    'Anda mengetahui variabel numerik mana yang relevan untuk penilaian anomali.'
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Mulai dari kecil',
      content: 'Uji dengan 2-3 variabel analisis terlebih dahulu untuk memahami karakter indeks anomali di dataset Anda.'
    },
    {
      type: 'warning' as const,
      title: 'Interpretasi hasil',
      content: 'Kasus “tidak biasa” tidak selalu berarti salah; gunakan konteks domain untuk menilai.'
    }
  ];

  return (
    <HelpGuideTemplate
      title="Identify Unusual Cases"
      description="Temukan kasus-kasus yang berbeda secara signifikan dari peer-nya dengan mengatur variabel dan kriteria yang tepat."
      lastUpdated="2025-08-10"
      sections={sections}
      prerequisites={prerequisites}
      tips={tips}
    />
  );
};

export default UnusualCasesGuide;
