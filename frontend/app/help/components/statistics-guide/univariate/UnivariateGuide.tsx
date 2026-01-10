import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    TrendingUp,
    BarChart3,
    Layers,
} from "lucide-react";

export const UnivariateGuide: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate"
            description="General Linear Model (GLM) Univariate analysis for regression, ANOVA, and ANCOVA with complete mathematical formulas."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            GLM Univariate Overview
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            GLM Univariate is a statistical framework that
                            unifies regression, ANOVA, and ANCOVA into one
                            comprehensive mathematical model.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    General Mathematical Model of GLM
                </h2>

                <p>GLM Univariate uses the general linear model:</p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">GLM Univariate Model:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>Y</strong> = dependent variable vector (n ×
                            1)
                        </li>
                        <li>
                            <strong>X</strong> = design matrix (n × p)
                        </li>
                        <li>
                            <strong>β</strong> = parameter vector (p × 1)
                        </li>
                        <li>
                            <strong>ε</strong> = error vector (n × 1)
                        </li>
                    </ul>
                </div>

                <p>
                    With assumption: <strong>ε ~ N(0, σ²I)</strong>
                </p>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Regression Analysis
                </h2>

                <p>
                    Linear regression models the relationship between a
                    continuous dependent variable with one or more independent
                    variables.
                </p>

                <h3>Simple Linear Regression</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = β₀ + β₁X + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Parameter estimation:
                    </p>
                    <div className="text-sm font-mono">
                        <div>β₁ = Σ(xᵢ - x̄)(yᵢ - ȳ) / Σ(xᵢ - x̄)²</div>
                        <div>β₀ = ȳ - β₁x̄</div>
                    </div>
                </div>

                <h3>Multiple Linear Regression</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = β₀ + β₁X₁ + β₂X₂ + ... + βₖXₖ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        OLS estimation:
                    </p>
                    <div className="text-sm font-mono">
                        <div>
                            <strong>β̂ = (X'X)⁻¹X'y</strong>
                        </div>
                    </div>
                </div>

                <h3>Coefficient of Determination (R²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>R² = 1 - (SSE/SST)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SSE = Σ(yᵢ - ŷᵢ)² (Sum of Squares Error)</li>
                        <li>SST = Σ(yᵢ - ȳ)² (Total Sum of Squares)</li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Analysis of Variance (ANOVA)
                </h2>

                <p>
                    ANOVA is used to compare means from three or more groups by
                    testing the null hypothesis that all population means are
                    equal.
                </p>

                <h3>One-Way ANOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼ = μ + αᵢ + εᵢⱼ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Yᵢⱼ = j-th observation in i-th group</li>
                        <li>μ = overall mean</li>
                        <li>αᵢ = i-th group effect</li>
                        <li>εᵢⱼ = random error</li>
                    </ul>
                </div>

                <h4>F-Statistic for One-Way ANOVA:</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSB / MSW</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>MSB = SSB / (k-1) (Mean Square Between)</li>
                        <li>MSW = SSW / (N-k) (Mean Square Within)</li>
                        <li>SSB = Σnᵢ(x̄ᵢ - x̄)² (Sum of Squares Between)</li>
                        <li>SSW = ΣΣ(xᵢⱼ - x̄ᵢ)² (Sum of Squares Within)</li>
                    </ul>
                </div>

                <h3>Two-Way ANOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼₖ = μ + αᵢ + βⱼ + (αβ)ᵢⱼ + εᵢⱼₖ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>αᵢ = factor A level i effect</li>
                        <li>βⱼ = factor B level j effect</li>
                        <li>(αβ)ᵢⱼ = interaction effect</li>
                    </ul>
                </div>

                <h4>Sum of Squares for Two-Way ANOVA:</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>SSA = bnΣ(x̄ᵢ.. - x̄...)²</strong>
                        </div>
                        <div>
                            <strong>SSB = anΣ(x̄.ⱼ. - x̄...)²</strong>
                        </div>
                        <div>
                            <strong>
                                SSAB = nΣ(x̄ᵢⱼ. - x̄ᵢ.. - x̄.ⱼ. + x̄...)²
                            </strong>
                        </div>
                        <div>
                            <strong>SSE = ΣΣΣ(xᵢⱼₖ - x̄ᵢⱼ.)²</strong>
                        </div>
                        <div>
                            <strong>SST = ΣΣΣ(xᵢⱼₖ - x̄...)²</strong>
                        </div>
                    </div>
                </div>

                <h3>N-Way ANOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Y = μ + Σαᵢ + Σ(αβ)ᵢⱼ + Σ(αβγ)ᵢⱼₖ + ... + ε
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        This model includes:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Main effects for each factor</li>
                        <li>Two-way interaction effects</li>
                        <li>Three-way interaction effects</li>
                        <li>And so on up to N-way interactions</li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Analysis of Covariance (ANCOVA)
                </h2>

                <p>
                    ANCOVA combines ANOVA with regression to control for the
                    effects of covariate variables that cannot be manipulated.
                </p>

                <h3>One-Way ANCOVA Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Yᵢⱼ = μ + αᵢ + β(Xᵢⱼ - X̄) + εᵢⱼ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Yᵢⱼ = dependent variable</li>
                        <li>Xᵢⱼ = covariate</li>
                        <li>αᵢ = group effect</li>
                        <li>β = covariate regression coefficient</li>
                    </ul>
                </div>

                <h3>Two-Way ANCOVA Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Yᵢⱼₖ = μ + αᵢ + βⱼ + (αβ)ᵢⱼ + γ(Xᵢⱼₖ - X̄) + εᵢⱼₖ
                        </strong>
                    </div>
                </div>

                <h3>Adjusted Means in ANCOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Ȳᵢ(adj) = Ȳᵢ - b(X̄ᵢ - X̄)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Ȳᵢ(adj) = adjusted mean for group i</li>
                        <li>Ȳᵢ = observed mean for group i</li>
                        <li>b = covariate regression coefficient</li>
                        <li>X̄ᵢ = covariate mean for group i</li>
                        <li>X̄ = overall covariate mean</li>
                    </ul>
                </div>

                <h2 className="mt-8">GLM Univariate Assumptions</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            1. Normality
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Residuals must be normally distributed:{" "}
                            <strong>ε ~ N(0, σ²)</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            2. Homoscedasticity
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Constant residual variance:{" "}
                            <strong>Var(εᵢ) = σ²</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            3. Independence
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Residuals are mutually independent:{" "}
                            <strong>Cov(εᵢ, εⱼ) = 0</strong>
                        </p>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            4. Linearity
                        </h4>
                        <p className="text-sm text-yellow-700">
                            Linear relationship between variables:{" "}
                            <strong>E(Y) = Xβ</strong>
                        </p>
                    </div>
                </div>

                <h2 className="mt-8">Hypothesis Testing</h2>

                <h3>F-Test for Model Significance</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = (SSR/p) / (SSE/(n-p-1))</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SSR = Sum of Squares Regression</li>
                        <li>SSE = Sum of Squares Error</li>
                        <li>p = number of parameters (excluding intercept)</li>
                        <li>n = number of observations</li>
                    </ul>
                </div>

                <h3>t-Test for Individual Coefficients</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = β̂ᵢ / SE(β̂ᵢ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>SE(β̂ᵢ) = √(MSE × Cᵢᵢ)</li>
                        <li>Cᵢᵢ = i-th diagonal element of (X'X)⁻¹</li>
                    </ul>
                </div>

                <h2 className="mt-8">Effect Size</h2>

                <h3>Eta Squared (η²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η² = SSB / SST</strong>
                    </div>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSB / (SSB + SSE)</strong>
                    </div>
                </div>

                <h2 className="mt-8">Power Analysis</h2>

                <h3>Power for ANOVA</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F {">"} F₍α,k-1,N-k₎ | F ~ F₍k-1,N-k,λ₎)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            λ = n × Σ(μᵢ - μ)² / σ² (noncentrality parameter)
                        </li>
                        <li>F₍α,k-1,N-k₎ = critical F value</li>
                    </ul>
                </div>

                <h2 className="mt-8">Related Topic</h2>
                <ul>
                    <li>GLM Univariate: Design Matrix</li>
                    <li>GLM Univariate: Sum of Squares</li>
                    <li>GLM Univariate: Parameter Estimates</li>
                    <li>GLM Univariate: Contrast Factors</li>
                    <li>GLM Univariate: Heteroscedasticity Tests</li>
                    <li>GLM Univariate: Levene Tests</li>
                    <li>GLM Univariate: EM Means</li>
                    <li>GLM Univariate: Lack of Fit Tests</li>
                </ul>

                <h2 className="mt-8">Reference</h2>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <ul>
                        <li>
                            Sarty, G. E. (2022). Introduction to Applied
                            Statistics for Psychology Students. University of
                            Saskatchewan.
                        </li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
