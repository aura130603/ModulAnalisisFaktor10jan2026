import React from 'react';
import { Zap, Brain, TrendingUp, Target } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection,
  ExampleGrid 
} from '../shared/StandardizedContentLayout';

export const AdvancedTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Analisis Statistik Lanjutan"
      description="Eksplorasi teknik-teknik analisis statistik yang lebih kompleks untuk penelitian mendalam dan pengambilan keputusan yang lebih akurat."
      variant="warning"
    />

    <FeatureGrid
      features={[
        {
          title: "Analisis Multivariat",
          icon: Brain,
          items: [
            "Principal Component Analysis (PCA)",
            "Factor Analysis - Eksploratori dan Konfirmatori",
            "Cluster Analysis - K-means, Hierarchical",
            "MANOVA - Multivariate Analysis of Variance",
            "Discriminant Analysis - Klasifikasi grup"
          ]
        },
        {
          title: "Deret Waktu & Peramalan",
          icon: TrendingUp,
          items: [
            "Trend Analysis - Identifikasi pola jangka panjang",
            "Seasonality Detection - Pola musiman",
            "ARIMA Models - Autoregressive Integrated Moving Average",
            "Exponential Smoothing - Peramalan adaptif",
            "Forecasting Accuracy - MAE, RMSE, MAPE"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Pembelajaran Mesin dengan Pendekatan Statistik"
      icon={Target}
      concepts={[
        {
          title: "Supervised Learning",
          description: "Algoritma yang belajar dari data berlabel untuk memprediksi output. Termasuk regresi linear/logistik, decision trees, dan neural networks sederhana."
        },
        {
          title: "Unsupervised Learning",
          description: "Menemukan pola tersembunyi dalam data tanpa label. Clustering, dimensionality reduction, dan association rule mining."
        },
        {
          title: "Model Validation",
          description: "Cross-validation, train-test split, bootstrap sampling untuk mengevaluasi performa model dan menghindari overfitting."
        },
        {
          title: "Feature Selection",
          description: "Teknik memilih variabel yang paling relevan: forward/backward selection, LASSO regression, information gain."
        }
      ]}
    />

    <ExampleGrid
      title="Desain Eksperimental Lanjutan"
      icon={Zap}
      examples={[
        {
          title: "Factorial Design",
          description: "Eksperimen dengan multiple factors untuk menganalisis main effects dan interaction effects antar variabel."
        },
        {
          title: "Randomized Controlled Trials",
          description: "Gold standard untuk penelitian kausal dengan randomisasi subjek ke treatment dan control groups."
        },
        {
          title: "A/B Testing",
          description: "Eksperimen untuk membandingkan dua versi (A vs B) dalam konteks bisnis atau produk digital."
        },
        {
          title: "Quasi-Experimental Design",
          description: "Desain eksperimen ketika randomisasi penuh tidak memungkinkan, menggunakan natural experiments."
        }
      ]}
      columns={2}
    />

    <div className="bg-muted/50 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Brain className="h-5 w-5" />
        Pertimbangan Khusus untuk Analisis Lanjutan
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-3">
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-2">Ukuran Sampel</h4>
            <p className="text-muted-foreground">
              Analisis multivariat memerlukan sampel yang lebih besar. Rule of thumb: minimal 10-20 observasi per variabel.
            </p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-2">Asumsi Kompleks</h4>
            <p className="text-muted-foreground">
              Multivariate normality, homoscedasticity, dan absence of multicollinearity menjadi lebih kritis.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-2">Interpretasi</h4>
            <p className="text-muted-foreground">
              Hasil lebih kompleks dan memerlukan pemahaman mendalam tentang konteks domain dan metodologi.
            </p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-2">Validasi</h4>
            <p className="text-muted-foreground">
              Cross-validation dan replication studies menjadi sangat penting untuk memastikan robustness hasil.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);