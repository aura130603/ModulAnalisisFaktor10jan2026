import React from 'react';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { Zap, Target } from 'lucide-react';

export const QuickStartGuide = () => (
  <div className="space-y-6">
    <HelpCard title="Panduan Cepat" icon={Zap} variant="feature">
      <div className="space-y-4 mt-4">
        <HelpStep 
          number={1} 
          title="Upload Data" 
          description="Upload file CSV/Excel dengan dua variabel kategorikal yang ingin dianalisis"
        />
        
        <HelpStep 
          number={2} 
          title="Pilih Variabel Baris" 
          description="Pilih variabel kategorikal yang akan ditampilkan sebagai baris dalam tabel kontingensi"
        />
        
        <HelpStep 
          number={3} 
          title="Pilih Variabel Kolom" 
          description="Pilih variabel kategorikal yang akan ditampilkan sebagai kolom dalam tabel kontingensi"
        />
        
        <HelpStep 
          number={4} 
          title="Konfigurasi Tampilan Sel" 
          description="Atur opsi tampilan: frekuensi teramati/diharapkan, persentase, dan residual"
        />
        
        <HelpStep 
          number={5} 
          title="Pilih Statistik" 
          description="Tentukan uji statistik: Chi-Square, Fisher's Exact, dan ukuran asosiasi"
        />
        
        <HelpStep 
          number={6} 
          title="Jalankan Analisis" 
          description="Klik tombol untuk menjalankan analisis crosstabs dan interpretasi hasil"
        />
      </div>
    </HelpCard>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Skenario Umum</h3>
        <div className="space-y-3 text-sm">
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-blue-200 dark:border-blue-800">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Penelitian Survei</p>
            <p className="text-blue-700 dark:text-blue-300">Menganalisis hubungan antara demografi responden dengan preferensi atau opini</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-emerald-200 dark:border-emerald-800">
            <p className="font-medium text-emerald-800 dark:text-emerald-200 mb-1">Uji Klinis</p>
            <p className="text-emerald-700 dark:text-emerald-300">Menguji efektivitas treatment berdasarkan karakteristik pasien</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-purple-200 dark:border-purple-800">
            <p className="font-medium text-purple-800 dark:text-purple-200 mb-1">Riset Pasar</p>
            <p className="text-purple-700 dark:text-purple-300">Analisis segmentasi konsumen dan preferensi produk</p>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800">
            <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">Quality Control</p>
            <p className="text-amber-700 dark:text-amber-300">Hubungan antara faktor produksi dengan kualitas output</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Tips Praktis</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Pastikan kategori variabel jelas dan tidak ambigu</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Periksa frekuensi minimum (≥5) di setiap sel sebelum interpretasi</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Gunakan persentase baris/kolom untuk interpretasi yang lebih mudah</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Analisis residual membantu mengidentifikasi pola spesifik</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full mt-2"></span>
            <p className="text-slate-600 dark:text-slate-400">Laporkan baik signifikansi statistik maupun ukuran efek</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Workflow Rekomendasi</h3>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium text-sm">1. Persiapan Data</p>
          <p className="ml-4 text-sm text-muted-foreground">• Bersihkan missing values • Pastikan kategori lengkap • Verifikasi tipe data kategorikal</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">2. Eksplorasi Awal</p>
          <p className="ml-4 text-sm text-muted-foreground">• Lihat frekuensi setiap kategori • Periksa distribusi marginal • Identifikasi kategori dengan frekuensi rendah</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">3. Analisis Deskriptif</p>
          <p className="ml-4 text-sm text-muted-foreground">• Buat tabel kontingensi • Hitung persentase baris dan kolom • Analisis pola distribusi</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">4. Uji Statistik</p>
          <p className="ml-4 text-sm text-muted-foreground">• Chi-Square untuk independensi • Fisher&apos;s Exact jika frekuensi rendah • Hitung ukuran asosiasi</p>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium text-sm">5. Interpretasi Hasil</p>
          <p className="ml-4 text-sm text-muted-foreground">• Evaluasi signifikansi statistik • Interpretasi ukuran efek • Identifikasi pola melalui residual</p>
        </div>
      </div>
    </div>

    <HelpAlert variant="tip" title="Interpretasi Hasil yang Tepat">
      <div className="text-sm space-y-3 mt-2">
        <div className="space-y-2">
          <p className="font-medium">Langkah Interpretasi:</p>
          <div className="ml-4 space-y-1">
            <p>1. <strong>Signifikansi:</strong> Apakah p-value &lt; 0.05?</p>
            <p>2. <strong>Kekuatan:</strong> Berapa nilai Cramer&apos;s V atau Phi?</p>
            <p>3. <strong>Arah:</strong> Pola apa yang terlihat dari persentase?</p>
            <p>4. <strong>Kontribusi:</strong> Sel mana yang berkontribusi pada asosiasi?</p>
            <p>5. <strong>Praktis:</strong> Apakah hasilnya bermakna secara praktis?</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="font-medium">Pelaporan:</p>
          <div className="ml-4 space-y-1">
            <p>• Laporkan Chi-Square, df, dan p-value</p>
            <p>• Sertakan ukuran efek (Cramer&apos;s V)</p>
            <p>• Jelaskan pola dengan persentase</p>
            <p>• Diskusikan implikasi praktis</p>
          </div>
        </div>
      </div>
    </HelpAlert>

    <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-3">Troubleshooting Umum</h3>
      <div className="space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="font-mono text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded min-w-fit">ERROR</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Frekuensi yang diharapkan terlalu kecil</p>
            <p className="text-slate-600 dark:text-slate-400">Gunakan Fisher&apos;s Exact Test atau kombinasikan kategori dengan frekuensi rendah</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded min-w-fit">WARN</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Hasil signifikan tapi ukuran efek kecil</p>
            <p className="text-slate-600 dark:text-slate-400">Dengan sampel besar, asosiasi lemah bisa signifikan. Fokus pada ukuran efek untuk interpretasi praktis</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <span className="font-mono text-blue-600 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded min-w-fit">INFO</span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-200">Tabel kontingensi dengan banyak sel kosong</p>
            <p className="text-slate-600 dark:text-slate-400">Pertimbangkan penggabungan kategori atau pengumpulan data tambahan</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
