import React from 'react';
import { Target, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { 
  IntroSection, 
  FeatureGrid, 
  ConceptSection 
} from '../shared/StandardizedContentLayout';

export const TipsTab = () => (
  <div className="space-y-6">
    <IntroSection
      title="Tips & Trik Analisis Statistik"
      description="Kumpulan praktik terbaik, tips praktis, dan cara menghindari kesalahan umum dalam analisis statistik."
      variant="tip"
    />

    <FeatureGrid
      features={[
        {
          title: "Persiapan Data yang Efektif",
          icon: CheckCircle,
          items: [
            "Data Cleaning - Identifikasi dan tangani missing values",
            "Outlier Detection - Gunakan boxplot dan z-score",
            "Data Transformation - Log, sqrt untuk normalisasi",
            "Variable Coding - Konsisten dalam pengkodean kategori",
            "Documentation - Catat semua langkah preprocessing"
          ]
        },
        {
          title: "Visualisasi yang Bermakna",
          icon: Lightbulb,
          items: [
            "Chart Selection - Pilih grafik sesuai tipe data",
            "Color Usage - Gunakan warna yang accessible",
            "Scale Appropriateness - Mulai dari nol untuk bar chart",
            "Annotation - Tambahkan label dan keterangan",
            "Simplicity - Hindari chart junk dan 3D effects"
          ]
        }
      ]}
    />

    <ConceptSection
      title="Kesalahan Umum yang Harus Dihindari"
      icon={AlertTriangle}
      concepts={[
        {
          title: "Multiple Testing Problem",
          description: "Melakukan banyak uji statistik tanpa koreksi meningkatkan Type I error. Gunakan Bonferroni correction atau FDR untuk multiple comparisons."
        },
        {
          title: "Correlation vs Causation",
          description: "Korelasi tidak berarti kausalitas. Perlu desain eksperimental atau analisis kausal untuk menetapkan hubungan sebab-akibat."
        },
        {
          title: "Sample Size Issues",
          description: "Sampel terlalu kecil (underpowered) atau terlalu besar (overpowered). Lakukan power analysis sebelum pengumpulan data."
        },
        {
          title: "P-Hacking",
          description: "Manipulasi analisis untuk mendapatkan hasil signifikan. Pre-register analysis plan dan laporkan semua analisis yang dilakukan."
        },
        {
          title: "Assumption Violations",
          description: "Mengabaikan asumsi statistik (normalitas, homoskedastisitas). Selalu periksa asumsi dan gunakan alternatif non-parametrik jika perlu."
        },
        {
          title: "Cherry Picking",
          description: "Melaporkan hanya hasil yang mendukung hipotesis. Laporkan semua hasil, termasuk yang tidak signifikan atau bertentangan."
        }
      ]}
    />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-muted/50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Best Practices
        </h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Reproducible Research</h4>
            <p className="text-muted-foreground">Dokumentasi kode, version control, dan data sharing untuk transparansi.</p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Effect Size Reporting</h4>
            <p className="text-muted-foreground">Selalu laporkan effect size bersama dengan significance testing.</p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Confidence Intervals</h4>
            <p className="text-muted-foreground">Gunakan CI untuk memberikan informasi tentang precision estimates.</p>
          </div>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Interpretasi yang Tepat
        </h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Statistical vs Practical Significance</h4>
            <p className="text-muted-foreground">Hasil signifikan secara statistik belum tentu bermakna praktis.</p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Context Matters</h4>
            <p className="text-muted-foreground">Interpretasi harus mempertimbangkan konteks domain dan penelitian.</p>
          </div>
          <div className="p-3 bg-background rounded border">
            <h4 className="font-medium mb-1">Uncertainty Communication</h4>
            <p className="text-muted-foreground">Komunikasikan ketidakpastian dan limitasi dalam hasil.</p>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-muted/50 p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Lightbulb className="h-5 w-5" />
        Quick Tips untuk Analisis Harian
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="font-medium">Sebelum Analisis:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Tentukan research question yang spesifik</li>
            <li>• Pilih alpha level sebelum melihat data</li>
            <li>• Periksa distribusi dan outliers</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Saat Analisis:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Validasi asumsi statistik</li>
            <li>• Gunakan visualisasi untuk eksplorasi</li>
            <li>• Dokumentasi setiap langkah</li>
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Setelah Analisis:</h4>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Interpretasi dalam konteks praktis</li>
            <li>• Diskusikan limitasi dan bias</li>
            <li>• Replikasi dengan data independen</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);