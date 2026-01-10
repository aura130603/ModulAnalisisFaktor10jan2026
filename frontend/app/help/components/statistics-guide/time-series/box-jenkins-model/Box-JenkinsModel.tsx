import React from 'react';
import { HelpContentWrapper } from '../../../HelpContentWrapper';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle } from 'lucide-react';

export const BoxJenkinsModel: React.FC = () => {
  return (
    <HelpContentWrapper
      title="Box-Jenkins Model – Algoritma"
      description="Penjelasan rinci mengenai proses estimasi parameter, evaluasi model, dan forecasting dengan pendekatan Box-Jenkins (ARIMA)."
    >
      <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
        <div className="flex">
          <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <AlertTitle className="text-blue-800 font-medium mb-1">Ringkasan</AlertTitle>
            <AlertDescription className="text-blue-700">
              Statify mengimplementasikan model ARIMA menggunakan tahapan Box-Jenkins:
              inisialisasi parameter (Durbin-Levinson & Innovation), estimasi dengan CLS dan optimasi L-BFGS, serta evaluasi model berdasarkan berbagai ukuran statistik.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      <div className="prose max-w-none">
        <h3>1. Inisiasi Parameter</h3>
        <h4>1.1. Parameter Intersep (μ)</h4>
        <p>Intersep diinisiasi dengan mengambil rata-rata dari data aktual:</p>
        <pre>{`μ = (1 / n) × Σ Yₜ,   untuk t = 1 s.d. n`}</pre>
        <ul>
          <li><code>Y bar</code>: Mean Data Aktual</li>
          <li><code>Y_t</code>: Data Aktual Observasi ke-t</li>
          <li><code>n</code>: Jumlah Observasi Data Aktual</li>
        </ul>

        <hr className="my-6" />

        <h4>1.2. Inisialisasi Parameter AR – Algoritma Durbin-Levinson</h4>
        <p>Digunakan untuk menentukan parameter autoregresif (φ) secara rekursif berdasarkan kovarians data.</p>
        <pre>
          {`Inisialisasi awal:
φ₁₁ = γ(1) / γ(0)
v₀ = γ(0)

Untuk k = 2 s.d. p:
φₖₖ = [γ(k) − Σ φₖ₋₁,ⱼ × γ(k − j)] / vₖ₋₁
        (j = 1 s.d. k−1)

vₖ = vₖ₋₁ × (1 − φₖₖ²)`}
        </pre>
        <p>Fungsi kovarians (γ) dihitung sebagai:</p>
        <pre>
          {`γ(h) = (1 / (n − |h|)) × Σ (Yₜ₊|h| − Ȳₙ)(Yₜ − Ȳₙ)
        untuk t = 1 s.d. n − |h|`}
        </pre>
        <ul>
          <li><code>gamma hat(h)</code>: Kovarians data aktual</li>
          <li><code>phi_kk</code>: Autokorelasi parsial ke-k atau parameter AR ke-k</li>
          <li><code>p</code>: Jumlah parameter AR</li>
        </ul>

        <hr className="my-6" />

        <h4>1.3. Inisialisasi Parameter MA – Algoritma Innovation</h4>
        <p>Algoritma ini digunakan untuk mengestimasi parameter moving average (θ) dengan pendekatan kovarian dan rekursi.</p>
        <pre>
          {`Inisialisasi:
v₀ = k(1,1)

Untuk 0 ≤ k < n:
θₙ,ₙ₋ₖ(t) = (1 / vₖ) × [k(n+1, k+1) − Σ θₖ,ₖ₋ⱼ × θₙ,ₙ₋ⱼ × vⱼ]
                (j = 0 s.d. k−1)

vₙ = k(n+1, n+1) − Σ θₙ,ₙ₋ⱼ² × vⱼ
            (j = 0 s.d. k−1)`}
        </pre>
        <ul>
          <li><code>theta_n,n-k</code>: Parameter MA ke-n,n-k</li>
          <li><code>n</code>: Jumlah parameter MA</li>
          <li><code>k(i,j)</code>: Kovarians data = gamma(|i-j|)</li>
        </ul>

        <h3>2. Estimasi Parameter – CSS + Optimasi</h3>
        <p>Parameter diestimasi dengan meminimalkan fungsi <i>Conditional Sum of Squares</i> (CSS) yang dinotasikan sebagai berikut:</p>
        <pre>{`f = Sₑ(β,μ) = Σ eₜ²`}</pre>
        <ul>
          <li><code>beta</code>: Parameter model</li>
          <li><code>e_t</code>: Residual ke-t</li>
        </ul>
        <p>Rumus residual (eₜ) untuk setiap model dihitung sebagai berikut:</p>
        <p><strong>Model AR:</strong></p>
        <pre>{`eₜ = (Yₜ - μ) - Σ φᵢ(Yₜ₋ᵢ - μ)`}</pre>
        <p><strong>Model MA:</strong></p>
        <pre>{`eₜ = (Yₜ - μ) + Σ θᵢ(eₜ₋ᵢ)`}</pre>
        <p><strong>Model ARMA:</strong></p>
        <pre>{`eₜ = (Yₜ - μ) - Σ φᵢ(Yₜ₋ᵢ - μ) + Σ θᵢ(eₜ₋ᵢ)`}</pre>
        <p>Optimasi dilakukan dengan metode <strong>L-BFGS</strong> untuk menemukan parameter yang paling optimal.</p>

        <h3>3. Standard Error Estimasi</h3>
        <p><strong>Intersep:</strong></p>
        <pre>{`se(μ) = √Var(μ)`}</pre>
        <ul>
          <li><code>Var(Y bar)</code>: [gamma_0 / n] * [1 + 2 * Σ (1 - k/n) * rho_k]</li>
          <li><code>rho_k</code>: Autokorelasi observasi ke-t</li>
          <li><code>gamma_k</code>: Autokovarians observasi ke-t, dapat dinotasikan juga sebagai gamma hat(k)</li>
          <li><code>gamma_0</code>: Varians data aktual</li>
        </ul>
        <p><strong>Parameter AR & MA:</strong></p>
        <p>Standard error parameter AR dan MA dihitung menggunakan persamaan berikut:</p>
        <pre>
          {`Var(β) = 2σₑ² × [Matriks Hessian]⁻¹
se(β) = √Var(β)`}
        </pre>
        <p>Di mana matriks Hessian adalah turunan kedua dari fungsi CSS. Persamaan-persamaan lain yang digunakan adalah:</p>
        <pre>
          {`σₑ² = S_c(β) / df
df = n - 2p - q - 1`}
        </pre>
        <ul>
          <li><code>S_c(β)</code>: Nilai Conditional Sum of Square (CSS) </li>
          <li><code>σₑ²</code>: Varians residual </li>
          <li><code>df</code>: Derajat bebas CSS </li>
        </ul>

        <h3>4. Uji Koefisien</h3>
        <p><strong>Statistik Uji-t:</strong></p>
        <pre>{`tᵢ = βᵢ / se(βᵢ)`}</pre>
        <p><strong>p-value:</strong></p>
        <pre>{`pᵢ = 2 × (1 - Fₜ(|tᵢ|, df))`}</pre>
        <ul>
          <li><code>beta_i</code>: Parameter ke-i</li>
          <li><code>se(beta_i)</code>: Standard error parameter ke-i</li>
          <li><code>p_i</code>: Nilai probabilitas uji t parameter ke-i</li>
          <li><code>t_i</code>: Nilai statistik uji t parameter ke-i</li>
          <li><code>F_t()</code>: Cumulative Distribution Function Distribusi Student-T</li>
          <li><code>df</code>: Derajat bebas</li>
          <li><code>n</code>: Jumlah observasi data</li>
          <li><code>k</code>: Jumlah parameter</li>
        </ul>

        <h3>5. Ukuran Penyeleksian Model</h3>
        <ul>
          <li><strong>Sum of Squared Residuals (SSRes):</strong> <pre>{`SSRes = Σ eₜ²`}</pre></li>
          <li><strong>Standard Error of Regression:</strong> <pre>{`σ = √(SSRes / (n - p - q - 1))`}</pre></li>
          <li><strong>Log Likelihood:</strong> <pre>{`ln(L) = -n/2 * ln(2π) - n * ln(σ) - (1 / (2σ²)) * SSRes`}</pre></li>
          <li><strong>Akaike Info Criterion (AIC):</strong> <pre>{`AIC = -2 * ln(L) + 2p`}</pre></li>
          <li><strong>Schwarz Bayesian Criterion (SBC/BIC):</strong> <pre>{`SBC = -2 * ln(L) + p * ln(n)`}</pre></li>
          <li><strong>Hannan-Quinn Criterion (HQC):</strong> <pre>{`HQC = -2 * ln(L) + 2p * ln(ln(n))`}</pre></li>
          <li><strong>Durbin-Watson Statistic:</strong> <pre>{`d = Σ(eₜ - eₜ₋₁)² / Σeₜ²`}</pre></li>
          <li>
            Keterangan:
            <ul>
              <li><code>e_t</code>: Residual observasi ke-t</li>
              <li><code>y_t</code>: Data awal observasi ke-t</li>
              <li><code>y_hat_t</code>: Data estimasi observasi ke-t</li>
            </ul>
          </li>
        </ul>

        <h3>6. Forecasting</h3>
        <p><strong>Tanpa Diferensiasi (ARIMA(p,0,q)):</strong></p>
        <pre>{`Yₜ = μ + Σ φᵢYₜ₋ᵢ - Σ θᵢeₜ₋ᵢ`}</pre>
        <p><strong>Diferensiasi Satu Kali (ARIMA(p,1,q)):</strong></p>
        <pre>{`Yₜ = μ + (1+φ₁)Yₜ₋₁ - Σ(φᵢ₋₁-φᵢ)Yₜ₋ᵢ - φₚYₜ₋ₚ₋₁ - Σθᵢeₜ₋ᵢ`}</pre>
        <p><strong>Diferensiasi Dua Kali (ARIMA(p,2,q)):</strong></p>
        <pre>{`Yₜ = μ + (2+φ₁)Yₜ₋₁ + (φ₂-2φ₁+1)Yₜ₋₂ + ... - Σθᵢeₜ₋ᵢ`}</pre>

        <h3>7. Evaluasi Forecasting</h3>
        <ul>
          <li><strong>Mean Square Error (MSE):</strong> <pre>{`MSE = (1/n) * Σ(Yₜ - Fₜ)²`}</pre></li>
          <li><strong>Root Mean Square Error (RMSE):</strong> <pre>{`RMSE = √MSE`}</pre></li>
          <li><strong>Mean Absolute Error (MAE):</strong> <pre>{`MAE = (1/n) * Σ|Yₜ - Fₜ|`}</pre></li>
          <li><strong>Mean Percentage Error (MPE):</strong> <pre>{`MPE = (1/n) * Σ[((Yₜ - Fₜ) / Yₜ) * 100]`}</pre></li>
          <li><strong>Mean Absolute Percentage Error (MAPE):</strong> <pre>{`MAPE = (1/n) * Σ|((Yₜ - Fₜ) / Yₜ) * 100|`}</pre></li>
          <li>
            Keterangan:
            <ul>
              <li><code>n</code>: Jumlah Periode Data</li>
              <li><code>Y_t</code>: Data Awal Periode ke-t</li>
              <li><code>F_t</code>: Data Hasil Peramalan (Forecasting) ke-t</li>
            </ul>
          </li>
        </ul>
        
        <h3>Referensi</h3>
        <ul>
          <li>Box, G. E. P., & Jenkins, G. M. (1976). <i>Time series analysis: Forecasting and control</i> (Revised ed.). San Francisco: Holden-Day.</li>
          <li>Brockwell, P. J., & Davis, R. A. (1996). <i>Introduction to time series and forecasting</i> (1st ed.). Springer.</li>
          <li>Cryer, J. D., & Chan, Kung-Sik (2008). <i>Time Series Analysis With Application in R</i> (2nd ed.). New York: Springer Science.</li>
          <li>Lütkepohl, H. (2005). <i>New Introduction to Multiple Time Series Analysis</i>. Springer-Verlag, Berlin Heidelberg.</li>
          <li>Makridakis, S., Wheelwright, S. C., & McGee, V. E. (1983). <i>Forecasting: Methods and applications</i>. New York: John Wiley and Sons.</li>
          <li>Mohamad. (2016, October 19). Appendix E: Hannan-Quinn Information Criterion (HQC). <i>NumXL Support</i>.</li>
          <li>Okazaki, N. (2002-2014). <a href="https://chokkan.org/software/liblbfgs/" target="_blank" rel="noopener noreferrer">libLBFGS: A library of Limited-memory Broyden-Fletcher-Goldfarb-Shanno (L-BFGS)</a> [Software].</li>
          <li>Peck, E., Vining, G., & Montgomery, D. (2012). <i>Introduction to Linear Regression Analysis</i>. Wiley.</li>
          <li>Wei, William W. S. (2005). <i>Time Series Analysis: Univariate and Multivariate Methods</i> (2nd ed.). Addison Wesley.</li>
        </ul>
      </div>
    </HelpContentWrapper>
  );
};