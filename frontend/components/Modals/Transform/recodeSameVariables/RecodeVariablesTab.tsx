// import React, { FC, useCallback } from "react";
// import type { Variable } from "@/types/Variable";
// import VariableListManager, { TargetListConfig } from '@/components/Common/VariableListManager';

// interface RecodeVariablesTabProps {
//     availableVariables: Variable[];
//     variablesToRecode: Variable[]; // Changed from stringVariables
//     highlightedVariable: { tempId: string, source: 'available' | 'recodeList' } | null; // Changed source type
//     setHighlightedVariable: React.Dispatch<React.SetStateAction<{ tempId: string, source: 'available' | 'recodeList' } | null>>;
//     moveToRightPane: (variable: Variable, targetIndex?: number) => void;
//     moveToLeftPane: (variable: Variable, targetIndex?: number) => void;
//     reorderVariables?: (source: 'available' | 'recodeList', variables: Variable[]) => void; // Changed source type
// }

// const RecodeVariablesTab: FC<RecodeVariablesTabProps> = ({
//     availableVariables,
//     variablesToRecode, // Changed from stringVariables
//     highlightedVariable,
//     setHighlightedVariable,
//     moveToRightPane,
//     moveToLeftPane,
//     reorderVariables = () => { console.warn("reorderVariables not implemented upstream"); },
// }) => {

//     const targetLists: TargetListConfig[] = [
//         {
//             id: 'recodeList', // Changed from 'string'
//             title: 'Variables to Recode:', // Changed title
//             variables: variablesToRecode, // Changed from stringVariables
//             height: '300px',
//             draggableItems: true,
//             droppable: true
//         }
//     ];

//     const managerHighlightedVariable = highlightedVariable
//         ? { id: highlightedVariable.tempId, source: highlightedVariable.source }
//         : null;

//     const setManagerHighlightedVariable = useCallback((value: { id: string, source: string } | null) => {
//         if (value && (value.source === 'available' || value.source === 'recodeList')) { // Changed source type
//             setHighlightedVariable({ tempId: value.id, source: value.source as 'available' | 'recodeList' });
//         } else {
//             setHighlightedVariable(null);
//         }
//     }, [setHighlightedVariable]);

//     const handleMoveVariable = useCallback((variable: Variable, fromListId: string, toListId: string, targetIndex?: number) => {
//         if (toListId === 'recodeList') { // Changed to 'recodeList'
//             moveToRightPane(variable, targetIndex);
//         } else if (toListId === 'available') {
//             moveToLeftPane(variable, targetIndex);
//         }
//     }, [moveToRightPane, moveToLeftPane]);

//     const handleReorderVariables = useCallback((listId: string, variables: Variable[]) => {
//         if ((listId === 'recodeList' || listId === 'available') && reorderVariables) { // Changed to 'recodeList'
//             reorderVariables(listId as 'available' | 'recodeList', variables);
//         }
//     }, [reorderVariables]);

//     return (
//         <VariableListManager
//             availableVariables={availableVariables}
//             targetLists={targetLists}
//             variableIdKey="tempId"
//             highlightedVariable={managerHighlightedVariable}
//             setHighlightedVariable={setManagerHighlightedVariable}
//             onMoveVariable={handleMoveVariable}
//             onReorderVariable={handleReorderVariables}
//         />
//     );
// };

// export default RecodeVariablesTab;
