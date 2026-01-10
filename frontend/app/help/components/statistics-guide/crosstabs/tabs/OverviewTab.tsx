import React from 'react';
import { Grid3x3, Target, TrendingUp, HelpCircle } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection, 
  ExampleGrid 
} from '../../shared/StandardizedContentLayout';

export const OverviewTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Tentang Analisis Crosstabs"
      description="Analisis Crosstabs (tabulasi silang) digunakan untuk menguji hubungan antara dua variabel kategorikal dengan membuat tabel kontingensi. Analisis ini menunjukkan bagaimana frekuensi terdistribusi di antara kategori-kategori dan menguji signifikansi statistik hubungan tersebut."
      variant="info"
    />

    <FeatureGrid
      features={[
        {
          title: "Kapan Menggunakan Crosstabs",
          icon: HelpCircle,
          items: [
            "Menguji hubungan antara dua variabel kategorikal",
            "Menganalisis respons survei berdasarkan kelompok demografis",
            "Membandingkan proporsi di antara kategori yang berbeda",
            "Mengidentifikasi pola dalam data kategorikal",
            "Memvalidasi hipotesis tentang independensi variabel",
            "Analisis pasar dan segmentasi konsumen"
          ],
        },
        {
          title: "Hasil yang Akan Diperoleh",
          icon: Grid3x3,
          items: [
            "Tabel kontingensi dengan jumlah teramati dan diharapkan",
            "Uji Chi-Square untuk independensi",
            "Persentase baris, kolom, dan total",
            "Ukuran asosiasi (Cramer's V, Gamma, dll.)",
            "Analisis residual untuk signifikansi sel",
            "Interpretasi statistik yang mudah dipahami"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Konsep Dasar Crosstabs"
      icon={Target}
      concepts={[
        {
          title: "Tabel Kontingensi",
          formula: "Matriks yang menampilkan frekuensi gabungan dua variabel kategorikal",
          description: "Variabel baris vs variabel kolom dengan interseksi menunjukkan jumlah observasi untuk setiap kombinasi kategori.",
          color: "emerald"
        },
        {
          title: "Uji Chi-Square",
          formula: "χ² = Σ((Observed - Expected)² / Expected)",
          description: "Menguji apakah ada hubungan signifikan antara dua variabel kategorikal.",
          color: "blue"
        },
        {
          title: "Ukuran Asosiasi",
          formula: "Cramer's V, Phi Coefficient, Contingency Coefficient",
          description: "Mengukur kekuatan hubungan antara variabel kategorikal (rentang 0-1).",
          color: "purple"
        }
      ]}
    />

    <ExampleGrid
      title="Contoh Aplikasi Praktis"
      icon={TrendingUp}
      examples={[
        {
          title: "Penelitian Medis",
          description: "Menguji hubungan antara jenis kelamin dan kejadian penyakit tertentu",
          color: "blue"
        },
        {
          title: "Survei Konsumen",
          description: "Menganalisis preferensi produk berdasarkan kelompok usia",
          color: "emerald"
        },
        {
          title: "Penelitian Pendidikan",
          description: "Hubungan metode pembelajaran dengan tingkat kelulusan",
          color: "purple"
        },
        {
          title: "Analisis Politik",
          description: "Preferensi voting berdasarkan lokasi geografis",
          color: "amber"
        }
      ]}
    />

    <IntroSection
      title="Tips Pemilihan Variabel"
      description="Variabel Baris: Sering kali merupakan variabel hasil atau dependen yang ingin dijelaskan. Variabel Kolom: Biasanya merupakan variabel prediktor atau independen yang menjelaskan. Pertimbangan: Pastikan kedua variabel bersifat kategorikal dan memiliki kategori yang jelas dan saling eksklusif."
      variant="tip"
    />
  </div>
);
