"use client";

import React, { useState } from 'react';
import { useEditMenuActions } from "@/components/Modals/Edit/Actions/useEditMenuActions";
import { FindReplaceMode } from "@/components/Modals/Edit/FindReplace/types";
import { GoToMode } from "@/components/Modals/Edit/GoTo/types";
import {
    FolderOpen,
    Save,
    Printer,
    Undo,
    Redo,
    Locate,
    Variable,
    Search,
    ArrowRightLeft,
    Columns,
} from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useFileMenuActions } from '@/components/Modals/File/Actions/useFileMenuActions';
import { ModalType, useModal } from '@/hooks/useModal';
// import { ModeToggle } from "@/components/mode-toggle";
import { useTableRefStore } from '@/stores/useTableRefStore';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useVariableStore } from '@/stores/useVariableStore';
import { useDataStore } from '@/stores/useDataStore';
import { toast } from "sonner";

export default function Toolbar() {
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const pathname = usePathname();
    const { handleAction: handleFileAction } = useFileMenuActions();
    const { handleAction: handleEditAction } = useEditMenuActions();
    const { openModal } = useModal();
    const { viewMode, toggleViewMode, dataTableRef, resetColumnSizingCache } = useTableRefStore();
    const variables = useVariableStore(state => state.variables);
    const updateMultipleVariables = useVariableStore(state => state.updateMultipleVariables);
    const data = useDataStore(state => state.data);

    const isDataPage = pathname === '/dashboard/data';

    // Auto-width column function
    const handleAutoWidth = useCallback(async () => {
        if (!dataTableRef?.current || !data || data.length === 0) {
            toast.error("Error: Tidak ada data untuk mengatur lebar kolom otomatis.");
            return;
        }

        try {
            // Reset cache untuk memastikan semua kolom dapat diperbarui
            if (resetColumnSizingCache) {
                resetColumnSizingCache();
            }
            const updates = [];

            // Calculate optimal width for ALL variables (termasuk yang sudah diubah manual)
            for (const variable of variables) {
                const columnIndex = variable.columnIndex;
                
                // Sample data untuk perhitungan (maksimal 100 rows untuk performa)
                const sampleSize = Math.min(data.length, 100);
                const sampleData = data.slice(0, sampleSize);
                
                let maxWidth = 80; // Default minimum width
                
                // Check header width
                if (variable.name) {
                    const headerWidth = variable.name.length * 8 + 40;
                    maxWidth = Math.max(maxWidth, headerWidth);
                }
                
                // Check content width dari sample data
                for (const row of sampleData) {
                    const cellValue = row[columnIndex];
                    if (cellValue !== null && cellValue !== undefined) {
                        const contentWidth = String(cellValue).length * 8 + 20;
                        maxWidth = Math.max(maxWidth, contentWidth);
                    }
                }
                
                // Batasi width maksimal untuk mencegah kolom terlalu lebar
                const optimalWidth = Math.min(maxWidth, 300);
                
                // Selalu update semua kolom, tidak peduli apakah sudah diubah manual
                updates.push({
                    identifier: variable.columnIndex,
                    changes: { columns: optimalWidth }
                });
            }

            if (updates.length > 0) {
                 await updateMultipleVariables(updates);
                 
                 toast.success(`Berhasil: Lebar ${updates.length} kolom telah disesuaikan otomatis.`);
             }
        } catch (error) {
            console.error('Error auto-sizing columns:', error);
            toast.error("Error: Gagal mengatur lebar kolom otomatis.");
        }
     }, [dataTableRef, data, variables, updateMultipleVariables, resetColumnSizingCache]);

    const fileTools = [
        { name: 'Open Data', icon: <FolderOpen size={16} />, onClick: () => openModal(ModalType.OpenData) },
        { name: 'Save Document', icon: <Save size={16} />, onClick: () => handleFileAction({ actionType: 'Save' }) },
        { name: 'Print', icon: <Printer size={16} />, onClick: () => openModal(ModalType.Print) },
        { name: 'Undo', icon: <Undo size={16} />, onClick: () => handleEditAction("Undo") },
        { name: 'Redo', icon: <Redo size={16} />, onClick: () => handleEditAction("Redo") },
    ];

    const dataTools = [
        { name: 'Locate', icon: <Locate size={16} />, onClick: () => openModal(ModalType.GoTo, { initialMode: GoToMode.CASE }) },
        { name: 'Variable', icon: <Variable size={16} />, onClick: () => openModal(ModalType.DefineVarProps) },
        { name: 'Search', icon: <Search size={16} />, onClick: () => openModal(ModalType.FindAndReplace, { initialTab: FindReplaceMode.FIND }) },
        { name: 'Auto Width', icon: <Columns size={16} />, onClick: handleAutoWidth },
        { name: 'Toggle View', icon: <ArrowRightLeft size={16} />, onClick: toggleViewMode },
    ];

    const ToolGroup = ({ tools }: { tools: { name: string; icon: React.ReactNode; onClick?: () => void }[] }) => (
        <div className="flex">
            {tools.map((tool) => {
                const isActive = tool.name === 'Toggle View' && viewMode === 'label' && isDataPage;

                return (
                    <TooltipProvider key={tool.name} delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className={`flex items-center justify-center h-8 w-8 text-muted-foreground hover:bg-accent transition-colors ${
                                        hoveredTool === tool.name || isActive ? 'bg-accent' : ''
                                    }`}
                                    onMouseEnter={() => setHoveredTool(tool.name)}
                                    onMouseLeave={() => setHoveredTool(null)}
                                    aria-label={tool.name}
                                    onClick={tool.onClick}
                                >
                                    {tool.icon}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="text-xs py-1 px-2">
                                {tool.name}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}
        </div>
    );

    return (
        <div className="bg-background px-4 py-1 border-b border-border flex justify-between items-center overflow-hidden shadow-md" data-tour="data-toolbar">
            {/* Always allow horizontal scroll on small screens, but keep normal on medium+ */}
            <div className="flex w-full overflow-x-auto md:overflow-visible">
                <div className="flex space-x-2 min-w-max">
                    <ToolGroup tools={fileTools} />
                    <Separator orientation="vertical" className="h-6 my-auto" />
                    <ToolGroup tools={dataTools} />
                </div>
            </div>
            {/* <ModeToggle /> */}
        </div>
    );
}