// collinearity_diagnostics.js

self.onmessage = function(e) {
    const { dependent, independent, dependentVariableInfo, independentVariableInfos } = e.data;

    // Validasi input
    if (!dependent || !independent || !dependentVariableInfo || !independentVariableInfos) {
        self.postMessage({ error: "Data dependent, independent, dan info variabel harus disediakan." });
        return;
    }

    // Periksa apakah independent adalah array of arrays
    const isArrayOfArrays = Array.isArray(independent) &&
        (independent.length === 0 || Array.isArray(independent[0]));

    let independentData;
    if (isArrayOfArrays) {
        independentData = independent;
    } else if (Array.isArray(independent)) {
        independentData = [independent]; // Konversi array tunggal ke array of arrays
    } else {
        self.postMessage({ error: "Data independent harus berupa array atau array of arrays." });
        return;
    }

    // Validasi panjang data
    const n = dependent.length; // jumlah data
    if (independentData.some(indVar => indVar.length !== n)) {
        self.postMessage({ error: "Panjang semua array independent harus sama dengan dependent." });
        return;
    }

    const k = independentData.length; // jumlah variabel independen

    // (Removed obsolete hard-coded SPSS shortcut block)
    
    // --- Bangun matriks desain X dengan kolom konstan (1) dan semua variabel independen
    const X = [];
    for (let i = 0; i < n; i++) {
        const row = [1]; // Kolom pertama adalah konstanta 1
        for (let j = 0; j < k; j++) {
            row.push(independentData[j][i]);
        }
        X.push(row);
    }

    // --- Implementasi algoritma SPSS untuk collinearity diagnostics
    // Scaling untuk match SPSS style
    const scaledX = X.map(row => [...row]);
    const sqrtN = Math.sqrt(n);
    
    // Scale constant term
    for (let i = 0; i < n; i++) {
        scaledX[i][0] /= sqrtN;
    }
    
    // Scale other variables dengan column norm
    for (let j = 1; j < k+1; j++) {
        let sumSq = 0;
        for (let i = 0; i < n; i++) {
            sumSq += X[i][j] * X[i][j];
        }
        const norm = Math.sqrt(sumSq);
        for (let i = 0; i < n; i++) {
            scaledX[i][j] /= norm;
        }
    }

    // Compute X'X untuk scaled X
    const XtX = Array(k + 1)
        .fill(null)
        .map(() => Array(k + 1).fill(0));
    for (let i = 0; i < k + 1; i++) {
        for (let j = 0; j < k + 1; j++) {
            for (let r = 0; r < n; r++) {
                XtX[i][j] += scaledX[r][i] * scaledX[r][j];
            }
        }
    }

    // ------------------------------------------------------------------
    // Helper : Jacobi eigen-decomposition for real symmetric matrices
    // Produces eigenvalues (array) and eigenvectors (array of vectors).
    // The implementation is adequate for the small dimensional matrices
    // (<= 20) that typically arise in regression diagnostics.
    // ------------------------------------------------------------------
    function jacobiEigenDecomposition(A, eps = 1e-10, maxIter = 100) {
        const n = A.length;
        // Deep copy of A so we do not mutate caller matrix
        const D = A.map((row) => row.slice());
        // Initialise eigenvector matrix as identity
        const V = Array(n)
            .fill(null)
            .map((_, i) =>
                Array(n)
                    .fill(0)
                    .map((__, j) => (i === j ? 1 : 0))
            );

        for (let iter = 0; iter < maxIter; iter++) {
            // Locate largest off-diagonal element in magnitude
            let p = 0;
            let q = 1;
            let max = Math.abs(D[p][q]);
            for (let i = 0; i < n - 1; i++) {
                for (let j = i + 1; j < n; j++) {
                    const val = Math.abs(D[i][j]);
                    if (val > max) {
                        max = val;
                        p = i;
                        q = j;
                    }
                }
            }

            // Convergence check
            if (max < eps) break;

            const theta = (D[q][q] - D[p][p]) / (2 * D[p][q]);
            const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
            const c = 1 / Math.sqrt(1 + t * t);
            const s = t * c;

            // Rotate matrix D
            const dpp = D[p][p];
            const dqq = D[q][q];
            const dpq = D[p][q];

            D[p][p] = c * c * dpp - 2 * s * c * dpq + s * s * dqq;
            D[q][q] = s * s * dpp + 2 * s * c * dpq + c * c * dqq;
            D[p][q] = D[q][p] = 0;

            for (let j = 0; j < n; j++) {
                if (j !== p && j !== q) {
                    const dpj = D[p][j];
                    const dqj = D[q][j];
                    D[p][j] = D[j][p] = c * dpj - s * dqj;
                    D[q][j] = D[j][q] = s * dpj + c * dqj;
                }
            }

            // Update eigenvectors
            for (let j = 0; j < n; j++) {
                const vjp = V[j][p];
                const vjq = V[j][q];
                V[j][p] = c * vjp - s * vjq;
                V[j][q] = s * vjp + c * vjq;
            }
        }

        const eigenvalues = D.map((row, idx) => row[idx]);

        // Eigenvectors are columns of V; convert to array of vectors
        const eigenvectors = [];
        for (let i = 0; i < n; i++) {
            const vec = [];
            for (let j = 0; j < n; j++) {
                vec.push(V[j][i]);
            }
            eigenvectors.push(vec);
        }

        return { eigenvalues, eigenvectors };
    }

    // Hitung eigenvalues dan eigenvectors untuk X'X menggunakan metode Jacobi (umum untuk semua ukuran matriks)
    const { eigenvalues, eigenvectors } = jacobiEigenDecomposition(XtX);

    // Sort eigenvalues and eigenvectors in descending eigenvalue order
    const indices = eigenvalues.map((_, i) => i);
    indices.sort((a, b) => eigenvalues[b] - eigenvalues[a]);

    const sortedEigenvalues = indices.map(i => eigenvalues[i]);
    const sortedEigenvectors = indices.map(i => eigenvectors[i]);

    // Compute condition indices
    const maxEigenvalue = sortedEigenvalues[0];
    const conditionIndices = sortedEigenvalues.map(lambda => 
        Math.sqrt(maxEigenvalue / Math.max(lambda, 1e-15)) // Prevent division by zero
    );

    // Compute variance proportions
    const varianceProportions = Array(k+1).fill().map(() => Array(k+1).fill(0));

    for (let j = 0; j < k+1; j++) {
        // Compute phi for variable j
        const phi = sortedEigenvectors.map((evec, i) => 
            (evec[j] * evec[j]) / sortedEigenvalues[i]
        );

        // Total phi for normalization
        const totalPhi = phi.reduce((sum, val) => sum + val, 0);

        // Variance proportions for each dimension
        for (let i = 0; i < k+1; i++) {
            varianceProportions[j][i] = phi[i] / totalPhi;
        }
    }

    // --- Fungsi pembulatan
    function round3(val) {
        return Math.round(val * 1000) / 1000;
    }
    function round2(val) {
        return Math.round(val * 100) / 100;
    }

    // --- Persiapkan output JSON

    // Header untuk Variance Proportions
    const varianceChildren = [
        { header: "Constant", key: "constant" }
    ];

    // Generate headers and keys for independent variables
    independentVariableInfos.forEach(varInfo => {
        const displayName = (varInfo.label && varInfo.label.trim() !== '') ? varInfo.label : varInfo.name;
        varianceChildren.push({
            header: displayName,
            key: varInfo.name // Use actual variable name as key
        });
    });

    // Baris untuk tiap dimensi
    const dimensionRows = [];
    for (let i = 0; i < k+1; i++) {
        const rowData = {
            rowHeader: [null, `${i+1}`],
            "Eigenvalue": round3(sortedEigenvalues[i]),
            "Condition Index": round3(conditionIndices[i])
        };

        // Tambahkan Variance Proportions
        rowData.constant = round2(varianceProportions[0][i]);
        for (let j = 0; j < k; j++) {
            // Use the actual variable name (which is the key) from independentVariableInfos
            const varNameKey = independentVariableInfos[j].name;
            rowData[varNameKey] = round2(varianceProportions[j+1][i]);
        }

        dimensionRows.push(rowData);
    }

    const result = {
        tables: [
            {
                title: "Collinearity Diagnostics",
                columnHeaders: [
                    { header: "Model" },
                    { header: "Dimension" },
                    { header: "Eigenvalue" },
                    { header: "Condition Index" },
                    {
                        header: "Variance Proportions",
                        children: varianceChildren
                    }
                ],
                rows: [
                    {
                        rowHeader: ["1"],
                        children: dimensionRows
                    }
                ],
                footnotes: [{
                    a: `Dependent Variable: ${(dependentVariableInfo.label && dependentVariableInfo.label.trim() !== '') ? dependentVariableInfo.label : dependentVariableInfo.name}`
                }]
            }
        ]
    };

    // Kirim hasil kembali ke main thread
    self.postMessage(result);
};