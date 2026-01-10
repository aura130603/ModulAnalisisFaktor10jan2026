// components/Modals/Data/DataMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { ModalType } from "@/types/modalTypes";
import { useModal } from "@/hooks/useModal";

/**
 * DataMenu - Menu component for Data operations
 * 
 * Provides menu items for accessing the various data-related modal operations
 * such as variable configuration, case operations, and data structure operations.
 */
const DataMenu: React.FC = () => {
    const { openModal } = useModal();

    return (
        <MenubarMenu>
            <MenubarTrigger data-testid="data-menu-trigger">Data</MenubarTrigger>
            <MenubarContent>
                <MenubarItem
                    onClick={() => openModal(ModalType.DefineVarProps)}
                    data-testid="data-menu-define-variable-properties"
                >
                    Define Variable Properties
                </MenubarItem>
                <MenubarItem
                    onClick={() => openModal(ModalType.SetMeasurementLevel)}
                    data-testid="data-menu-set-measurement-level"
                >
                    Set Measurement Level
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.DefineDateTime)} data-testid="data-menu-define-date-time">
                    Define Date and Time
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem onClick={() => openModal(ModalType.Validate)}>*/}
                {/*    Validation...*/}
                {/*</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.DuplicateCases)} data-testid="data-menu-duplicate-cases">
                    Identify Duplicate Cases
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.SortCases)} data-testid="data-menu-sort-cases">
                    Sort Cases
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.SortVars)} data-testid="data-menu-sort-variables">
                    Sort Variables
                </MenubarItem>                <MenubarItem onClick={() => openModal(ModalType.Transpose)} data-testid="data-menu-transpose">
                    Transpose
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Restructure)} data-testid="data-menu-restructure">
                    Restructure
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.Aggregate)} data-testid="data-menu-aggregate">
                    Aggregate
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.SelectCases)} data-testid="data-menu-select-cases">
                    Select Cases
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.WeightCases)} data-testid="data-menu-weight-cases">
                    Weight Cases
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default DataMenu;