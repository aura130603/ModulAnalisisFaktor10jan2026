import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    TestTube,
} from "lucide-react";

export const HeteroscedasticityTests: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Heteroscedasticity Tests"
            description="Complete explanation of heteroscedasticity tests in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Heteroscedasticity Tests
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Heteroscedasticity tests check whether error
                            variance is constant across all predictor levels.
                            Violation of this assumption can affect the validity
                            of statistical inference.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <TestTube className="h-6 w-6" />
                    Basic Concepts of Heteroscedasticity
                </h2>

                <p>
                    Heteroscedasticity is a condition where error variance is
                    not constant across all predictor levels. This violates the
                    homoscedasticity assumption required for valid statistical
                    inference in linear models.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Homoscedasticity (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Constant error variance</li>
                            <li>Var(εᵢ) = σ² for all i</li>
                            <li>Assumption satisfied</li>
                            <li>Valid statistical inference</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Heteroscedasticity (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Non-constant error variance</li>
                            <li>Var(εᵢ) ≠ σ² for some i</li>
                            <li>Assumption violated</li>
                            <li>Biased statistical inference</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Heteroscedasticity Test Methods
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            White Test
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>General heteroscedasticity detection</li>
                            <li>No form assumption required</li>
                            <li>Uses squares and interactions</li>
                            <li>Statistic: LM = n × R²</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Breusch-Pagan Test
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Linear heteroscedasticity detection</li>
                            <li>Based on predicted values</li>
                            <li>Assumes normality</li>
                            <li>Statistic: BP = ESS / (2 × σ̂⁴)</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Modified Breusch-Pagan
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>Robust version of BP test</li>
                            <li>Robust to non-normality</li>
                            <li>Koenker-Bassett version</li>
                            <li>Statistic: LM = n × R²</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">F-Test</h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Alternative to Chi-square test</li>
                            <li>Better performance on small samples</li>
                            <li>Based on predicted values</li>
                            <li>Statistic: F = (R²/df₁) / ((1-R²)/df₂)</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    General Algorithm
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in calculate_heteroscedasticity_tests:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Fit Main Model:</strong> Create design
                            matrix and perform sweep
                        </li>
                        <li>
                            <strong>Calculate Residuals:</strong> ε = y - ŷ
                        </li>
                        <li>
                            <strong>Square Residuals:</strong> ε² as dependent
                            variable
                        </li>
                        <li>
                            <strong>Create Auxiliary Model:</strong> Regress ε²
                            on predictors
                        </li>
                        <li>
                            <strong>Calculate Statistics:</strong> Based on
                            selected method
                        </li>
                        <li>
                            <strong>Test Significance:</strong> Compare with
                            theoretical distribution
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    White Test
                </h2>

                <p>
                    White test is the most commonly used heteroscedasticity test
                    because it requires no assumptions about the specific form
                    of heteroscedasticity.
                </p>

                <h3>Auxiliary Model Construction</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">White Auxiliary Matrix:</h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. Intercept:</strong> Column with value 1
                        </div>
                        <div>
                            <strong>2. Original Predictors:</strong> X₁, X₂,
                            ..., Xₚ
                        </div>
                        <div>
                            <strong>3. Squared Predictors:</strong> X₁², X₂²,
                            ..., Xₚ²
                        </div>
                        <div>
                            <strong>4. Interactions:</strong> X₁×X₂, X₁×X₃, ...,
                            Xₚ₋₁×Xₚ
                        </div>
                    </div>
                </div>

                <h3>White Test Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>LM = n × R²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>n</strong> = number of observations
                        </li>
                        <li>
                            <strong>R²</strong> = coefficient of determination
                            from auxiliary regression
                        </li>
                        <li>
                            <strong>df</strong> = number of predictors in
                            auxiliary model - 1
                        </li>
                    </ul>
                </div>

                <h3>Distribution and Interpretation</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        White Test follows Chi-square distribution:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <li>LM ~ χ²(df) under H₀</li>
                        <li>p-value = P(χ²(df) {">"} LM)</li>
                        <li>
                            p {"<"} 0.05: Reject H₀, heteroscedasticity present
                        </li>
                        <li>p ≥ 0.05: Fail to reject H₀, homoscedasticity</li>
                    </div>
                </div>

                <h2 className="mt-8">Breusch-Pagan Test</h2>

                <p>
                    Breusch-Pagan test assumes that error variance is a linear
                    function of explanatory variables.
                </p>

                <h3>BP Auxiliary Model</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Auxiliary Regression:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>ε² = α₀ + α₁ŷ + u</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Where ε² is squared residuals and ŷ is predicted values
                    </p>
                </div>

                <h3>Breusch-Pagan Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>BP = ESS / (2 × σ̂⁴)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>ESS</strong> = Explained Sum of Squares from
                            auxiliary regression
                        </li>
                        <li>
                            <strong>σ̂²</strong> = RSS/n (error variance estimate
                            from main model)
                        </li>
                        <li>
                            <strong>df</strong> = 1 (since only ŷ as predictor)
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Modified Breusch-Pagan Test</h2>

                <p>
                    Modified Breusch-Pagan test (Koenker-Bassett) is a more
                    robust version against normality assumption violations.
                </p>

                <h3>Modified BP Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>LM = n × R²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Same as White test, but auxiliary model only uses ŷ
                    </p>
                </div>

                <h3>Advantages of Modified BP</h3>
                <div className="bg-green-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-green-800 mb-2">
                        Advantages over classical BP:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>More robust to non-normality</li>
                        <li>No distributional assumptions required</li>
                        <li>Better performance on small samples</li>
                        <li>More asymptotically consistent</li>
                    </ul>
                </div>

                <h2 className="mt-8">F-Test for Heteroscedasticity</h2>

                <p>
                    F-test is an alternative to Chi-square test that often
                    performs better on small samples.
                </p>

                <h3>F-Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = (R²/df₁) / ((1-R²)/df₂)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df₁</strong> = number of predictors in
                            auxiliary model - 1
                        </li>
                        <li>
                            <strong>df₂</strong> = n - number of predictors in
                            auxiliary model
                        </li>
                        <li>
                            <strong>R²</strong> = coefficient of determination
                            from auxiliary regression
                        </li>
                    </ul>
                </div>

                <h3>F Distribution</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        F-test follows F distribution:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                        <li>F ~ F(df₁, df₂) under H₀</li>
                        <li>p-value = P(F(df₁, df₂) {">"} F_observed)</li>
                        <li>
                            p {"<"} 0.05: Reject H₀, heteroscedasticity present
                        </li>
                        <li>p ≥ 0.05: Fail to reject H₀, homoscedasticity</li>
                    </div>
                </div>

                <h2 className="mt-8">Interpreting Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value ≥ 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Fail to reject H₀</li>
                            <li>Homoscedasticity</li>
                            <li>Assumption satisfied</li>
                            <li>Valid statistical inference</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {"<"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Reject H₀</li>
                            <li>Heteroscedasticity</li>
                            <li>Assumption violated</li>
                            <li>Consider solutions</li>
                        </ul>
                    </div>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
