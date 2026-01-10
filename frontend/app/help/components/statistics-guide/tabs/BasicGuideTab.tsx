import React from 'react';
import { BookOpen, BarChart3, TrendingUp, Calculator } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../shared/StandardizedContentLayout';

export const BasicGuideTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Panduan Dasar Analisis Statistik"
      description="Pelajari konsep-konsep fundamental dalam analisis statistik dan cara menerapkannya dalam penelitian Anda."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Tipe Data dan Variabel",
          icon: BarChart3,
          items: [
            "Nominal - Kategori tanpa urutan (jenis kelamin, agama)",
            "Ordinal - Kategori dengan urutan (tingkat pendidikan)",
            "Interval - Numerik dengan jarak sama (suhu Celsius)",
            "Rasio - Numerik dengan titik nol absolut (tinggi, berat)",
            "Diskrit vs Kontinu - Bilangan bulat vs desimal"
          ]
        },
        {
          title: "Statistik Deskriptif",
          icon: Calculator,
          items: [
            "Mean - Rata-rata aritmatika",
            "Median - Nilai tengah data terurut",
            "Modus - Nilai yang paling sering muncul",
            "Standar Deviasi - Ukuran penyebaran data",
            "Range - Selisih nilai maksimum dan minimum"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Konsep Penting dalam Statistik"
      icon={BookOpen}
      concepts={[
        {
          title: "Populasi vs Sampel",
          description: "Populasi adalah keseluruhan objek penelitian, sedangkan sampel adalah bagian dari populasi yang dipilih untuk diteliti. Statistik sampel digunakan untuk mengestimasi parameter populasi."
        },
        {
          title: "Distribusi Normal",
          description: "Distribusi probabilitas yang berbentuk lonceng, simetris, dengan mean = median = modus. Banyak fenomena alam mengikuti distribusi normal."
        },
        {
          title: "Hipotesis Statistik",
          description: "Pernyataan tentang parameter populasi yang akan diuji. H0 (hipotesis nol) vs H1 (hipotesis alternatif). Keputusan berdasarkan bukti dari data sampel."
        },
        {
          title: "Tingkat Signifikansi",
          description: "Probabilitas menolak H0 ketika H0 benar (Type I error). Umumnya ditetapkan 0.05 (5%). Nilai p kurang dari alpha menunjukkan hasil signifikan."
        },
        {
          title: "Confidence Interval",
          description: "Rentang nilai yang kemungkinan besar mengandung parameter populasi yang sebenarnya. CI 95% berarti 95% yakin parameter berada dalam rentang tersebut."
        },
        {
          title: "Effect Size",
          description: "Ukuran besarnya efek atau perbedaan yang ditemukan. Memberikan informasi praktis tentang signifikansi hasil, tidak hanya signifikansi statistik."
        }
      ]}
    />

    <div className="bg-muted/50 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Langkah-langkah Analisis Statistik
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">Persiapan Data:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>1. Definisikan tujuan penelitian</li>
            <li>2. Tentukan variabel yang akan dianalisis</li>
            <li>3. Periksa kualitas dan kelengkapan data</li>
            <li>4. Identifikasi missing values dan outliers</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Eksekusi Analisis:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>5. Pilih metode analisis yang tepat</li>
            <li>6. Periksa asumsi statistik</li>
            <li>7. Jalankan analisis dan interpretasi hasil</li>
            <li>8. Validasi dan dokumentasi temuan</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);