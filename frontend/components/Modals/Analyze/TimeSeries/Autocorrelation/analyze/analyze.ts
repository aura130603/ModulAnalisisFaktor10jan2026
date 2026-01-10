import init, {Autocorrelation} from '@/components/Modals/Analyze/TimeSeries/wasm/pkg/wasm';

export async function handleAutocorrelation(
    data: (number)[], 
    dataHeader: (string), 
    lag: (number),
    difference: (string),
    useSeasonal: (boolean),
    seasonal: (number),
):Promise<[string, string, number[], string, string, string, string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data) ? data : null;
    
    if (!inputData) {
        throw new Error("Invalid input data");
    }

    try {
        if (!inputData.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        const autocorrelation = new Autocorrelation(new Float64Array(data), lag as number);
        await autocorrelation.autocorelate(difference, useSeasonal, seasonal);

        // Untuk testing hasil di console
        const test1 = Array.from(autocorrelation.calculate_acf(new Float64Array(data)));
        const test2 = Array.from(autocorrelation.calculate_acf_se(new Float64Array(test1)));
        const test3 = Array.from(autocorrelation.calculate_pacf(new Float64Array(test1)));
        const test4 = Array.from(autocorrelation.calculate_pacf_se(new Float64Array(test3)));
        const test5 = Array.from(autocorrelation.calculate_ljung_box(new Float64Array(test1)));
        // const test6 = Array.from(autocorrelation.df_ljung_box());
        const test7 = Array.from(autocorrelation.pvalue_ljung_box(new Float64Array(test5)));

        // Nilai yang sebenarnya
        const acf = Array.from(autocorrelation.get_acf());
        const acf_se = Array.from(autocorrelation.get_acf_se());
        const pacf = Array.from(autocorrelation.get_pacf());
        const pacf_se = Array.from(autocorrelation.get_pacf_se());
        const lb = Array.from(autocorrelation.get_lb());
        const pval = Array.from(autocorrelation.get_pvalue_lb());
        const df = Array.from(autocorrelation.get_df_lb());

        // Description Table
        let descriptionJSON = JSON.stringify({
            tables: [
                {
                    title: `Description Table`,
                    columnHeaders: [{header:""},{header: 'description'}],
                    rows: [
                        {
                            rowHeader: [`Name Method`],
                            description: `Autocorrelation`,
                        },
                        {
                            rowHeader: [`Series Name`],
                            description: `${dataHeader}`,
                        },
                        {
                            rowHeader: [`Differencing`],
                            description: `${difference === "level" ? "none" : difference}`,
                        },
                        {
                            rowHeader: [`Seasonal Differencing`],
                            description: `${useSeasonal ? "with seasonal-differencing" : "none"}`,
                        },
                        {
                            rowHeader: [`Periodicity`],
                            description: `${useSeasonal ? seasonal : ""}`,
                        },
                        {
                            rowHeader: [`Maximum Lag`],
                            description: `${lag}`,
                        },
                        {
                            rowHeader: [`Approach Method of Standard Error`],
                            description: `Bartlett Formula`,
                        },
                        {
                            rowHeader: [`Observations`],
                            description: `${data.length}`,
                        },
                        {
                            rowHeader: [`Number Observations of Computable First Lags`],
                            description: `${ 
                                difference === 'first-difference' && useSeasonal ? data.length - 2 - seasonal :
                                difference === 'second-difference' && useSeasonal ? data.length - 3 - seasonal :
                                useSeasonal ? data.length - 1 - seasonal :
                                difference === 'first-difference' ? data.length - 2 : 
                                difference === 'second-difference' ? data.length - 3 : data.length - 1}`,
                        },
                    ],
                }
            ],
        });

        let acfStruct: Record<string, any> = {}; // Menggunakan objek kosong
        // Mengecek panjang seluruh data apakah sama
        if ((acf.length + acf_se.length + lb.length + df.length + pval.length) % acf.length == 0) {
            for (let i = 0; i < acf.length; i++) {
                acfStruct[i] = { // Gunakan i sebagai key dalam objek
                    acf: acf[i],
                    acf_se: acf_se[i],
                    lb: lb[i],
                    pval: pval[i],
                    df: df[i]
                };
            }
        } else {
            throw new Error("Data length is not equal");
        }
        let acfJSON = JSON.stringify({
            tables: [{
                title: "Autocorrelation Function (ACF)",
                columnHeaders: [{header: ""}, {header: "ACF"}, {header: "SE"}, {header: "Ljung-Box"}, {header: "df"}, {header: "p-value"}],
                rows: Object.entries(acfStruct).map(([key, value]) => ({
                    "rowHeader": [parseInt(key) + 1],
                    "ACF": value.acf.toFixed(3),
                    "SE": value.acf_se.toFixed(3),
                    "Ljung-Box": value.lb.toFixed(3),
                    "df": value.df,
                    "p-value": value.pval.toFixed(3),
                })),
            }]
        });

        let pacfStruct: Record<string, any> = {};
        // mengecek panjang seluruh data apakah sama
        if ((pacf.length + pacf_se.length) % pacf.length == 0) {
            for (let i = 0; i < pacf.length; i++) {
                pacfStruct[i] = {
                    pacf: pacf[i],
                    pacf_se: pacf_se[i],
                };
            }
        }else{
            throw new Error("Data length is not equal");
        }
        let pacfJSON = JSON.stringify({
            tables: [{
                title: "Partial Autocorrelation Function (PACF)",
                columnHeaders: [{header: ""}, {header: "PACF"}, {header: "SE"}],
                rows: Object.entries(pacfStruct).map(([key, value]) => ({
                    "rowHeader": [parseInt(key) + 1],
                    "PACF": value.pacf.toFixed(3),
                    "SE": value.pacf_se.toFixed(3),
                })),
            }]
        });

        let bartletLeftACF = Array.from(autocorrelation.calculate_bartlet_left (new Float64Array(acf_se), 0.05));
        let bartletRightACF = Array.from(autocorrelation.calculate_bartlet_right (new Float64Array(acf_se), 0.05));
        let structureACF: any[] = [];
        // Validasi panjang array
        for (let i = 0; i < acf.length; i++) {
            structureACF.push({
                category: `lag ${i + 1}`,
                bars: {
                    acf:acf[i]
                },
                lines: {
                    bartletLeft: bartletLeftACF[i],
                    bartletRight: bartletRightACF[i],
                },
            });
        }
        let acfGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Vertical Bar & Line Chart2",
                    chartMetadata: {
                        axisInfo: {
                            category: `lag`,
                            barValue: `acf`,
                            lineValue: [`bartlet left ACF`, `bartlet right ACF`],
                        },
                        description: `Autocorrelation ${dataHeader} using ${lag}`,
                        notes: `Autocorrelation ${dataHeader}`,
                        title: `Autocorrelation Function Correlogram`,
                    },
                    chartData: structureACF,
                    config: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#4682B4"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let bartletLeftPACF = Array.from(autocorrelation.calculate_bartlet_left(new Float64Array(pacf_se), 0.05));
        let bartletRightPACF = Array.from(autocorrelation.calculate_bartlet_right(new Float64Array(pacf_se), 0.05));
        let structurePACF: any[] = [];
        // Validasi panjang array
        for (let i = 0; i < pacf.length; i++) {
            structurePACF.push({
                category: `lag ${i + 1}`,
                bars: {
                    pacf:pacf[i]
                },
                lines: {
                    bartletLeft: bartletLeftPACF[i],
                    bartletRight: bartletRightPACF[i],
                },
            });
        }
        let pacfGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Vertical Bar & Line Chart2",
                    chartMetadata: {
                        axisInfo: {
                            category: `lag`,
                            barValue: `pacf`,
                            lineValue: [`bartlet left PACF`, `bartlet right PACF`],
                        },
                        description: `Autocorellation ${dataHeader} using ${lag}`,
                        notes: `Autocorellation ${dataHeader}`,
                        title: `Partial Autocorrelation Function Correlogram`,
                    },
                    chartData: structurePACF,
                    config: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#0096FF", "#1B1212", "#1B1212"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        return ["success", descriptionJSON, test7, acfJSON, pacfJSON, acfGraphicJSON, pacfGraphicJSON];
    } catch (error) {
        let errorMessage = error as Error;
        let errorJSON = JSON.stringify({
            tables: [
                {
                    title: `Error Table`,
                    columnHeaders: [{header:""},{header: 'error'}],
                    rows: [
                        {
                            rowHeader: [`Error Message`],
                            description: `${errorMessage.message}`,
                        },
                    ],
                }
            ],
        });
        return ["error", errorJSON,[0], "", "", "", ""];
    }
}