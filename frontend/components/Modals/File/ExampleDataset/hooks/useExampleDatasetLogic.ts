import { useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useMetaStore } from "@/stores/useMetaStore";
import { processSavFileFromUrl } from "@/components/Modals/File/ExampleDataset/services/services";
import type { UseExampleDatasetLogicProps, UseExampleDatasetLogicOutput } from "@/components/Modals/File/ExampleDataset/types";
import { processSavApiResponse } from "@/utils/savFileUtils";

export const useExampleDatasetLogic = ({
    onClose,
}: UseExampleDatasetLogicProps): UseExampleDatasetLogicOutput => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { overwriteAll } = useVariableStore();
    const { setData, resetData } = useDataStore();
    const { setMeta: setProjectMeta } = useMetaStore();

    const loadDataset = async (filePath: string) => {
        setIsLoading(true);
        setError(null);

        try {
            await resetData();
            const result = await processSavFileFromUrl(filePath);
            const { variables, dataMatrix, metaHeader } = processSavApiResponse(result);

            await overwriteAll(variables, dataMatrix);
            await setProjectMeta({
                name: filePath.split('/').pop() || 'Example Dataset',
                location: "local",
                created: metaHeader.created ? new Date(metaHeader.created) : new Date(),
            });

            onClose();
        } catch (err: any) {
            console.error("Error opening example dataset:", err);
            setError(err.message || "An unexpected error occurred while opening the file.");
        } finally {
            setIsLoading(false);
        }
    }

    return {
        isLoading,
        error,
        loadDataset,
    };
}; 