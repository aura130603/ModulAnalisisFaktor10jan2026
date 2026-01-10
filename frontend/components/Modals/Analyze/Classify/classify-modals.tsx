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

interface ClassifyModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const ClassifyModals: React.FC<ClassifyModalsProps> = ({
    modalType,
    onClose,
    props,
}) => {
    // These modal types don't exist in ModalType enum yet
    // Uncomment when these are added to the ModalType enum
    /*
    switch (modalType) {
        case ModalType.TwoStepCluster:
            return <TwoStepClusterContainer onClose={onClose} {...props} />;
        case ModalType.KMeansCluster:
            return <KMeansClusterContainer onClose={onClose} {...props} />;
        case ModalType.HierarchicalCluster:
            return <HierClusContainer onClose={onClose} {...props} />;
        case ModalType.Tree:
            return <TreeContainer onClose={onClose} {...props} />;
        case ModalType.Discriminant:
            return <DiscriminantContainer onClose={onClose} {...props} />;
        case ModalType.NearestNeighbor:
            return <KNNContainer onClose={onClose} {...props} />;
        case ModalType.ROCCurve:
            return <RocCurveContainer onClose={onClose} {...props} />;
        case ModalType.ROCAnalysis:
            return <RocAnalysisContainer onClose={onClose} {...props} />;
        default:
            return null;
    }
    */
    return null;
};

export const isClassifyModal = (type: ModalType): boolean => {
    // These modal types don't exist in ModalType enum yet
    // Return false until they are added
    return false;
    /*
    return [
        ModalType.TwoStepCluster,
        ModalType.KMeansCluster,
        ModalType.HierarchicalCluster,
        ModalType.Tree,
        ModalType.Discriminant,
        ModalType.NearestNeighbor,
        ModalType.ROCCurve,
        ModalType.ROCAnalysis,
    ].includes(type);
    */
};
