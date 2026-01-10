"use client"
import React, { FC } from "react";
import { ModalType } from "@/hooks/useModal";
import ChiSquare from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/ChiSquare";
import Runs from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/Runs";
import TwoIndependentSamples from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/TwoIndependentSamples";
import KIndependentSamples from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/KIndependentSamples";
import TwoRelatedSamples from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/TwoRelatedSamples";
import KRelatedSamples from "@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/KRelatedSamples";
export const modalStyles = {
    dialogContent: "bg-white p-0 shadow-[0px_4px_12px_rgba(0,0,0,0.08)]",
    dialogHeader: "bg-[#F7F7F7] px-6 py-5 border-b border-[#E6E6E6] h-16",
    dialogBody: "px-6 py-6",
    dialogFooter: "bg-[#F7F7F7] px-6 py-5 border-t border-[#E6E6E6] h-16",
    dialogTitle: "text-lg font-semibold text-black",
    dialogDescription: "text-sm text-[#888888]",
    primaryButton: "bg-black text-white hover:opacity-90 h-8",
    secondaryButton: "border-[#CCCCCC] text-black hover:bg-[#F7F7F7] h-8",
    formGroup: "space-y-2 mb-6",
    label: "text-[#444444] text-xs font-medium",
    input: "h-10 border-[#CCCCCC] focus:border-black"
};

interface LegacyDialogsModalProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const LegacyDialogsModal: FC<LegacyDialogsModalProps> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        // case ModalType.ChiSquare:
        //     return <ChiSquare onClose={onClose} {...props} />;
        // case ModalType.Runs:
        //     return <Runs onClose={onClose} {...props} />;
        // case ModalType.TwoIndependentSamples:
        //     return <TwoIndependentSamples onClose={onClose} {...props} />;
        // case ModalType.KIndependentSamples:
        //     return <KIndependentSamples onClose={onClose} {...props} />;
        // case ModalType.TwoRelatedSamples:
        //     return <TwoRelatedSamples onClose={onClose} {...props} />;
        // case ModalType.KRelatedSamples:
        //     return <KRelatedSamples onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isLegacyDialogsModal = (type: ModalType): boolean => {
    return false; // Always return false as all modals are disabled
    // return [
    //     // ModalType.ChiSquare,
    //     // ModalType.Runs,
    //     // ModalType.TwoIndependentSamples,
    //     // ModalType.KIndependentSamples,
    //     // ModalType.TwoRelatedSamples,
    //     // ModalType.KRelatedSamples
    // ].includes(type);
};