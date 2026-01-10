import React from 'react';
import { HelpContentWrapper } from '../../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Smoothing: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Smoothing – Algoritma"
      description="Penjelasan rinci mengenai cara Statify melakukan peramalan dengan menggunakan metode Smoothing, termasuk Moving Average dan Exponential Smoothing."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Deskripsi</AlertTitle>
            <AlertDescription className="text-blue-700">
              Smoothing adalah suatu teknik dalam analisis deret waktu yang bertujuan untuk melakukan peramalan dengan menggunakan data periode sebelumnya sebagai dasar untuk meramal data di masa depan. Pada modul ini metode smoothing yang tersedia terdiri atas dua metode utama, yaitu metode Moving Average dan Exponential Smoothing.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Metode Smoothing</h3>
        <ol>
          <li>
            <h4>Simple Moving Average</h4>
            <p>
              Simple Moving Average adalah salah satu metode smoothing yang merata-ratakan sejumlah data dalam rentang tertentu untuk meramal data di masa mendatang. Berikut rumus untuk menghitung simple moving average pada fitur ini.
            </p>
            <pre>
              {`M_t = Ŷ_{t+1} = (1/d) * Σ(i=0)^(d-1) Y_{t-i}`}
            </pre>
            <p>
              Keterangan:
              <br />
              - M_t = Nilai moving average periode ke-t
              <br />
              - Ŷ_t+1 = Data ramalan satu periode selanjutnya setelah t
              <br />
              - Y_t = Data awal periode ke-t
              <br />
              - d = Jumlah jarak yang digunakan untuk menghitung rata-rata (average)
              <br />
              - n = Jumlah periode data
            </p>
          </li>
          <li>
            <h4>Double Moving Average</h4>
            <p>
              Double Moving Average adalah pengembangan dari metode simple moving average, yakni melakukan moving average sebanyak dua kali lalu menghitung nilai tren yang menyerupai bentuk regresi linear sederhana dalam menghitung data setelahnya.
            </p>
            <pre>
              {`M_t = (1/d) * Σ(t=0)^(d-1) Y_{t-i}`} <br />
              {`M'_t = (1/d) * Σ(i=0)^(d-1) M_{t-i}`} <br />
              {`a_t = 2M_t - M'_t`} <br />
              {`b_t = (2/(d-1)) * (M_t - M'_t)`} <br />
              {`Ŷ_{t+p} = a_t + b_t * p`}
            </pre>
            <p>
              Keterangan:
              <br />
              - M_t = Nilai moving average pertama periode ke-t
              <br />
              - M'_t = Nilai moving average kedua periode ke-t
              <br />
              - a_t = Nilai selisih antara dua moving average periode ke-t
              <br />
              - b_t = Nilai perubahan atau gradien antara moving average periode ke-t
              <br />
              - Ŷ_t+p = Data ramalan p periode selanjutnya setelah t
              <br />
              - Y_t = Data awal periode ke-t
              <br />
              - d = Jumlah jarak yang digunakan untuk menghitung rata-rata (average)
            </p>
          </li>
          <li>
            <h4>Simple Exponential Smoothing</h4>
            <p>
              Simple Exponential Smoothing adalah metode smoothing yang melakukan peramalan menggunakan pembobotan nilai sekarang dan nilai hasil peramalan masa sebelumnya. Pembobotan ini menggunakan satu parameter yang umumnya sering disebut parameter alpa. Berikut rumus untuk melakukan proses simple exponential smoothing.
            </p>
            <pre>
              {`Ŷ_{t+1} = αY_t + (1-α)Ŷ_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - Ŷ_t+1 = Data ramalan baru satu periode selanjutnya
              <br />
              - α = Konstanta smoothing (0 &lt; α &lt; 1)
              <br />
              - Y_t = Data awal periode ke-t
            </p>
          </li>
          <li>
            <h4>Double Exponential Smoothing</h4>
            <p>
              Double Exponential Smoothing adalah metode peramalan yang didasarkan pada metode brown yang meramal data deret waktu dengan menggunakan tren linear yang memiliki kesamaan konsep dengan double moving average. Berikut rumus yang digunakan pada double exponential smoothing.
            </p>
            <pre>
              {`A_t = αY_t + (1-α)A_{t-1}`} <br />
              {`A'_t = αA_t + (1-α)A'_{t-1}`} <br />
              {`a_t = 2A_t - A'_t`} <br />
              {`b_t = (α/(1-α)) * (A_t - A'_t)`} <br />
              {`Ŷ_{t+p} = a_t + b_t * p`}
            </pre>
            <p>
              Keterangan:
              <br />
              - A_t = Nilai exponential smoothing pertama periode ke-t
              <br />
              - A'_t = Nilai exponential smoothing kedua periode ke-t
              <br />
              - a_t = Nilai selisih antara dua exponential smoothing periode ke-t
              <br />
              - b_t = Nilai perubahan atau gradien antara exponential smoothing periode ke-t
              <br />
              - Ŷ_t+p = Data ramalan p periode selanjutnya setelah t
              <br />
              - Y_t = Data awal periode ke-t
              <br />
              - α = Konstanta smoothing (0 &lt; α &lt; 1)
            </p>
          </li>
          <li>
            <h4>Holt's Exponential Smoothing</h4>
            <p>
              Holt's Exponential Smoothing adalah metode smoothing yang penghitungannya menggunakan dua parameter. Parameter pertama digunakan untuk menghitung exponential smoothing dasar untuk setiap periodenya sedangkan parameter kedua digunakan untuk menghitung nilai tren dari exponential smoothing sebelumnya untuk setiap periode. Berikut rumus yang digunakan untuk menghitung holt's exponential smoothing.
            </p>
            <pre>
              {`A_t = αY_t + (1-α)(A_{t-1} + T_{t-1})`} <br />
              {`T_t = β(A_t - A_{t-1}) + (1-β)T_{t-1}`} <br />
              {`Ŷ_{t+p} = A_t + pT_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - A_t = Nilai exponential smoothing periode ke-t
              <br />
              - T_t = Nilai estimasi tren periode ke-t
              <br />
              - Ŷ_t+p = Data ramalan p periode selanjutnya setelah t
              <br />
              - Y_t = Data awal periode ke-t
              <br />
              - α = Konstanta smoothing (0 &lt; α &lt; 1)
              <br />
              - β = Konstanta tren (0 &lt; β &lt; 1)
            </p>
          </li>
          <li>
            <h4>Winter's Exponential Smoothing</h4>
            <p>
              Winter's Exponential Smoothing adalah suatu pengembangan dari teknik exponential smoothing yang sebelumnya yang menambahkan faktor dan parameter musim dalam penghitungannya. Berikut adalah rumus untuk menghitung winter's exponential smoothing.
            </p>
            <pre>
              {`A_t = α * (Y_t / S_{t-L}) + (1-α) * (A_{t-1} + T_{t-1})`} <br />
              {`T_t = β * (A_t - A_{t-1}) + (1-β) * T_{t-1}`} <br />
              {`S_t = γ * (Y_t / A_t) + (1-γ) * S_{t-L}`} <br />
              {`Ŷ_{t+p} = (A_t + pT_t) * S_{t-L+p}`}
            </pre>
            <p>
              Dikarenakan penghitungan menggunakan panjang periode musim maka untuk nilai awal yang periodenya kurang dari periode musim (t &lt; L) perlu dilakukan inisiasi sebagai berikut.
            </p>
            <pre>
              {`A_1 = Y_1`} <br />
              {`T_1 = 0.0`} <br />
              {`S_1 = 1.0`}
            </pre>
            <p>
              Untuk periode t &gt; 1 dan t &lt; L:
            </p>
            <pre>
              {`A_t = α * (Y_t / 1.0) + (1-α) * (A_{t-1} + T_{t-1})`} <br />
              {`T_t = β * (A_t - A_{t-1}) + (1-β) * T_{t-1}`} <br />
              {`S_t = γ * (Y_t / A_t) + (1-γ) * 1.0`} <br />
            </pre>
            <p>
              Keterangan:
              <br />
              - A_t = Nilai exponential smoothing periode ke-t
              <br />
              - T_t = Nilai estimasi tren periode ke-t
              <br />
              - S_t = Nilai estimasi musim periode ke-t
              <br />
              - Ŷ_t+p = Data ramalan p periode selanjutnya setelah t
              <br />
              - Y_t = Data awal periode ke-t
              <br />
              - α = Konstanta smoothing (0 &lt; α &lt; 1)
              <br />
              - β = Konstanta tren (0 &lt; β &lt; 1)
              <br />
              - γ = Konstanta musim (0 &lt; γ &lt; 1)
              <br />
              - L = Panjang periode musim
            </p>
          </li>
        </ol>

        <h3>Evaluasi Smoothing</h3>
        <p>
          Pada tahapan ini hasil peramalan data akan dievaluasi menggunakan beberapa indikator berikut.
        </p>
        <ol>
          <li>
            <strong>Mean Square Error (MSE)</strong>
            <pre>{`MSE = (1/n) * Σ(t=1)^n (Y_t - F_t)²`}</pre>
          </li>
          <li>
            <strong>Root Mean Square Error (RMSE)</strong>
            <pre>{`RMSE = √MSE`}</pre>
          </li>
          <li>
            <strong>Mean Absolute Error (MAE)</strong>
            <pre>{`MAE = (1/n) * Σ(t=1)^n |Y_t - F_t|`}</pre>
          </li>
          <li>
            <strong>Mean Percentage Error (MPE)</strong>
            <pre>{`MPE = (1/n) * Σ(t=1)^n [((Y_t - F_t)/Y_t) * 100]`}</pre>
          </li>
          <li>
            <strong>Mean Absolute Percentage Error (MAPE)</strong>
            <pre>{`MAPE = (1/n) * Σ(t=1)^n [|(Y_t - F_t)/Y_t| * 100]`}</pre>
          </li>
        </ol>
        <p>
          Keterangan:
          <br />
          - n = Jumlah periode data
          <br />
          - Y_t = Data awal periode ke-t
          <br />
          - F_t = Data hasil peramalan (forecasting) ke-t
        </p>

        <h3>Referensi</h3>
        <ul>
          <li>Hanke, J. E., & Wichern, D. W. (1995). Business forecasting (5th ed.). Pearson Prentice Hall.</li>
          <li>Makridakis, S., Wheelwright, S. C., & McGee, V. E. (1983). Forecasting: Methods and applications. New York: John Wiley and Sons.</li>
        </ul>
      </div>
    </HelpContentWrapper>
  );
};