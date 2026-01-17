// perbaikan 14/1/2026

// perbaikan (10/1/2026)

// PERBAIKAN 4/1/2026

import {formatDisplayNumber} from "@/hooks/useFormatter";
import {ResultJson, Table} from "@/types/Table";

        export function transformFactorAnalysisResult(data: any): ResultJson & {
            screePlotChart?: any,
            loadingPlotChart?: any,
            factorScores?: any[] } {
                const resultJson: ResultJson & { screePlotChart?: any, loadingPlotChart?: any, factorScores?: any[] } = {
                tables: [],
    };

    console.log("Transforming factor analysis result data:", data);

    if (!data) {
        console.error("No data provided to transformFactorAnalysisResult");
        return resultJson;
    }

    // 1. Descriptive Statistics
    if (data.descriptive_statistics) {
        const table: Table = {
            key: "descriptive_statistics",
            title: "Descriptive Statistics",
            columnHeaders: [
                { header: "Variable", key: "var" },
                { header: "Mean", key: "mean" },
                { header: "Std. Deviation", key: "std_deviation" },
                { header: "Analysis N", key: "analysis_n" },
            ],
            rows: [],
        };

        data.descriptive_statistics.forEach((stat: any, index: number) => {
            table.rows.push({
                rowHeader: [stat.variable],
                mean: formatDisplayNumber(stat.mean),
                std_deviation: formatDisplayNumber(stat.std_deviation),
                analysis_n: formatDisplayNumber(stat.analysis_n),
            });
        });

        resultJson.tables.push(table);
    }

    // 2. Correlation Matrix
    if (data.correlation_matrix) {
        const variables = data.correlation_matrix.correlations.map(
            (entry: any) => entry.variable
        );

        const table: Table = {
            key: "correlation_matrix",
            title: "Correlation Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Correlation values
        data.correlation_matrix.correlations.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        // Significance values - only add if they exist and have length
        if (
            data.correlation_matrix.sig_values &&
            data.correlation_matrix.sig_values.length > 0
        ) {
            // Add "Sig. (1-tailed)" row header
            table.columnHeaders[0] = { header: "Sig. (1-tailed)", key: "var" };

            data.correlation_matrix.sig_values.forEach(
                (entry: any, rowIndex: number) => {
                    const rowData: any = {
                        rowHeader: [entry.variable],
                    };

                    entry.values.forEach((val: any, colIndex: number) => {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(
                            val.value
                        );
                    });

                    table.rows.push(rowData);
                }
            );
        }

        resultJson.tables.push(table);
    }

    // 3. Inverse Correlation Matrix
    if (data.inverse_correlation_matrix) {
        const variables =
            data.inverse_correlation_matrix.inverse_correlations.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "inverse_correlation_matrix",
            title: "Inverse of Correlation Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        data.inverse_correlation_matrix.inverse_correlations.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        resultJson.tables.push(table);
    }

    // 3b. Covariance Matrix
    if (data.covariance_matrix) {
        const variables =
            data.covariance_matrix.covariances.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "covariance_matrix",
            title: "Covariance Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        data.covariance_matrix.covariances.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        // Add determinant note
        table.rows.push({
            rowHeader: [`a. Determinant = ${formatDisplayNumber(data.covariance_matrix.determinant)}`],
        });

        resultJson.tables.push(table);
    }

    // 3c. Inverse of Covariance Matrix
    if (data.inverse_covariance_matrix) {
        const variables =
            data.inverse_covariance_matrix.inverse_covariances.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "inverse_covariance_matrix",
            title: "Inverse of Covariance Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        data.inverse_covariance_matrix.inverse_covariances.forEach(
            (entry: any, rowIndex: number) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
                });

                table.rows.push(rowData);
            }
        );

        resultJson.tables.push(table);
    }

    // 4. KMO and Bartlett's Test
    if (data.kmo_bartletts_test) {
        const table: Table = {
            key: "kmo_bartletts_test",
            title: "KMO and Bartlett's Test",
            columnHeaders: [
                { header: "", key: "test" },
                { header: "", key: "var" },
                { header: "", key: "value" },
            ],
            rows: [
                {
                    rowHeader: [
                        "Kaiser-Meyer-Olkin Measure of Sampling Adequacy",
                    ],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.kaiser_meyer_olkin
                    ),
                },
                {
                    rowHeader: [
                        "Bartlett's Test of Sphericity",
                        "Approx. Chi-Square",
                    ],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.bartletts_test_chi_square
                    ),
                },
                {
                    rowHeader: ["", "df"],
                    value: formatDisplayNumber(data.kmo_bartletts_test.df),
                },
                {
                    rowHeader: ["", "Sig."],
                    value: formatDisplayNumber(
                        data.kmo_bartletts_test.significance
                    ),
                },
            ],
        };

        resultJson.tables.push(table);
    }

    // 5. Anti-image Matrices
    if (data.anti_image_matrices) {
        const variables = data.anti_image_matrices.anti_image_covariance.map(
            (entry: any) => entry.variable
        );

        const table: Table = {
            key: "anti_image_matrices",
            title: "Anti-image Matrices",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Anti-image Covariance
        const covarianceHeader = { rowHeader: ["Anti-image Covariance"] };
        table.rows.push(covarianceHeader);

        data.anti_image_matrices.anti_image_covariance.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: [entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Anti-image Correlation
        const correlationHeader = { rowHeader: ["Anti-image Correlation"] };
        table.rows.push(correlationHeader);

        data.anti_image_matrices.anti_image_correlation.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    const value = val.value;
                    // Add 'a' superscript to diagonal elements (MSA values)
                    if (entry.variable === val.variable) {
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(value);
                    }
                });

                table.rows.push(rowData);
            }
        );

        resultJson.tables.push(table);
    }

    // 6. Communalities
    if (data.communalities) {
        const isCovariance = data.communalities.extraction_matrix_type === "covariance";

        const columnHeaders: any = [{ header: "", key: "var" }];
        
        if (isCovariance) {
            // Jika Covariance: Tampilkan Raw dan Rescaled
            columnHeaders.push({ header: "Raw Initial", key: "raw_initial" });
            columnHeaders.push({ header: "Rescaled Initial", key: "rescaled_initial" });
        } else {
            // Jika Correlation (ULS Default): Hanya tampilkan "Initial"
            // Kita menggunakan key 'rescaled_initial' karena di Rust data dikirim ke field tersebut
            columnHeaders.push({ header: "Initial", key: "rescaled_initial" });
        }
        
        columnHeaders.push({ header: "Extraction", key: "extraction" });

        const table: Table = {
            key: "communalities",
            title: "Communalities",
            columnHeaders,
            rows: [],
        };

        // Build lookup maps from the arrays
        const rawInitialMap = new Map<string, number>();
        const rescaledInitialMap = new Map<string, number>();
        const extractionMap = new Map<string, number>();

        if (Array.isArray(data.communalities.raw_initial)) {
            (data.communalities.raw_initial as any[]).forEach((item: any) => {
                rawInitialMap.set(item.variable, item.value);
            });
        }

        if (Array.isArray(data.communalities.rescaled_initial)) {
            (data.communalities.rescaled_initial as any[]).forEach((item: any) => {
                rescaledInitialMap.set(item.variable, item.value);
            });
        }

        if (Array.isArray(data.communalities.extraction)) {
            (data.communalities.extraction as any[]).forEach((item: any) => {
                extractionMap.set(item.variable, item.value);
            });
        }

        // Get variables in order
        const variables = data.communalities.raw_initial && Array.isArray(data.communalities.raw_initial)
            ? (data.communalities.raw_initial as any[]).map((item: any) => item.variable)
            : (data.communalities.extraction && Array.isArray(data.communalities.extraction))
                ? (data.communalities.extraction as any[]).map((item: any) => item.variable)
                : [];

        variables.forEach((variable: string) => {
            const rowData: any = {
                rowHeader: [variable],
            };

            if (isCovariance) {
                const rawInitialValue = rawInitialMap.get(variable);
                rowData.raw_initial = formatDisplayNumber(rawInitialValue ?? null);
            }

            const rescaledInitialValue = rescaledInitialMap.get(variable);
            rowData.rescaled_initial = formatDisplayNumber(rescaledInitialValue ?? null);

            const extractionValue = extractionMap.get(variable);
            rowData.extraction = formatDisplayNumber(extractionValue ?? null);

            table.rows.push(rowData);
        });

        // Add extraction method note
        const noteRow: any = {
            rowHeader: [`Extraction Method: Principal Component Analysis.`], // Note: String ini bisa dibuat dinamis berdasarkan config jika ada
        };
        
        table.rows.push(noteRow);

        resultJson.tables.push(table);
    }

    // 7. Total Variance Explained (REVISI KHUSUS COVARIANCE & CORRELATION)
    if (data.total_variance_explained) {
        try {
            // Normalisasi data menjadi array blocks (handle single object or array)
            const varianceBlocks = Array.isArray(data.total_variance_explained)
                ? data.total_variance_explained
                : [["Total", data.total_variance_explained]];

            // Cek apakah ini Covariance (biasanya memiliki label 'Raw' atau 'Rescaled')
            const isCovariance = varianceBlocks.some((block: any) => {
                const label = Array.isArray(block) ? block[0] : (block.matrix_type || "");
                return label === "Raw" || label === "Rescaled";
            });

            if (isCovariance) {
                // === LOGIKA KHUSUS COVARIANCE (Output Gabungan Raw & Rescaled) ===
                
                const table: Table = {
                    key: "total_variance_explained",
                    title: "Total Variance Explained",
                    columnHeaders: [
                        // Kolom untuk label "Raw" / "Rescaled" dengan lebar tetap agar tidak terlalu lebar
                        { header: "", key: "group_label" }, 
                        { header: "Component", key: "component", width: "auto" },
                        // SPSS Covariance headers lebih sederhana (hanya Initial Eigenvalues)
                        { header: "Total", key: "total" },
                        { header: "% of Variance", key: "percent_var" },
                        { header: "Cumulative %", key: "cumulative_percent" }
                    ],
                    rows: [],
                };

                // Iterasi setiap blok (Raw, lalu Rescaled) dan gabungkan ke satu tabel yang sama
                varianceBlocks.forEach((block: any) => {
                    const [blockLabel, blockData] = Array.isArray(block) ? block : [block.matrix_type || "Total", block];

                    if (!blockData || !blockData.initial || !blockData.initial.rows) return;

                    const numRows = blockData.initial.rows.length;

                    for (let i = 0; i < numRows; i++) {
                        const rowData: any = {
                            // Tampilkan Label Grup hanya pada baris pertama setiap blok, baris sisanya kosong
                            group_label: i === 0 ? blockLabel : "", 
                            rowHeader: [], // Kosongkan rowHeader default, tapi WAJIB ada agar TS tidak error
                            component: (i + 1).toString(),
                        };

                        // Data Initial (Total, %, Cum %)
                        const rowValues = blockData.initial.rows[i];
                        if (rowValues) {
                            rowData["total"] = formatDisplayNumber(rowValues[0]);
                            rowData["percent_var"] = formatDisplayNumber(rowValues[1]);
                            rowData["cumulative_percent"] = formatDisplayNumber(rowValues[2]);
                        }

                        table.rows.push(rowData);
                    }
                });

                // Tambahkan catatan kaki khusus Covariance
                // FIX: Menambahkan properti rowHeader: [] agar sesuai interface 'Row'
                // table.rows.push({
                //     rowHeader: [], // <--- FIX ERROR TYPESCRIPT
                //     group_label: "Extraction Method: Principal Component Analysis.",
                //     component: "", total: "", percent_var: "", cumulative_percent: ""
                // });
                
                // table.rows.push({
                //     rowHeader: [], // <--- FIX ERROR TYPESCRIPT
                //     group_label: "a. When analyzing a covariance matrix, the initial eigenvalues are the same across the raw and rescaled solution.",
                //     component: "", total: "", percent_var: "", cumulative_percent: ""
                // });

                resultJson.tables.push(table);

            } else {
                // === LOGIKA STANDAR CORRELATION (Kode Lama/Existing) ===
                
                // Ambil blok pertama saja karena correlation biasanya single block
                const block = varianceBlocks[0];
                const [blockLabel, blockData] = Array.isArray(block) ? block : [block.matrix_type || "Total", block];

                const table: Table = {
                    key: "total_variance_explained",
                    title: "Total Variance Explained",
                    columnHeaders: [
                        { header: "Component", key: "component" },
                        {
                            header: "Initial Eigenvalues",
                            key: "initial_eigenvalues",
                            children: blockData.initial.headers.map((header: string, idx: number) => ({
                                header,
                                key: `initial_${idx}`,
                            })),
                        },
                    ],
                    rows: [],
                };
                

                

                // Add extraction columns header if exists
                if (blockData.extraction?.rows?.length > 0) {
                    table.columnHeaders.push({
                        header: "Extraction Sums of Squared Loadings",
                        key: "extraction_sums",
                        children: blockData.extraction.headers.map((header: string, idx: number) => ({
                            header,
                            key: `extraction_${idx}`,
                        })),
                    });
                }

                // Add rotation columns header if exists
                if (blockData.rotation?.rows?.length > 0) {
                    table.columnHeaders.push({
                        header: "Rotation Sums of Squared Loadings",
                        key: "rotation_sums",
                        children: blockData.rotation.headers.map((header: string, idx: number) => ({
                            header,
                            key: `rotation_${idx}`,
                        })),
                    });
                }

                // Build Rows
                const numComponents = blockData.initial.rows.length;
                for (let i = 0; i < numComponents; i++) {
                    const rowData: any = {
                        rowHeader: [(i + 1).toString()], // Component number as header
                    };

                    // Initial Data
                    blockData.initial.rows[i].forEach((val: number, idx: number) => {
                        rowData[`initial_${idx}`] = formatDisplayNumber(val);
                    });

                    // Extraction Data
                    if (blockData.extraction?.rows[i]) {
                        blockData.extraction.rows[i].forEach((val: number, idx: number) => {
                            rowData[`extraction_${idx}`] = formatDisplayNumber(val);
                        });
                    }

                    // Rotation Data
                    if (blockData.rotation?.rows[i]) {
                        blockData.rotation.rows[i].forEach((val: number, idx: number) => {
                            rowData[`rotation_${idx}`] = formatDisplayNumber(val);
                        });
                    }

                    table.rows.push(rowData);
                }
                
                // Add footer
                table.rows.push({
                    rowHeader: ["Extraction Method: Principal Component Analysis."],
                });

                resultJson.tables.push(table);
            }

        } catch (error) {
            console.error("Error processing total_variance_explained:", error);
        }
    }




    // 8. Component Matrix
    if (data.component_matrix) {
        const extractedComponents =
            data.component_matrix.components[0]?.values.length || 0;

        const table: Table = {
            key: "component_matrix",
            title: "Component Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Component",
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.component_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number, index: number) => {
                rowData[`component_${index + 1}`] = formatDisplayNumber(value);
            });

            table.rows.push(rowData);
        });

        // Add footnote
        table.rows.push({
            rowHeader: [`Extraction Method: Principal Component Analysis.`],
        });

        if (extractedComponents > 0) {
            table.rows.push({
                rowHeader: [`a. ${extractedComponents} components extracted.`],
            });
        }

        resultJson.tables.push(table);
    }

    // 9. Reproduced Correlations
    if (data.reproduced_correlations) {
        const variables =
            data.reproduced_correlations.reproduced_correlation.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "reproduced_correlations",
            title: "Reproduced Correlations",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Reproduced Correlation header
        table.rows.push({ rowHeader: ["Reproduced Correlation"] });

        // Reproduced correlation values
        data.reproduced_correlations.reproduced_correlation.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    // Add 'a' superscript to diagonal elements
                    if (entry.variable === val.variable) {
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(val.value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(
                            val.value
                        );
                    }
                });

                table.rows.push(rowData);
            }
        );

        // Residual header
        table.rows.push({ rowHeader: ["Residualᵇ"] });

        // Residual values
        data.reproduced_correlations.residual.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: [entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["a. Reproduced communalities"],
        });
        table.rows.push({
            rowHeader: [
                "b. Residuals are computed between observed and reproduced correlations. There are X (X%) nonredundant residuals with absolute values greater than 0.05.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 9b. Reproduced Covariances
    if (data.reproduced_covariances) {
        const variables =
            data.reproduced_covariances.reproduced_covariance.map(
                (entry: any) => entry.variable
            );

        const table: Table = {
            key: "reproduced_covariances",
            title: "Reproduced Covariances",
            columnHeaders: [
                { header: "", key: "var" },
                ...variables.map((variable: string, index: number) => ({
                    header: variable,
                    key: `var_${index}`,
                })),
            ],
            rows: [],
        };

        // Reproduced Covariance header
        table.rows.push({ rowHeader: ["Reproduced Covariance"] });

        // Reproduced covariance values
        data.reproduced_covariances.reproduced_covariance.forEach(
            (entry: any) => {
                const rowData: any = {
                    rowHeader: [entry.variable],
                };

                entry.values.forEach((val: any, colIndex: number) => {
                    // Add 'a' superscript to diagonal elements
                    if (entry.variable === val.variable) {
                        rowData[`var_${colIndex}`] =
                            formatDisplayNumber(val.value) + "ᵃ";
                    } else {
                        rowData[`var_${colIndex}`] = formatDisplayNumber(
                            val.value
                        );
                    }
                });

                table.rows.push(rowData);
            }
        );

        // Residual header
        table.rows.push({ rowHeader: ["Residualᵇ"] });

        // Residual values
        data.reproduced_covariances.residual.forEach((entry: any) => {
            const rowData: any = {
                rowHeader: [entry.variable],
            };

            entry.values.forEach((val: any, colIndex: number) => {
                rowData[`var_${colIndex}`] = formatDisplayNumber(val.value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["a. Reproduced communalities"],
        });
        table.rows.push({
            rowHeader: [
                "b. Residuals are computed between observed and reproduced covariances. There are X (X%) nonredundant residuals with absolute values greater than 0.05.",
            ],
        });

        resultJson.tables.push(table);
    }

    // 10. Rotated Component Matrix (Orthogonal rotations only)
    if (data.rotated_component_matrix && !data.pattern_matrix) {
        const extractedComponents =
            data.rotated_component_matrix.components[0]?.values.length || 0;

        const table: Table = {
            key: "rotated_component_matrix",
            title: "Rotated Component Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Component",
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.rotated_component_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number, index: number) => {
                rowData[`component_${index + 1}`] = formatDisplayNumber(value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });
        table.rows.push({
            rowHeader: ["a. Rotation converged in X iterations."],
        });

        resultJson.tables.push(table);
    }

    // 11. Component Transformation Matrix (Orthogonal rotations only)
    if (data.component_transformation_matrix && !data.pattern_matrix) {
        const components =
            data.component_transformation_matrix.components.length;

        const table: Table = {
            key: "component_transformation_matrix",
            title: "Component Transformation Matrix",
            columnHeaders: [
                { header: "Component", key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        // Fill rows
        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatDisplayNumber(
                    data.component_transformation_matrix.components[i][j]
                );
            }

            table.rows.push(rowData);
        }

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 11a. Pattern Matrix (Oblique rotations only)
    if (data.pattern_matrix) {
        const extractedComponents =
            data.pattern_matrix.components[0]?.values.length || 0;

        const table: Table = {
            key: "pattern_matrix",
            title: "Pattern Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Component",
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.pattern_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number, index: number) => {
                rowData[`component_${index + 1}`] = formatDisplayNumber(value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Promax with Kaiser Normalization."],
        });
        table.rows.push({
            rowHeader: ["a. Rotation converged in X iterations."],
        });

        resultJson.tables.push(table);
    }

    // 11b. Structure Matrix (Oblique rotations only)
    if (data.structure_matrix) {
        const extractedComponents =
            data.structure_matrix.components[0]?.values.length || 0;

        const table: Table = {
            key: "structure_matrix",
            title: "Structure Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Component",
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.structure_matrix.components.forEach((component: any) => {
            const rowData: any = {
                rowHeader: [component.variable],
            };

            component.values.forEach((value: number, index: number) => {
                rowData[`component_${index + 1}`] = formatDisplayNumber(value);
            });

            table.rows.push(rowData);
        });

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Promax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 11c. Component Correlation Matrix (Oblique rotations only)
    if (data.component_correlation_matrix) {
        const components =
            data.component_correlation_matrix.correlations.length;

        const table: Table = {
            key: "component_correlation_matrix",
            title: "Component Correlation Matrix",
            columnHeaders: [
                { header: "Component", key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        // Fill rows
        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatDisplayNumber(
                    data.component_correlation_matrix.correlations[i][j]
                );
            }

            table.rows.push(rowData);
        }

        resultJson.tables.push(table);
    }

    // 12. Component Score Coefficient Matrix
    if (data.component_score_coefficient_matrix) {
        const extractedComponents =
            data.component_score_coefficient_matrix.components[0]?.values
                .length || 0;

        const table: Table = {
            key: "component_score_coefficient_matrix",
            title: "Component Score Coefficient Matrix",
            columnHeaders: [
                { header: "", key: "var" },
                {
                    header: "Component",
                    key: "component",
                    children: Array.from(
                        { length: extractedComponents },
                        (_, i) => ({
                            header: (i + 1).toString(),
                            key: `component_${i + 1}`,
                        })
                    ),
                },
            ],
            rows: [],
        };

        data.component_score_coefficient_matrix.components.forEach(
            (component: any) => {
                const rowData: any = {
                    rowHeader: [component.variable],
                };

                component.values.forEach((value: number, index: number) => {
                    rowData[`component_${index + 1}`] =
                        formatDisplayNumber(value);
                });

                table.rows.push(rowData);
            }
        );

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 13. Component Score Covariance Matrix
    if (data.component_score_covariance_matrix) {
        const components =
            data.component_score_covariance_matrix.components.length;

        const table: Table = {
            key: "component_score_covariance_matrix",
            title: "Component Score Covariance Matrix",
            columnHeaders: [
                { header: "Component", key: "component" },
                ...Array.from({ length: components }, (_, i) => ({
                    header: (i + 1).toString(),
                    key: `component_${i + 1}`,
                })),
            ],
            rows: [],
        };

        // Fill rows
        for (let i = 0; i < components; i++) {
            const rowData: any = {
                rowHeader: [(i + 1).toString()],
            };

            for (let j = 0; j < components; j++) {
                rowData[`component_${j + 1}`] = formatDisplayNumber(
                    data.component_score_covariance_matrix.components[i][j]
                );
            }

            table.rows.push(rowData);
        }

        // Add footnotes
        table.rows.push({
            rowHeader: ["Extraction Method: Principal Component Analysis."],
        });
        table.rows.push({
            rowHeader: ["Rotation Method: Varimax with Kaiser Normalization."],
        });

        resultJson.tables.push(table);
    }

    // 14. Scree Plot Data (Tabel & Chart)
    if (data.scree_plot) {
        // A. Format sebagai Tabel (Kode Lama - Tetap dipertahankan)
        const table: Table = {
            key: "scree_plot",
            title: "Scree Plot Data",
            columnHeaders: [
                { header: "Component Number", key: "component_number" },
                { header: "Eigenvalue", key: "eigenvalue" },
            ],
            rows: [],
        };

        for (let i = 0; i < data.scree_plot.component_numbers.length; i++) {
            table.rows.push({
                rowHeader: [data.scree_plot.component_numbers[i].toString()],
                eigenvalue: formatDisplayNumber(data.scree_plot.eigenvalues[i]),
            });
        }
        resultJson.tables.push(table);

        // B. Format sebagai Chart Data (KODE BARU DITAMBAHKAN DISINI)
        // Kita meneruskan raw object dari Rust langsung karena strukturnya sudah cocok
        // dengan props yang diharapkan oleh komponen ScreePlot ({component_numbers, eigenvalues})
        resultJson.screePlotChart = data.scree_plot;
    }

    // 15. Loading Plot Data
    if (data.loading_plot) {
        // Kita teruskan objek loading_plot dari Rust ke UI
        resultJson.loadingPlotChart = data.loading_plot;
    }

    // 16. Factor Scores (untuk Save as Variables)
    // Ekstrak factor_scores dari respons WASM jika ada
    if (data.factor_scores && Array.isArray(data.factor_scores)) {
        resultJson.factorScores = data.factor_scores;
    }

    return resultJson;
}
