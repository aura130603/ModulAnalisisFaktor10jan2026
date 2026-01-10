import init, {Decomposition} from '@/components/Modals/Analyze/TimeSeries/wasm/pkg/wasm';
import {generateDate} from '@/components/Modals/Analyze/TimeSeries/TimeSeriesGenerateDate';

export async function handleDecomposition(
    data: (number)[],
    dataHeader: (string),
    decompositionMethod: string,
    trendMethod: string,
    periodValue: number,
    periodLable: string,
    typeDate: string,
    startHour: number,
    startDay: number,
    startMonth: number,
    startYear: number
): Promise<[string, string, number[], number[], number[], number[], number[], 
            string, string, string, string, string, string, string, string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data) ? data : null;

    if (!inputData) {
        throw new Error("Invalid input data");
    }
    if (inputData.length < 4 * Number(periodValue)) {
        throw new Error("Data length is less than 4 times the periodicity");
    }
    if (inputData.length % Number(periodValue) !== 0) {
        throw new Error("Data length is not a multiple of the periodicity");
    }

    try {
        if (!data.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        let decomposition;
        let forecastingValue;
        let forecastingRound;
        let decompositionMethodName;
        switch (decompositionMethod) {
            case 'additive':
                decomposition = new Decomposition(new Float64Array(data), periodValue);
                forecastingValue = Array.from(decomposition.additive_decomposition());
                forecastingRound = forecastingValue.map(value => Number(parseFloat(value.toString()).toFixed(3)));
                decompositionMethodName = 'Additive Decomposition';
                break;
            case 'multiplicative':
                decomposition = new Decomposition(new Float64Array(data), periodValue);
                forecastingValue = Array.from(decomposition.multiplicative_decomposition(trendMethod));
                forecastingRound = forecastingValue.map(value => Number(parseFloat(value.toString()).toFixed(3)));
                decompositionMethodName = 'Multiplicative Decomposition';
                break;
            default:
                throw new Error(`Unknown method: ${decompositionMethod}`);
        }

        // Testing
        let centered = Array.from(decomposition.calculate_centered_moving_average());

        let nameTrendMethod;
        switch (trendMethod) {
            case 'linear':
                nameTrendMethod = "Linear Trend Equation";
                break;
            case 'exponential':
                nameTrendMethod = "Exponential Trend Equation";
                break;
            default:
                throw new Error(`Unknown method: ${trendMethod}`);
        }

        // get components
        let seasonalComponent = Array.from(decomposition.get_seasonal_component());
        let trendComponent = Array.from(decomposition.get_trend_component());
        let irregularComponent = Array.from(decomposition.get_irregular_component());

        // round component
        let seasonalRound = seasonalComponent.map(value => Number(parseFloat(value.toString()).toFixed(3)));
        let trendRound = trendComponent.map(value => Number(parseFloat(value.toString()).toFixed(3)));
        let irregularRound = irregularComponent.map(value => Number(parseFloat(value.toString()).toFixed(3)));

        // Description Table
        let dateArray = await generateDate(typeDate, startHour, startDay, startMonth, startYear, data.length);
        let descriptionJSON = JSON.stringify({
            tables: [
                {
                    title: `Description Table`,
                    columnHeaders: [{header:""},{header: 'description'}],
                    rows: [
                        {
                            rowHeader: [`Decomposition Method`],
                            description: `${decompositionMethodName}`,
                        },
                        {
                            rowHeader: [`Formula of Calculating Decomposition`],
                            description: `Classical Decomposition`,
                        },
                        {
                            rowHeader: [`Trend Method`],
                            description: `${decompositionMethod === 'additive' ? 'none' : trendMethod}`,
                        },
                        {
                            rowHeader: [`Series Name`],
                            description: `${dataHeader}`,
                        },
                        {
                            rowHeader: [`Series Period`],
                            description: `${dateArray[0]} - ${dateArray[dateArray.length - 1]}`,
                        },
                        {
                            rowHeader: [`Periodicity`],
                            description: `${periodValue}`,
                        },
                        {
                            rowHeader: [`Observations`],
                            description: `${data.length}`,
                        },
                    ],
                }
            ],
        });

        let structuredData: any[] = [];
        // Validasi panjang array
        if (data.length === forecastingRound.length) {
            for (let i = 0; i < data.length; i++) {
                structuredData.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${dataHeader}`,
                    value: data[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let dataGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`${dataHeader}`],
                        },
                        description: `${dataHeader}`,
                        notes: `${dataHeader}`,
                        title: `Data Series ${dataHeader}`,
                    },
                    chartData: structuredData,
                    chartConfig: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#0000FF"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let structuredTrend: any[] = [];
        // Validasi panjang array
        if (data.length === forecastingRound.length) {
            for (let i = 0; i < data.length; i++) {
                structuredTrend.push({
                    category: `${dateArray[i]}`,
                    subcategory: `Trend`,
                    value: trendRound[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let trendGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`Trend`],
                        },
                        description: `Trend`,
                        notes: `Trend`,
                        title: `Trend Component of ${dataHeader}`,
                    },
                    chartData: structuredTrend,
                    chartConfig: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#0000FF"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let structuredSeasonal: any[] = [];
        // Validasi panjang array
        if (data.length === forecastingRound.length) {
            for (let i = 0; i < data.length; i++) {
                structuredSeasonal.push({
                    category: `${dateArray[i]}`,
                    subcategory: `Seasonal`,
                    value: seasonalRound[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let seasonalGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`Seasonal`],
                        },
                        description: `Seasonal`,
                        notes: `Seasonal`,
                        title: `Seasonal Component of ${dataHeader}`,
                    },
                    chartData: structuredSeasonal,
                    chartConfig: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#0000FF"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let structuredIrregular: any[] = [];
        // Validasi panjang array
        if (data.length === forecastingRound.length) {
            for (let i = 0; i < data.length; i++) {
                structuredIrregular.push({
                    category: `${dateArray[i]}`,
                    subcategory: `Irregular`,
                    value: irregularRound[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let irregularGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`Irregular`],
                        },
                        description: `Irregular`,
                        notes: `Irregular`,
                        title: `Irregular Component of ${dataHeader}`,
                    },
                    chartData: structuredIrregular,
                    chartConfig: {
                        "width": 1000,
                        "height": 400,
                        "chartColor": ["#0000FF"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let structuredForecasting: any[] = [];
        // Validasi panjang array
        if (data.length === forecastingRound.length) {
            for (let i = 0; i < data.length; i++) {
                structuredForecasting.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${dataHeader}`,
                    value: data[i],
                });
                structuredForecasting.push({
                    category: `${dateArray[i]}`,
                    subcategory: `Decomposition Forecasting`,
                    value: forecastingRound[i] === 0? null : forecastingRound[i],
                });
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let forecastingGraphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Multiple Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`${dataHeader}`, `Decomposition Forecasting`],
                        },
                        description: `Decomposition ${dataHeader}`,
                        notes: `Decomposition ${dataHeader}`,
                        title: `Decomposition Forecasting of ${dataHeader}`,
                    },
                    chartData: structuredForecasting,
                    chartConfig: {
                        "width": 1000,
                        "height": 500,
                        "chartColor": ["#0096FF", "#FFC300"],
                        "useLegend": true,
                        "useAxis": true,
                    }
                }
            ]
        });

        let evalValue = await decomposition.decomposition_evaluation(new Float64Array(forecastingValue)) as Record<string, number>;
        let evalJSON = JSON.stringify({
            tables: [
                {
                    title: `Decompostion Forecasting Evaluation Results`,
                    columnHeaders: [{header:""},{header: 'value'}], 
                    rows: Object.entries(evalValue).map(([key, value]) => ({
                        rowHeader: [key], 
                        value: value.toFixed(3),     
                    })),
                },
            ],
        });

        let seasonalIndices = Array.from(decomposition.get_seasonal_indices());
        let namePeriodLable = seasonalIndices.map((_, i) => `period ${i + 1} of ${periodValue}`);
        let seasonValue: Record<string, number> = Object.fromEntries(
            namePeriodLable.map((label, i) => [label, seasonalIndices[i]])
        );
        let seasonJSON = JSON.stringify({
            tables: [
                {
                    title: `Seasonal Indices ${periodLable}`,
                    columnHeaders: [{header:""},{header: 'value'}],
                    rows: Object.entries(seasonValue).map(([key, value]) => ({
                        rowHeader: [key], 
                        value: value.toFixed(3),     
                    })),
                },
            ],
        });

        let equation = decomposition.get_trend_equation() as string;
        let equationJSON = JSON.stringify({
            "tables": [
                {
                "title": `${nameTrendMethod}`,
                "columnHeaders": [{"header": `${equation}`}], 
                "rows": [
                    {
                    "rowHeader": [`The Equation`],
                    "trend": `${equation}` // Isi nilai biar nggak error
                    }
                ]
                }
            ]
        });

        return ["success", descriptionJSON, centered, seasonalRound, trendRound, irregularRound, 
                forecastingRound, evalJSON, seasonJSON, equationJSON, forecastingGraphicJSON,
                dataGraphicJSON, trendGraphicJSON, seasonalGraphicJSON, irregularGraphicJSON];
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
        return ["error", errorJSON, [0],[0],[0],[0],[0],"","","","","", "", "", ""];
    }
}