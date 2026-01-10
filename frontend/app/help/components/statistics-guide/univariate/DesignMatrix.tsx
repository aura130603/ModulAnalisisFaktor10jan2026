import React from "react";
import { HelpContentWrapper } from "../../HelpContentWrapper";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    HelpCircle,
    Calculator,
    BarChart3,
    TrendingUp,
    LayoutDashboard,
} from "lucide-react";

export const DesignMatrix: React.FC = () => {
    return (
        <HelpContentWrapper
            title="GLM Univariate: Design Matrix & Sweep Operations"
            description="Complete explanation of design matrix construction and sweep operations in GLM Univariate analysis."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            Design Matrix & Sweep Operations
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            The design matrix is a fundamental component in GLM
                            that represents the linear model in matrix form.
                            Gauss-Jordan sweep operations are used to solve
                            equation systems and extract parameter estimates.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <LayoutDashboard className="h-6 w-6" />
                    Basic Concepts of Design Matrix
                </h2>

                <p>
                    The Design Matrix (X) is a matrix that represents the linear
                    model in matrix form. Each row represents one observation,
                    and each column represents one predictor or combination of
                    predictors.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">
                        Linear Model in Matrix Form:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Y = Xβ + ε</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>Y</strong> = response vector (n × 1)
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

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    Design Matrix Construction
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in create_design_response_weights:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Data Extraction:</strong> Extract dependent
                            variable and WLS weights
                        </li>
                        <li>
                            <strong>Data Validation:</strong> Ensure all values
                            are numeric and valid
                        </li>
                        <li>
                            <strong>Model Term Generation:</strong> Create list
                            of terms based on configuration
                        </li>
                        <li>
                            <strong>Data Caching:</strong> Pre-cache factor
                            levels and covariates for efficiency
                        </li>
                        <li>
                            <strong>Column Construction:</strong> Create columns
                            for each model term
                        </li>
                        <li>
                            <strong>Matrix Assembly:</strong> Combine all
                            columns into design matrix
                        </li>
                    </ol>
                </div>

                <h3>Types of Terms in Model</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Intercept
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Column with value 1 for all observations</li>
                            <li>Represents constant in model</li>
                            <li>Usually first column in design matrix</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Covariates
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Continuous variables</li>
                            <li>Original values from data</li>
                            <li>No dummy coding required</li>
                        </ul>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Factors (Main Effects)
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Dummy coding for each level</li>
                            <li>
                                One column per level (except reference level)
                            </li>
                            <li>
                                Value 1 if observation at that level, 0 if not
                            </li>
                        </ul>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="font-bold text-red-800 mb-2">
                            Interactions
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                            <li>Product of component columns</li>
                            <li>Represents interaction effects</li>
                            <li>Can involve factors and covariates</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Cross-Product Matrix Z'WZ
                </h2>

                <p>
                    The Z'WZ matrix is the cross-product matrix that becomes the
                    center of Gauss-Jordan sweep operations. Z is formed by
                    combining design matrix X and response vector Y.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">Z Matrix Construction:</h4>
                    <div className="text-center text-lg font-mono">
                        <strong>Z = [X Y]</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Matrix Z combines design matrix X with response vector Y
                    </p>
                </div>

                <h3>Z'WZ Matrix Structure</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Z'WZ matrix has structure:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            [ X'WX X'WY ]<br />[ Y'WX Y'WY ]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>X'WX:</strong> p×p matrix (p = number of
                            parameters)
                        </li>
                        <li>
                            <strong>X'WY:</strong> p×1 vector
                        </li>
                        <li>
                            <strong>Y'WX:</strong> 1×p vector (transpose of
                            X'WY)
                        </li>
                        <li>
                            <strong>Y'WY:</strong> scalar (total sum of squares)
                        </li>
                    </ul>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Gauss-Jordan Sweep Operations
                </h2>

                <p>
                    Sweep operations are fundamental algorithms for solving
                    linear equation systems and extracting parameter estimates
                    from the Z'WZ matrix.
                </p>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Sweep Algorithm (AS 178):
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Collinearity Detection:</strong> Check pivot
                            element c[k,k]
                        </li>
                        <li>
                            <strong>Pivot Validation:</strong> If |c[k,k]| ≤ ε ×
                            |s_k|, parameter is collinear
                        </li>
                        <li>
                            <strong>Sweep Operations:</strong> For each valid
                            row/column k
                        </li>
                        <li>
                            <strong>Matrix Update:</strong> Apply sweep
                            transformations
                        </li>
                        <li>
                            <strong>Result Extraction:</strong> Extract G⁻¹, β̂,
                            and S from swept matrix
                        </li>
                    </ol>
                </div>

                <h3>Standard Sweep Operations</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold mb-2">For each row/column k:</h4>
                    <div className="text-sm font-mono space-y-2">
                        <div>
                            <strong>1. c[k,k] = -1/c[k,k]</strong>
                        </div>
                        <div>
                            <strong>2. c[k,j] = c[k,j]/c[k,k] (j ≠ k)</strong>
                        </div>
                        <div>
                            <strong>3. c[i,k] = c[i,k]/c[k,k] (i ≠ k)</strong>
                        </div>
                        <div>
                            <strong>
                                4. c[i,j] = c[i,j] + c[i,k] × c[k,j] × c[k,k]
                                (i,j ≠ k)
                            </strong>
                        </div>
                    </div>
                </div>

                <h3>Results After Sweep</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Matrix after sweeping first p rows/columns:
                    </h4>
                    <div className="text-center text-lg font-mono">
                        <strong>
                            [ -G B̂ ]<br />[ B̂' S ]
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>G:</strong> Generalized inverse of X'WX
                            (p×p)
                        </li>
                        <li>
                            <strong>B̂:</strong> Parameter estimates (p×1)
                        </li>
                        <li>
                            <strong>B̂':</strong> Transpose of B̂ (1×p)
                        </li>
                        <li>
                            <strong>S:</strong> Residual matrix (1×1, contains
                            SSE)
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">Collinearity Detection</h2>

                <p>
                    The sweep algorithm detects collinearity by checking pivot
                    elements. Collinear parameters cannot be uniquely estimated.
                </p>

                <div className="bg-red-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-red-800 mb-2">
                        Collinearity Conditions:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                        <li>|c[k,k]| ≤ ε × |s_k| (pivot too small)</li>
                        <li>Inconsistency in swept flags</li>
                        <li>Aliased parameters (cannot be estimated)</li>
                        <li>Parameter estimate = 0 for collinear parameters</li>
                    </ul>
                </div>

                <h2 className="mt-8">Parameter Estimation</h2>

                <h3>Ordinary Least Squares (OLS)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'X)⁻¹X'y</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Parameter estimation using least squares method
                    </p>
                </div>

                <h3>Weighted Least Squares (WLS)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>β̂ = (X'WX)⁻¹X'Wy</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Parameter estimation with weights for heteroscedasticity
                    </p>
                </div>

                <h3>Generalized Inverse</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>G⁻¹ = -G (from sweep results)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Generalized inverse for singular matrix cases
                    </p>
                </div>

                <h2 className="mt-8">Sum of Squares Error (SSE)</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>SSE = S[0,0] (from sweep results)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Sum of Squares Error extracted from S[0,0] element of
                        swept matrix
                    </p>
                </div>

                <h3>Degrees of Freedom Error</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>df_error = n - rank(X)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Degrees of freedom for error
                    </p>
                </div>

                <h3>Mean Square Error (MSE)</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>MSE = SSE / df_error</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Error variance estimate
                    </p>
                </div>

                <h2 className="mt-8">Practical Applications</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Advantages of Sweep Operations
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Automatic collinearity detection</li>
                            <li>Handling of singular matrices</li>
                            <li>Extraction of all statistics simultaneously</li>
                            <li>Numerically stable</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            When to Use
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Models with complex interactions</li>
                            <li>Data with collinearity</li>
                            <li>Models with covariates</li>
                            <li>Analysis requiring G⁻¹</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">References</h2>

                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>
                            Clarke, M.R.B. (1982) "Algorithm AS 178: The
                            Gauss-Jordan Sweep Operator with Detection of
                            Collinearity"
                        </li>
                        <li>
                            Ridout, M.S. and Cobby, J.M. (1989) "Algorithm AS
                            R78: A Remark on Algorithm AS 178"
                        </li>
                        <li>
                            Journal of the Royal Statistical Society. Series C
                            (Applied Statistics)
                        </li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
