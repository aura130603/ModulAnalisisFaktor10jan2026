import React from 'react';
import { Zap, Upload, Database } from 'lucide-react';
import { HelpCard, HelpAlert } from '../../../ui/HelpLayout';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <HelpAlert variant="tip" title="Quick Start - Mulai dalam 3 Langkah">
      <p className="text-sm mt-2">
        Ikuti panduan cepat ini untuk mulai bekerja dengan data di Statify dalam hitungan menit.
      </p>
    </HelpAlert>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <HelpCard title="1. Import Data" icon={Upload} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Mulai dengan mengimpor data Anda:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Klik <strong>File → Import Data → CSV Data/Excel</strong></li>
            <li>• Pilih file dan atur pengaturan</li>
            <li>• Klik <strong>Import</strong></li>
          </ul>
        </div>
      </HelpCard>

      <HelpCard title="2. Periksa Data" icon={Database} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Validasi data yang telah diimpor:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Periksa nama dan tipe variabel</li>
            <li>• Cek missing values</li>
            <li>• Validasi format data</li>
            <li>• Atur measurement level</li>
          </ul>
        </div>
      </HelpCard>

      <HelpCard title="3. Mulai Analisis" icon={Zap} variant="step">
        <div className="space-y-3 text-sm">
          <p className="text-slate-600 dark:text-slate-400">
            Siap untuk analisis statistik:
          </p>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>• Pilih menu <strong>Analyze</strong></li>
            <li>• Pilih jenis analisis</li>
            <li>• Drag variabel ke dialog</li>
            <li>• Klik <strong>OK</strong> untuk hasil</li>
          </ul>
        </div>
      </HelpCard>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Format File Populer</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">CSV Files</p>
            <p className="text-muted-foreground">Format universal, kompatibel dengan semua aplikasi</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Excel Files</p>
            <p className="text-muted-foreground">Mempertahankan formatting dan multiple sheets</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">SPSS Files</p>
            <p className="text-muted-foreground">Import dengan metadata dan label lengkap</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Tips Export</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Backup Rutin</p>
            <p className="text-muted-foreground">Export data secara berkala untuk backup</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Sharing Results</p>
            <p className="text-muted-foreground">Export ke Excel/PDF untuk berbagi hasil</p>
          </div>
          
          <div className="p-3 bg-muted/50 rounded border border-border">
            <p className="font-medium text-foreground mb-1">Visualizations</p>
            <p className="text-muted-foreground">Simpan grafik dalam format SVG untuk kualitas terbaik</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);