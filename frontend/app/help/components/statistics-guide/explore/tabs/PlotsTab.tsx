import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { BarChart3 } from 'lucide-react';

export const PlotsTab = () => (
  <div className="space-y-6">
    <HelpCard title="Opsi Visualisasi Explore" icon={BarChart3} variant="feature">
      <div className="space-y-6 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Boxplots (Radio Group)</h4>
          <p className="text-sm text-muted-foreground">
            Pilih satu opsi boxplot untuk visualisasi distribusi dan outlier detection. 
            Dapat dikonfigurasi sebelum memilih variables.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">None:</span>
                <p className="text-muted-foreground ml-2">Tidak menampilkan boxplot sama sekali</p>
              </div>
              <div>
                <span className="font-medium">Factor levels together:</span>
                <p className="text-muted-foreground ml-2">
                  Menampilkan boxplot per level factor variable dalam satu chart. 
                  Ideal untuk membandingkan distribusi antar kelompok.
                </p>
              </div>
              <div>
                <span className="font-medium">Dependents together:</span>
                <p className="text-muted-foreground ml-2">
                  Menampilkan semua dependent variables dalam satu boxplot chart. 
                  Berguna untuk membandingkan scale multiple variables.
                </p>
              </div>
              <div>
                <span className="font-medium">Dependents separately:</span>
                <p className="text-muted-foreground ml-2">
                  Membuat boxplot terpisah untuk setiap dependent variable. 
                  Optimal ketika variables memiliki scale berbeda.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Descriptives (Individual Checkboxes)</h4>
          <div className="space-y-4">
            <div>
              <span className="font-medium text-sm">Stem-and-leaf (Checkbox):</span>
              <p className="text-sm text-muted-foreground mt-1">
                Menampilkan distribusi detail sambil mempertahankan nilai data aktual. 
                Berguna untuk dataset kecil-menengah untuk melihat pola dan nilai spesifik.
              </p>
            </div>
            <div>
              <span className="font-medium text-sm">Histogram (Checkbox):</span>
              <p className="text-sm text-muted-foreground mt-1">
                Menampilkan distribusi frekuensi untuk memahami bentuk (shape) dan pola data. 
                Dapat dikombinasikan dengan boxplot untuk analisis komprehensif.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Normality Plots (Removed)</h4>
          <p className="text-sm text-muted-foreground">
            Opsi normality plots dengan tests telah dihapus dari UI modal sesuai requirement. 
            Focus pada descriptive plots yang tersedia: boxplots, stem-and-leaf, dan histogram.
          </p>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="tip" title="Panduan Pemilihan Plot untuk Explore Analysis">
      <div className="text-sm space-y-2 mt-2">
        <p>• <strong>Boxplots dengan Outliers:</strong> Ketika Statistics → Outliers diaktifkan, boxplot akan menampilkan outlier detection menggunakan Tukey's Hinges</p>
        <p>• <strong>Factor levels together:</strong> Terbaik untuk melihat perbedaan distribusi antar kelompok factor variable</p>
        <p>• <strong>Dependents separately:</strong> Ideal ketika dependent variables memiliki scale atau range yang sangat berbeda</p>
        <p>• <strong>Stem-and-leaf detail:</strong> Mempertahankan nilai eksak sambil menampilkan shape distribusi, baik untuk data dengan sample size moderat</p>
        <p>• <strong>Histogram interpretation:</strong> Bell curve = normal distribution, skewed = asymmetric distribution</p>
        <p>• <strong>Kombinasi optimal:</strong> Boxplot + Histogram memberikan comprehensive view tentang distribution shape dan outliers</p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Interpretasi Plot dalam Konteks Explore</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Boxplot outliers:</strong> Menggunakan Tukey's Hinges IQR, bukan percentile-based quartiles</p>
            <p>• <strong>Extreme values:</strong> Titik di luar whiskers menggunakan 1.5×IQR dan 3×IQR criteria</p>
            <p>• <strong>Robust statistics view:</strong> Median line di boxplot lebih reliable dibanding mean ketika ada outliers</p>
            <p>• <strong>Multiple dependent variables:</strong> Setiap variable diproses dengan ExamineCalculator secara independen</p>
            <p>• <strong>Factor grouping:</strong> Memungkinkan perbandingan robust statistics antar level kategori</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Konfigurasi Plot Settings</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Pre-configuration:</strong> Plot settings dapat dikonfigurasi sebelum memilih variables</p>
            <p>• <strong>Boxplot + Outliers:</strong> Kombinasi yang powerful untuk robust exploratory analysis</p>
            <p>• <strong>Factor analysis:</strong> "Factor levels together" + "Dependents separately" untuk detailed comparison</p>
            <p>• <strong>Large datasets:</strong> Histogram lebih informatif daripada stem-and-leaf untuk N &gt; 100</p>
            <p>• <strong>Small datasets:</strong> Stem-and-leaf mempertahankan individual values yang berguna untuk analisis detail</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);