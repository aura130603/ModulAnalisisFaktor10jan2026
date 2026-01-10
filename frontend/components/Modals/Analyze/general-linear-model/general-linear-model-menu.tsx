"use client";

import React from "react";
import {
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
} from "@/components/ui/menubar";
import {ModalType, useModal} from "@/hooks/useModal";

const GeneralLinearModelMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarSub>
            <MenubarSubTrigger>General Linear Model</MenubarSubTrigger>
            <MenubarSubContent>
                <MenubarItem
                    onClick={() => openModal(ModalType.ModalUnivariate)}
                >
                    Univariate
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalMultivariate)}
                >
                    Multivariate
                </MenubarItem>
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalRepeatedMeasures)}
                >
                    Repeated Measures
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    disabled={true}
                    onClick={() => openModal(ModalType.ModalVarianceComponents)}
                >
                    Variance Components
                </MenubarItem>
            </MenubarSubContent>
        </MenubarSub>
    );
};

export default GeneralLinearModelMenu;
