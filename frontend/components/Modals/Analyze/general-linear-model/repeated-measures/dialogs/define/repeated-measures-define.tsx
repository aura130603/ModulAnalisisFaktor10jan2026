import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {
    RepeatedMeasureDefineDefault
} from "@/components/Modals/Analyze/general-linear-model/repeated-measures/constants/repeated-measures-define-default";
import {useModal} from "@/hooks/useModal";
import {
    RepeatedMeasureDefineData,
    RepeatedMeasureDefineType,
    RepeatedMeasuresDefineContainerProps,
} from "@/components/Modals/Analyze/general-linear-model/repeated-measures/types/repeated-measure-define";
import {useEffect, useState} from "react";
import {RepeatedMeasureDefineDialog} from "./repeated-measures-dialog";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const RepeatedMeasuresDefineContainer = ({
    onClose,
}: RepeatedMeasuresDefineContainerProps) => {
    const [formData, setFormData] = useState<RepeatedMeasureDefineType>({
        ...RepeatedMeasureDefineDefault,
    });
    const [isDefineOpen, setIsDefineOpen] = useState(true);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("RepeatedMeasuresDefine");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...RepeatedMeasureDefineDefault });
                }
            } catch (error) {
                console.error("Failed to load form data:", error);
            }
        };

        loadFormData();
    }, []);

    const updateFormData = <T extends keyof typeof formData>(
        section: T,
        field: keyof (typeof formData)[T],
        value: unknown
    ) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
    };

    const executeRepeatedMeasuresDefine = async (
        mainData: RepeatedMeasureDefineData
    ) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("RepeatedMeasuresDefine", newFormData);
        } catch (error) {
            console.error("Failed to save form data:", error);
        }
    };

    const resetFormData = async () => {
        try {
            await clearFormData("RepeatedMeasuresDefine");
            setFormData({ ...RepeatedMeasureDefineDefault });
        } catch (error) {
            console.error("Failed to clear form data:", error);
        }
    };

    const handleClose = () => {
        closeModal();
        onClose();
    };

    return (
        <Dialog open={isDefineOpen} onOpenChange={handleClose}>
            <DialogTitle></DialogTitle>
            <DialogContent className="sm:max-w-sm">
                <RepeatedMeasureDefineDialog
                    isDefineOpen={isDefineOpen}
                    setIsDefineOpen={setIsDefineOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    onContinue={(mainData) =>
                        executeRepeatedMeasuresDefine(mainData)
                    }
                    onReset={resetFormData}
                />
            </DialogContent>
        </Dialog>
    );
};
