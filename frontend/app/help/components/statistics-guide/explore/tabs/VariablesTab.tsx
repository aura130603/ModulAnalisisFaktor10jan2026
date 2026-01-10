import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { HelpCircle, Calculator } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Analisis Explore?">
      <p className="text-sm mt-2">
        Analisis Explore menggunakan <strong>ExamineCalculator</strong> untuk memberikan statistik deskriptif yang robust, 
        deteksi outlier dengan Tukey's Hinges, dan M-estimators yang tidak terpengaruh nilai ekstrem. 
        Analisis ini ideal untuk eksplorasi data awal dan identifikasi karakteristik distribusi yang dapat diandalkan.
      </p>
    </HelpAlert>

    <HelpCard title="Kapan Menggunakan Analisis Explore" icon={HelpCircle} variant="feature">
      <ul className="text-sm space-y-2 mt-2">
        <li>• Eksplorasi data awal dengan statistik robust</li>
        <li>• Deteksi outlier menggunakan Tukey's Hinges dan IQR</li>
        <li>• Analisis distribusi dengan 5% trimmed mean</li>
        <li>• Perbandingan kelompok dengan factor variables</li>
        <li>• Confidence interval untuk estimasi mean yang akurat</li>
        <li>• Identifikasi extreme values dengan kriteria SPSS EXAMINE</li>
      </ul>
    </HelpCard>

    <HelpCard title="Memilih Variabel untuk Analisis" icon={Calculator} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Dependent List (Wajib)"
          description="Pilih satu atau lebih variabel NUMERIC untuk analisis. Hanya variabel bertipe NUMERIC yang tersedia dalam available list."
        />
        <HelpStep
          number={2}
          title="Factor List (Opsional)"
          description="Tambahkan variabel kategorikal (semua tipe) untuk membandingkan statistik antar kelompok. Factor variables memungkinkan analisis by-group."
        />
        <HelpStep
          number={3}
          title="Pertimbangan Penggunaan"
          description="Setiap dependent variable akan dianalisis dengan statistik robust. Factor variables akan membagi analisis per level kategori."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Jenis Variabel yang Didukung</h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Dependent Variables (NUMERIC Only)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• Hanya variabel bertipe NUMERIC yang muncul di available list</li>
              <li>• Scale/Interval variables (umur, tinggi, berat, suhu)</li>
              <li>• Ordinal variables dengan nilai numerik (rating 1-5)</li>
              <li>• Continuous dan discrete numeric variables</li>
              <li>• Filtered otomatis: DATE type dikecualikan dari numeric computations</li>
            </ul>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <h4 className="font-medium text-slate-800 dark:text-slate-200">✓ Factor Variables (Semua Tipe)</h4>
            </div>
            <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
              <li>• NUMERIC: untuk grouping berdasarkan kode (1=Pria, 2=Wanita)</li>
              <li>• STRING: untuk kategori teks (jenis kelamin, agama, kota)</li>
              <li>• DATE: untuk grouping berdasarkan periode waktu</li>
              <li>• Semua measurement levels: nominal, ordinal, scale</li>
            </ul>
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
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Pemilihan Variabel</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Dependent List:</strong> Wajib diisi dengan minimal 1 variabel NUMERIC untuk analisis</p>
            <p>• <strong>Factor List:</strong> Opsional, untuk analisis by-group (semua tipe variabel diterima)</p>
            <p>• <strong>Multiple dependents:</strong> Setiap dependent variable akan dianalisis secara terpisah</p>
            <p>• <strong>Dengan factor variables:</strong> Statistik akan dihitung per kombinasi dependent-factor</p>
            <p>• <strong>Filtering otomatis:</strong> Available list hanya menampilkan variabel NUMERIC yang valid</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Penanganan Data dan Computation Logic</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Missing Values dan Valid N</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">ExamineCalculator akan:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• Filter nilai non-numeric dan missing values dari computation</li>
            <li>• Hitung N valid untuk setiap dependent variable secara terpisah</li>
            <li>• Menampilkan summary dengan N, N valid, dan N missing per variable</li>
            <li>• Melakukan weighted computation jika weights tersedia</li>
          </ul>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
          <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 mb-2">Measurement Level Logic</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Sistem menentukan computation berdasarkan:</p>
          <ul className="text-sm space-y-1 ml-4 text-slate-600 dark:text-slate-400">
            <li>• <strong>isNumeric check:</strong> (measure === 'scale' || measure === 'ordinal') && coreType !== 'date'</li>
            <li>• <strong>Scale/Ordinal:</strong> Mendapat full descriptive statistics + robust estimators</li>
            <li>• <strong>Nominal/DATE:</strong> Hanya frequency statistics tanpa descriptive computations</li>
            <li>• <strong>Numeric conversion:</strong> Menggunakan toNumeric() function untuk type coercion</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);