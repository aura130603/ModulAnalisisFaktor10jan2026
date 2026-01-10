import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    Layers,
} from "lucide-react";

export const ParameterEstimates: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Parameter Estimates"
            description="Complete explanation of parameter estimation in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Parameter Estimates
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Parameter estimates provide coefficients for each
                            predictor in the model, showing the relationship
                            between predictors and the dependent variable.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Basic Concepts of Parameter Estimates
                </h2>

                <p>
                    Parameter estimates are coefficients obtained from the GLM
                    model that show:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Parameter Components
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Intercept (β₀)</li>
                            <li>Factor coefficients (αᵢ, βⱼ)</li>
                            <li>Covariate coefficients (γ)</li>
                            <li>Interaction coefficients (αβᵢⱼ)</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Interpretation
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Magnitude of predictor effect</li>
                            <li>Direction of relationship</li>
                            <li>Statistical significance</li>
                            <li>Standard error</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Mathematical Model
                </h2>

                <h3>General GLM Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Y = dependent variable vector (n × 1)</li>
                        <li>X = design matrix (n × p)</li>
                        <li>β = parameter vector (p × 1)</li>
                        <li>ε = error vector (n × 1)</li>
                    </ul>
                </div>

                <h3>Parameter Estimation with OLS</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'X)⁻¹X'y</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Least squares estimator for parameter β
                    </p>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Parameter Components
                </h2>

                <h3>Intercept (β₀)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β₀ = ȳ - Σβᵢx̄ᵢ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Predicted value of Y when all predictors = 0
                    </p>
                </div>

                <h3>Factor Coefficients (αᵢ, βⱼ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>αᵢ = μᵢ - μ</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>μᵢ = mean for level i</li>
                        <li>μ = overall mean</li>
                    </ul>
                </div>

                <h3>Covariate Coefficients (γ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>γ = Cov(Y,X) / Var(X)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Change in Y per unit change in X
                    </p>
                </div>

                <h3>Interaction Coefficients (αβᵢⱼ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>(αβ)ᵢⱼ = μᵢⱼ - μᵢ. - μ.ⱼ + μ..</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Interaction effect between factor A level i and factor B
                        level j
                    </p>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Standard Errors and Inference
                </h2>

                <h3>Covariance Matrix</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Var(β̂) = σ²(X'X)⁻¹</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Where σ² = MSE (Mean Square Error)
                    </p>
                </div>

                <h3>Standard Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE(β̂ᵢ) = √[MSE × Cᵢᵢ]</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Where Cᵢᵢ is the i-th diagonal element of (X'X)⁻¹
                    </p>
                </div>

                <h3>t-Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = β̂ᵢ / SE(β̂ᵢ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Follows t-distribution with df = n-p-1
                    </p>
                </div>

                <h3>Confidence Interval</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = β̂ᵢ ± t₍α/2,df₎ × SE(β̂ᵢ)</strong>
                    </div>
                </div>

                <h2 className="mt-8">Parameter Interpretation</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Positive Coefficient
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Increase in predictor → increase in Y</li>
                            <li>Positive effect on dependent variable</li>
                            <li>Same direction relationship</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Negative Coefficient
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Increase in predictor → decrease in Y</li>
                            <li>Negative effect on dependent variable</li>
                            <li>Opposite direction relationship</li>
                        </ul>
                    </div>
                </div>

                <h3>Factor Coefficient Interpretation</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <p className="text-sm text-gray-600">
                        For factor with k levels:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>Level 1: baseline (no coefficient)</li>
                        <li>
                            Level i: coefficient αᵢ shows difference from
                            baseline
                        </li>
                        <li>Interpretation: Y for level i = baseline + αᵢ</li>
                    </ul>
                </div>

                <h3>Covariate Coefficient Interpretation</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <p className="text-sm text-gray-600">
                        For continuous covariate:
                    </p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            Coefficient γ shows change in Y per unit change in X
                        </li>
                        <li>
                            Interpretation: 1 unit increase in X → γ unit
                            increase in Y
                        </li>
                        <li>
                            Controls for effects of other variables in model
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Parameter Estimates Output</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Parameter Estimates Table:
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Parameter</th>
                                    <th className="text-left p-2">Estimate</th>
                                    <th className="text-left p-2">
                                        Std. Error
                                    </th>
                                    <th className="text-left p-2">t-value</th>
                                    <th className="text-left p-2">p-value</th>
                                    <th className="text-left p-2">95% CI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b">
                                    <td className="p-2">Intercept</td>
                                    <td className="p-2">β̂₀</td>
                                    <td className="p-2">SE(β̂₀)</td>
                                    <td className="p-2">t₀</td>
                                    <td className="p-2">p₀</td>
                                    <td className="p-2">[L₀, U₀]</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="p-2">Factor A[1]</td>
                                    <td className="p-2">α̂₁</td>
                                    <td className="p-2">SE(α̂₁)</td>
                                    <td className="p-2">t₁</td>
                                    <td className="p-2">p₁</td>
                                    <td className="p-2">[L₁, U₁]</td>
                                </tr>
                                <tr>
                                    <td className="p-2">Covariate</td>
                                    <td className="p-2">γ̂</td>
                                    <td className="p-2">SE(γ̂)</td>
                                    <td className="p-2">tᵧ</td>
                                    <td className="p-2">pᵧ</td>
                                    <td className="p-2">[Lᵧ, Uᵧ]</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
