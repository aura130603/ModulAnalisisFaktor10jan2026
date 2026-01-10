import React from 'react';
import { Calculator, Target } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Statistik Deskriptif?"
      description="Statistik deskriptif merangkum data Anda dengan ukuran-ukuran kunci seperti rata-rata, sebaran, dan bentuk distribusi. Mereka memberikan wawasan cepat tentang karakteristik data Anda."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Deskriptif",
          icon: Target,
          items: [
            "Eksplorasi awal dataset numerik",
            "Memahami distribusi dan karakteristik variabel",
            "Mendeteksi outlier dan pola data", 
            "Mengecek normalitas distribusi",
            "Membandingkan statistik antar variabel",
            "Persiapan sebelum analisis inferensial",
            "Validasi kualitas data"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Statistik yang Dihasilkan"
      icon={Calculator}
      concepts={[
        {
          title: "Central Tendency", 
          formula: "Mean, Median, Sum - menggunakan weighted calculation dengan bobot W",
          description: "Ukuran nilai pusat distribusi. Mean sensitif outlier, Median robust terhadap outlier.",
          color: "blue"
        },
        {
          title: "Dispersion",
          formula: "Std. deviation, Variance, Range, Min/Max, S.E. Mean", 
          description: "Mengukur variabilitas dan penyebaran data. Standard Error mengukur presisi estimasi mean.",
          color: "purple"
        },
        {
          title: "Distribution",
          formula: "Skewness (kemencengan), Kurtosis (ketajaman puncak)",
          description: "Menggambarkan bentuk distribusi: simetri, ekor panjang, dan ketajaman puncak.",
          color: "orange"
        },
        {
          title: "Percentiles", 
          formula: "25th Percentile (Q1), 75th Percentile (Q3), IQR",
          description: "Membagi data menjadi kuartil. IQR = Q3-Q1 robust measure of spread.",
          color: "emerald"
        }
      ]}
    />

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
          <span className="text-white text-xs font-bold">💡</span>
        </div>
        <div>
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Tips Praktis</h3>
          <div className="text-sm space-y-2 text-amber-700 dark:text-amber-300">
            <p>• <strong>Level Measurement:</strong> Scale variables mendapat semua statistik, Ordinal hanya median & persentil, Nominal hanya mode</p>
            <p>• <strong>Missing Values:</strong> Sistem otomatis mengecualikan missing values berdasarkan definisi variabel</p>
            <p>• <strong>Weights:</strong> Jika ada weight variable, semua perhitungan menggunakan weighted formula</p>
            <p>• <strong>Display Order:</strong> Atur urutan output: Variable list, Alphabetic, atau berdasarkan Mean</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
