"use client";

import React from "react";
import {ModalType} from "@/hooks/useModal";

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
    input: "h-10 border-[#CCCCCC] focus:border-black",
};

interface DimensionReductionModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const DimensionReductionModals: React.FC<
    DimensionReductionModalsProps
> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        // case ModalType.Factor:
        //     return <FactorContainer onClose={onClose} {...props} />;
        // case ModalType.CorrespondenceAnalysis:
        //     return <CorrespondenceContainer onClose={onClose} {...props} />;
        // case ModalType.OptimalScaling:
        //     return <OptScaContainer onClose={onClose} {...props} />;
        // case ModalType.OptimalScalingCATPCA:
        //     return <OptScaCatpcaContainer onClose={onClose} {...props} />;
        // case ModalType.OptimalScalingMCA:
        //     return <OptScaMCAContainer onClose={onClose} {...props} />;
        // case ModalType.OptimalScalingOVERALS:
        //     return <OptScaOveralsContainer onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isDimensionReductionModal = (type: ModalType): boolean => {
    return false; // Always return false as all modals are disabled
    // return [
    //     // ModalType.Factor,
    //     // ModalType.CorrespondenceAnalysis,
    //     // ModalType.OptimalScaling,
    //     // ModalType.OptimalScalingCATPCA,
    //     // ModalType.OptimalScalingMCA,
    //     // ModalType.OptimalScalingOVERALS,
    // ].includes(type);
};
