import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">i</span>
        </div>
        <div>
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">ExamineCalculator: Statistik Robust dengan SPSS EXAMINE Logic</h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Menggunakan kombinasi DescriptiveCalculator dan FrequencyCalculator dengan tambahan 
            statistik robust: 5% trimmed mean, Tukey's Hinges untuk IQR, dan M-estimators yang tidak terpengaruh outlier.
          </p>
        </div>
      </div>
    </div>

    <HelpCard title="Opsi Statistik yang Tersedia" icon={Calculator} variant="feature">
      <div className="space-y-6 mt-2">
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Descriptives (Checkbox)</h4>
          <p className="text-sm text-muted-foreground">
            Mengaktifkan statistik deskriptif dasar ditambah 5% trimmed mean untuk estimasi robust.
            Termasuk semua output dari DescriptiveCalculator dan FrequencyCalculator.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <div className="space-y-3">
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Weighted Mean</p>
                <BlockMath math={'\\bar{x}_w = \\dfrac{\\sum w_i x_i}{\\sum w_i}'} />
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">5% Trimmed Mean (Robust)</p>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mean setelah menghilangkan 5% nilai tertinggi dan terendah berdasarkan total weight.
                  Lebih tahan terhadap outlier dibanding arithmetic mean.
                </div>
              </div>
              <div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Tukey's Hinges IQR</p>
                <BlockMath math={'\\text{IQR} = Q_3 - Q_1 \\text{ (using Tukey method)}'} />
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Menggunakan Tukey's Hinges definition untuk Q1 dan Q3, bukan percentile biasa.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Confidence Interval for Mean (Input Field)</h4>
          <p className="text-sm text-muted-foreground">
            Hanya aktif jika Descriptives dicentang. Default 95%, dapat diubah ke level kepercayaan lain.
            Menggunakan t-distribution dengan approximation untuk df &gt; 30.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <div className="space-y-2">
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1">Confidence Interval Formula</p>
              <BlockMath math={'CI = \\bar{x} \\pm t_{\\alpha/2,df} \\times SE'} />
              <div className="text-slate-700 dark:text-slate-300 text-sm space-y-1">
                <div><InlineMath math={'SE = \\dfrac{s}{\\sqrt{n}}'} /> (Standard Error of Mean)</div>
                <div><InlineMath math={'df = n - 1'} /> (degrees of freedom)</div>
                <div><InlineMath math={'t_{\\alpha/2,df}'} /> menggunakan <code>getTCriticalApproximation()</code></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">Outliers (Checkbox)</h4>
          <p className="text-sm text-muted-foreground">
            Mengaktifkan deteksi extreme values menggunakan Tukey's Hinges dengan kriteria 1.5×IQR dan 3×IQR fences.
            Default menampilkan 5 highest dan 5 lowest extreme values.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-2">Outlier Detection Criteria</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Mild Outliers:</span>
                <div className="flex gap-4">
                  <BlockMath math={'x < Q_1 - 1.5 \\times IQR'} />
                  <BlockMath math={'x > Q_3 + 1.5 \\times IQR'} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Extreme Outliers:</span>
                <div className="flex gap-4">
                  <BlockMath math={'x < Q_1 - 3 \\times IQR'} />
                  <BlockMath math={'x > Q_3 + 3 \\times IQR'} />
                </div>
              </div>
              <div className="text-slate-600 dark:text-slate-400 text-xs mt-1">
                Q1 dan Q3 menggunakan Tukey's Hinges, bukan percentile method standard.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm border-b pb-1">M-Estimators (Always Computed)</h4>
          <p className="text-sm text-muted-foreground">
            Statistik robust yang tidak terpengaruh outlier. Otomatis dihitung untuk semua numeric variables.
            Saat ini menggunakan 5% trimmed mean sebagai estimasi untuk semua M-estimator types.
          </p>
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <p className="font-medium mb-2">Available M-Estimators:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Huber:</strong> Robust location estimator dengan bounded influence</li>
                <li>• <strong>Tukey:</strong> Bisquare estimator yang menolak outlier secara total</li>
                <li>• <strong>Hampel:</strong> Three-part redescending estimator</li>
                <li>• <strong>Andrews:</strong> Sine-based redescending estimator</li>
              </ul>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                <em>Note: Current implementation menggunakan 5% trimmed mean sebagai approximation untuk semua M-estimators.</em>
              </p>
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="info" title="Percentiles dan Additional Statistics">
      <div className="text-sm mt-2 space-y-2">
        <p>
          <strong>Default Percentiles:</strong> ExamineCalculator otomatis menghitung percentiles [5, 10, 25, 50, 75, 90, 95] 
          menggunakan HAVERAGE method (default SPSS EXAMINE). Method dapat dikonfigurasi via options.percentileMethod.
        </p>
        <p>
          <strong>Frequency Statistics:</strong> Setiap variable juga mendapat statistik frekuensi dari FrequencyCalculator 
          (N, N valid, N missing, dll.) yang digabungkan dengan descriptive statistics.
        </p>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-emerald-800 dark:text-emerald-200 mb-2">Rekomendasi Pengaturan Statistics</h3>
          <div className="text-sm space-y-2 text-emerald-700 dark:text-emerald-300">
            <p>• <strong>Descriptives:</strong> Selalu aktifkan untuk mendapat statistik dasar + 5% trimmed mean</p>
            <p>• <strong>Confidence Interval:</strong> 95% untuk analisis standar, 99% untuk analisis konservatif</p>
            <p>• <strong>Outliers:</strong> Aktifkan jika suspect ada extreme values dalam data</p>
            <p>• <strong>M-Estimators:</strong> Otomatis dihitung, memberikan robust alternative untuk central tendency</p>
            <p>• <strong>Tukey's Hinges:</strong> Lebih robust untuk IQR dibanding percentile-based quartiles</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);