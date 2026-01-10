import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Zap } from 'lucide-react';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <HelpCard title="Panduan Cepat ExamineCalculator" icon={Zap} variant="feature">
      <div className="space-y-4 mt-4">
        <HelpStep 
          number={1} 
          title="Upload Data" 
          description="Upload file CSV/Excel dengan variabel numerik untuk analisis robust"
        />
        
        <HelpStep 
          number={2} 
          title="Pilih Dependent Variables" 
          description="Drag NUMERIC variables ke Dependent List. Hanya NUMERIC variables yang muncul di available list"
        />
        
        <HelpStep 
          number={3} 
          title="Tambah Factor Variables (Opsional)" 
          description="Drag variables (semua tipe) ke Factor List untuk analisis by-group"
        />
        
        <HelpStep 
          number={4} 
          title="Configure Statistics Tab" 
          description="✓ Descriptives (+ CI%), ✓ Outliers untuk deteksi extreme values. M-estimators dihitung otomatis"
        />
        
        <HelpStep 
          number={5} 
          title="Setup Plots Tab" 
          description="Pilih Boxplot type, ✓ Stem-and-leaf, ✓ Histogram sesuai kebutuhan analisis"
        />
        
        <HelpStep 
          number={6} 
          title="Run Analysis" 
          description="Klik Run → ExamineCalculator memproses dengan robust statistics"
        />
      </div>
    </HelpCard>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Skenario Penggunaan ExamineCalculator</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Robust Exploratory Analysis</p>
            <p className="text-blue-700 dark:text-blue-300">Descriptives + Outliers + Boxplots untuk comprehensive robust exploration</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-800">
            <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">Tukey's Hinges Outlier Detection</p>
            <p className="text-emerald-700 dark:text-emerald-300">Outliers checkbox menggunakan 1.5×IQR dan 3×IQR dengan Tukey method</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-800">
            <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">By-Group Comparison</p>
            <p className="text-purple-700 dark:text-purple-300">Factor variables untuk membandingkan robust statistics antar kelompok</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Output yang Dihasilkan</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400"><strong>Descriptives:</strong> Mean, SD, 5% trimmed mean, confidence interval</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400"><strong>Frequencies:</strong> N, N valid, N missing, median, quartiles</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400"><strong>M-Estimators:</strong> Huber, Tukey, Hampel, Andrews robust estimates</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400"><strong>Percentiles:</strong> 5, 10, 25, 50, 75, 90, 95 using HAVERAGE method</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400"><strong>Extreme Values:</strong> Outliers dan extremes dengan case identification</p>
          </div>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="ExamineCalculator Workflow">
      <div className="text-sm space-y-3 mt-2">
        <div className="space-y-2">
          <p className="font-medium">1. Variable Selection & Filtering</p>
          <p className="ml-4 text-muted-foreground">• Only NUMERIC variables appear in available list • Factor variables accept all types • Automatic filtering by variable.type === 'NUMERIC'</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">2. Statistics Computation</p>
          <p className="ml-4 text-muted-foreground">• FrequencyCalculator untuk basic stats • DescriptiveCalculator untuk numeric measures • 5% trimmed mean untuk robust central tendency</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">3. Robust Analysis</p>
          <p className="ml-4 text-muted-foreground">• Tukey's Hinges untuk robust IQR • Confidence interval dengan t-distribution • M-estimators (Huber, Tukey, Hampel, Andrews)</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">4. Outlier Detection</p>
          <p className="ml-4 text-muted-foreground">• 1.5×IQR for mild outliers • 3×IQR for extreme outliers • Case number identification untuk traceability</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">5. Output Integration</p>
          <p className="ml-4 text-muted-foreground">• Combine frequency + descriptive + robust statistics • Default percentiles [5,10,25,50,75,90,95] • Summary dengan N valid per variable</p>
        </div>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Troubleshooting ExamineCalculator</h3>
      <div className="space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="font-mono text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded min-w-fit">ERROR</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Dependent list kosong</p>
            <p className="text-slate-600 dark:text-slate-400">Minimal satu NUMERIC variable wajib ada di Dependent List untuk analisis</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded min-w-fit">WARN</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Variable filtered out dari computation</p>
            <p className="text-slate-600 dark:text-slate-400">isNumeric check: (measure==='scale'||'ordinal') && coreType!=='date' menentukan computation eligibility</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded min-w-fit">INFO</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">5% trimmed mean vs mean berbeda signifikan</p>
            <p className="text-slate-600 dark:text-slate-400">Indikasi adanya outliers, gunakan M-estimators dan Tukey's Hinges untuk analisis robust</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded min-w-fit">TIP</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Confidence interval tidak muncul</p>
            <p className="text-slate-600 dark:text-slate-400">Pastikan Descriptives checkbox dicentang dan N &gt; 1 untuk CI computation</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);