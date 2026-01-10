/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpCard, HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Upload, Lightbulb, Database } from 'lucide-react';

export const ImportSav = () => {
  const sections = [
    {
      id: 'import-steps',
      title: 'Cara Impor File SPSS',
      description: 'Panduan langkah demi langkah untuk mengimpor data SPSS Anda ke Statify',
      icon: Upload,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Klik 'File' di bilah menu atas aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Open SAV"
            description="Klik File → Open SAV."
          />
          <HelpStep
            number={3}
            title="Pilih File Anda"
            description="Telusuri komputer Anda dan pilih file .sav yang ingin Anda gunakan."
          />
          <HelpStep
            number={4}
            title="Muat Data Anda"
            description="Klik 'Buka' untuk mengimpor data Anda ke editor data Statify."
          />
        </div>
      )
    },
    {
      id: 'tips',
      title: 'Informasi Berguna',
      description: 'Apa yang perlu Anda ketahui tentang file SPSS',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tahukah Anda?">
            <p className="text-sm mt-2">
              Statify dapat menangani file .sav yang besar dengan efisien. Untuk dataset yang sangat besar, proses impor mungkin membutuhkan beberapa saat.
            </p>
          </HelpAlert>
          
          <HelpCard title="Format Yang Didukung" icon={Database} variant="feature">
            <p className="text-sm text-muted-foreground">
              Statify mendukung file SPSS (.sav) dari berbagai versi, termasuk file yang dibuat dengan SPSS terbaru.
            </p>
          </HelpCard>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'File Besar',
      content: 'Untuk file besar (lebih dari 10MB), pastikan browser Anda memiliki memori yang cukup tersedia.'
    },
    {
      type: 'warning' as const,
      title: 'Kompatibilitas',
      content: 'Beberapa fitur SPSS yang sangat spesifik mungkin tidak sepenuhnya didukung.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Ekspor Data Anda', href: '/help/file-guide/export-csv' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Impor File SPSS"
      description="Panduan lengkap untuk mengimpor data SPSS (.sav) ke Statify"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};