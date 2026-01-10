import init, {Arima} from '@/components/Modals/Analyze/TimeSeries/wasm/pkg/wasm';
import {generateDate} from '@/components/Modals/Analyze/TimeSeries/TimeSeriesGenerateDate';

export async function handleBoxJenkinsModel(
    data: (number)[], 
    dataHeader: (string), 
    orderParameter: (number)[],
    forecasting: boolean,
    period: number,
    typeDate: string,
    startHour: number,
    startDay: number,
    startMonth: number,
    startYear: number
):Promise<[string, string, number[], string, string, string, number[], string]> {
    await init(); // Inisialisasi WebAssembly
    const inputData = Array.isArray(data) ? data : null;
    
    if (!inputData) {
        throw new Error("Invalid input data");
    }

    try {
        if (!inputData.every((val) => typeof val === 'number')) {
            throw new Error("dataValues contains non-numeric values");
        }

        const arima = new Arima(new Float64Array(data), orderParameter[0], orderParameter[1], orderParameter[2]);
        // let test = Array.from(burg_alg(5, new Float64Array(data)));
        let coef = Array.from(arima.estimate_coef());
        let se = Array.from(arima.estimate_se()); 
        let tStat = Array.from(arima.t_stat());
        let pValue = Array.from(arima.p_value());
        let selCritValue = Array.from(arima.selection_criteria());

        // Description Table
        let dateArray = await generateDate(typeDate, startHour, startDay, startMonth, startYear, data.length);
        let descriptionJSON = JSON.stringify({
            tables: [
                {
                    title: `Description Table`,
                    columnHeaders: [{header:""},{header: 'description'}],
                    rows: [
                        {
                            rowHeader: [`Name Method`],
                            description: `ARIMA (${orderParameter[0]}, ${orderParameter[1]}, ${orderParameter[2]})`,
                        },
                        {
                            rowHeader: [`Estimation Method`],
                            description: `Conditional Least Squares (CLS)`,
                        },
                        {
                            rowHeader: [`Function Estimation`],
                            description: `Conditional Sum of Squares (CSS)`,
                        },
                        {
                            rowHeader: [`Optimalization Method`],
                            description: `L-BFGS`,
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
                            rowHeader: [`Series Length`],
                            description: `${data.length}`,
                        },
                    ],
                }
            ],
        });

        let coefName = ['Constant'];

        if(orderParameter[0] > 0){
            for(let i = 1; i <= orderParameter[0]; i++){
                coefName.push(`AR(${i})`);
            }
        }
        if(orderParameter[2] > 0){
            for(let i = 1; i <= orderParameter[2]; i++){
                coefName.push(`MA(${i})`);
            }
        }

        let coefStruct: Record<string, any> = {}; // Menggunakan objek kosong
        // Jika Nilai SE elemen ke-0, maka determinan 0 maka matriks singular
        for (let i = 0; i < se.length; i++) {
            if (se[i] == 0.0) {
                se[i] = NaN; // Mengganti nilai SE dengan NaN
                tStat[i] = NaN; // Mengganti nilai SE dengan NaN
                pValue[i] = NaN; // Mengganti nilai SE dengan NaN
            }
        }
        
        if ((coefName.length + coef.length + se.length + tStat.length + pValue.length) % coef.length == 0) {
            for (let i = 0; i < coef.length; i++) {
                coefStruct[i] = { // Gunakan i sebagai key dalam objek
                    coefName: coefName[i],
                    coef: coef[i],
                    se: se[i],
                    tStat: tStat[i],
                    pValue: pValue[i]
                };
            }
        } else {
            throw new Error("Data length is not equal");
        }
        let coefStructJson = JSON.stringify({
            tables: [{
                title: `Coefficients Test for ARIMA (${orderParameter[0]},${orderParameter[1]},${orderParameter[2]})`,
                columnHeaders: [{header: ""}, {header: "coef"}, {header: "std. error"}, {header: "t value"}, {header: "p-value"}],
                rows: Object.entries(coefStruct).map(([key, value]) => ({
                    "rowHeader": [value.coefName],
                    "coef": value.coef.toFixed(3),
                    "std. error": value.se.toFixed(3),
                    "t value": value.tStat.toFixed(3),
                    "p-value": value.pValue.toFixed(3),
                })),
            }]
        });

        let selCritName = orderParameter[0] == 0 && orderParameter[2] == 0 ? 
        [
            `S.E. of Regression`,`Sum Squared Resid`,
            `Log Likelihood`, `Mean Dependent Var`, `S.D. Dependent Var`,
            `Akaike Info Crit`, `Schwarz Criterion`, `Hannan-Quinn`, `Durbin-Watson`
        ]
        :
        [
            `R-Squared`, `Adj. R-Squared`, `S.E. of Regression`,`Sum Squared Resid`,
            `Log Likelihood`, `F-Statistic`, `Prob(F-Stat)`, `Mean Dependent Var`, `S.D. Dependent Var`,
            `Akaike Info Crit`, `Schwarz Criterion`, `Hannan-Quinn`, `Durbin-Watson`
        ];
        let selCritStruct: Record<string, any> = {}; // Menggunakan objek kosong
        // Mengecek panjang seluruh data apakah sama
        if ((selCritName.length + selCritValue.length) % selCritValue.length == 0) {
            for (let i = 0; i < selCritName.length; i++) {
                selCritStruct[i] = { // Gunakan i sebagai key dalam objek
                    selCritName: selCritName[i],
                    selCritValue: selCritValue[i],
                };
            }
        } else {
            throw new Error("Data length is not equal");
        }
        let selCritStructJson = JSON.stringify({
            tables: [{
                title: `Selection Criteria for ${dataHeader}`,
                columnHeaders: [{header: ""}, {header: "value"}],
                rows: Object.entries(selCritStruct).map(([key, value]) => ({
                    "rowHeader": [value.selCritName],
                    "value": value.selCritValue.toFixed(3),
                })),
            }]
        });

        let forecast;
        let forecastEval;
        let forecastEvalJson = "";
        let graphicJSON = "";
        if (forecasting) {
            forecast = Array.from(arima.forecast());
            let structuredForecasting: any[] = [];
            // Validasi panjang array
            if (data.length === forecast.length) {
                for (let i = 0; i < data.length; i++) {
                    structuredForecasting.push({
                        category: `${dateArray[i]}`,
                        subcategory: `${dataHeader}`,
                        value: data[i],
                    });
                    structuredForecasting.push({
                        category: `${dateArray[i]}`,
                        subcategory: `ARIMA Forecasting`,
                        value: forecast[i] === 0? null : forecast[i],
                    });
                }
            } else {
                throw new Error("Panjang array tidak sama!");
            }

            graphicJSON = JSON.stringify({
                charts: [
                    {
                        chartType: "Multiple Line Chart",
                        chartMetadata: {
                            axisInfo: {
                                category: `date`,
                                subCategory: [`${dataHeader}`, `ARIMA Forecasting`],
                            },
                            description: `ARIMA ${dataHeader}`,
                            notes: `ARIMA ${dataHeader}`,
                            title: `ARIMA Forecasting of ${dataHeader}`,
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

            forecastEval = arima.forecasting_evaluation() as Record<string, number>;
            forecastEvalJson = JSON.stringify({
                tables: [
                    {
                        title: `Arima Forecasting Evaluation`,
                        columnHeaders: [{header:""},{header: 'value'}], 
                        rows: Object.entries(forecastEval).map(([key, value]) => ({
                            "rowHeader": [key], 
                            "value": value.toFixed(3),     
                        })),
                    },
                ],
            });
            forecast = Array.from(arima.forecast());
        } else{
            forecast = [0];
        }

        return ["success", descriptionJSON, [...coef, ...se], coefStructJson , selCritStructJson, forecastEvalJson, forecast, graphicJSON];
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
        return ["error", errorJSON, [0], "", "", "", [0], ""];
    }
}