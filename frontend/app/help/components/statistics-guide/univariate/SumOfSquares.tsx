import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    Layers,
} from "lucide-react";

export const SumOfSquares: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Sum of Squares"
            description="Complete explanation of Sum of Squares calculation in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Sum of Squares in GLM
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Sum of Squares is a fundamental component in
                            analysis of variance that measures variability in
                            data. GLM uses four different types of SS for
                            various analysis purposes.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Calculator className="h-6 w-6" />
                    Basic Concepts of Sum of Squares
                </h2>

                <p>
                    Sum of Squares (SS) measures total variability in data and
                    can be decomposed into several components. In GLM, SS is
                    calculated using hypothesis matrix L:
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        General Sum of Squares Formula:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS(H) = (L × β̂)ᵀ × (L × G⁻¹ × Lᵀ)⁻¹ × (L × β̂)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>L</strong> = hypothesis matrix (describes
                            the hypothesis being tested)
                        </li>
                        <li>
                            <strong>β̂</strong> = parameter estimate vector
                        </li>
                        <li>
                            <strong>G⁻¹</strong> = generalized inverse of matrix
                            (X'WX)
                        </li>
                        <li>
                            <strong>SS(H)</strong> = Sum of Squares for
                            hypothesis H
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Layers className="h-6 w-6" />
                    Types of Sum of Squares
                </h2>

                <p>
                    GLM uses four different types of Sum of Squares, each with
                    specific characteristics and uses:
                </p>

                <h3>Type I Sum of Squares (Sequential)</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Type I SS Characteristics:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>Sequential:</strong> Depends on order of
                            terms in model
                        </li>
                        <li>
                            <strong>Hierarchical:</strong> Each term evaluated
                            after previous terms
                        </li>
                        <li>
                            <strong>Cumulative:</strong> Effects of previous
                            terms are controlled
                        </li>
                        <li>
                            <strong>Application:</strong> Models with clear
                            theoretical ordering
                        </li>
                    </ul>
                </div>

                <h4>L Matrix Construction for Type I</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                1. Take L₀ = p×p submatrix from Z'WZ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                2. Perform SWEEP on columns before term Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                3. Zero out rows and columns for effects before
                                Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>
                                4. Zero out rows for effects after Fⱼ
                            </strong>
                        </div>
                        <div>
                            <strong>5. Remove zero-valued rows</strong>
                        </div>
                        <div>
                            <strong>6. Extract independent row basis</strong>
                        </div>
                    </div>
                </div>

                <h4>Type I SS Formula</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SS₁(Fⱼ) = SS(Fⱼ | F₁, F₂, ..., Fⱼ₋₁)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares for term Fⱼ after controlling for effects
                        of terms F₁ through Fⱼ₋₁
                    </p>
                </div>

                <h3>Type II Sum of Squares (Marginal)</h3>
                <div className="bg-green-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-green-800 mb-2">
                        Type II SS Characteristics:
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                        <li>
                            <strong>Marginal:</strong> Tests term effect after
                            other terms that don't contain it
                        </li>
                        <li>
                            <strong>Marginality Principle:</strong> Respects
                            model hierarchy
                        </li>
                        <li>
                            <strong>Order Independent:</strong> Not dependent on
                            order in model
                        </li>
                        <li>
                            <strong>Application:</strong> Models without
                            significant interactions
                        </li>
                    </ul>
                </div>

                <h4>L Matrix Construction for Type II</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>
                                L = [0 | C × (X₂ᵀ × W^½ × M₁ × W^½ × X₂) | C ×
                                (X₂ᵀ × W^½ × M₁ × W^½ × X₃)]
                            </strong>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">Where:</p>
                        <ul className="text-sm text-gray-600 mt-1">
                            <li>
                                <strong>X₁:</strong> Columns for effects that
                                don't contain F
                            </li>
                            <li>
                                <strong>X₂:</strong> Columns for effect F (term
                                of interest)
                            </li>
                            <li>
                                <strong>X₃:</strong> Columns for effects that
                                contain F
                            </li>
                            <li>
                                <strong>M₁:</strong> Orthogonal projection
                                matrix to column space of X₁
                            </li>
                            <li>
                                <strong>C:</strong> Generalized inverse of (X₂ᵀ
                                × W^½ × M₁ × W^½ × X₂)
                            </li>
                        </ul>
                    </div>
                </div>

                <h4>Type II SS Formula</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₂(F) = SS(F | all terms that don't contain F)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares for term F after controlling for all
                        terms that don't contain F
                    </p>
                </div>

                <h3>Type III Sum of Squares (Partial)</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Type III SS Characteristics:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                            <strong>Partial:</strong> Tests term effect after
                            ALL other terms in model
                        </li>
                        <li>
                            <strong>Equal-Weighted:</strong> Uses equally
                            weighted cell means
                        </li>
                        <li>
                            <strong>Marginal:</strong> Tests marginal hypotheses
                        </li>
                        <li>
                            <strong>Application:</strong> Models with
                            interactions, unbalanced designs
                        </li>
                    </ul>
                </div>

                <h4>L Matrix Construction for Type III</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>Intercept:</strong> L = average of all
                            factor-based parameters
                        </div>
                        <div>
                            <strong>Covariates:</strong> L = [0, 0, ..., 1, 0,
                            ...] (1 at covariate position)
                        </div>
                        <div>
                            <strong>Factor Main Effects:</strong> Contrasts
                            between levels, averaged over other factor levels
                        </div>
                        <div>
                            <strong>Interactions:</strong> Product of contrasts
                            from involved main effects
                        </div>
                    </div>
                </div>

                <h4>Type III SS Formula</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₃(F) = SS(F | all other terms in model)
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares for term F after controlling for all
                        other terms in model
                    </p>
                </div>

                <h3>Type IV Sum of Squares (Balanced)</h3>
                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Type IV SS Characteristics:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>
                            <strong>Balanced:</strong> Designed for designs with
                            empty cells
                        </li>
                        <li>
                            <strong>Distributed:</strong> Contrasts distributed
                            equally across available cells
                        </li>
                        <li>
                            <strong>Modified Type III:</strong> Modification of
                            Type III for incomplete data
                        </li>
                        <li>
                            <strong>Application:</strong> Factorial designs with
                            missing cells
                        </li>
                    </ul>
                </div>

                <h4>L Matrix Construction for Type IV</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. Start with Type III L matrix</strong>
                        </div>
                        <div>
                            <strong>
                                2. Identify effects containing term of interest
                            </strong>
                        </div>
                        <div>
                            <strong>
                                3. Adjust coefficients based on available cells
                            </strong>
                        </div>
                        <div>
                            <strong>4. Distribute contrasts equally</strong>
                        </div>
                        <div>
                            <strong>5. Extract independent row basis</strong>
                        </div>
                    </div>
                </div>

                <h4>Type IV SS Formula</h4>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            SS₄(F) = SS₃(F) with adjustment for empty cells
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Type III Sum of Squares adjusted to handle missing cells
                    </p>
                </div>

                <h2 className="mt-8">Sum of Squares Types Comparison</h2>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Type</th>
                                <th className="border p-2 text-left">
                                    Characteristic
                                </th>
                                <th className="border p-2 text-left">
                                    Control
                                </th>
                                <th className="border p-2 text-left">
                                    Application
                                </th>
                                <th className="border p-2 text-left">Order</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border p-2 font-bold">Type I</td>
                                <td className="border p-2">Sequential</td>
                                <td className="border p-2">Previous terms</td>
                                <td className="border p-2">
                                    Hierarchical models
                                </td>
                                <td className="border p-2">Dependent</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type II
                                </td>
                                <td className="border p-2">Marginal</td>
                                <td className="border p-2">
                                    Terms that don't contain F
                                </td>
                                <td className="border p-2">
                                    Models without interactions
                                </td>
                                <td className="border p-2">Independent</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type III
                                </td>
                                <td className="border p-2">Partial</td>
                                <td className="border p-2">All other terms</td>
                                <td className="border p-2">
                                    Models with interactions
                                </td>
                                <td className="border p-2">Independent</td>
                            </tr>
                            <tr>
                                <td className="border p-2 font-bold">
                                    Type IV
                                </td>
                                <td className="border p-2">Balanced</td>
                                <td className="border p-2">All other terms</td>
                                <td className="border p-2">
                                    Designs with empty cells
                                </td>
                                <td className="border p-2">Independent</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3>SS Calculation Algorithm</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Steps in calculate_ss_for_term:
                    </h4>
                    <ol className="text-sm text-gray-600 space-y-1">
                        <li>1. Validate L matrix and β̂ dimensions</li>
                        <li>
                            2. Calculate L × β̂ (hypothesis linear combination
                            estimate)
                        </li>
                        <li>3. Calculate L × G⁻¹ × Lᵀ (covariance matrix)</li>
                        <li>
                            4. Calculate rank of covariance matrix (degrees of
                            freedom)
                        </li>
                        <li>
                            5. Calculate pseudo-inverse of covariance matrix
                        </li>
                        <li>6. Calculate SS = (L×β̂)ᵀ × (L×G⁻¹×Lᵀ)⁻¹ × (L×β̂)</li>
                        <li>7. Ensure SS ≥ 0 (take maximum with 0)</li>
                    </ol>
                </div>

                <h2 className="mt-8">Degrees of Freedom</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>df = rank(L × G⁻¹ × Lᵀ)</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Degrees of freedom for each SS type determined by rank
                        of hypothesis covariance matrix
                    </p>
                </div>

                <h2 className="mt-8">Mean Squares and F-Statistics</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>MS = SS / df</strong>
                        </div>
                        <div>
                            <strong>F = MS / MSE</strong>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Mean Squares and F-statistics calculated using
                        appropriate SS and df
                    </p>
                </div>

                <h2 className="mt-8">Effect Size</h2>

                <h3>Eta Squared (η²)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>η² = SS / SST</strong>
                        </div>
                    </div>
                </div>

                <h3>Partial Eta Squared (η²ₚ)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>η²ₚ = SS / (SS + SSE)</strong>
                        </div>
                    </div>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
