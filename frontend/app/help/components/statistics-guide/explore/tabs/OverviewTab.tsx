import React from 'react';
import { HelpCircle, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Analisis Explore?"
      description="Analisis Explore menggunakan ExamineCalculator untuk menghasilkan statistik robust berbasis SPSS EXAMINE logic. Menggabungkan DescriptiveCalculator, FrequencyCalculator, dan tambahan algoritma robust: 5% trimmed mean, Tukey's Hinges untuk IQR, M-estimators, dan confidence intervals dengan t-distribution approximation."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Explore",
          icon: HelpCircle,
          items: [
            "Eksplorasi data dengan statistik robust yang tidak terpengaruh outlier",
            "Deteksi extreme values menggunakan Tukey's Hinges dan IQR criteria",
            "Analisis distribusi dengan 5% trimmed mean dan M-estimators", 
            "Confidence interval untuk mean menggunakan t-distribution",
            "Perbandingan kelompok dengan factor variables (by-group analysis)",
            "Comprehensive outlier analysis dengan mild/extreme classification"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Komponen ExamineCalculator yang Akan Dipelajari"
      icon={FileText}
      concepts={[
        {
          title: "5% Trimmed Mean",
          formula: "Mean after removing 5% highest and lowest values by weight",
          description: "Robust central tendency estimator yang lebih tahan terhadap outlier dibanding arithmetic mean.",
          color: "purple"
        },
        {
          title: "Tukey's Hinges IQR",
          formula: "Q3 - Q1 using Tukey method, not percentile-based",
          description: "Robust measure of spread menggunakan definition Tukey untuk quartiles, bukan percentile 25th/75th.",
          color: "orange"
        },
        {
          title: "Outlier Detection",
          formula: "1.5×IQR (mild) and 3×IQR (extreme) with Tukey fences",
          description: "SPSS EXAMINE compatible outlier detection dengan classification mild/extreme outliers.",
          color: "blue"
        },
        {
          title: "M-Estimators",
          formula: "Huber, Tukey, Hampel, Andrews estimators",
          description: "Robust location estimators yang menolak influence dari outliers (current: 5% trimmed approximation).",
          color: "emerald"
        }
      ]}
    />

    <IntroSection
      title="Mengapa ExamineCalculator Unggul?"
      description="Robust Statistics: Menggunakan 5% trimmed mean dan M-estimators yang tidak terpengaruh outlier. SPSS Compatible: Logic dan algoritma mengikuti standard SPSS EXAMINE procedure. Comprehensive Analysis: Menggabungkan frequency + descriptive + robust statistics dalam satu analisis. Accurate Outlier Detection: Tukey's Hinges memberikan IQR yang lebih robust untuk outlier detection. Weighted Support: Semua computation mendukung case weights untuk survey data atau complex sampling."
      variant="tip"
    />
  </div>
);