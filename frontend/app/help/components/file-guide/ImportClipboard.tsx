/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Clipboard, Copy, Zap } from 'lucide-react';

export const ImportClipboard = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'Cara Impor dari Clipboard',
      description: 'Panduan langkah demi langkah untuk mengimpor data langsung dari clipboard Anda',
      icon: Clipboard,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Salin Data Anda"
            description="Salin data dari sumber mana pun (Excel, Google Sheets, dll.) menggunakan fitur Salin pada aplikasi tersebut."
          />
          <HelpStep
            number={2}
            title="Buka Menu File"
            description="Pergi ke menu 'File' di Statify."
          />
          <HelpStep
            number={3}
            title="Pilih Import Data → From Clipboard"
            description="Klik File → Import Data → From Clipboard."
          />
          <HelpStep
            number={4}
            title="Muat Data Anda"
            description="Data Anda akan secara otomatis dimuat ke editor data."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Manfaat',
      description: 'Mengapa impor clipboard sangat berguna',
      icon: Zap,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Impor Cepat">
            <p className="text-sm mt-2">
              Ini adalah cara tercepat untuk memasukkan data ke Statify. Cukup salin dari spreadsheet mana pun dan tempel langsung.
            </p>
          </HelpAlert>
          
          <HelpCard title="Dukungan Universal" icon={Copy} variant="feature">
            <p className="text-sm text-muted-foreground">
              Bekerja dengan data dari Excel, Google Sheets, LibreOffice Calc, dan aplikasi spreadsheet lainnya.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Format Data',
      content: 'Pastikan data Anda memiliki header di baris pertama untuk hasil impor yang terbaik.'
    },
    {
      type: 'info' as const,
      title: 'Deteksi Otomatis',
      content: 'Statify secara otomatis mendeteksi format data dan jenis kolom saat mengimpor dari clipboard.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Impor dari Clipboard"
      description="Panduan lengkap untuk mengimpor data langsung dari clipboard Anda ke Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};