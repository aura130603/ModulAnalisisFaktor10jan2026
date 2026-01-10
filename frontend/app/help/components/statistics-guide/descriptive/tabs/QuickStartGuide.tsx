import React from 'react';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-500 dark:border-blue-400">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Panduan Cepat: Analisis Deskriptif</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Pilih Variabel</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Seret variabel numerik dari panel kiri ke kotak analisis.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Pilih Statistik</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Di tab <strong>Statistics</strong>, pilih statistik yang diinginkan:</p>
            <ul className="text-xs mt-1 ml-3 space-y-1 text-slate-600 dark:text-slate-400">
              <li>• <strong>Central Tendency:</strong> Mean, Median, Sum</li>
              <li>• <strong>Dispersion:</strong> Std. deviation, Variance, Minimum, Maximum, Range, S.E. mean</li>
              <li>• <strong>Distribution:</strong> Kurtosis, Skewness</li>
              <li>• <strong>Display Order:</strong> Variable list, Alphabetic, Ascending/Descending means</li>
            </ul>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">Jalankan Analisis</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">Klik tombol OK untuk menjalankan analisis dan melihat hasil.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-500 dark:border-slate-400">
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Interpretasi Hasil</h3>
      <div className="space-y-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Central Tendency</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Mean:</strong> Rata-rata berbobot, sensitif terhadap outlier</li>
            <li>• <strong>Median:</strong> Nilai tengah (Persentil ke-50), robust terhadap outlier</li>
            <li>• <strong>Sum:</strong> Total berbobot dari semua nilai valid</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Dispersion</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Std. deviation:</strong> Akar kuadrat dari variance (sample-corrected)</li>
            <li>• <strong>Variance:</strong> Momen kedua terpusat berbobot dibagi (W-1)</li>
            <li>• <strong>Range:</strong> Selisih antara nilai maksimum dan minimum</li>
            <li>• <strong>S.E. mean:</strong> Standard error of the mean = std.dev/√W</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Distribution</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>Skewness:</strong> Mengukur asimetri distribusi (0=simetris, &gt;0=ekor kanan, &lt;0=ekor kiri)</li>
            <li>• <strong>Kurtosis:</strong> Mengukur ketajaman puncak (0=normal, &gt;0=tajam, &lt;0=datar)</li>
          </ul>
        </div>
        <div className="p-3 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-600">
          <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">Percentiles</h4>
          <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
            <li>• <strong>25th Percentile (Q1):</strong> 25% data berada di bawah nilai ini</li>
            <li>• <strong>75th Percentile (Q3):</strong> 75% data berada di bawah nilai ini</li>
            <li>• <strong>IQR:</strong> Q3 - Q1, mengukur spread dari 50% data tengah</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
