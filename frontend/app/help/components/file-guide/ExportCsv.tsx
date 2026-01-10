/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { HelpGuideTemplate } from '../../ui/HelpGuideTemplate';
import { HelpAlert, HelpStep } from '../../ui/HelpLayout';
import { Download, Settings } from 'lucide-react';

export const ExportCsv = () => {
  const sections = [
    {
      id: 'export-steps',
      title: 'Cara Ekspor ke CSV',
      description: 'Panduan langkah demi langkah untuk menyimpan data Anda sebagai file CSV',
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
            description="Klik File → Export → CSV Data."
          />
          <HelpStep
            number={3}
            title="Pilih Pengaturan Anda"
            description="Dialog akan muncul dimana Anda dapat mengatur opsi seperti pemisah dan simbol desimal."
          />
          <HelpStep
            number={4}
            title="Beri Nama File Anda"
            description="Masukkan nama file dan pilih lokasi penyimpanan di komputer Anda."
          />
          <HelpStep
            number={5}
            title="Simpan Data Anda"
            description="Klik 'Export' untuk menyimpan file ke komputer Anda."
          />
        </div>
      )
    },
    {
      id: 'options',
      title: 'Opsi Ekspor',
      description: 'Pengaturan yang dapat Anda sesuaikan saat menyimpan file',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <HelpAlert variant="info" title="Pemisah Data">
            <p className="text-sm mt-2">
              Pilih cara memisahkan kolom data Anda (koma, titik koma, atau tab) berdasarkan apa yang terbaik untuk kebutuhan Anda.
            </p>
          </HelpAlert>
          <HelpAlert variant="tip" title="Simbol Desimal">
            <p className="text-sm mt-2">
              Atur simbol desimal (titik atau koma) untuk menyesuaikan standar regional Anda atau persyaratan perangkat lunak lain.
            </p>
          </HelpAlert>
        </div>
      )
    }
  ];

  const tips = [
    {
      type: 'warning' as const,
      title: 'Catatan Data',
      content: 'Ekspor CSV hanya menyimpan data mentah Anda. Properti variabel seperti label atau tingkat pengukuran tidak akan disertakan dalam file .csv.'
    },
    {
      type: 'tip' as const,
      title: 'Kompatibilitas',
      content: 'File CSV bekerja dengan hampir semua program spreadsheet dan perangkat lunak statistik lainnya.'
    },
    {
      type: 'info' as const,
      title: 'Dukungan Karakter',
      content: 'File CSV disimpan dengan encoding UTF-8 untuk memastikan karakter khusus ditampilkan dengan benar.'
    }
  ];

  const relatedTopics = [
    { title: 'Ekspor ke Excel', href: '/help/file-guide/export-excel' },
    { title: 'Impor File CSV', href: '/help/file-guide/import-csv' },
    { title: 'Cetak Data Anda', href: '/help/file-guide/print' },
    { title: 'Panduan Manajemen Data', href: '/help/data-guide' }
  ];

  return (
    <HelpGuideTemplate
      title="Ekspor ke CSV"
      description="Panduan lengkap untuk menyimpan data Anda sebagai Comma-Separated Values (.csv)"
      lastUpdated="2024-01-15"
      sections={sections}
      tips={tips}
      relatedTopics={relatedTopics}
    />
  );
};