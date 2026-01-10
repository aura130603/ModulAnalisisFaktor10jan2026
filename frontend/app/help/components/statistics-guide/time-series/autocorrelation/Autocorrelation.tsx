import React from 'react';
import { HelpContentWrapper } from '../../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Autocorrelation: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Autocorrelation – Algoritma"
      description="Penjelasan ringkas mengenai autokorelasi, autokorelasi parsial, dan statistik uji Ljung-Box untuk data runtun waktu."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Statify menghitung autokorelasi dan autokorelasi parsial sebagai dasar dalam identifikasi orde AR dan MA, serta menyertakan statistik uji Ljung-Box untuk evaluasi.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Deskripsi</h3>
        <p>
          Jika pada materi pengantar statistik korelasi adalah alat ukur yang digunakan untuk melihat kekuatan hubungan antara dua variabel, namun pada data runtun waktu analisis univariat, perbandingannya dilakukan terhadap variabel yang sama tetapi pada periode waktu yang berbeda, yang disebut autokorelasi. Ukuran ini sering digunakan untuk menentukan parameter orde AR (Autoregressive) dan MA (Moving Average) dalam model Box-Jenkins (ARIMA). Autokorelasi juga sering digunakan bersamaan dengan autokorelasi parsial (partial autocorrelation) untuk mengidentifikasi hubungan kondisional setiap data runtun waktu antar periode.
        </p>

        <h3>Ukuran Statistik</h3>

        <h4>1. Autokorelasi</h4>
        <p><strong>Sampel Autokorelasi (rk):</strong></p>
        <pre>
{`rk = Σ (Yt - Ȳ)(Yt+k - Ȳ) / Σ (Yt - Ȳ)^2`}
        </pre>
        <ul>
          <li>n = Jumlah periode data</li>
          <li>rk = Sampel autokorelasi lag ke-k</li>
          <li>Yt = Data periode ke-t</li>
          <li>Ȳ = Rata-rata data</li>
        </ul>
        <p><strong>Standard Error Sampel Autokorelasi:</strong></p>
        <pre>
{`var(rk) = (1/n) * (1 + 2 Σ ri), i = 1..q`}
        </pre>
        <ul>
          <li>var(rk) = Varians sampel autokorelasi lag ke-k</li>
          <li>q = Jumlah lag</li>
        </ul>

        <h4>2. Statistik Uji Ljung-Box (Qk)</h4>
        <pre>
{`Qk = n(n + 2) Σ (ri^2 / (n - i))`}
        </pre>
        <ul>
          <li>Qk = Statistik uji Ljung-Box lag ke-k</li>
          <li><strong>Distribusi:</strong> Qk ~ χ²(k-p-d)</li>
        </ul>

        <h4>3. Autokorelasi Parsial</h4>
        <p><strong>Sampel Autokorelasi Parsial (ϕ̂kk):</strong></p>
        <pre>
{`ϕ̂11 = r1
ϕ̂22 = (r2 - r1^2) / (1 - r1^2)
ϕ̂kk = [rk - Σ ϕ̂k-1,j * rk-j] / [1 - Σ ϕ̂k-1,j * rj]`}
        </pre>
        <p><strong>Standard Error Sampel Autokorelasi Parsial:</strong></p>
        <pre>
{`var(ϕ̂kk) ≈ 1 / n`}
        </pre>
        <p>Dengan asumsi bahwa model AR(p) memiliki jumlah orde p ≤ k-1. Hal ini disebutkan dalam Quenouille, 1949.</p>

        <h4>4. Nilai Batas Bartlett</h4>
        <ul>
          <li>Autokorelasi: rk ± Zα/2 × se(rk)</li>
          <li>Autokorelasi Parsial: ϕ̂kk ± Zα/2 × se(ϕ̂kk)</li>
        </ul>

        <h3>Referensi</h3>
        <ul>
          <li>Bartlett, M. S. (1946). *Journal of the Royal Statistical Society, Series B*, 8.</li>
          <li>Box, G. E. P., & Jenkins, G. M. (1976). *Time Series Analysis: Forecasting and Control*. Holden-Day.</li>
          <li>Cryer, J. D., & Chan, K. S. (2008). *Time Series Analysis With Application in R* (2nd ed.). Springer.</li>
          <li>Quenouville, M. H. (1949). *Journal of the Royal Statistical Society, Series B*, 11.</li>
          <li>Makridakis, S., Wheelwright, S. C., & McGee, V. E. (1983). *Forecasting: Methods and Applications*. John Wiley and Sons.</li>
          <li>Wei, W. W. S. (2005). *Time Series Analysis: Univariate and Multivariate Methods* (2nd ed.). Addison Wesley.</li>
        </ul>
      </div>
    </HelpContentWrapper>
  );
};