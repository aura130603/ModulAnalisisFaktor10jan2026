import React from 'react';
import { Table, Calculator, HelpCircle } from 'lucide-react';
import { InlineMath } from 'react-katex';

export const VariablesTab = () => (
  <div className="space-y-6">
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Table className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Memilih Variabel</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Pilih Variabel</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Pilih satu atau lebih variabel numerik. UI hanya menampilkan variabel bertipe <strong>NUMERIC</strong> (termasuk COMMA, DOT, SCIENTIFIC, DOLLAR, RESTRICTED_NUMERIC) untuk analisis Descriptives.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Tambahkan ke Analisis</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Seret variabel ke kotak analisis atau gunakan tombol panah untuk menambahkannya ke analisis deskriptif Anda.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
          <div>
            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-1">Opsi Standardized Values</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Centang &quot;Save standardized values as variables&quot; untuk menyimpan <em>z-score</em> tiap variabel (hanya kasus valid): <InlineMath math={'z_i = (x_i - \\bar{x})/s'} />.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Didukung</h3>
      </div>
      <div className="space-y-3">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-800">
          <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Level Pengukuran dan Statistik yang Tersedia</h4>
          <div className="text-sm space-y-2 text-green-700 dark:text-green-300">
            <p>• <strong>Scale (Interval/Ratio):</strong> Semua statistik tersedia - mean, median, std deviation, variance, skewness, kurtosis, dll.</p>
            <p>• <strong>Ordinal:</strong> Median, persentil (Q1, Q3), IQR, mode, tetapi tidak ada mean atau std deviation</p>
            <p>• <strong>Nominal:</strong> Hanya mode dan frekuensi yang bermakna</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Variabel Numerik</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: NUMERIC, COMMA, DOT, SCIENTIFIC, DOLLAR, RESTRICTED_NUMERIC</p>
            <ul className="text-sm space-y-1 text-slate-500 dark:text-slate-500">
              <li>• Scale/Interval (umur, tinggi, berat)</li>
              <li>• Ratio (pendapatan, jarak, waktu)</li>
              <li>• Ordinal numerik (rating 1-10)</li>
            </ul>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">Variabel Tanggal (Date)</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: DATE, ADATE, EDATE, SDATE, JDATE, QYR, MOYR, WKYR, DATETIME, TIME, DTIME</p>
            <div className="text-xs space-y-1 text-slate-500 dark:text-slate-500">
              <p>• Secara otomatis dikonversi ke SPSS seconds untuk perhitungan</p>
              <p>• Format string dd-mm-yyyy akan dikonversi terlebih dahulu</p>
              <p>• Diperlakukan sebagai scale measurement untuk analisis statistik</p>
            </div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✗ Tidak Didukung</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Tipe: STRING</p>
            <ul className="text-sm space-y-1 text-slate-500 dark:text-slate-500">
              <li>• Variabel kategorikal text</li>
              <li>• Gunakan Frequencies untuk analisis STRING</li>
            </ul>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">⚠ Perlu Perhatian</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Data dengan banyak missing values</li>
              <li>• Nominal dengan kode numerik (1=pria, 2=wanita)</li>
              <li>• Perhatikan level measurement yang sesuai</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">⚠</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Missing Values & Weights</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Missing Values:</strong> Sistem mendeteksi missing values berdasarkan definisi variabel dan mengecualikannya dari perhitungan</p>
            <p>• <strong>Weights (Bobot):</strong> Jika tersedia, sistem menggunakan weighted calculation. Nilai default weight = 1 untuk semua kasus</p>
            <p>• <strong>Valid N:</strong> Jumlah kasus valid (bukan missing) yang digunakan dalam perhitungan</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Pemilihan Variabel</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Untuk analisis Descriptives:</strong> Gunakan variabel numerik kontinu</p>
            <p>• <strong>Untuk analisis Frequencies:</strong> Cocok untuk semua jenis variabel</p>
            <p>• <strong>Untuk analisis Explore:</strong> Ideal untuk eksplorasi data numerik dengan outlier detection</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Penanganan Missing Values</h3>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sistem akan otomatis:</p>
        <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
          <li>• Menghitung jumlah data valid dan missing</li>
          <li>• Mengecualikan missing values dari perhitungan statistik</li>
          <li>• Melaporkan persentase missing values</li>
          <li>• Memberikan peringatan jika missing values &gt; 50%</li>
        </ul>
      </div>
    </div>
  </div>
);
