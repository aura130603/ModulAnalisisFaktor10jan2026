import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
} from "lucide-react";

export const LevenesTest: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Levene's Test"
            description="Complete explanation of Levene's test for homogeneity of variances in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Levene's Test
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Levene's test is used to check whether the variances
                            of the dependent variable are equal across all
                            groups. The assumption of homogeneity of variances
                            is important for ANOVA.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Basic Concepts of Levene's Test
                </h2>

                <p>
                    Levene's Test tests the null hypothesis that population
                    variances are equal across all groups. This is an important
                    assumption for parametric analyses such as ANOVA.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Null Hypothesis (H₀)
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• σ₁² = σ₂² = ... = σₖ²</li>
                            <li>• Variances equal across all groups</li>
                            <li>• Homogeneity assumption satisfied</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Alternative Hypothesis (H₁)
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• σᵢ² ≠ σⱼ² for at least one pair</li>
                            <li>• Variances not equal across all groups</li>
                            <li>• Homogeneity assumption violated</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Levene's Test Variations
                </h2>

                <p>
                    Levene's Test has several variations that differ in how they
                    calculate the center point for absolute deviations:
                </p>

                <h3>1. Based on Mean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Ȳᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Uses mean as substitute for median
                    </p>
                </div>

                <h3>2. Based on Median</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Mᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Uses median (same as standard Levene's Test)
                    </p>
                </div>

                <h3>3. Based on Median with Adjusted df</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Mᵢ|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Uses median with adjusted degrees of freedom
                        (Brown-Forsythe)
                    </p>
                </div>

                <h3>4. Based on Trimmed Mean</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>Zᵢⱼ = |Yᵢⱼ - Ȳᵢ(trimmed)|</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Uses trimmed mean (mean after removing outliers)
                    </p>
                </div>

                <h2 className="mt-8">Calculation Steps</h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Levene's Test Algorithm:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Calculate Group Medians</strong>
                            <br />
                            Mᵢ = median of group i
                        </li>
                        <li>
                            <strong>Calculate Absolute Deviations</strong>
                            <br />
                            Zᵢⱼ = |Yᵢⱼ - Mᵢ|
                        </li>
                        <li>
                            <strong>Calculate Mean Deviations</strong>
                            <br />
                            Z̄ᵢ = mean of Zᵢⱼ for group i
                        </li>
                        <li>
                            <strong>Calculate F Statistic</strong>
                            <br />F = MSB / MSW for Zᵢⱼ
                        </li>
                    </ol>
                </div>

                <h2 className="mt-8">Mathematical Formulas</h2>

                <h3>F Statistic</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>F = MSB / MSW</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>MSB</strong> = Mean Square Between (between
                            groups)
                        </li>
                        <li>
                            <strong>MSW</strong> = Mean Square Within (within
                            groups)
                        </li>
                    </ul>
                </div>

                <h3>Sum of Squares</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>SSB = Σnᵢ(Z̄ᵢ - Z̄)²</strong>
                        </div>
                        <div>
                            <strong>SSW = ΣΣ(Zᵢⱼ - Z̄ᵢ)²</strong>
                        </div>
                        <div>
                            <strong>SST = SSB + SSW</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>nᵢ</strong> = number of observations in
                            group i
                        </li>
                        <li>
                            <strong>Z̄ᵢ</strong> = mean absolute deviation of
                            group i
                        </li>
                        <li>
                            <strong>Z̄</strong> = overall mean absolute deviation
                        </li>
                        <li>
                            <strong>Zᵢⱼ</strong> = absolute deviation of
                            observation j in group i
                        </li>
                    </ul>
                </div>

                <h3>Degrees of Freedom</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>df₁ = k - 1</strong> (between groups)
                        </div>
                        <div>
                            <strong>df₂ = N - k</strong> (within groups)
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>k</strong> = number of groups
                        </li>
                        <li>
                            <strong>N</strong> = total observations
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Interpreting Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            p-value {">"} 0.05
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>• Fail to reject H₀</li>
                            <li>• Homogeneous variances</li>
                            <li>• ANOVA can be used</li>
                            <li>• Assumption satisfied</li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            p-value {"<"} 0.05
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>• Reject H₀</li>
                            <li>• Non-homogeneous variances</li>
                            <li>• Consider alternatives</li>
                            <li>• Assumption violated</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">
                    Alternatives When Variances Are Not Homogeneous
                </h2>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Solutions for Heteroscedasticity:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-2">
                        <li>
                            <strong>1. Welch's ANOVA:</strong> Does not require
                            homogeneity of variances assumption
                        </li>
                        <li>
                            <strong>2. Data Transformation:</strong> Log, square
                            root, or other transformations
                        </li>
                        <li>
                            <strong>3. Robust Methods:</strong> Use methods
                            resistant to assumption violations
                        </li>
                        <li>
                            <strong>4. Non-parametric Tests:</strong>{" "}
                            Kruskal-Wallis or Mann-Whitney U
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Results Table</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">
                                    Function
                                </th>
                                <th className="border p-2 text-left">
                                    Levene Statistic
                                </th>
                                <th className="border p-2 text-left">df1</th>
                                <th className="border p-2 text-left">df2</th>
                                <th className="border p-2 text-left">Sig.</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="text-left p-2">Based on Mean</td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on Median
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on Median and with adjusted df
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">adjusted df</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                            <tr className="border-b">
                                <td className="text-left p-2">
                                    Based on trimmed mean
                                </td>
                                <td className="text-left p-2">F-value</td>
                                <td className="text-left p-2">k-1</td>
                                <td className="text-left p-2">N-k</td>
                                <td className="text-left p-2">p-value</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
