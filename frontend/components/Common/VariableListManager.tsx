import type { FC} from 'react';
import React, { useState, useCallback, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getVariableIcon as defaultGetVariableIcon } from './iconHelper';
import { InfoIcon, GripVertical, MoveHorizontal, ArrowBigDown, ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import type { Variable } from "@/types/Variable";
import { useMobile } from "@/hooks/useMobile";

// Define the structure for configuring target lists
export interface TargetListConfig {
    id: string;               // Unique identifier for the list (e.g., 'selected', 'rows', 'factors')
    title: string;            // Display title for the list
    variables: Variable[];    // The array of variables currently in this list
    height: string;           // CSS height for the list container
    maxItems?: number;        // Optional limit for the number of items
    droppable?: boolean;      // Whether items can be dropped into this list (defaults to true)
    draggableItems?: boolean; // Whether items *within* this list can be dragged (defaults to true)
    
    // Optional filtering rules for variable type and measurement scale
    allowedTypes?: string[];           // Array of allowed variable types (e.g., ['numeric', 'string', 'date'])
    allowedMeasurements?: string[];    // Array of allowed measurement levels (e.g., ['nominal', 'ordinal', 'scale', 'unknown'])
}

// Props for the reusable component
interface VariableListManagerProps {
    // Core data props
    availableVariables: Variable[];
    targetLists: TargetListConfig[];
    variableIdKey: keyof Variable; // Key to use for unique identification ('tempId' or 'columnIndex')
    
    // Selection state
    highlightedVariable: { id: string, source: string } | null;
    setHighlightedVariable: (value: { id: string, source: string } | null) => void;
    
    // Event handlers
    onMoveVariable: (variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => void;
    onReorderVariable: (listId: string, variables: Variable[]) => void;
    onVariableDoubleClick?: (variable: Variable, sourceListId: string) => void;
    
    // Display customization
    getVariableIcon?: (variable: Variable) => React.ReactNode;
    getDisplayName?: (variable: Variable) => string;
    isVariableDisabled?: (variable: Variable) => boolean;
    showArrowButtons?: boolean;
    availableListHeight?: string;
    
    // Custom content rendering
    renderListFooter?: (listId: string) => React.ReactNode;
    renderExtraInfoContent?: () => React.ReactNode;
    renderRightColumnFooter?: () => React.ReactNode;
}



// Helper function to get display name (default implementation)
const defaultGetDisplayName = (variable: Variable): string => {
    if (variable.label) {
        return `${variable.label} [${variable.name}]`;
    }
    return variable.name;
};

const VariableListManager: FC<VariableListManagerProps> = ({
    // Core data props
    availableVariables,
    targetLists,
    variableIdKey,
    
    // Selection state
    highlightedVariable,
    setHighlightedVariable,
    
    // Event handlers
    onMoveVariable,
    onReorderVariable,
    onVariableDoubleClick,
    
    // Display customization (with defaults)
    getVariableIcon = defaultGetVariableIcon,
    getDisplayName = defaultGetDisplayName,
    isVariableDisabled,
    showArrowButtons = true,
    availableListHeight = '300px',
    
    // Custom content rendering
    renderListFooter,
    renderExtraInfoContent,
    renderRightColumnFooter,
}) => {
    // State for drag and drop operations
    const [draggedItem, setDraggedItem] = useState<{ variable: Variable, sourceListId: string } | null>(null);
    const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    // Use the mobile hook to detect mobile devices and orientation
    const { isMobile, isPortrait } = useMobile();

    // Helper function to check if a variable matches filtering criteria
    const isVariableAllowedInList = useCallback((variable: Variable, listConfig: TargetListConfig): boolean => {
        // Check type filtering
        if (listConfig.allowedTypes && listConfig.allowedTypes.length > 0) {
            const variableType = variable.type?.toLowerCase();
            if (!variableType || !listConfig.allowedTypes.some(type => type.toLowerCase() === variableType)) {
                return false;
            }
        }

        // Check measurement scale filtering
        if (listConfig.allowedMeasurements && listConfig.allowedMeasurements.length > 0) {
            const variableMeasurement = variable.measure?.toLowerCase();
            if (!variableMeasurement || !listConfig.allowedMeasurements.some(measure => measure.toLowerCase() === variableMeasurement)) {
                return false;
            }
        }

        return true;
    }, []);

    // Combine available variables and target lists for unified handling
    const allLists = useMemo(() => [
        { id: 'available', title: 'Available Variables', variables: availableVariables, height: availableListHeight },
        ...targetLists
    ], [availableVariables, targetLists, availableListHeight]);

    // --- Drag and Drop Handlers ---
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, variable: Variable, sourceListId: string) => {
        const varId = variable[variableIdKey];
        if (varId === undefined || varId === null) {
            console.error("Variable is missing the unique key:", variableIdKey);
            e.preventDefault();
            return;
        }
        
        e.dataTransfer.setData('application/json', JSON.stringify({
            variableId: varId,
            sourceListId
        }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedItem({ variable, sourceListId });
        setHighlightedVariable(null); // Clear highlight on drag start
    }, [variableIdKey, setHighlightedVariable]);

    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
        setIsDraggingOver(null);
        setDragOverIndex(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string) => {
        e.preventDefault();
        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false; // Default true

        // Check if the dragged variable is allowed in the target list
        let isAllowed = true;
        if (draggedItem && targetListConfig && targetListId !== 'available') {
            isAllowed = isVariableAllowedInList(draggedItem.variable, targetListConfig as TargetListConfig);
        }

        // Prevent dropping into non-droppable lists, lists that are full, or when variable is not allowed
        if (!targetDroppable || !isAllowed || (targetListConfig?.maxItems && 
            targetListConfig.variables.length >= targetListConfig.maxItems && 
            draggedItem?.sourceListId !== targetListId)) {
            e.dataTransfer.dropEffect = 'none';
            setIsDraggingOver(null); // Ensure visual feedback matches drop effect
        } else {
            e.dataTransfer.dropEffect = 'move';
            setIsDraggingOver(targetListId);
            
            // If dragging to a different list, clear the index indicator
            if (draggedItem && draggedItem.sourceListId !== targetListId && dragOverIndex !== null) {
                setDragOverIndex(null);
            }
        }
    }, [draggedItem, dragOverIndex, allLists, isVariableAllowedInList]);

    const handleItemDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, targetIndex: number, listId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const listConfig = allLists.find(l => l.id === listId);
        const itemsDraggable = (listConfig as TargetListConfig)?.draggableItems !== false; // Default true

        if (draggedItem && draggedItem.sourceListId === listId && itemsDraggable) {
            // Dragging within the same list for reordering
            e.dataTransfer.dropEffect = 'move';
            setDragOverIndex(targetIndex);
        } else if (!draggedItem || draggedItem.sourceListId !== listId) {
            // Dropping from another list - don't show item-level drop indicator
            if (dragOverIndex !== null) {
                setDragOverIndex(null);
            }
            
            // Ensure the general drop effect is still 'move' if the list is droppable
            const targetListConfig = allLists.find(l => l.id === listId);
            const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;
            e.dataTransfer.dropEffect = targetDroppable ? 'move' : 'none';
        } else {
            e.dataTransfer.dropEffect = 'none'; // Cannot reorder if draggableItems is false
        }
    }, [draggedItem, dragOverIndex, allLists]);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        // Check if the mouse is actually leaving the container
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDraggingOver(null);
            setDragOverIndex(null);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, targetListId: string, targetIndex?: number) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent drop from bubbling to parent container
        
        const targetListConfig = allLists.find(l => l.id === targetListId);
        const targetDroppable = (targetListConfig as TargetListConfig)?.droppable !== false;

        // Allow drop onto 'available' even if not explicitly 'droppable' in config
        if (!targetDroppable && targetListId !== 'available') {
            handleDragEnd(); // Clean up state even if drop is invalid
            return;
        }

        try {
            const dataString = e.dataTransfer.getData('application/json');
            if (!dataString) throw new Error("No drag data found");

            const { variableId, sourceListId } = JSON.parse(dataString);
            if (!variableId || !sourceListId) throw new Error("Invalid drag data structure");

            const sourceList = allLists.find(l => l.id === sourceListId)?.variables;
            if (!sourceList) throw new Error(`Source list ${sourceListId} not found`);

            const variableToMove = sourceList.find(v => v[variableIdKey] === variableId);
            if (!variableToMove) throw new Error(`Variable with ID ${variableId} not found in source list ${sourceListId}`);

            // Check if variable is allowed in target list (for non-available lists)
            if (targetListId !== 'available' && targetListConfig) {
                const isAllowed = isVariableAllowedInList(variableToMove, targetListConfig as TargetListConfig);
                if (!isAllowed) {
                    handleDragEnd();
                    return;
                }
            }

            // --- Handle single-item list overwrite logic ---
            const isReplacingSingleItem = sourceListId !== targetListId &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // Check max items constraint (prevent drop only if exceeding maxItems AND not replacing single item)
            if (sourceListId !== targetListId &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem) {
                handleDragEnd();
                return;
            }

            // Perform overwrite if needed (move existing variable back to available first)
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                onMoveVariable(existingVariable, targetListId, 'available');
            }

            // --- Handle move or reorder operations ---
            if (sourceListId === targetListId) {
                // Reordering within the same list
                const listConfig = allLists.find(l => l.id === targetListId) as TargetListConfig | undefined;
                const itemsDraggable = listConfig?.draggableItems !== false;

                if (!itemsDraggable) {
                    handleDragEnd();
                    return;
                }

                if (typeof targetIndex === 'number') {
                    const currentList = [...sourceList];
                    const sourceIndex = currentList.findIndex(v => v[variableIdKey] === variableId);

                    if (sourceIndex === -1) throw new Error("Dragged item not found in list for reorder");
                    if (sourceIndex === targetIndex) {
                        handleDragEnd();
                        return;
                    }

                    const [movedVariable] = currentList.splice(sourceIndex, 1);
                    // Adjust target index based on movement direction
                    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
                    currentList.splice(adjustedTargetIndex, 0, movedVariable);

                    onReorderVariable(targetListId, currentList);
                }
            } else {
                // Moving between different lists
                onMoveVariable(variableToMove, sourceListId, targetListId, targetIndex);
            }
        } catch (error) {
            console.error('[VariableListManager handleDrop] Error:', error);
        } finally {
            handleDragEnd(); // Always reset drag state
        }
    }, [allLists, variableIdKey, onReorderVariable, onMoveVariable, handleDragEnd, isVariableAllowedInList]);

    // --- Selection and Double Click Handlers ---
    const handleVariableSelect = useCallback((variable: Variable, sourceListId: string) => {
        const varId = variable[variableIdKey]?.toString();
        if (varId === undefined || varId === null) return;
        
        // Toggle selection if already selected
        if (highlightedVariable?.id === varId && highlightedVariable.source === sourceListId) {
            setHighlightedVariable(null);
        } else {
            setHighlightedVariable({ id: varId, source: sourceListId });
        }
    }, [highlightedVariable, setHighlightedVariable, variableIdKey]);

    const handleVariableDoubleClick = useCallback((variable: Variable, sourceListId: string) => {
        // Use custom handler if provided
        if (onVariableDoubleClick) {
            onVariableDoubleClick(variable, sourceListId);
            return;
        }
        
        // Default double-click behavior: move between available and first target list
        const targetListId = sourceListId === 'available'
            ? targetLists.find(l => {
                if (l.droppable === false) return false;
                if (l.maxItems && l.variables.length >= l.maxItems && l.maxItems !== 1) return false;
                
                // Check if variable is allowed in this target list
                return isVariableAllowedInList(variable, l);
            })?.id
            : 'available';

        if (targetListId) {
            const targetListConfig = allLists.find(l => l.id === targetListId);
            const isReplacingSingleItem = targetListId !== 'available' &&
                targetListConfig?.maxItems === 1 &&
                targetListConfig.variables.length === 1;

            // Check max items constraint
            if (targetListId !== 'available' &&
                targetListConfig?.maxItems &&
                targetListConfig.variables.length >= targetListConfig.maxItems &&
                !isReplacingSingleItem) {
                return;
            }

            // Perform overwrite if needed
            if (isReplacingSingleItem && targetListConfig) {
                const existingVariable = targetListConfig.variables[0];
                onMoveVariable(existingVariable, sourceListId, targetListId);
            }

            // Move the double-clicked variable
            onMoveVariable(variable, sourceListId, targetListId);
        }
    }, [targetLists, onMoveVariable, allLists, onVariableDoubleClick, isVariableAllowedInList]);

    // --- Arrow Button Rendering (centralized) ---
    const renderCentralArrowButton = () => {
        if (!showArrowButtons || !highlightedVariable) return null;

        const sourceListId = highlightedVariable.source;
        const isFromAvailable = sourceListId === 'available';

        // Helper to get selected variable object
        const getSelectedVariable = () => {
            const sourceList = allLists.find(l => l.id === sourceListId);
            return sourceList?.variables.find(v => String(v[variableIdKey]) === highlightedVariable.id);
        };

        // ---------------------------
        // Case 1: Variable selected from "available" list – may move to ANY valid target list
        // ---------------------------
        if (isFromAvailable) {
            // Collect all candidate target lists that can accept another variable and allow the variable
            const candidateTargets = targetLists.filter(t => {
                if (t.droppable === false) return false;
                if (t.maxItems && t.variables.length >= t.maxItems && t.maxItems !== 1) return false;
                
                const variableToMove = getSelectedVariable();
                if (!variableToMove) return false;
                
                // Check if variable is allowed in this target list
                return isVariableAllowedInList(variableToMove, t);
            });

            if (candidateTargets.length === 0) return null; // No place to move

            const variableToMove = getSelectedVariable();
            if (!variableToMove) return null;

            return (
                <div className="flex flex-col items-center space-y-2">
                    {candidateTargets.map(target => (
                        <button
                            key={target.id}
                            id={`move-to-${target.id}-button`}
                            data-testid={`central-move-button-${target.id}`}
                            aria-label={`Move variable to ${target.title}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                // If the target is a single-item list already containing a variable, move that variable back first
                                if (target.maxItems === 1 && target.variables.length === 1) {
                                    const existingVariable = target.variables[0];
                                    onMoveVariable(existingVariable, target.id, 'available');
                                }
                                onMoveVariable(variableToMove, 'available', target.id);
                            }}
                            className="flex-shrink-0 flex items-center justify-center p-0.5 w-6 h-6 rounded-full border border-border bg-accent/50 hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                        >
                            <ArrowBigRight size={16} className="text-foreground" />
                        </button>
                    ))}
                </div>
            );
        }

        // ---------------------------
        // Case 2: Variable selected from a target list – only one button to move back to Available
        // ---------------------------
        const sourceListConfig = targetLists.find(l => l.id === sourceListId);
        if (sourceListConfig?.draggableItems === false) return null; // Can't move from a non-draggable list

        const variableToMove = getSelectedVariable();
        if (!variableToMove) return null;

        return (
            <button
                id={`move-back-to-available-button`}
                data-testid={`central-move-button-back-to-available`}
                aria-label={`Move variable back to Available`}
                onClick={(e) => {
                    e.stopPropagation();
                    onMoveVariable(variableToMove, sourceListId, 'available');
                }}
                className="flex-shrink-0 flex items-center justify-center p-0.5 w-6 h-6 rounded-full border border-border bg-accent/50 hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
            >
                <ArrowBigLeft size={16} className="text-foreground" />
            </button>
        );
    };

    // --- Rendering Logic ---
    const renderVariableItem = (variable: Variable, listId: string, index: number) => {
        const varRawId = variable[variableIdKey] ?? (variable as any).columnIndex ?? (variable as any).aggregateId ?? (variable as any).name;
        const varId = varRawId !== undefined && varRawId !== null ? String(varRawId) : undefined;
        if (varId === undefined) {
            console.warn("Variable missing identifier for rendering:", variable);
            return null;
        }

        const listConfig = allLists.find(l => l.id === listId);
        const itemsDraggableInList = (listConfig as TargetListConfig)?.draggableItems !== false;
        const isActuallyDraggable = itemsDraggableInList || listId === 'available';

        // Check if the item is disabled based on the prop from the parent
        const isDisabled = isVariableDisabled ? isVariableDisabled(variable) : false;

        const isBeingDragged = draggedItem?.variable[variableIdKey] === variable[variableIdKey];
        const isHighlighted = highlightedVariable?.id === varId && highlightedVariable.source === listId;
        const isDropTargetIndicator = itemsDraggableInList && 
            draggedItem?.sourceListId === listId && 
            dragOverIndex === index && 
            draggedItem && 
            !isBeingDragged;

        return (
            <TooltipProvider key={varId}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            id={`variable-item-${listId}-${varId}`}
                            data-testid={`variable-item-${listId}-${varId}`}
                            data-variable-id={varId}
                            data-list-id={listId}
                            className={`
                                flex items-center p-1 border rounded-md group relative transition-all duration-150 ease-in-out text-sm
                                ${isActuallyDraggable && !isDisabled ? 'cursor-grab' : 'cursor-default'}
                                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                                ${isBeingDragged ? "opacity-40 bg-accent" : "hover:bg-accent"}
                                ${isHighlighted ? "bg-accent border-primary" : "border-border"}
                                ${isDropTargetIndicator ? "border-t-[3px] border-t-primary pt-[1px]" : "pt-1"}
                            `}
                            style={{
                                // Border styling
                                borderTopStyle: isDropTargetIndicator ? 'solid' : 'solid',
                                borderTopWidth: isDropTargetIndicator ? '3px' : '1px',
                                borderTopColor: isDropTargetIndicator 
                                    ? 'hsl(var(--primary))' 
                                    : (isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))'),
                                paddingTop: isDropTargetIndicator ? '1px' : '4px',
                                paddingBottom: '4px',
                                
                                // Consistent side/bottom borders
                                borderLeftWidth: '1px', 
                                borderRightWidth: '1px', 
                                borderBottomWidth: '1px',
                                borderLeftColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                borderRightColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                                borderBottomColor: isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                            }}
                            onClick={() => !isDisabled && handleVariableSelect(variable, listId)}
                            onDoubleClick={() => !isDisabled && handleVariableDoubleClick(variable, listId)}
                            draggable={isActuallyDraggable && !isDisabled}
                            onDragStart={(e) => isActuallyDraggable && !isDisabled && handleDragStart(e, variable, listId)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => !isDisabled && handleItemDragOver(e, index, listId)}
                            onDrop={(e) => !isDisabled && handleDrop(e, listId, index)}
                        >
                            <div className="flex items-center w-full truncate">
                                {itemsDraggableInList && (
                                    <GripVertical 
                                        size={14} 
                                        className="text-muted-foreground mr-1 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity"
                                        data-testid={`drag-handle-${listId}-${varId}`}
                                    />
                                )}
                                {!itemsDraggableInList && <div className="w-[14px] mr-1 flex-shrink-0"></div>}
                                <span data-testid={`variable-icon-${listId}-${varId}`}>{getVariableIcon(variable)}</span>
                                <span 
                                    className="truncate" 
                                    data-testid={`variable-name-${listId}-${varId}`}
                                    title={getDisplayName(variable)}
                                >{getDisplayName(variable)}</span>
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        <p className="text-sm">{getDisplayName(variable)}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    };

    interface ArrowInfo {
        button: React.ReactNode;
        handler: () => void;
    }

    const renderList = (
        listConfig: TargetListConfig | { id: string, title: string, variables: Variable[], height: string },
        arrowInfo?: ArrowInfo
    ) => {
        const { id, title, variables, height } = listConfig;
        
        // Check if it's a full TargetListConfig or just the basic available list structure
        const isTargetConfig = 'droppable' in listConfig || 'draggableItems' in listConfig || 'maxItems' in listConfig;
        const config = isTargetConfig ? listConfig as TargetListConfig : null;

        // Determine if items can be dropped INTO this list container
        const droppable = id !== 'available' && (!config || config.droppable !== false);
        const showDropPlaceholder = variables.length === 0 && droppable;

        // Adjust the height for single-item lists
        const isSingleItemList = config?.maxItems === 1;
        const adjustedHeight = isSingleItemList
            ? variables.length === 0 ? "46px" : "auto"
            : height;

        // Adjust overflow for single-item lists
        const overflowStyle = isSingleItemList ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden";

        const testIdMap: Record<string, string> = {
            available: 'available-variable-list',
            break: 'break-variable-list',
            aggregated: 'aggregated-variable-list',
        };

        return (
            <div 
                key={id} 
                className={`flex flex-col ${id !== 'available' ? 'mb-2' : ''}`}
                id={`${id}-variables-list-container`}
                data-testid={`${id}-variables-list-container`}
            >
                {title && (
                    <div
                        id={`${id}-list-title`}
                        data-testid={`${id}-list-title`}
                        className={`text-sm font-medium text-foreground mb-1.5 px-1 flex items-center h-6 ${arrowInfo ? 'cursor-pointer hover:bg-accent rounded' : ''}`}
                        onClick={arrowInfo?.handler}
                    >
                        {/* Render arrow button (if any) at the left side */}
                        {arrowInfo?.button && (
                            <span 
                                className="mr-1 flex-shrink-0" 
                                data-testid={`arrow-button-${id}`}
                                onClick={(e) => { e.stopPropagation(); arrowInfo.handler(); }}
                            >
                                {arrowInfo.button}
                            </span>
                        )}
                        <span className="truncate" title={title}>{title}</span>
                    </div>
                )}
                <div
                    data-list-id={id}
                    data-testid={testIdMap[id] || `${id}-variable-list`}
                    id={`${id}-variables-list`}
                    role="group"
                    aria-label={title || id}
                    className={`
                        border p-1 rounded-md w-full transition-colors relative bg-background
                        ${overflowStyle}
                        ${isDraggingOver === id && droppable ? "border-primary bg-accent" : "border-border"}
                        ${!droppable && id !== 'available' ? 'bg-muted cursor-not-allowed' : ''}
                        ${id === 'selected' ? 'tour-target-selected-variables' : ''}
                    `}
                    style={{ height: adjustedHeight, minHeight: isSingleItemList ? "auto" : "" }}
                    onDragOver={(e) => handleDragOver(e, id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, id)} // Drop on container (append to end)
                >
                    {showDropPlaceholder && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none p-2">
                            <MoveHorizontal size={18} className="mb-1" />
                            <p className="text-xs text-center">
                                {config?.maxItems === 1 ? "Drop one variable here" : "Drop variables here"}
                            </p>
                        </div>
                    )}
                    {variables.length === 0 && id === 'available' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none p-4">
                            <p className="text-sm text-center">All variables used</p>
                        </div>
                    )}

                    <div 
                        className={`space-y-0.5 p-0.5 transition-all duration-150`}
                        data-testid={`${id}-variables-container`}
                        id={`${id}-variables-container`}
                    >
                        {variables.map((variable, index) => renderVariableItem(variable, id, index))}
                    </div>
                </div>
                {renderListFooter?.(id)}
            </div>
        );
    };

    // --- Main Return with Responsive Layout ---
    // Only use flex column layout if mobile AND portrait orientation
    const useVerticalLayout = isMobile && isPortrait;

    if (useVerticalLayout) {
        return (
            <div 
                className="flex flex-col gap-4"
                id="variable-list-manager-mobile"
                data-testid="variable-list-manager-mobile"
            >
                {/* Available Variables */}
                <div 
                    className="w-full flex flex-col"
                    id="available-variables-section"
                    data-testid="available-variables-section"
                >
                    {renderList(allLists.find(l => l.id === 'available')!)}
                </div>
                
                {/* Central Arrow Button for Mobile */}
                <div 
                    className="flex justify-center items-center my-1 h-8"
                    id="central-arrow-section"
                    data-testid="central-arrow-section"
                >
                    {renderCentralArrowButton()}
                </div>
                
                {/* Target Lists */}
                <div 
                    className="w-full flex flex-col space-y-2"
                    id="target-lists-section"
                    data-testid="target-lists-section"
                >
                    {targetLists.map(listConfig => renderList(listConfig))}
                    {renderRightColumnFooter?.()}
                </div>

                {/* Helper Text */}
                <div 
                    className="flex flex-col mt-2 space-y-2"
                    id="helper-text-section"
                    data-testid="helper-text-section"
                >
                    <div 
                        className="text-xs text-muted-foreground flex items-center p-1.5 rounded bg-accent border border-border"
                        id="help-info-mobile"
                        data-testid="help-info-mobile"
                    >
                        <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-muted-foreground" />
                        <span>Drag or double-click to move. Tap to select, then use arrow.</span>
                    </div>
                    {renderExtraInfoContent?.()}
                </div>
            </div>
        );
    }

    // For desktop layout, we need a more complex structure to align arrows with their targets
    // First, check if we need to show multiple arrows (from available to targets)
    const sourceListId = highlightedVariable?.source;
    const isFromAvailable = sourceListId === 'available';
    
    // Calculate which target lists can receive the selected variable
    const eligibleTargets = isFromAvailable && highlightedVariable
        ? targetLists.filter(t => {
            if (t.droppable === false) return false;
            if (t.maxItems && t.variables.length >= t.maxItems && t.maxItems !== 1) return false;
            return true;
        })
        : [];
        
    // Prepare arrow buttons for each target list
    const arrowButtons: Record<string, ArrowInfo> = {};
    
    if (isFromAvailable && eligibleTargets.length > 0) {
        const variableToMove = allLists.find(l => l.id === 'available')?.variables.find(
            v => String(v[variableIdKey]) === highlightedVariable?.id
        );
        
        if (variableToMove) {
            eligibleTargets.forEach(target => {
                const moveWithSwap = () => {
                    // If target already full (single-item list), move its current variable back first
                    if (target.maxItems === 1 && target.variables.length === 1) {
                        const existingVariable = target.variables[0];
                        onMoveVariable(existingVariable, target.id, 'available');
                    }
                    onMoveVariable(variableToMove, 'available', target.id);
                };

                arrowButtons[target.id] = {
                    button: (
                        <button
                            id={`arrow-move-to-${target.id}-button`}
                            data-testid={`arrow-move-button-${target.id}`}
                            aria-label={`Move variable to ${target.title}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                moveWithSwap();
                            }}
                            className="flex-shrink-0 flex items-center justify-center p-0.5 w-6 h-6 rounded-full border border-border bg-accent/50 hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                        >
                            <ArrowBigRight size={16} className="text-foreground" />
                        </button>
                    ),
                    handler: moveWithSwap
                };
            });
        }
    } else if (sourceListId && sourceListId !== 'available') {
        // For moving back to available
        const sourceListConfig = targetLists.find(l => l.id === sourceListId);
        if (sourceListConfig?.draggableItems !== false) {
            const variableToMove = allLists.find(l => l.id === sourceListId)?.variables.find(
                v => String(v[variableIdKey]) === highlightedVariable?.id
            );
            
            if (variableToMove) {
                arrowButtons[sourceListId] = {
                    button: (
                        <button
                            id={`arrow-move-back-to-available-button`}
                            data-testid={`arrow-move-button-back-to-available`}
                            aria-label={`Move variable back to Available`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveVariable(variableToMove, sourceListId, 'available');
                            }}
                            className="flex-shrink-0 flex items-center justify-center p-0.5 w-6 h-6 rounded-full border border-border bg-accent/50 hover:bg-accent hover:border-primary transition-all duration-150 ease-in-out"
                        >
                            <ArrowBigLeft size={16} className="text-foreground" />
                        </button>
                    ),
                    handler: () => onMoveVariable(variableToMove, sourceListId, 'available')
                };
            }
        }
    }

    // Pendekatan baru dengan layout 2 kolom dan tombol di antara kolom
    return (
        <div 
            className="flex gap-8 items-start relative"
            id="variable-list-manager-desktop"
            data-testid="variable-list-manager-desktop"
        >
            {/* Available Variables Column (Left) */}
            <div 
                className="w-[45%] flex flex-col"
                id="available-variables-column"
                data-testid="available-variables-column"
            >
                {renderList(allLists.find(l => l.id === 'available')!)}
                
                <div 
                    className="flex flex-col mt-2 space-y-2"
                    id="help-section-desktop"
                    data-testid="help-section-desktop"
                >
                    <div 
                        className="text-xs text-muted-foreground flex items-center p-1.5 rounded bg-accent border border-border"
                        id="help-info-desktop"
                        data-testid="help-info-desktop"
                    >
                        <InfoIcon size={14} className="mr-1.5 flex-shrink-0 text-muted-foreground" />
                        <span>Drag or double-click to move.</span>
                    </div>
                    {renderExtraInfoContent?.()}
                </div>
            </div>

            {/* Target Lists Column (Right) with buttons positioned between columns */}
            <div 
                className="w-[45%] flex flex-col space-y-2 relative" 
                id="target-variables-column"
                data-testid="target-variables-column"
            >
                {targetLists.map((listConfig) => (
                    <React.Fragment key={`list-${listConfig.id}`}>
                        {renderList(listConfig, arrowButtons[listConfig.id])}
                    </React.Fragment>
                ))}
                {renderRightColumnFooter?.()}
            </div>
        </div>
    );
};

export default VariableListManager;