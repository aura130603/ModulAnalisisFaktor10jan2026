// components/Layout/Main/EditMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
} from "@/components/ui/menubar";
import { useModal } from "@/hooks/useModal";
import { ModalType } from "@/types/modalTypes";
import { FindReplaceMode } from "@/components/Modals/Edit/FindReplace/types";
import { GoToMode } from "@/components/Modals/Edit/GoTo/types";
import { useEditMenuActions } from "./Actions/useEditMenuActions";

const EditMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useEditMenuActions();

    return (
        <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
                {/* <MenubarItem onClick={() => handleAction("Undo")}>
                    Undo
                </MenubarItem>
                <MenubarItem onClick={() => handleAction("Redo")}>
                    Redo
                </MenubarItem>
                <MenubarSeparator /> */}
                <MenubarItem onClick={() => handleAction("Cut")}>
                    Cut
                </MenubarItem>
                <MenubarItem onClick={() => handleAction("Copy")}>
                    Copy
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction("CopyWithVariableNames")
                    }
                >
                    Copy with Variable Names
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction("CopyWithVariableLabels")
                    }
                >
                    Copy with Variable Labels
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction("Paste")}
                >
                    Paste
                </MenubarItem>
                <MenubarItem
                    onClick={() => handleAction("PasteVariables")}
                >
                    Paste Variables
                </MenubarItem>
                <MenubarItem
                    onClick={() =>
                        handleAction("PasteWithVariableNames")
                    }
                >
                    Paste with Variable Names
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction("Clear")}
                >
                    Clear
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem
                    onClick={() => handleAction("InsertVariable")}
                >
                    Insert Variable
                </MenubarItem>
                <MenubarItem
                    onClick={() => handleAction("InsertCases")}
                >
                    Insert Cases
                </MenubarItem>
                <MenubarSeparator />
                {/*<MenubarItem>Search Data Files</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.FindAndReplace, { initialTab: FindReplaceMode.FIND })}>
                    Find
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.FindAndReplace, { initialTab: FindReplaceMode.REPLACE })}>
                    Replace
                </MenubarItem>
                {/*<MenubarItem>Find Next</MenubarItem>*/}
                <MenubarItem onClick={() => openModal(ModalType.GoTo, { initialMode: GoToMode.CASE })}>
                    Go to Case
                </MenubarItem>
                <MenubarItem onClick={() => openModal(ModalType.GoTo, { initialMode: GoToMode.VARIABLE })}>
                    Go to Variable
                </MenubarItem>
                {/*<MenubarItem>Go to Imputation...</MenubarItem>*/}
                {/*<MenubarSeparator />*/}
                {/*<MenubarItem>Options...</MenubarItem>*/}
            </MenubarContent>
        </MenubarMenu>
    );
};

export default EditMenu;