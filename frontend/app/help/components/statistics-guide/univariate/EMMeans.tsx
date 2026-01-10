import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    Layers,
} from "lucide-react";

export const EMMeans: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Estimated Marginal Means (EM Means)"
            description="Complete explanation of Estimated Marginal Means calculation in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Estimated Marginal Means (EM Means)
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            EM Means are adjusted means for each factor level,
                            controlling for the effects of other variables in
                            the model. They provide fair comparisons between
                            groups by removing bias from unbalanced designs.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Basic Concepts of EM Means
                </h2>

                <p>
                    Estimated Marginal Means (EM Means) are predicted means for
                    each combination of factor levels after controlling for the
                    effects of other variables in the model. EM Means are
                    calculated as linear combinations of model parameters using
                    L-vectors.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        General EM Means Formula:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>EM Mean = L' × β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>L'</strong> = transpose of L-vector (linear
                            combination coefficients)
                        </li>
                        <li>
                            <strong>β̂</strong> = vector of estimated parameters
                            from the model
                        </li>
                        <li>
                            <strong>EM Mean</strong> = Estimated Marginal Mean
                            for specific level combination
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    EM Means Calculation Process
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in calculate_EM Means:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Design Preparation:</strong> Create design
                            matrix, response vector, and weights
                        </li>
                        <li>
                            <strong>Extract Model Information:</strong> Get
                            parameter names and prepare covariate data
                        </li>
                        <li>
                            <strong>Matrix Calculation:</strong> Create
                            cross-product matrix (Z'Z)
                        </li>
                        <li>
                            <strong>Model Solution:</strong> Perform SWEEP to
                            obtain β̂, G⁻¹, and SSE
                        </li>
                        <li>
                            <strong>Basic Statistics Calculation:</strong>{" "}
                            Calculate MSE and df_error
                        </li>
                        <li>
                            <strong>Extract Factors:</strong> Identify all
                            factors and their levels
                        </li>
                        <li>
                            <strong>Iteration & EM Means Calculation:</strong>{" "}
                            For each requested effect
                        </li>
                        <li>
                            <strong>Aggregate Results:</strong> Collect all
                            results into EM MeansResult structure
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    L-Vector Construction for EM Means
                </h2>

                <p>
                    The L-vector defines how to calculate one specific EM Mean.
                    Each L-vector has the same length as the number of model
                    parameters and determines coefficients for each parameter.
                </p>

                <h3>L-Vector Construction Rules</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Intercept:</strong> Coefficient always 1.0
                        </div>
                        <div>
                            <strong>Covariates:</strong> Coefficient is
                            covariate mean
                        </div>
                        <div>
                            <strong>Specified factors:</strong> Coefficient 1.0
                            if level matches, 0.0 if not
                        </div>
                        <div>
                            <strong>Averaged factors:</strong> Coefficient is
                            1.0 / number of levels
                        </div>
                        <div>
                            <strong>Interactions:</strong> Coefficient is
                            product of component coefficients
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">EM Means Statistics Calculation</h2>

                <h3>Estimated Marginal Mean (EM Mean)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>EM Mean = L' × β̂</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Predicted marginal mean value for specific level
                        combination
                    </p>
                </div>

                <h3>Standard Error (SE) of EM Mean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SE = √(L' × G⁻¹ × L × MSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>G⁻¹</strong> = generalized inverse of matrix
                            (X'X)
                        </li>
                        <li>
                            <strong>MSE</strong> = Mean Squared Error
                        </li>
                        <li>
                            <strong>SE</strong> = measures variability or
                            uncertainty of EM Mean estimate
                        </li>
                    </ul>
                </div>

                <h3>Confidence Interval (CI)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>CI = EM Mean ± (t_critical × SE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>t_critical</strong> = critical t-value from
                            t-distribution
                        </li>
                        <li>
                            <strong>df</strong> = degrees of freedom error
                        </li>
                        <li>
                            <strong>α</strong> = significance level
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Pairwise Comparisons</h2>

                <p>
                    Pairwise comparisons compare EM Means of each pair of levels
                    within a main effect to determine if there are significant
                    differences.
                </p>

                <h3>Mean Difference</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Mean Difference = EM Meanᵢ - EM Meanⱼ = (Lᵢ - Lⱼ)' ×
                            β̂
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Difference in estimated means between two levels
                    </p>
                </div>

                <h3>Standard Error of the Difference</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SE_diff = √((Lᵢ - Lⱼ)' × G⁻¹ × (Lᵢ - Lⱼ) × MSE)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Measures uncertainty of mean difference
                    </p>
                </div>

                <h3>Significance (p-value)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                t-statistic = Mean Difference / SE_diff
                            </strong>
                        </div>
                        <div>
                            <strong>
                                p-value = P(|t| {">"} t_observed | H₀)
                            </strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Adjustment for multiple comparisons using Bonferroni,
                        Sidak, or LSD methods
                    </p>
                </div>

                <h3>Multiple Comparison Adjustments</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Adjustment Methods:
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                        <div>
                            <strong>Bonferroni:</strong> α' = α / C (C = number
                            of comparisons)
                        </div>
                        <div>
                            <strong>Sidak:</strong> α' = 1 - (1 - α)^(1/C)
                        </div>
                        <div>
                            <strong>LSD (No adjustment):</strong> α' = α
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Univariate Tests</h2>

                <p>
                    Univariate tests perform F-tests for main effects, testing
                    the null hypothesis that all EM Means for levels of that
                    effect are equal.
                </p>

                <h3>Sum of Squares for Hypothesis (SSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSH = (Lβ̂)' × (L × G⁻¹ × L')⁻¹ × (Lβ̂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        L is the contrast matrix testing differences between EM
                        Means
                    </p>
                </div>

                <h3>Mean Square for Hypothesis (MSH)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSH = SSH / df_hypothesis</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        df_hypothesis = number of levels - 1
                    </p>
                </div>

                <h3>F-value</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSH / MSE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Test statistic comparing between-group variation with
                        within-group variation
                    </p>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SSH / (SSH + SSE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size measure showing proportion of variation
                        explained by main effect
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F {">"} F_critical | F ~ F(df₁, df₂, λ))
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>λ</strong> = noncentrality parameter = F ×
                            df_hypothesis
                        </li>
                        <li>
                            <strong>F_critical</strong> = critical F-value for α
                            and df
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Grand Mean</h2>

                <p>
                    Grand Mean is the overall mean calculated by averaging all
                    factor effects and using covariate means.
                </p>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        L-Vector Construction for Grand Mean:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <div>Intercept: 1.0</div>
                        <div>Covariates: covariate means</div>
                        <div>
                            Factors: 1.0 / number of levels (for averaging)
                        </div>
                        <div>
                            Interactions: product of component coefficients
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Non-Estimable EM Means</h2>

                <p>
                    Non-estimable EM Means occur when the L-vector contains all
                    zeros, meaning that level combination cannot be uniquely
                    calculated from the data.
                </p>

                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Non-Estimable Conditions:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>
                            Level combinations not present in data (missing
                            cells)
                        </li>
                        <li>Unbalanced design with empty cells</li>
                        <li>Overparameterized model</li>
                        <li>Covariates with invalid values</li>
                    </ul>
                </div>

                <h2 className="mt-8">Interpreting Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Significant EM Mean
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>CI does not contain 0</li>
                            <li>SE relatively small</li>
                            <li>Stable estimate</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Non-Estimable EM Mean
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Displayed as NaN</li>
                            <li>L-vector all zeros</li>
                            <li>Level combination not in data</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Pairwise Comparison
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>p-value {"<"} 0.05: significant</li>
                            <li>CI does not contain 0</li>
                            <li>Practically important difference</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Univariate Test
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>F-value {">"} F_critical</li>
                            <li>p-value {"<"} 0.05</li>
                            <li>η²ₚ shows effect size</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Practical Applications</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">When to Use EM Means:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                            <strong>Unbalanced design:</strong> When number of
                            observations differs across cells
                        </li>
                        <li>
                            <strong>Models with covariates:</strong> To control
                            for continuous variable effects
                        </li>
                        <li>
                            <strong>Significant interactions:</strong> To
                            understand main effects in interaction context
                        </li>
                        <li>
                            <strong>Missing cells:</strong> When some level
                            combinations are not present in data
                        </li>
                        <li>
                            <strong>Fair comparisons:</strong> To compare groups
                            in a fair manner
                        </li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
