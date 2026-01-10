import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Table, Database, CheckSquare, AlertTriangle } from 'lucide-react';

export const VariablesTab = () => (
  <div className="space-y-6">
    <HelpAlert variant="info" title="Apa itu Crosstabs Analysis?">
      <p className="text-sm mt-2">
        Analisis Crosstabs menggunakan <strong>CrosstabsCalculator</strong> untuk membuat tabel kontingensi 
        dengan dukungan weighted computation, date string conversion, dan berbagai residual statistics. 
        Sistem otomatis mengurutkan kategori dan menangani missing values sesuai SPSS standards.
      </p>
    </HelpAlert>

    <HelpCard title="Memilih Row dan Column Variables" icon={Table} variant="feature">
      <div className="space-y-4 mt-2">
        <HelpStep
          number={1}
          title="Row(s) Variables"
          description="Drag variables ke Row(s) list untuk tabel kontingensi. Dapat berupa semua tipe: NUMERIC, STRING, DATE."
        />
        <HelpStep
          number={2}
          title="Column(s) Variables"
          description="Drag variables ke Column(s) list. Sistem akan membuat tabel untuk setiap kombinasi row-column."
        />
        <HelpStep
          number={3}
          title="Automatic Processing"
          description="CrosstabsCalculator otomatis mendeteksi date strings, mengurutkan kategori, dan menangani missing values."
        />
      </div>
    </HelpCard>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Variable Types dan Processing Logic</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-medium text-slate-800 dark:text-slate-200">NUMERIC Variables</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Nilai numerik yang akan dikategorikan sesuai unique values
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Processing:</strong></p>
            <p>• Automatic sorting: numeric values sorted numerically</p>
            <p>• Missing values: berdasarkan variable.missing definitions</p>
            <p>• Weighted computation: mendukung case weights untuk survey data</p>
            <p>• <strong>Contoh:</strong> Kode kategori (1,2,3), Rating (1-5), Group numbers</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-medium text-slate-800 dark:text-slate-200">STRING Variables</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Text categories dengan natural sorting menggunakan localeCompare
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Processing:</strong></p>
            <p>• Automatic sorting: alphabetical dengan numeric handling</p>
            <p>• Case sensitive: "Male" ≠ "male" (perhatikan konsistensi)</p>
            <p>• Missing values: berdasarkan exact string match di variable.missing</p>
            <p>• <strong>Contoh:</strong> Gender ("Male","Female"), Cities, Product categories</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-slate-800 dark:text-slate-200">DATE Variables (Special Handling)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded border text-sm mb-2 text-slate-700 dark:text-slate-300">
            Date strings "dd-mm-yyyy" otomatis dikonversi ke SPSS seconds untuk sorting
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Special Processing:</strong></p>
            <p>• Detection: isDateString() mengecek format "dd-mm-yyyy"</p>
            <p>• Conversion: dateStringToSpssSeconds() untuk internal computation</p>
            <p>• Display: spssSecondsToDateString() untuk output kategori</p>
            <p>• <strong>Contoh:</strong> "01-01-2023", "15-06-2024" → sorted chronologically</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">CrosstabsCalculator Processing Requirements</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
          <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Missing Value Handling</h4>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>checkIsMissing():</strong> Variable-specific missing value definitions digunakan</p>
            <p>• <strong>Valid vs Missing Weight:</strong> Computed separately untuk case processing summary</p>
            <p>• <strong>Exclusion:</strong> Cases dengan missing di row OR column variable dikecualikan</p>
            <p>• <strong>Weight adjustment:</strong> Non-integer weights dapat diatur dengan roundCase/truncateCase</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Category Sorting Logic</h4>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>NUMERIC:</strong> Sorted numerically (1, 2, 10, not "1", "10", "2")</p>
            <p>• <strong>STRING:</strong> localeCompare dengan numeric: true untuk natural sorting</p>
            <p>• <strong>DATE:</strong> Internal SPSS seconds sorting, display sebagai original date strings</p>
            <p>• <strong>Mixed types:</strong> Consistent sorting dalam setiap column/row variable</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <h4 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Frequency dan Expected Count Requirements</h4>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Expected count ≥ 5:</strong> Rule of thumb untuk valid Chi-square test</p>
            <p>• <strong>Cell computation:</strong> Expected = (row total × column total) / grand total</p>
            <p>• <strong>Weighted computation:</strong> Semua frequencies menggunakan case weights</p>
            <p>• <strong>Rounding:</strong> Expected counts rounded to 1 decimal place untuk display</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800">
          <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Multiple Variables Support</h4>
          <div className="text-sm space-y-2 text-purple-700 dark:text-purple-300">
            <p>• <strong>Row variables:</strong> Setiap row variable dianalisis dengan setiap column variable</p>
            <p>• <strong>Column variables:</strong> Multiple columns menghasilkan separate crosstabs</p>
            <p>• <strong>Worker processing:</strong> variable.row dan variable.col harus defined</p>
            <p>• <strong>Output naming:</strong> "RowVarName * ColVarName" untuk identification</p>
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
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Tips Variable Selection untuk Crosstabs</h3>
          <div className="text-sm space-y-2 text-blue-700 dark:text-blue-300">
            <p>• <strong>Row variables:</strong> Biasanya independent/predictor variables dengan kategori lebih sedikit</p>
            <p>• <strong>Column variables:</strong> Dependent/outcome variables untuk easy percentage interpretation</p>
            <p>• <strong>Date variables:</strong> Pastikan konsisten format "dd-mm-yyyy" untuk automatic conversion</p>
            <p>• <strong>Mixed analysis:</strong> Bisa mix NUMERIC codes dengan STRING categories dalam satu analisis</p>
            <p>• <strong>Weight considerations:</strong> Jika data weighted, pastikan weight variable sudah dikonfigurasi</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
