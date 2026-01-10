import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    Target,
} from "lucide-react";

export const ContrastFactors: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Contrast Factors"
            description="Complete explanation of contrast factors, contrast methods, and hypothesis testing in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Contrast Factors
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Contrast factors enable specific hypothesis testing
                            about differences between factor levels. Different
                            contrast methods provide different ways to compare
                            levels within factors.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Basic Concepts of Contrast Factors
                </h2>

                <p>
                    Contrast factors are techniques for testing specific
                    hypotheses about differences between levels within a factor.
                    Contrasts allow us to test theoretically meaningful
                    comparisons rather than just testing general differences.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">General Contrast Model:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>ψ = L'β</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>ψ</strong> = contrast value
                        </li>
                        <li>
                            <strong>L'</strong> = contrast coefficient vector
                        </li>
                        <li>
                            <strong>β</strong> = model parameter vector
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Contrast Methods
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Deviation
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Compare levels with grand mean</li>
                            <li>
                                Coefficients: 1 for target level, -1/k for
                                others
                            </li>
                            <li>Reference: First or Last</li>
                            <li>Number of contrasts: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">Simple</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Compare levels with reference level</li>
                            <li>
                                Coefficients: 1 for target level, -1 for
                                reference
                            </li>
                            <li>Reference: First or Last</li>
                            <li>Number of contrasts: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Difference
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Level_i vs mean of previous levels</li>
                            <li>
                                Coefficients: 1 for level_i, -1/i for levels
                                1..i-1
                            </li>
                            <li>No reference required</li>
                            <li>Number of contrasts: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">Helmert</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Level_i vs mean of subsequent levels</li>
                            <li>
                                Coefficients: 1 for level_i, -1/(k-i) for levels
                                i+1..k
                            </li>
                            <li>No reference required</li>
                            <li>Number of contrasts: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Repeated
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>Level_i vs level_{`i + 1`}</li>
                            <li>
                                Coefficients: 1 for level_i, -1 for level_
                                {`i + 1`}
                            </li>
                            <li>No reference required</li>
                            <li>Number of contrasts: k-1</li>
                        </ul>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-bold text-indigo-800 mb-2">
                            Polynomial
                        </h4>
                        <ul className="text-sm text-indigo-700 space-y-1">
                            <li>Linear trend (degree 1 only)</li>
                            <li>
                                Coefficients: centered and normalized values
                            </li>
                            <li>No reference required</li>
                            <li>Number of contrasts: 1 (if k ≥ 2)</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    L-Matrix Construction
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in generate_l_matrix_and_descriptions:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Parse Specification:</strong> Extract factor
                            name, method, and reference
                        </li>
                        <li>
                            <strong>Determine Number of Contrasts:</strong>{" "}
                            Based on method and number of levels
                        </li>
                        <li>
                            <strong>Initialize L Matrix:</strong> Empty matrix
                            with appropriate dimensions
                        </li>
                        <li>
                            <strong>Generate Coefficients:</strong> For each
                            contrast based on method
                        </li>
                        <li>
                            <strong>Averaging Logic:</strong> For other factors
                            in parameters
                        </li>
                        <li>
                            <strong>Generate Descriptions:</strong> Labels and
                            descriptions for each contrast
                        </li>
                    </ol>
                </div>

                <h3>Contrast Coefficient Formulas</h3>

                <h4>Deviation Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>For k = 2:</strong>
                        </div>
                        <div>
                            Target level: 0.5 (if ref = Last) or -0.5 (if ref =
                            First)
                        </div>
                        <div>Other level: -0.5 or 0.5</div>
                        <div>
                            <strong>For k {">"} 2:</strong>
                        </div>
                        <div>Target level: 1 - 1/k</div>
                        <div>Other levels: -1/k</div>
                    </div>
                </div>

                <h4>Simple Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Coefficients:</strong>
                        </div>
                        <div>Target level: 1.0</div>
                        <div>Reference level: -1.0</div>
                        <div>Other levels: 0.0</div>
                    </div>
                </div>

                <h4>Difference Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>For level_{`i + 1`}:</strong>
                        </div>
                        <div>Level_{`i + 1`}: 1.0</div>
                        <div>Levels 1..i: -1/i</div>
                        <div>Levels i+2..k: 0.0</div>
                    </div>
                </div>

                <h4>Helmert Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>For level_i:</strong>
                        </div>
                        <div>Level_i: 1.0</div>
                        <div>Levels i+1..k: -1/(k-i)</div>
                        <div>Levels 1..i-1: 0.0</div>
                    </div>
                </div>

                <h4>Repeated Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>For level_i vs level_{`i + 1`}:</strong>
                        </div>
                        <div>Level_i: 1.0</div>
                        <div>Level_{`i + 1`}: -1.0</div>
                        <div>Other levels: 0.0</div>
                    </div>
                </div>

                <h4>Polynomial Contrast</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Linear Trend:</strong>
                        </div>
                        <div>x_i = i - (k-1)/2 (centered values)</div>
                        <div>Normalized: x_i / √(Σx_i²)</div>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Contrast Hypothesis Testing
                </h2>

                <h3>Contrast Estimation</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>ψ̂ = L'β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Contrast estimation using parameter estimates from the
                        model
                    </p>
                </div>

                <h3>Standard Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE(ψ̂) = √(L'G⁻¹L × MSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Standard error of contrast using generalized inverse and
                        MSE
                    </p>
                </div>

                <h3>t-Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>t = ψ̂ / SE(ψ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        t-statistic for testing H₀: ψ = 0
                    </p>
                </div>

                <h3>Confidence Interval</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = ψ̂ ± t_critical × SE(ψ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Confidence interval for the true contrast value
                    </p>
                </div>

                <h2 className="mt-8">F-Test for Contrast Sets</h2>

                <h3>Sum of Squares Hypothesis (SSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSH = (Lβ̂)'(LG⁻¹L')⁻¹(Lβ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of squares for contrast set
                    </p>
                </div>

                <h3>Mean Square Hypothesis (MSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSH = SSH / df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Where df_hypothesis = number of contrasts
                    </p>
                </div>

                <h3>F-Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSH / MSE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        F-statistic for testing significance of contrast set
                    </p>
                </div>

                <h2 className="mt-8">Effect Size and Power</h2>

                <h3>Partial Eta Squared</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSH / (SSH + SSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size for contrast set
                    </p>
                </div>

                <h3>Noncentrality Parameter</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>λ = F × df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Noncentrality parameter for power calculation
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Power = P(F {">"} F_critical | λ)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Observed power for contrast set
                    </p>
                </div>

                <h2 className="mt-8">Practical Applications</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            When to Use Deviation
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Want to compare with overall average</li>
                            <li>Reference level has no special meaning</li>
                            <li>Focus on deviations from grand mean</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            When to Use Simple
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>There is a control or baseline level</li>
                            <li>Want to compare with specific level</li>
                            <li>Reference level has theoretical meaning</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            When to Use Helmert
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Levels have natural ordering</li>
                            <li>Want to compare with subsequent levels</li>
                            <li>Suitable for ordinal variables</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            When to Use Polynomial
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Levels have numerical ordering</li>
                            <li>Want to test linear trends</li>
                            <li>Interval or ratio variables</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Interpreting Results</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Contrast Result Table:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>Contrast Estimate:</strong> Estimated
                            contrast value
                        </li>
                        <li>
                            <strong>Standard Error:</strong> Standard error of
                            estimate
                        </li>
                        <li>
                            <strong>Significance:</strong> p-value for t-test
                        </li>
                        <li>
                            <strong>Confidence Interval:</strong> Confidence
                            interval
                        </li>
                    </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Contrast Test Table:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            <strong>Sum of Squares:</strong> SSH for contrast
                            set
                        </li>
                        <li>
                            <strong>F Value:</strong> F-statistic for contrast
                            set
                        </li>
                        <li>
                            <strong>Significance:</strong> p-value for F-test
                        </li>
                        <li>
                            <strong>Partial Eta Squared:</strong> Effect size
                        </li>
                        <li>
                            <strong>Observed Power:</strong> Observed power
                        </li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
