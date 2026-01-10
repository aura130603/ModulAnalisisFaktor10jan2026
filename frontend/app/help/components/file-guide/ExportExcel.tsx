/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Download, Settings, Tags } from 'lucide-react';

export const ExportExcel = () => {
  const sections = [
    {
      id: 'export-steps',
      title: 'Cara Ekspor ke Excel',
      description: 'Panduan langkah demi langkah untuk menyimpan data Anda sebagai file Excel',
      icon: Download,
      content: (
        <div className="space-y-4">
          <HelpStep
            number={1}
            title="Periksa Data Anda"
            description="Pastikan data yang ingin diekspor sudah dimuat di editor data."
          />
          <HelpStep
            number={2}
            title="Buka Menu File"
            description="Klik File → Export → Excel."
          />
          <HelpStep
            number={3}
            title="Atur Ekspor"
            description="Dialog ekspor akan muncul. Beri nama file Anda."
          />
          <HelpStep
            number={4}
            title="Pilih Label Nilai"
            description="Anda dapat memilih untuk menyertakan label nilai variabel jika diinginkan."
          />
          <HelpStep
            number={5}
            title="Buat File Anda"
            description="Klik 'Export' untuk membuat dan mengunduh file .xlsx Anda."
          />
        </div>
      )
    },
    {
      id: 'features',
      title: 'Fitur & Manfaat',
      description: 'Keuntungan mengekspor ke format Excel',
      icon: Tags,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="success" title="Label Nilai">
            <p className="text-sm mt-2">
              Tidak seperti CSV, ekspor Excel memungkinkan Anda menyimpan label nilai. Ini berarti jika Anda memiliki variabel dengan 1="Laki-laki" dan 2="Perempuan", file yang diekspor dapat menampilkan "Laki-laki" dan "Perempuan" alih-alih 1 dan 2.
            </p>
          </HelpAlert>
          <HelpAlert variant="info" title="Preservasi Format">
            <p className="text-sm mt-2">
              Format Excel menyimpan lebih banyak informasi metadata dibandingkan CSV, termasuk jenis data dan format.
            </p>
          </HelpAlert>
        </div>
      )
    },
    {
      id: 'options',
      title: 'Opsi Ekspor',
      description: 'Pengaturan yang dapat Anda sesuaikan',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="tip" title="Multiple Worksheet">
            <p className="text-sm mt-2">
              File Excel dapat berisi beberapa worksheet, memungkinkan organisasi yang lebih baik untuk dataset yang kompleks.
            </p>
          </HelpAlert>
          <HelpAlert variant="info" title="Kompatibilitas">
            <p className="text-sm mt-2">
              File .xlsx bekerja dengan Microsoft Excel, LibreOffice Calc, Google Sheets, dan aplikasi spreadsheet lainnya.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'success' as const,
      title: 'Preservasi Metadata',
      content: 'Ekspor Excel menyimpan lebih banyak informasi metadata daripada format lain, termasuk label nilai dan format.'
    },
    {
      type: 'tip' as const,
      title: 'Ukuran File',
      content: 'File Excel umumnya lebih besar daripada CSV, tetapi menyimpan lebih banyak informasi struktural dan metadata.'
    },
    {
      type: 'info' as const,
      title: 'Lintas Platform',
      content: 'Format .xlsx bekerja di berbagai platform dan aplikasi spreadsheet modern.'
    }
  ];

  const relatedTopics = [
    { title: 'Ekspor ke CSV', href: '/help/file-guide/export-csv' },
    { title: 'Impor File Excel', href: '/help/file-guide/import-excel' },
    { title: 'Cetak Data Anda', href: '/help/file-guide/print' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Ekspor ke Excel"
      description="Panduan lengkap untuk menyimpan data Anda sebagai Microsoft Excel (.xlsx)"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};