import React from 'react';
import { HelpCircle, FileText } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Apa itu Analisis Frekuensi?"
      description="Analisis frekuensi menghitung seberapa sering setiap nilai unik muncul dalam data Anda. Ini membantu Anda memahami distribusi nilai dan mengidentifikasi pola."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Analisis Frekuensi",
          icon: HelpCircle,
          items: [
            "Memahami distribusi data kategorikal",
            "Mengidentifikasi nilai yang paling umum",
            "Memeriksa kualitas data dan nilai yang hilang",
            "Mempersiapkan data untuk analisis lebih lanjut"
          ]
        },
        {
          title: "Yang Akan Anda Pelajari",
          icon: FileText,
          items: [
            "Cara memilih variabel untuk analisis",
            "Opsi statistik yang tersedia",
            "Opsi kustomisasi grafik",
            "Cara menginterpretasi hasil"
          ]
        }
      ]}
    />
  </div>
);