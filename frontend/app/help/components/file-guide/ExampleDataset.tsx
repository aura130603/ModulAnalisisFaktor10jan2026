/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Database, Lightbulb } from 'lucide-react';

export const ExampleDataset = () => {
  const sections = [
    {
      id: 'load-steps',
      title: 'Langkah Memuat Dataset Contoh',
      description: 'Panduan langkah demi langkah untuk memuat dataset contoh',
      icon: Database,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Buka Menu File"
            description="Navigasi ke menu 'File' di toolbar utama aplikasi."
          />
          <HelpStep
            number={2}
            title="Pilih Example Data"
            description="Klik 'Example Data' untuk melihat daftar dataset yang tersedia (.sav)."
          />
          <HelpStep
            number={3}
            title="Pilih Dataset"
            description="Pilih dataset (.sav) yang ingin Anda gunakan dari daftar yang tersedia. Setiap dataset memiliki deskripsi singkat tentang isinya."
          />
          <HelpStep
            number={4}
            title="Muat Dataset"
            description="Klik 'Muat' untuk memuat dataset ke dalam editor data Statify."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Manfaat',
      description: 'Informasi penting tentang dataset contoh',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Tidak Perlu Internet">
            <p className="text-sm mt-2">
              Semua dataset contoh disertakan dengan aplikasi, sehingga Anda dapat mengaksesnya bahkan ketika offline.
            </p>
          </HelpAlert>
          <HelpAlert variant="tip" title="Eksplorasi Fitur">
            <p className="text-sm mt-2">
              Dataset contoh dirancang khusus untuk membantu Anda menjelajahi berbagai fitur analisis statistik di Statify.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'tip' as const,
      title: 'Pembelajaran Cepat',
      content: 'Gunakan dataset contoh untuk mempelajari fitur baru tanpa perlu menyiapkan data Anda sendiri.'
    },
    {
      type: 'info' as const,
      title: 'Variasi Data',
      content: 'Setiap dataset contoh memiliki karakteristik yang berbeda untuk mendemonstrasikan berbagai jenis analisis.'
    }
  ];

  const relatedTopics = [
    { title: 'Impor File SPSS', href: '/help/file-guide/import-sav' },
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Manajemen Data', href: '/help/data-guide' },
    { title: 'Memulai', href: '/help/getting-started' }
  ];

  return (
    <HelpGuideTemplate
      title="Menggunakan Dataset Contoh"
      description="Statify menyediakan berbagai dataset contoh untuk membantu Anda menjelajahi fitur-fiturnya"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};