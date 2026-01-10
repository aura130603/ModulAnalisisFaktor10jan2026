// roc-curve-analysis-output.ts
import {RocCurveFinalResultType} from "@/components/Modals/Analyze/Classify/roc-curve/types/roc-curve-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultROCCurve({
    formattedResult,
}: RocCurveFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const rocCurveResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "ROC Curve Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `ROC Curve Analysis Result`,
                note: "",
            });

            /*
             * 📊 Case Processing Summary Result 📊
             * */
            const caseProcessingSummary = findTable("case_processing_summary");
            if (caseProcessingSummary) {
                const caseProcessingId = await addAnalytic(logId, {
                    title: `Case Processing Summary`,
                    note: "",
                });

                await addStatistic(caseProcessingId, {
                    title: `Case Processing Summary`,
                    description: `Case Processing Summary`,
                    output_data: caseProcessingSummary,
                    components: `Case Processing Summary`,
                });
            }

            /*
             * 📈 Area Under the Curve Results 📈
             * */
            const variables = formattedResult.tables
                .filter((table) =>
                    table.key.startsWith("area_under_roc_curve_")
                )
                .map((table) => table.key.replace("area_under_roc_curve_", ""));

            for (const variable of variables) {
                const areaUnderCurve = findTable(
                    `area_under_roc_curve_${variable}`
                );
                if (areaUnderCurve) {
                    const areaUnderCurveId = await addAnalytic(logId, {
                        title: `Area Under the Curve for ${variable}`,
                        note: "",
                    });

                    await addStatistic(areaUnderCurveId, {
                        title: `Area Under the Curve`,
                        description: `Area Under the ROC Curve for ${variable}`,
                        output_data: areaUnderCurve,
                        components: `Area Under the Curve`,
                    });
                }
            }

            /*
             * 📊 Coordinates of the Curve Results 📊
             * */
            for (const variable of variables) {
                const coordinatesOfCurve = findTable(
                    `coordinates_roc_${variable}`
                );
                if (coordinatesOfCurve) {
                    const coordinatesOfCurveId = await addAnalytic(logId, {
                        title: `Coordinates of the Curve for ${variable}`,
                        note: "",
                    });

                    await addStatistic(coordinatesOfCurveId, {
                        title: `Coordinates of the Curve`,
                        description: `Coordinates of the ROC Curve for ${variable}`,
                        output_data: coordinatesOfCurve,
                        components: `Coordinates of the Curve`,
                    });
                }
            }
        };

        await rocCurveResult();
    } catch (e) {
        console.error(e);
    }
}
