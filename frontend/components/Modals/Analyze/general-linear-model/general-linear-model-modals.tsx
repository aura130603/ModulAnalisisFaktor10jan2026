"use client";

import React from "react";
import {ModalType} from "@/hooks/useModal";

interface GeneralLinearModelModalsProps {
    modalType: ModalType;
    onClose: () => void;
    props?: any;
}

export const GeneralLinearModelModals: React.FC<
    GeneralLinearModelModalsProps
> = ({ modalType, onClose, props }) => {
    switch (modalType) {
        // case ModalType.Univariate:
        //     return <UnivariateContainer onClose={onClose} {...props} />;
        // case ModalType.Multivariate:
        //     return <MultivariateContainer onClose={onClose} {...props} />;
        // case ModalType.RepeatedMeasures:
        //     return (
        //         <RepeatedMeasuresDefineContainer onClose={onClose} {...props} />
        //     );
        // case ModalType.RepeatedMeasuresDialog:
        //     return <RepeatedMeasuresContainer onClose={onClose} {...props} />;
        // case ModalType.VarianceComponents:
        //     return <VarianceCompsContainer onClose={onClose} {...props} />;
        default:
            return null;
    }
};

export const isGeneralLinearModelModal = (type: ModalType): boolean => {
    return false; // Always return false as all modals are disabled
    // return [
    //     // ModalType.Univariate,
    //     // ModalType.Multivariate,
    //     // ModalType.RepeatedMeasures,
    //     // ModalType.RepeatedMeasuresDialog,
    //     // ModalType.VarianceComponents,
    // ].includes(type);
};
