import {OptScaInitial} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/optimal-scaling-dialog";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog";
import {
    OptScaDefineDefault
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/constants/optimal-scaling-define-default";
import {useModal} from "@/hooks/useModal";
import {
    OptScaContainerProps,
    OptScaDefineMainType,
    OptScaDefineType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/types/optimal-scaling-define";
import {useEffect, useState} from "react";
import {clearFormData, getFormData, saveFormData} from "@/hooks/useIndexedDB";

export const OptScaContainer = ({ onClose }: OptScaContainerProps) => {
    const [formData, setFormData] = useState<OptScaDefineType>({
        ...OptScaDefineDefault,
    });
    const [isDefineOpen, setIsDefineOpen] = useState(true);

    const { closeModal } = useModal();

    useEffect(() => {
        const loadFormData = async () => {
            try {
                const savedData = await getFormData("OptimalScaling");
                if (savedData) {
                    const { id, ...formDataWithoutId } = savedData;
                    setFormData(formDataWithoutId);
                } else {
                    setFormData({ ...OptScaDefineDefault });
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

    const executeOptScaDefine = async (mainData: OptScaDefineMainType) => {
        try {
            const newFormData = {
                ...formData,
                main: mainData,
            };

            await saveFormData("OptimalScaling", newFormData);
        } catch (error) {
            console.error("Failed to save form data:", error);
        }
    };

    const resetFormData = async () => {
        try {
            await clearFormData("OptimalScaling");
            setFormData({ ...OptScaDefineDefault });
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
                <OptScaInitial
                    isDefineOpen={isDefineOpen}
                    setIsDefineOpen={setIsDefineOpen}
                    updateFormData={(field, value) =>
                        updateFormData("main", field, value)
                    }
                    data={formData.main}
                    onContinue={(mainData) => executeOptScaDefine(mainData)}
                    onReset={resetFormData}
                />
            </DialogContent>
        </Dialog>
    );
};
