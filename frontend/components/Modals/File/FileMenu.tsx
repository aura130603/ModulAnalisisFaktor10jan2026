// components/Layout/Main/FileMenu.tsx
"use client";

import React from "react";
import {
    MenubarMenu,
    MenubarTrigger,
    MenubarContent,
    MenubarItem,
    MenubarSeparator,
    MenubarSub,
    MenubarSubTrigger,
    MenubarSubContent,
} from "@/components/ui/menubar";
import { useFileMenuActions } from "./Actions/useFileMenuActions";
import { ModalType, useModal } from "@/hooks/useModal";

const FileMenu: React.FC = () => {
    const { openModal } = useModal();
    const { handleAction } = useFileMenuActions();

    return (
        <MenubarMenu data-testid="file-menu">
            <MenubarTrigger data-testid="file-menu-trigger">File</MenubarTrigger>
            <MenubarContent data-testid="file-menu-content">
                <MenubarItem onClick={() => handleAction({ actionType: "New" })} data-testid="file-menu-new">
                    New
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "Save" })} data-testid="file-menu-save">
                    Save
                </MenubarItem>
                <MenubarItem onClick={() => handleAction({ actionType: "SaveAs" })} data-testid="file-menu-save-as">
                    Save As
                </MenubarItem>
                <MenubarSub data-testid="file-menu-open-section">
                    <MenubarItem onClick={() => openModal(ModalType.OpenData)} data-testid="file-menu-open-sav">
                        Open SAV
                    </MenubarItem>
                    <MenubarItem onClick={() => openModal(ModalType.ExampleDataset)} data-testid="file-menu-example-data">
                        Example Data
                    </MenubarItem>
                </MenubarSub>
                <MenubarSub data-testid="file-menu-import-section">
                    <MenubarSubTrigger data-testid="file-menu-import-trigger">Import Data</MenubarSubTrigger>
                    <MenubarSubContent data-testid="file-menu-import-content">
                        <MenubarItem onClick={() => openModal(ModalType.ImportExcel)} data-testid="file-menu-import-excel">
                            Excel
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ImportCSV)} data-testid="file-menu-import-csv">
                            CSV Data
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ImportClipboard)} data-testid="file-menu-import-clipboard">
                            From Clipboard
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarSub data-testid="file-menu-export-section">
                    <MenubarSubTrigger data-testid="file-menu-export-trigger">Export</MenubarSubTrigger>
                    <MenubarSubContent data-testid="file-menu-export-content">
                        <MenubarItem onClick={() => openModal(ModalType.ExportExcel)} data-testid="file-menu-export-excel">
                            Excel
                        </MenubarItem>
                        <MenubarItem onClick={() => openModal(ModalType.ExportCSV)} data-testid="file-menu-export-csv">
                            CSV Data
                        </MenubarItem>
                    </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem onClick={() => openModal(ModalType.Print)} data-testid="file-menu-print">
                    Print...
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => handleAction({ actionType: "Exit" })} data-testid="file-menu-exit">
                    Exit
                </MenubarItem>
            </MenubarContent>
        </MenubarMenu>
    );
};

export default FileMenu;