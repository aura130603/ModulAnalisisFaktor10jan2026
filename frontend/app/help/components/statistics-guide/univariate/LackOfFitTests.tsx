import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    CheckCircle,
} from "lucide-react";

export const LackOfFitTests: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Lack of Fit Tests"
            description="Complete explanation of lack of fit tests for evaluating model adequacy in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Lack of Fit Tests
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Lack of fit tests determine whether the chosen model
                            adequately explains the relationship between
                            predictors and response. These tests compare total
                            error with pure error.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6" />
                    Basic Concepts of Lack of Fit
                </h2>

                <p>
                    Lack of fit test is a test to determine whether the chosen
                    model adequately explains the relationship between predictor
                    variables (X) and response variable (Y). This test compares
                    variation around the model mean with pure variation in the
                    data.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Adequate Model (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Model fits the data well</li>
                            <li>No lack of fit</li>
                            <li>Error is only random error</li>
                            <li>F-value not significant</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Inadequate Model (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Model does not fit the data well</li>
                            <li>Lack of fit present</li>
                            <li>Error includes systematic error</li>
                            <li>F-value significant</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Lack of Fit Test Components
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Total Error
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Variation not explained by model</li>
                            <li>SSE = Σ(yᵢ - ŷᵢ)²</li>
                            <li>df = n - p</li>
                            <li>Contains random + systematic error</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Pure Error
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Pure variation in data</li>
                            <li>SS_PE = ΣΣ(yᵢⱼ - ȳᵢ)²</li>
                            <li>df = n - c</li>
                            <li>Only random error</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            Lack of Fit
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>Systematic variation</li>
                            <li>SS_LOF = SS_Error - SS_PE</li>
                            <li>df = c - p</li>
                            <li>Measures model inadequacy</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Replication
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Observations with same X</li>
                            <li>Required for pure error</li>
                            <li>At least 2 observations per combination</li>
                            <li>Without replication, test invalid</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Lack of Fit Test Algorithm
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in calculate_lack_of_fit_tests:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>1. Fit Main Model:</strong> Create design
                            matrix and perform sweep
                        </li>
                        <li>
                            <strong>2. Calculate Total Error:</strong> SSE =
                            Σ(yᵢ - ŷᵢ)²
                        </li>
                        <li>
                            <strong>3. Group Data:</strong> Based on unique X
                            combinations
                        </li>
                        <li>
                            <strong>4. Calculate Pure Error:</strong> SS_PE =
                            ΣΣ(yᵢⱼ - ȳᵢ)²
                        </li>
                        <li>
                            <strong>5. Calculate Lack of Fit:</strong> SS_LOF =
                            SSE - SS_PE
                        </li>
                        <li>
                            <strong>6. Calculate F Statistic:</strong> F =
                            MS_LOF / MS_PE
                        </li>
                        <li>
                            <strong>7. Test Significance:</strong> Compare with
                            F(df_LOF, df_PE)
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Mathematical Calculations
                </h2>

                <h3>Total Error (SSE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSE = Σ(yᵢ - ŷᵢ)²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>yᵢ</strong> = observed value i
                        </li>
                        <li>
                            <strong>ŷᵢ</strong> = predicted value i
                        </li>
                        <li>
                            <strong>df_error</strong> = n - p (n = number of
                            observations, p = number of parameters)
                        </li>
                    </ul>
                </div>

                <h3>Pure Error (SS_PE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS_PE = ΣΣ(yᵢⱼ - ȳᵢ)²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>yᵢⱼ</strong> = observation j in group i
                        </li>
                        <li>
                            <strong>ȳᵢ</strong> = mean of group i
                        </li>
                        <li>
                            <strong>df_pure_error</strong> = n - c (c = number
                            of unique X combinations)
                        </li>
                    </ul>
                </div>

                <h3>Lack of Fit (SS_LOF)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS_LOF = SSE - SS_PE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df_lack_of_fit</strong> = c - p
                        </li>
                        <li>
                            <strong>MS_LOF</strong> = SS_LOF / df_lack_of_fit
                        </li>
                        <li>
                            <strong>MS_PE</strong> = SS_PE / df_pure_error
                        </li>
                    </ul>
                </div>

                <h3>F Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MS_LOF / MS_PE</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>df₁</strong> = df_lack_of_fit = c - p
                        </li>
                        <li>
                            <strong>df₂</strong> = df_pure_error = n - c
                        </li>
                        <li>
                            <strong>F ~ F(df₁, df₂)</strong> under H₀
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Data Grouping</h2>

                <p>
                    Grouping data based on unique combinations of predictor
                    values is a critical step in lack of fit test. Each unique X
                    combination forms one group.
                </p>

                <h3>Grouping Algorithm</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Grouping steps:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Hash X Rows:</strong> Each X row is hashed
                            for unique identification
                        </li>
                        <li>
                            <strong>Group Y:</strong> Y values with same X hash
                            are grouped
                        </li>
                        <li>
                            <strong>Calculate Means:</strong> ȳᵢ for each group
                        </li>
                        <li>
                            <strong>Calculate Pure Error:</strong> Deviations
                            from group means
                        </li>
                    </ol>
                </div>

                <h3>Grouping Example</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Example data with replication:
                    </h4>
                    <div className="text-sm text-yellow-700 space-y-2">
                        <div>
                            <strong>Group 1 (X = [1, 2]):</strong> Y = [10, 12,
                            11] → ȳ₁ = 11
                        </div>
                        <div>
                            <strong>Group 2 (X = [1, 3]):</strong> Y = [15, 16]
                            → ȳ₂ = 15.5
                        </div>
                        <div>
                            <strong>Group 3 (X = [2, 2]):</strong> Y = [20, 21,
                            19] → ȳ₃ = 20
                        </div>
                        <div>
                            <strong>SS_PE:</strong> ΣΣ(yᵢⱼ - ȳᵢ)²
                        </div>
                    </div>
                </div>

                <h2 className="mt-8">Effect Size and Power</h2>

                <h3>Partial Eta Squared</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>η²ₚ = SS_LOF / (SS_LOF + SS_PE)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Effect size for lack of fit, showing proportion of
                        variance in total error caused by model inadequacy
                    </p>
                </div>

                <h3>Noncentrality Parameter</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>λ = df_lack_of_fit × F</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Noncentrality parameter for power calculation
                    </p>
                </div>

                <h3>Observed Power</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            Power = P(F(df₁, df₂, λ) {">"} F_critical)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Observed power to detect lack of fit
                    </p>
                </div>

                <h2 className="mt-8">Interpreting Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value ≥ 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Fail to reject H₀</li>
                            <li>Model is adequate</li>
                            <li>No lack of fit</li>
                            <li>Model can be used</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {"<"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Reject H₀</li>
                            <li>Model is inadequate</li>
                            <li>Lack of fit present</li>
                            <li>Consider alternative models</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Validity Conditions</h2>

                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Lack of Fit test requires:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Replication:</strong> At least 2
                            observations with same X
                        </li>
                        <li>
                            <strong>2. df_lack_of_fit {">"} 0:</strong> c {">"}{" "}
                            p (combinations {">"} parameters)
                        </li>
                        <li>
                            <strong>3. df_pure_error {">"} 0:</strong> n {">"} c
                            (observations {">"} combinations)
                        </li>
                        <li>
                            <strong>4. MS_PE {">"} 0:</strong> Variation exists
                            in replication
                        </li>
                    </ul>
                </div>

                <h3>Special Cases</h3>
                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        When test is invalid:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>No replication (c = n)</li>
                        <li>Saturated model (p ≥ c)</li>
                        <li>MS_PE = 0 (no variation in replication)</li>
                        <li>df_lack_of_fit ≤ 0</li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
