// correspondence-analysis-output.ts
import {
    CorrespondenceFinalResultType
} from "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/types/correspondence-analysis-worker";
import {Table} from "@/types/Table";
import {useResultStore} from "@/stores/useResultStore";

export async function resultCorrespondence({
    formattedResult,
}: CorrespondenceFinalResultType) {
    try {
        const { addLog, addAnalytic, addStatistic } = useResultStore.getState();

        const findTable = (key: string) => {
            const foundTable = formattedResult.tables.find(
                (table: Table) => table.key === key
            );
            return foundTable ? JSON.stringify({ tables: [foundTable] }) : null;
        };

        const correspondenceResult = async () => {
            /*
             * 🎉 Title Result 🎉
             * */
            const titleMessage = "Correspondence Analysis";
            const logId = await addLog({ log: titleMessage });
            const analyticId = await addAnalytic(logId, {
                title: `Correspondence Analysis Result`,
                note: "",
            });

            /*
             * 📊 Correspondence Table 📊
             * */
            const correspondenceTable = findTable("correspondence_table");
            if (correspondenceTable) {
                const correspondenceTableId = await addAnalytic(logId, {
                    title: `Correspondence Table`,
                    note: "",
                });

                await addStatistic(correspondenceTableId, {
                    title: `Correspondence Table`,
                    description: `Correspondence Table`,
                    output_data: correspondenceTable,
                    components: `Correspondence Table`,
                });
            }

            /*
             * 📈 Row Profiles 📈
             * */
            const rowProfiles = findTable("row_profiles");
            if (rowProfiles) {
                const rowProfilesId = await addAnalytic(logId, {
                    title: `Row Profiles`,
                    note: "",
                });

                await addStatistic(rowProfilesId, {
                    title: `Row Profiles`,
                    description: `Row Profiles`,
                    output_data: rowProfiles,
                    components: `Row Profiles`,
                });
            }

            /*
             * 📊 Column Profiles 📊
             * */
            const columnProfiles = findTable("column_profiles");
            if (columnProfiles) {
                const columnProfilesId = await addAnalytic(logId, {
                    title: `Column Profiles`,
                    note: "",
                });

                await addStatistic(columnProfilesId, {
                    title: `Column Profiles`,
                    description: `Column Profiles`,
                    output_data: columnProfiles,
                    components: `Column Profiles`,
                });
            }

            /*
             * 📈 Summary 📈
             * */
            const summary = findTable("summary");
            if (summary) {
                const summaryId = await addAnalytic(logId, {
                    title: `Summary`,
                    note: "",
                });

                await addStatistic(summaryId, {
                    title: `Summary`,
                    description: `Summary of Correspondence Analysis`,
                    output_data: summary,
                    components: `Summary`,
                });
            }

            /*
             * 🎯 Row Points Analysis 🎯
             * */
            const rowPoints = findTable("row_points");
            if (rowPoints) {
                const rowPointsId = await addAnalytic(logId, {
                    title: `Row Points Analysis`,
                    note: "",
                });

                await addStatistic(rowPointsId, {
                    title: `Overview Row Points`,
                    description: `Overview of Row Points`,
                    output_data: rowPoints,
                    components: `Overview Row Points`,
                });
            }

            /*
             * 🎯 Column Points Analysis 🎯
             * */
            const columnPoints = findTable("column_points");
            if (columnPoints) {
                const columnPointsId = await addAnalytic(logId, {
                    title: `Column Points Analysis`,
                    note: "",
                });

                await addStatistic(columnPointsId, {
                    title: `Overview Column Points`,
                    description: `Overview of Column Points`,
                    output_data: columnPoints,
                    components: `Overview Column Points`,
                });
            }

            /*
             * 📝 Confidence Row Points 📝
             * */
            const confidenceRowPoints = findTable("confidence_row_points");
            if (confidenceRowPoints) {
                const confidenceRowPointsId = await addAnalytic(logId, {
                    title: `Confidence Row Points`,
                    note: "",
                });

                await addStatistic(confidenceRowPointsId, {
                    title: `Confidence Row Points`,
                    description: `Confidence Statistics for Row Points`,
                    output_data: confidenceRowPoints,
                    components: `Confidence Row Points`,
                });
            }

            /*
             * 📝 Confidence Column Points 📝
             * */
            const confidenceColumnPoints = findTable(
                "confidence_column_points"
            );
            if (confidenceColumnPoints) {
                const confidenceColumnPointsId = await addAnalytic(logId, {
                    title: `Confidence Column Points`,
                    note: "",
                });

                await addStatistic(confidenceColumnPointsId, {
                    title: `Confidence Column Points`,
                    description: `Confidence Statistics for Column Points`,
                    output_data: confidenceColumnPoints,
                    components: `Confidence Column Points`,
                });
            }
        };

        await correspondenceResult();
    } catch (e) {
        console.error(e);
    }
}
