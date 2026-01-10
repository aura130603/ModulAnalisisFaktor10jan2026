import init, {Smoothing} from '@/components/Modals/Analyze/TimeSeries/wasm/pkg/wasm';
import {generateDate} from '@/components/Modals/Analyze/TimeSeries/TimeSeriesGenerateDate';

export async function handleSmoothing(
    data: (number)[], 
    dataHeader: (string), 
    pars: (number)[], 
    periodicity: (number),
    typeDate: (string),
    startHour: (number),
    startDay: (number),
    startMonth: (number),
    startYear: (number),
    method: string): 
Promise<[string, string, number[], string, string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data)? data : null;
    
    if (!inputData) {
        throw new Error("Invalid input data");
    }

    try {
        if (!data.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        let smoothing;
        let smoothingValue;
        let nameMethod;
        let parametersUsed;
        
        smoothing = new Smoothing(new Float64Array(data));
        console.log("Smoothing initialized:", smoothing);
        switch (method) {
            case 'sma':
                smoothingValue = smoothing.calculate_sma(pars[0]);
                nameMethod = 'Simple Moving Average';
                parametersUsed = [{
                    rowHeader: [`Distance`],
                    description: `${pars[0]}`,
                }]
                break;
            case 'dma':
                smoothingValue = smoothing.calculate_dma(pars[0]);
                nameMethod = 'Double Moving Average';
                parametersUsed = [{
                    rowHeader: [`Distance`],
                    description: `${pars[0]}`,
                }]
                break;
            case 'ses':
                smoothingValue = smoothing.calculate_ses(pars[0]);
                nameMethod = 'Simple Exponential Smoothing';
                parametersUsed = [{
                    rowHeader: [`Alpha`],
                    description: `${pars[0]}`,
                }]
                break;
            case 'des':
                smoothingValue = smoothing.calculate_des(pars[0]);
                nameMethod = 'Double Exponential Smoothing';
                parametersUsed = [{
                    rowHeader: [`Alpha`],
                    description: `${pars[0]}`,
                }]
                break;
            case 'holt':
                smoothingValue = smoothing.calculate_holt(pars[0], pars[1]);
                nameMethod = 'Holt\'s Method';
                parametersUsed = [{
                    rowHeader: [`Alpha`],
                    description: `${pars[0]}`,
                }, {
                    rowHeader: [`Beta`],
                    description: `${pars[1]}`,
                }]
                break;
            case 'winter':
                smoothingValue = smoothing.calculate_winter(pars[0], pars[1], pars[2], periodicity);
                nameMethod = 'Winter\'s Method';
                parametersUsed = [{
                    rowHeader: [`Alpha`],
                    description: `${pars[0]}`,
                }, {
                    rowHeader: [`Beta`],
                    description: `${pars[1]}`,
                }, {
                    rowHeader: [`Gamma`],
                    description: `${pars[2]}`,
                }]
                break;
            default:
                throw new Error(`Unknown method: ${method}`);
        }

        // Description Table
        let smoothingLength = 0;
        for (let i = 0; i < smoothingValue.length; i++) {
            if (smoothingValue[i] !== 0) {
                smoothingLength++;
            }
        }
        let smoothingArray = Array.from(smoothingValue);
        let smoothingRound = smoothingArray.map(value => Number(parseFloat(value.toString()).toFixed(3)));
        let dateArray = await generateDate(typeDate, startHour, startDay, startMonth, startYear, smoothingArray.length);
        let descriptionJSON = JSON.stringify({
            tables: [
                {
                    title: `Description Table`,
                    columnHeaders: [{header:""},{header: 'description'}],
                    rows: [
                        {
                            rowHeader: [`Smoothing Method`],
                            description: `${nameMethod}`,
                        },
                        ...parametersUsed,
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
                            description: `${(periodicity === 0) ? 'None' : periodicity}`,
                        },
                        {
                            rowHeader: [`Series Length`],
                            description: `${data.length}`,
                        },
                        {
                            rowHeader: [`Smoothing Length`],
                            description: `${smoothingLength}`,
                        },
                    ],
                }
            ],
        });

        // Smoothing Graph
        let structuredSmoothing: any[] = [];
        // Validasi panjang array
        if (data.length === smoothingArray.length) {
            for (let i = 0; i < smoothingArray.length; i++) {
                structuredSmoothing.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${dataHeader}`,
                    value: data[i],
                });
                structuredSmoothing.push({
                    category: `${dateArray[i]}`,
                    subcategory: `${nameMethod}`,
                    value: smoothingRound[i] === 0? null : smoothingRound[i],
                });
                if (smoothingArray[i] === 0.0){
                    smoothingRound[i] = NaN;
                }
            }
        } else {
            throw new Error("Panjang array tidak sama!");
        }
        let graphicJSON = JSON.stringify({
            charts: [
                {
                    chartType: "Multiple Line Chart",
                    chartMetadata: {
                        axisInfo: {
                            category: `date`,
                            subCategory: [`${dataHeader}`, `$(nameMethod) Smoothing`],
                        },
                        description: `Smoothing ${dataHeader} using ${nameMethod}`,
                        notes: `Smoothing ${dataHeader}`,
                        title: `Smoothing of ${dataHeader} using ${nameMethod}`,
                    },
                    chartData: structuredSmoothing,
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

        let evalValue = await smoothing.smoothing_evaluation(smoothingValue) as Record<string, number>;
        let evalJSON = JSON.stringify({
            tables: [
                {
                    title: `Smoothing Evaluation Results`,
                    columnHeaders: [{header:""},{header: 'value'}], 
                    rows: Object.entries(evalValue).map(([key, value]) => ({
                        rowHeader: [key], 
                        value: value.toFixed(3),     
                    })),
                },
            ],
        });

        return ["success", descriptionJSON, smoothingRound, graphicJSON, evalJSON];
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
        return ["error", errorJSON,[0],"",""];
    }
}