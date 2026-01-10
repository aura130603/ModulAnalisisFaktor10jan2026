/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpStep } from '../../ui/HelpLayout';
import { Printer, FileText, Settings, Image } from 'lucide-react';

export const Print = () => {
  const sections = [
    {
      id: 'print-steps',
      title: 'Cara Mencetak Data Anda',
      description: 'Panduan langkah demi langkah untuk mencetak data dan hasil analisis',
      icon: Printer,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Pergi ke menu 'File' di toolbar utama."
          />
          <HelpStep
            number={2}
            title="Pilih Cetak"
            description="Klik File → Print..."
          />
          <HelpStep
            number={3}
            title="Pilih Konten"
            description="Pilih apa yang ingin Anda cetak (tampilan data, hasil analisis, atau grafik)."
          />
          <HelpStep
            number={4}
            title="Atur Pengaturan Cetak"
            description="Sesuaikan pengaturan cetak seperti orientasi dan ukuran halaman."
          />
          <HelpStep
            number={5}
            title="Cetak atau Simpan"
            description="Klik 'Cetak' untuk mengirim ke printer Anda atau simpan sebagai PDF."
          />
        </div>
      )
    },
    {
      id: 'print-options',
      title: 'Opsi Cetak',
      description: 'Berbagai jenis konten yang dapat Anda cetak',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpCard title="Tabel Data" icon={FileText} variant="feature">
            <p className="text-sm text-muted-foreground">
              Cetak tabel data dengan format yang optimal untuk kemudahan membaca.
            </p>
          </HelpCard>
          
          <HelpCard title="Output Statistik" icon={FileText} variant="feature">
            <p className="text-sm text-muted-foreground">
              Cetak hasil analisis statistik dalam format profesional.
            </p>
          </HelpCard>
          
          <HelpCard title="Grafik & Chart" icon={Image} variant="feature">
            <p className="text-sm text-muted-foreground">
              Cetak grafik dan chart dalam resolusi tinggi untuk presentasi.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Kualitas Cetak',
      content: 'Gunakan orientasi landscape untuk tabel data yang lebar agar lebih mudah dibaca.'
    },
    {
      type: 'info' as const,
      title: 'Ekspor PDF',
      content: 'Simpan sebagai PDF untuk berbagi hasil analisis dengan kolega atau untuk arsip.'
    }
  ];

  const relatedTopics = [
    { title: 'Ekspor ke Excel', href: '/help/file-guide/export-excel' },
    { title: 'Ekspor ke CSV', href: '/help/file-guide/export-csv' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' },
    { title: 'Panduan Manajemen File', href: '/help/file-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Mencetak Data Anda"
      description="Panduan lengkap untuk mencetak data dan hasil analisis dari Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};