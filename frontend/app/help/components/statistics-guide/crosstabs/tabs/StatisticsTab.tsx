import React from 'react';
import { HelpCard, HelpAlert } from '@/app/help/ui/HelpLayout';
import { Calculator, TrendingUp, Target, BarChart3 } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

export const StatisticsTab = () => (
  <div className="space-y-6">
    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Uji Chi-Square</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Chi-Square Test of Independence</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\chi^2 = \\sum \\frac{(O_{ij} - E_{ij})^2}{E_{ij}}'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>H₀:</strong> Kedua variabel independen (tidak ada hubungan)</p>
            <p><strong>H₁:</strong> Ada hubungan antara kedua variabel</p>
            <p>
              <strong>df:</strong>{' '}
              <InlineMath math={'(r-1)(c-1)'} />
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Interpretasi Hasil</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p><strong>p-value &lt; 0.05:</strong> Tolak H₀, ada hubungan signifikan</p>
            <p><strong>p-value ≥ 0.05:</strong> Terima H₀, tidak ada bukti hubungan</p>
            <p><strong>Effect size:</strong> Gunakan Cramer&apos;s V untuk mengukur kekuatan hubungan</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
            <h4 className="font-medium text-amber-800 dark:text-amber-200">Asumsi Chi-Square</h4>
          </div>
          <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <p>• Frekuensi yang diharapkan ≥ 5 di setiap sel</p>
            <p>• Observasi independen</p>
            <p>• Sampel acak</p>
            <p>• Kategori saling eksklusif</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Ukuran Asosiasi</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Cramer&apos;s V</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'V = \\sqrt{ \\dfrac{ \\chi^2 }{ n \\cdot \\min(r-1, \\; c-1) } }'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Rentang:</strong> 0 - 1 (0 = tidak ada asosiasi, 1 = asosiasi sempurna)</p>
            <p><strong>Interpretasi:</strong> 0.1 = lemah, 0.3 = sedang, 0.5 = kuat</p>
            <p><strong>Kegunaan:</strong> Dapat digunakan untuk tabel berukuran apa pun</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Phi Coefficient (φ)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\varphi = \\sqrt{ \\dfrac{ \\chi^2 }{ n } }'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Rentang:</strong> 0 - 1 untuk tabel 2×2</p>
            <p><strong>Khusus untuk:</strong> Tabel kontingensi 2×2</p>
            <p><strong>Setara dengan:</strong> Korelasi Pearson untuk variabel dikotomi</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Contingency Coefficient (C)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'C = \\sqrt{ \\dfrac{ \\chi^2 }{ \\chi^2 + n } }'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Rentang:</strong> 0 - tidak mencapai 1 (maksimum tergantung ukuran tabel)</p>
            <p><strong>Kegunaan:</strong> Alternatif untuk tabel dengan ukuran berbeda</p>
            <p><strong>Catatan:</strong> Sulit dibandingkan antar tabel berbeda ukuran</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Lambda (λ)</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'\\lambda = \\dfrac{E_1 + E_2 - E_0}{2n - E_0}'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
            <p><strong>Interpretasi:</strong> Proportional reduction in error (PRE)</p>
            <p><strong>Kegunaan:</strong> Mengukur prediktabilitas asimetrik</p>
            <p><strong>Rentang:</strong> 0 - 1 (proporsi pengurangan kesalahan prediksi)</p>
          </div>
        </div>
      </div>
    </div>

    <div className="p-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium text-slate-800 dark:text-slate-200">Uji Alternatif</h3>
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Fisher&apos;s Exact Test</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p><strong>Kapan digunakan:</strong> Frekuensi yang diharapkan &lt; 5 di beberapa sel</p>
            <p><strong>Keunggulan:</strong> Memberikan p-value yang tepat, tidak bergantung pada asumsi</p>
            <p><strong>Keterbatasan:</strong> Komputasi intensif untuk tabel besar</p>
            <p><strong>Ideal untuk:</strong> Tabel 2×2 dengan sampel kecil</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Likelihood Ratio Chi-Square</h4>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded border mb-2">
            <BlockMath math={'G^2 = 2 \\sum O_{ij} \\ln \\left( \\dfrac{O_{ij}}{E_{ij}} \\right)'} />
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p><strong>Kegunaan:</strong> Alternatif untuk Chi-Square klasik</p>
            <p><strong>Keunggulan:</strong> Lebih sensitif untuk sampel kecil</p>
            <p><strong>Interpretasi:</strong> Sama dengan Chi-Square biasa</p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-600">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <h4 className="font-medium text-slate-800 dark:text-slate-200">Linear-by-Linear Association</h4>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p><strong>Kapan digunakan:</strong> Kedua variabel bersifat ordinal</p>
            <p><strong>Keunggulan:</strong> Lebih powerful untuk mendeteksi tren linear</p>
            <p><strong>Interpretasi:</strong> Menguji tren linear dalam asosiasi</p>
            <p><strong>df = 1:</strong> Selalu memiliki 1 derajat kebebasan</p>
          </div>
        </div>
      </div>
    </div>

    <HelpCard title="Pemilihan Ukuran Asosiasi" icon={BarChart3} variant="feature">
      <div className="space-y-4 mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Rekomendasi Berdasarkan Ukuran Tabel</h4>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p><strong>Tabel 2×2:</strong> Phi Coefficient</p>
              <p><strong>Tabel Apa Pun:</strong> Cramer&apos;s V</p>
              <p><strong>Variabel Ordinal:</strong> Gamma, Tau-b, Tau-c</p>
              <p><strong>Prediksi Asimetrik:</strong> Lambda</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Interpretasi Kekuatan Asosiasi</h4>
            <div className="text-sm space-y-2 text-muted-foreground">
              <p><strong>0.00 - 0.09:</strong> Sangat lemah/tidak ada</p>
              <p><strong>0.10 - 0.29:</strong> Lemah</p>
              <p><strong>0.30 - 0.49:</strong> Sedang</p>
              <p><strong>0.50 - 1.00:</strong> Kuat</p>
            </div>
          </div>
        </div>
      </div>
    </HelpCard>

    <HelpAlert variant="warning" title="Perhatian dalam Interpretasi">
      <div className="text-sm space-y-2 mt-2">
        <p>
          <strong>Signifikansi vs Kekuatan:</strong> Chi-Square yang signifikan tidak selalu berarti hubungan yang kuat. 
          Dengan sampel besar, bahkan asosiasi lemah bisa menjadi signifikan secara statistik.
        </p>
        <p>
          <strong>Kausalitas:</strong> Asosiasi yang signifikan tidak menyiratkan hubungan kausal. 
          Pertimbangkan kemungkinan confounding variables.
        </p>
        <p>
          <strong>Validitas Praktis:</strong> Selalu pertimbangkan apakah hasil secara praktis bermakna 
          dalam konteks penelitian Anda.
        </p>
      </div>
    </HelpAlert>
  </div>
);
