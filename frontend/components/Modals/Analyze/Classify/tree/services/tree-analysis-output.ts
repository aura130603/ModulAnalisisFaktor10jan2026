import {useResultStore} from "@/stores/useResultStore";
import {Table} from "@/types/Table";

export async function resultTree(formattedResult: any) {
    try {
        console.log("formattedResult", formattedResult);
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const treeAnalysisResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Decision Tree Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Decision Tree Analysis Result`,
                note: "",
            });

            // Add other statistics and analytics based on the actual output data structure
            // This is a placeholder implementation that should be updated with actual tree analysis results

            if (formattedResult.tables) {
                for (const table of formattedResult.tables) {
                    const tableData = JSON.stringify({ tables: [table] });
                    await addStatistic(analyticId, {
                        title: table.label || table.key,
                        description: table.description || table.key,
                        output_data: tableData,
                        components: table.key,
                    });
                }
            }
        };

        await treeAnalysisResult();
    } catch (error) {
        console.error("Error in tree analysis output:", error);
    }
}
