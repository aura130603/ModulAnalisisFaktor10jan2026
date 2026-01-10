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

export const KMeansClustering: React.FC = () => {
    return (
        <HelpContentWrapper
            title="K-Means Clustering"
            description="Complete explanation of the K-Means clustering algorithm for data grouping."
        >
            <Alert className="mb-6 bg-blue-50 border-blue-100 text-blue-800">
                <div className="flex">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                        <AlertTitle className="text-blue-800 font-medium mb-1">
                            K-Means Clustering
                        </AlertTitle>
                        <AlertDescription className="text-blue-700">
                            The K-Means algorithm iteratively updates cluster
                            center positions to minimize the total distance
                            between data points and their nearest cluster
                            centers.
                        </AlertDescription>
                    </div>
                </div>
            </Alert>

            <div className="prose max-w-none">
                <h2 className="flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Basic Concepts of K-Means
                </h2>

                <p>
                    K-Means is a clustering algorithm that divides data into K
                    groups based on similarity. Each group has a center
                    (centroid) that represents the average of all data points in
                    that group.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            K-Means Objectives
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Minimize within-cluster variance</li>
                            <li>Maximize between-cluster separation</li>
                            <li>Group similar data</li>
                            <li>Discover hidden patterns</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Characteristics
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Iterative algorithm</li>
                            <li>Based on Euclidean distance</li>
                            <li>Converges to local minimum</li>
                            <li>Sensitive to initialization</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <Calculator className="h-6 w-6" />
                    K-Means Algorithm
                </h2>

                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Steps in generate_final_cluster_centers:
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-2">
                        <li>
                            <strong>Initialize Cluster Centers:</strong>{" "}
                            Determine initial positions of cluster centers
                        </li>
                        <li>
                            <strong>Calculate Convergence Threshold:</strong>{" "}
                            Based on minimum distance between initial centers
                        </li>
                        <li>
                            <strong>Iterate Assignment & Update:</strong> Assign
                            points to nearest cluster and update centers
                        </li>
                        <li>
                            <strong>Check Convergence:</strong> Compare center
                            position changes with threshold
                        </li>
                    </ol>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <BarChart3 className="h-6 w-6" />
                    Initialization Methods
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="font-bold text-yellow-800 mb-2">
                            Random Initialization
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                            <li>Select K points randomly</li>
                            <li>Simple and fast</li>
                            <li>Inconsistent results</li>
                            <li>Can get trapped in local minima</li>
                        </ul>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-bold text-purple-800 mb-2">
                            K-Means++
                        </h4>
                        <ul className="text-sm text-purple-700 space-y-1">
                            <li>Probabilistic selection</li>
                            <li>Initial centers more separated</li>
                            <li>Faster convergence</li>
                            <li>More consistent results</li>
                        </ul>
                    </div>
                </div>

                <h2 className="flex items-center gap-2 mt-8">
                    <TrendingUp className="h-6 w-6" />
                    Distance Calculation
                </h2>

                <h3>Euclidean Distance</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>d(x, y) = √(Σ(xᵢ - yᵢ)²)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Where:</p>
                    <ul className="text-sm text-gray-600 mt-1">
                        <li>
                            <strong>x, y</strong> = data vectors
                        </li>
                        <li>
                            <strong>i</strong> = i-th dimension
                        </li>
                        <li>
                            <strong>d</strong> = Euclidean distance
                        </li>
                    </ul>
                </div>

                <h3>Assignment Rule</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>c(x) = argmin_k ||x - μ_k||²</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Each data point is assigned to the cluster with the
                        nearest center
                    </p>
                </div>

                <h3>Update Rule</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>μ_k = (1/|C_k|) × Σ_{"x∈C_k"} x</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Cluster center is updated as the average of all points
                        in the cluster
                    </p>
                </div>

                <h2 className="mt-8">Two Update Modes</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-bold text-green-800 mb-2">
                            Running Means
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1">
                            <li>Update centers incrementally</li>
                            <li>μ_new = μ_old + (x - μ_old) / n</li>
                            <li>More memory efficient</li>
                            <li>Suitable for large datasets</li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-2">
                            Batch Update
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>Update centers after all assignments</li>
                            <li>μ = (1/|C|) x Σ_{"x∈C"} x</li>
                            <li>More accurate</li>
                            <li>Standard K-Means</li>
                        </ul>
                    </div>
                </div>

                <h2 className="mt-8">Convergence Criteria</h2>

                <h3>Threshold Calculation</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>
                            threshold = convergence_criterion × min_center_dist
                        </strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Threshold is calculated based on minimum distance
                        between initial cluster centers
                    </p>
                </div>

                <h3>Stopping Conditions</h3>
                <div className="bg-yellow-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-yellow-800 mb-2">
                        Algorithm stops when:
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>max_change ≤ threshold (convergence achieved)</li>
                        <li>
                            iterations ≥ max_iterations (maximum iterations
                            reached)
                        </li>
                        <li>No assignment changes (perfect convergence)</li>
                    </ul>
                </div>

                <h3>Maximum Change Calculation</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>max_change = max(||μ_new - μ_old||)</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Maximum change is the largest Euclidean distance between
                        old and new centers
                    </p>
                </div>

                <h2 className="mt-8">Distance Between Cluster Centers</h2>

                <h3>Distance Matrix</h3>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <div className="text-center text-lg font-mono">
                        <strong>D[i][j] = ||μ_i - μ_j||</strong>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                        Symmetric matrix showing Euclidean distances between
                        cluster centers
                    </p>
                </div>

                <h3>Distance Matrix Interpretation</h3>
                <div className="bg-blue-50 p-4 rounded-lg my-4">
                    <h4 className="font-bold text-blue-800 mb-2">
                        Distance value interpretation:
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>
                            <strong>D[i][j] = 0:</strong> i = j (distance to
                            self)
                        </li>
                        <li>
                            <strong>D[i][j] small:</strong> Clusters i and j are
                            close
                        </li>
                        <li>
                            <strong>D[i][j] large:</strong> Clusters i and j are
                            far apart
                        </li>
                        <li>
                            <strong>D[i][j] = D[j][i]:</strong> Symmetric matrix
                        </li>
                    </ul>
                </div>

                <h2 className="mt-8">References</h2>
                <div className="bg-gray-50 p-4 rounded-lg my-4">
                    <ul>
                        <li>
                            Hartigan, J. A. (1975). Clustering Algorithms. In
                            John Wiley & Sons. John Wiley & Sons.
                        </li>
                    </ul>
                </div>
            </div>
        </HelpContentWrapper>
    );
};
