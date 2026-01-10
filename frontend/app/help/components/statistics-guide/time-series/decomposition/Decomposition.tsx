import React from 'react';
import { HelpContentWrapper } from '../../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const Decomposition: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Decomposition – Algoritma"
      description="Penjelasan lengkap mengenai metode dekomposisi data deret waktu menggunakan pendekatan klasik aditif dan multiplikatif."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Deskripsi</AlertTitle>
            <AlertDescription className="text-blue-700">
              Decomposition (Dekomposisi) adalah suatu teknik peramalan data runtun waktu dengan memisahkan data runtun waktu menjadi empat komponen, di antaranya adalah komponen trend, cyclical, seasonal, dan irregular.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Komponen Dekomposisi</h3>
        <ul>
          <li><strong>Komponen Trend:</strong> Komponen data runtun waktu yang menggambarkan suatu pola garis trend.</li>
          <li><strong>Komponen Seasonal:</strong> Komponen data runtun waktu yang menggambarkan pola dalam kurun waktu tertentu yang terjadi secara berulang, biasanya terlihat dalam data kurun waktu bulanan, triwulanan, ataupun mingguan.</li>
          <li><strong>Komponen Cyclical:</strong> Komponen yang menunjukkan pola dalam kurun waktu tertentu namun dalam jangka waktu yang lebih panjang. Dalam praktisnya, komponen cyclical sering dianggap menjadi satu kesatuan dengan trend atau disebut komponen trend-cycle.</li>
          <li><strong>Komponen Irregular:</strong> Komponen data runtun waktu yang sifatnya acak dan tidak memiliki pola karena merupakan sisa pengurangan dari ketiga komponen sebelumnya. Komponen ini sering disebut juga error.</li>
        </ul>

        <h3>Bentuk Umum Dekomposisi</h3>
        <p>
          Dekomposisi data runtun waktu memiliki bentuk umum sebagai berikut:
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Multiplicative:</strong>
            <pre>
              {`Y(t) = T(t) * S(t) * I(t)`}
            </pre>
          </li>
          <li>
            <strong>Additive:</strong>
            <pre>
              {`Y(t) = T(t) + S(t) + I(t)`}
            </pre>
          </li>
        </ul>
        <p>
          Keterangan:
          <br />
          - Y_t = Data asli periode ke-t
          <br />
          - T_t = Komponen trend-cycle periode ke-t
          <br />
          - S_t = Komponen seasonal periode ke-t
          <br />
          - I_t = Komponen irregular periode ke-t
        </p>

        <h3>Algoritma Dekomposisi</h3>
        <p>
          Pada modul ini, fitur dekomposisi menggunakan metode dekomposisi klasik.
        </p>
        <h4>1. Tahapan Multiplicative Decomposition</h4>
        <p>Berikut tahapan dekomposisi data runtun waktu bentuk multiplikatif:</p>
        <ol>
          <li>
            <strong>Menghitung Moving Average</strong>
            <p>
              Pada tahap ini, data akan dimuluskan (smoothing) menggunakan teknik simple moving average jika periode data ganjil dan centered moving average jika periode data genap. Proses ini bertujuan untuk menghilangkan komponen trend-cycle pada data sementara waktu sebagai persiapan perhitungan komponen seasonal.
            </p>
            <ul>
              <li>
                <strong>Ganjil</strong>
                <pre>
                  {`TCtmp_t = (1/p) * Σ(Y_i) untuk i dari K-t-1 sampai p+t`}
                </pre>
                <p>
                  Keterangan:
                  <br />
                  - TCtmp_t = Komponen trend-cycle sementara periode ke-t
                  <br />
                  - p = Periode musim data
                  <br />
                  - Y_i = Data periode ke-i
                </p>
              </li>
              <li>
                <strong>Genap</strong>
                <pre>
                  {`TCtmp_t = (1/2) * [ (1/p) * Σ(Y_i) untuk i dari k-t-1 sampai p+t + (1/p) * Σ(Y_i) untuk i dari k-t sampai p+t+1 ]`}
                </pre>
                <p>
                  Keterangan:
                  <br />
                  - TCtmp_t = Komponen trend-cycle sementara periode ke-t
                  <br />
                  - p = Periode musim data
                  <br />
                  - Y_i = Data periode ke-i
                  <br />
                  - k = p/2
                </p>
              </li>
            </ul>
          </li>
          <li>
            <strong>Menghitung Komponen Seasonal</strong>
            <p>
              Setelah menghitung moving average, selanjutnya dihitung rasio data asli terhadap moving average untuk mendapatkan komponen seasonal sementara.
            </p>
            <pre>
              {`Ywtc_t = Y_t / TC_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - Ywtc_t = Rasio data asli terhadap trend-cycle
              <br />
              - Y_t = Data asli periode ke-t
              <br />
              - TC_t = Komponen trend-cycle sementara periode ke-t
            </p>
          </li>
        </ol>

        <h4>2. Tahapan Additive Decomposition</h4>
        <p>
          Tahapan dekomposisi data runtun waktu bentuk aditif hampir sama dengan multiplikatif, namun menggunakan operasi pengurangan.
        </p>
        <ol>
          <li>
            <strong>Menghitung Moving Average</strong>
            <p>
              Tahap ini sama dengan metode multiplikatif, yaitu menggunakan moving average untuk mendapatkan komponen trend-cycle.
            </p>
          </li>
          <li>
            <strong>Menghitung Komponen Seasonal</strong>
            <p>
              Perbedaannya adalah rasio data asli terhadap moving average dihitung dengan operasi pengurangan.
            </p>
            <pre>
              {`Ywtc_t = Y_t - TC_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - Ywtc_t = Selisih data asli terhadap trend-cycle
              <br />
              - Y_t = Data asli periode ke-t
              <br />
              - TC_t = Komponen trend-cycle sementara periode ke-t
            </p>
          </li>
        </ol>

        <h4>3. Menyelesaikan Dekomposisi dan Peramalan</h4>
        <p>
          Setelah mendapatkan komponen seasonal sementara, selanjutnya dihitung komponen seasonal yang sebenarnya (SC_t), komponen trend-cycle (TC_t), komponen irregular (IC_t), dan nilai peramalan (F_t).
        </p>
        <ol>
          <li>
            <strong>Normalisasi Komponen Seasonal</strong>
            <pre>
              {`SI_i = (1/d) * Σ(Ywtc)`}
            </pre>
            <p>
              Keterangan:
              <br />
              - SI_i = Indeks Musiman (Seasonal Index) untuk musim ke-i
              <br />
              - d = Jumlah siklus musiman
              <br />
              - Ywtc = Komponen data tanpa trend-cycle
            </p>
          </li>
          <li>
            <strong>Komponen Trend-Cycle</strong>
            <pre>
              {`TC_t = Y_t - SC_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - TC_t = Komponen trend-cycle periode ke-t
              <br />
              - Y_t = Data asli periode ke-t
              <br />
              - SC_t = Komponen seasonal periode ke-t
            </p>
          </li>
          <li>
            <strong>Komponen Irregular</strong>
            <pre>
              {`IC_t = Y_t - TC_t - SC_t`}
            </pre>
            <p>
              Keterangan:
              <br />
              - IC_t = Komponen irregular periode ke-t
              <br />
              - Y_t = Data asli periode ke-t
              <br />
              - TC_t = Komponen trend-cycle periode ke-t
              <br />
              - SC_t = Komponen seasonal periode ke-t
            </p>
          </li>
          <li>
            <strong>Peramalan (Forecasting)</strong>
            <p>
              Pada tahapan ini, komponen seasonal dan trend-cycle akan digabungkan untuk memperoleh hasil peramalan.
            </p>
            <ul>
              <li><strong>Bentuk Aditif:</strong>
                <pre>
                  {`F_t = TC_t + SC_t`}
                </pre>
              </li>
              <li><strong>Bentuk Multiplikatif:</strong>
                <pre>
                  {`F_t = TC_t * SC_t`}
                </pre>
              </li>
            </ul>
            <p>
              Keterangan:
              <br />
              - F_t = Hasil peramalan (forecasting) periode ke-t
              <br />
              - TC_t = Komponen trend-cycle periode ke-t
              <br />
              - SC_t = Komponen seasonal periode ke-t
            </p>
          </li>
        </ol>

        <h3>Evaluasi Forecasting</h3>
        <p>
          Pada tahapan ini, hasil peramalan data akan dievaluasi menggunakan beberapa indikator berikut.
        </p>
        <ol>
          <li>
            <strong>Mean Square Error (MSE)</strong>
            <pre>
              {`MSE = (1/n) * Σ(Y_t - F_t)²`}
            </pre>
          </li>
          <li>
            <strong>Root Mean Square Error (RMSE)</strong>
            <pre>
              {`RMSE = √(MSE)`}
            </pre>
          </li>
          <li>
            <strong>Mean Absolute Error (MAE)</strong>
            <pre>
              {`MAE = (1/n) * Σ|Y_t - F_t|`}
            </pre>
          </li>
          <li>
            <strong>Mean Percentage Error (MPE)</strong>
            <pre>
              {`MPE = (1/n) * Σ[((Y_t - F_t) / Y_t) * 100]`}
            </pre>
          </li>
          <li>
            <strong>Mean Absolute Percentage Error (MAPE)</strong>
            <pre>
              {`MAPE = (1/n) * Σ|((Y_t - F_t) / Y_t) * 100|`}
            </pre>
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
          <li>Makridakis, S., Wheelwright, S. C., & McGee, V. E. (1983). Forecasting: Methods and applications. New York: John Wiley and Sons.</li>
          <li>Peck, E., Vining, G., & Montgomery, D. (2012). <i>Introduction to Linear Regression Analysis</i>. Wiley.</li>
        </ul>
      </div>
    </HelpContentWrapper>
  );
};