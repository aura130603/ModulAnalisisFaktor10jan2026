import React from 'react';
import { HelpAlert } from '@/app/help/ui/HelpLayout';
import { BarChart3, Info } from 'lucide-react';

export const ChartsTab = () => (
  <div className="space-y-6">
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Visualisasi Data Deskriptif</h3>
      </div>
      
      <HelpAlert variant="info" title="Fitur Visualisasi">
        <div className="text-sm space-y-2 mt-2">
          <p>
            Fitur visualisasi untuk analisis deskriptif sedang dalam tahap pengembangan. 
            Saat ini, Anda dapat melihat hasil statistik dalam bentuk tabel.
          </p>
          <p>
            Untuk visualisasi data, Anda dapat menggunakan fitur <strong>Explore</strong> 
            yang menyediakan histogram dan box plot untuk deteksi outlier.
          </p>
        </div>
      </HelpAlert>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Info className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Alternatif Visualisasi</h3>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Gunakan Analisis Explore</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Kegunaan:</strong> Menyediakan histogram dan box plot untuk visualisasi distribusi data</p>
            <p><strong>Akses:</strong> Melalui menu Analyze → Descriptive → Explore</p>
            <p><strong>Fitur:</strong> Deteksi outlier, uji normalitas, dan statistik deskriptif lengkap</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Export Data untuk Visualisasi External</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Format:</strong> Export hasil ke CSV atau Excel</p>
            <p><strong>Tools:</strong> Import ke software visualisasi seperti Excel, R, atau Python</p>
            <p><strong>Keunggulan:</strong> Fleksibilitas dalam membuat berbagai jenis grafik</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
