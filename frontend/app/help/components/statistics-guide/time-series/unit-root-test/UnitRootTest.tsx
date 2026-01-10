import React from 'react';
import { HelpContentWrapper } from '../../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const UnitRootTest: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Unit Root Test – Algoritma"
      description="Penjelasan rinci mengenai cara Statify melakukan uji unit root, termasuk uji Dickey-Fuller dan Augmented Dickey-Fuller."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Deskripsi</AlertTitle>
            <AlertDescription className="text-blue-700">
              Unit Root Test adalah suatu uji untuk memeriksa kestasioneran data runtun waktu. Uji ini penting dilakukan karena untuk analisis lanjutan dan pemodelan data runtun waktu harus memenuhi asumsi stasioneritas. Terdapat beberapa metode dalam melakukan uji ini antara lain Augmented Dickey-Fuller, Phillips-Peron, dan Kwiatkowski-Phillips-Schmidt-Shin. Namun, pada modul ini Uji Unit Root masih terbatas pada uji Dickey-Fuller dan Augmented Dickey-Fuller.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>Uji Dickey-Fuller</h3>
        <p>
          Uji Dickey-Fuller adalah uji menggunakan statistik uji tau (τ) untuk menguji kestasioneran, dengan bentuk umum rumus sebagai berikut.
        </p>
        <pre>{`τ = γ / se(γ)`}</pre>
        <p>
          Nilai γ diperoleh dari koefisien slope dari persamaan berikut.
        </p>
        <pre>{`Δy_t = a₀ + γy_(t-1) + ε_t`}</pre>
        <p>
          Dengan demikian dapat dikatakan bahwa γ adalah koefisien slope data runtun waktu hasil regresi dari data differencing terhadap data runtun waktu satu periode sebelumnya.
        </p>

        <h3>Uji Augmented Dickey-Fuller</h3>
        <p>
          Augmented Dickey-Fuller adalah bentuk lebih kompleks dari uji Dickey-Fuller yang menambah faktor lag (p) data differencing ke dalam persamaan sebelumnya sehingga dapat ditulis seperti berikut.
        </p>
        <pre>{`Δy_t = a₀ + γy_(t-1) + Σ(t=1)^p β_iΔy_(t-i) + ε_t`}</pre>
        <p>
          Selain itu, uji hipotesis dari Uji Dickey-Fuller dan Uji Augmented Dickey-Fuller adalah sebagai berikut.
        </p>
        <ul>
          <li>H₀: γ=0 (tidak stasioner)</li>
          <li>H₁: γ&lt;0 (stasioner)</li>
        </ul>
        <p>
          Pada penjelasan sebelumnya bentuk persamaan yang ditampilkan dalam uji ini masih satu jenis bentuk dari beberapa bentuk persamaan yang tersedia, berikut beberapa bentuk persamaan yang tersedia pada uji Dickey-Fuller dan Augmented Dickey-Fuller.
        </p>
        <h4>Persamaan Dickey-Fuller</h4>
        <ul>
          <li><strong>Persamaan tanpa konstanta</strong>
            <pre>{`Δy_t = γy_(t-1) + ε_t`}</pre>
          </li>
          <li><strong>Persamaan dengan konstanta</strong>
            <pre>{`Δy_t = a₀ + γy_(t-1) + ε_t`}</pre>
          </li>
          <li><strong>Persamaan dengan tren waktu</strong>
            <pre>{`Δy_t = a₀ + γy_(t-1) + a₂t + ε_t`}</pre>
          </li>
        </ul>
        <h4>Persamaan Augmented Dickey-Fuller</h4>
        <ul>
          <li><strong>Persamaan tanpa konstanta</strong>
            <pre>{`Δy_t = γy_(t-1) + Σ(t=1)^p β_iΔy_(t-i) + ε_t`}</pre>
          </li>
          <li><strong>Persamaan dengan konstanta</strong>
            <pre>{`Δy_t = a₀ + γy_(t-1) + Σ(t=1)^p β_iΔy_(t-i) + ε_t`}</pre>
          </li>
          <li><strong>Persamaan dengan tren waktu</strong>
            <pre>{`Δy_t = a₀ + γy_(t-1) + a₂t + Σ(t=1)^p β_tΔy_(t-i) + ε_t`}</pre>
          </li>
        </ul>
        <h3>Nilai Kritis dan Probabilitas</h3>
        <p>
          Selanjutnya dalam uji juga akan dihitung nilai kritis dan probabilitas yang metode penghitungan didasarkan pada jurnal MacKinnon, 1994.
        </p>
        <h4>Rumus Nilai Kritis</h4>
        <pre>{`C(α) = β₀ + (β₁/N) + (β₂/N²) + (β₃/N³)`}</pre>
        <p>Keterangan:</p>
        <ul>
          <li>α = Nilai signifikansi</li>
        </ul>
        <h4>Tabel Nilai Kritis Mac Kinnon</h4>
        <table>
          <thead>
            <tr>
              <th>Persamaan</th>
              <th>α</th>
              <th>β₀</th>
              <th>β₁</th>
              <th>β₂</th>
              <th>β₃</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>tanpa konstanta</td>
              <td>0.01</td>
              <td>-2.2358</td>
              <td>-3.627</td>
              <td>0</td>
              <td>-</td>
            </tr>
            <tr>
              <td></td>
              <td>0.05</td>
              <td>-1.941</td>
              <td>-3.365</td>
              <td>31.223</td>
              <td>-</td>
            </tr>
            <tr>
              <td></td>
              <td>0.10</td>
              <td>-1.61682</td>
              <td>-2.714</td>
              <td>25.364</td>
              <td>-</td>
            </tr>
            <tr>
              <td>dengan konstanta</td>
              <td>0.01</td>
              <td>-3.43035</td>
              <td>-6.5393</td>
              <td>-16.786</td>
              <td>-79.433</td>
            </tr>
            <tr>
              <td></td>
              <td>0.05</td>
              <td>-2.8903</td>
              <td>-4.234</td>
              <td>-40.04</td>
              <td>-</td>
            </tr>
            <tr>
              <td></td>
              <td>0.10</td>
              <td>-2.56677</td>
              <td>-1.5384</td>
              <td>-2.809</td>
              <td>0</td>
            </tr>
            <tr>
              <td>dengan tren waktu</td>
              <td>0.01</td>
              <td>-3.95877</td>
              <td>-28.428</td>
              <td>-134.155</td>
              <td>-</td>
            </tr>
            <tr>
              <td></td>
              <td>0.05</td>
              <td>-3.41049</td>
              <td>-9.036</td>
              <td>-45.374</td>
              <td>-22.38</td>
            </tr>
            <tr>
              <td></td>
              <td>0.10</td>
              <td>-3.12705</td>
              <td>-2.5856</td>
              <td>-9.0531</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
        <h4>Rumus Nilai Probabilitas</h4>
        <pre>{`p = ϕ(ŷ₀ + ŷ₁τ + ŷ₂τ² + ŷ₃τ³)`}</pre>
        <p>Keterangan:</p>
        <ul>
          <li>ϕ = Cumulative Distribution Function Normal Standard</li>
          <li>τnc(1) = Persamaan tanpa konstanta satu variabel</li>
          <li>τc(1) = Persamaan dengan konstanta satu variabel</li>
          <li>τct(1) = Persamaan dengan tren waktu variabel</li>
        </ul>
        <h4>Tabel Mac Kinnon Probability Value untuk τ &lt; τ*</h4>
        <table>
          <thead>
            <tr>
              <th>Statistic</th>
              <th>ŷ₀</th>
              <th>ŷ₁</th>
              <th>ŷ₂ × 10²</th>
              <th>τ*</th>
              <th>tmin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>τnc(1)</td>
              <td>0.6344</td>
              <td>1.2378</td>
              <td>3.2496</td>
              <td>-1.04</td>
              <td>-19.04</td>
            </tr>
            <tr>
              <td>τc(1)</td>
              <td>2.1659</td>
              <td>1.4412</td>
              <td>3.8269</td>
              <td>-1.61</td>
              <td>-18.83</td>
            </tr>
            <tr>
              <td>τct(1)</td>
              <td>3.2512</td>
              <td>1.6047</td>
              <td>4.9588</td>
              <td>-2.89</td>
              <td>-16.18</td>
            </tr>
          </tbody>
        </table>
        <h4>Tabel Mac Kinnon Probability Value untuk τ &gt; τ*</h4>
        <table>
          <thead>
            <tr>
              <th>Statistic</th>
              <th>ŷ₀</th>
              <th>ŷ₁ × 10</th>
              <th>ŷ₂ × 10</th>
              <th>ŷ₃ × 10²</th>
              <th>τ*</th>
              <th>tmax</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>τnc(1)</td>
              <td>0.4797</td>
              <td>9.3557</td>
              <td>-0.6999</td>
              <td>3.3066</td>
              <td>-1.04</td>
              <td>-</td>
            </tr>
            <tr>
              <td>τc(1)</td>
              <td>1.7339</td>
              <td>9.3202</td>
              <td>-1.2745</td>
              <td>-1.0368</td>
              <td>-1.61</td>
              <td>2.74</td>
            </tr>
            <tr>
              <td>τct(1)</td>
              <td>2.5261</td>
              <td>6.1654</td>
              <td>-3.7956</td>
              <td>-6.0285</td>
              <td>-2.89</td>
              <td>0.7</td>
            </tr>
          </tbody>
        </table>
        <h3>Uji Koefisien Regresi</h3>
        <p>
          Selanjutnya pengujian koefisien regresi hingga ukuran penyeleksian kriteria regresi juga ditampilkan dengan rumus sebagai berikut.
        </p>
        <ol>
          <li>
            <strong>Statistik uji-t</strong>
            <pre>{`t_i = β_i / se(β_i)`}</pre>
          </li>
          <li>
            <strong>Nilai Probabilitas uji-t</strong>
            <pre>{`p_i = 2 * (1 - F_t(|t_i|, df))`}</pre>
          </li>
        </ol>
        <p>Keterangan:</p>
        <ul>
          <li>df = n-k</li>
          <li>β_i = Parameter ke-i</li>
          <li>se(β_i) = Standard error parameter ke-i</li>
          <li>p_i = Nilai probabilitas uji-t parameter ke-i</li>
          <li>t_i = Nilai statistik uji-t parameter ke-i</li>
          <li>F_t() = Cumulative Distribution Function Distribusi Student-T</li>
          <li>df = Derajat bebas</li>
          <li>n = Jumlah observasi data</li>
          <li>k = Jumlah parameter</li>
        </ul>
        <h3>Ukuran Penyeleksian Kriteria Regresi</h3>
        <ol>
          <li>
            <strong>Sum of Squared Residual (SSRes)</strong>
            <pre>{`SS_Res = Σ(i=1)^n e² = Σ(i=1)^n (y_i - ŷ_i)²`}</pre>
            <p>Keterangan:</p>
            <ul>
              <li>y = Vektor variabel terikat (n x 1)</li>
              <li>X = Matriks variabel bebas (n x p)</li>
              <li>β̂ = Vektor estimasi parameter (p x l)</li>
            </ul>
          </li>
          <li>
            <strong>Standard Error of Regression</strong>
            <pre>{`σ² ≈ SS_Res / (n-k-1)`} untuk regresi linear berganda</pre>
            <pre>{`σ² ≈ SS_Res / (n-k)`} untuk persamaan tanpa konstanta</pre>
          </li>
          <li>
            <strong>Coefficient Determination (R²)</strong>
            <pre>{`R² = 1 - (SS_Res / SS_T)`}</pre>
            <pre>{`SS_T = Σ(i=1)^n (y_i - ȳ)²`}</pre>
          </li>
          <li>
            <strong>Coefficient Determination Adjusted (R²-adj)</strong>
            <pre>{`R²_adj = 1 - (SS_Res / (n-k-1)) / (SS_T / (n-1))`}</pre>
          </li>
          <li>
            <strong>Log Likelihood</strong>
            <pre>{`ln L(y,X,β,σ²) = (-n/2)ln(2π) - n ln(σ) - (1/(2σ²))SS_Res`}</pre>
            <pre>{`σ² ≈ σ̃² = SS_Res / n`}</pre>
          </li>
          <li>
            <strong>F-Statistic</strong>
            <pre>{`F₀ = MS_R / MS_Res`}</pre>
            <pre>{`MS_R = SS_R / k`}</pre>
            <pre>{`SS_R = SS_T - SS_Res`}</pre>
          </li>
          <li>
            <strong>Probabilitas F-Statistic</strong>
            <pre>{`p = 1 - P(F₀ > Fα;k;n-k-1)`}</pre>
          </li>
          <li>
            <strong>Mean Dependent Variable</strong>
            <pre>{`ȳ = (1/n) * Σ(i=1)^n y_i`}</pre>
          </li>
          <li>
            <strong>Standard Deviation Dependent Variable</strong>
            <pre>{`se(y) = Σ(i=1)^n (y_i - ȳ) / (n-1)`}</pre>
          </li>
          <li>
            <strong>Akaike Info Criterion (AIC)</strong>
            <pre>{`AIC = -2 ln L + 2p`}</pre>
            <pre>{`Mean(AIC) = AIC / n`}</pre>
            <p>Keterangan:</p>
            <ul>
              <li>ln L = Nilai log likelihood</li>
              <li>p = Jumlah parameter</li>
            </ul>
          </li>
          <li>
            <strong>Schwarz, Bayesian Criterion (SBC)</strong>
            <pre>{`SBC = -2 ln L + p ln n`}</pre>
            <pre>{`Mean(SBC) = SBC / n`}</pre>
          </li>
          <li>
            <strong>Hannan-Quinn Criterion (HQC)</strong>
            <pre>{`HQC = -2 ln L + 2p ln(ln n)`}</pre>
            <pre>{`Mean(HQC) = HQC / n`}</pre>
          </li>
          <li>
            <strong>Durbin-Watson Statistic</strong>
            <pre>{`d = Σ(t=2)^n (e_t - e_(t-1))² / Σ(t=1)^n e_t²`}</pre>
            <pre>{`e_t = y_t - ŷ_t`}</pre>
            <p>Keterangan:</p>
            <ul>
              <li>e_t = Residual observasi ke-t</li>
              <li>y_t = Data awal observasi ke-t</li>
              <li>ŷ_t = Data estimasi observasi ke-t</li>
            </ul>
          </li>
        </ol>

        <h3>Referensi</h3>
        <ul>
          <li>Enders, W. (2015). *Applied Econometric Time Series* (4th ed.). Wiley.</li>
          <li>Lütkepohl, H. (2005). *New Introduction to Multiple Time Series Analysis*. Springer-Verlag, Berlin Heidelberg.</li>
          <li>MacKinnon, J. G. (1994). *Approximate asymptotic distribution functions for unit-root and cointegration tests*. Journal of Business & Economic Statistics, 12(2), 167-176.</li>
          <li>MacKinnon, J. G. (1996). *Numerical distribution functions for unit root and cointegration tests*. Journal of Applied Econometrics, 11(6), 601-618.</li>
          <li>MacKinnon, J. G. (2010). *Critical values for cointegration tests* (Queen's Economics Department Working Paper No. 1227).</li>
          <li>Mohamad. (2016, October 19). Appendix E: Hannan-Quinn Information Criterion (HQC). NumXL Support.</li>
          <li>Peck, E., Vining, G., & Montgomery, D. (2012). *Introduction to Linear Regression Analysis*. Wiley.</li>
        </ul>
      </div>
    </HelpContentWrapper>
  );
};