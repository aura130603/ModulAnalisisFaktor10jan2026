import { useCallback, useState } from "react";
import { useVariableStore } from "@/stores/useVariableStore";
import type { Variable } from "@/types/Variable";
import { toast } from "sonner";

export type HighlightedVariable = {
    tempId: string;
    source: 'available' | 'test1' | 'test2';
    rowIndex?: number;
};

export const useVariableSelection = () => {
    const variables = useVariableStore((state) => state.variables);
    const [availableVariables, setAvailableVariables] = useState<Variable[]>(
        variables.filter(v => v.name !== "")
    );
    const [testVariables1, setTestVariables1] = useState<Variable[]>([]);
    const [testVariables2, setTestVariables2] = useState<Variable[]>([]);
    const [pairNumbers, setPairNumbers] = useState<number[]>([]);
    const [highlightedVariable, setHighlightedVariable] = useState<HighlightedVariable | null>(null);
    const [highlightedPair, setHighlightedPair] = useState<{ id: number } | null>(null);

    // Move a variable to test variables (either list1 or list2)
    const moveToTestVariables = useCallback((variable: Variable, targetList?: 'test1' | 'test2') => {
        // Determine if we have incomplete pairs
        const hasUndefinedInTest1 = testVariables1.some(v => v === undefined);
        const hasUndefinedInTest2 = testVariables2.some(v => v === undefined);
        const hasIncompletePair = hasUndefinedInTest1 || hasUndefinedInTest2;
        
        // Find the index of the first undefined value in each list
        const undefinedIndexInTest1 = testVariables1.findIndex(v => v === undefined);
        const undefinedIndexInTest2 = testVariables2.findIndex(v => v === undefined);
        
        let targetListToUse = targetList;
        
        // Handle incomplete pairs (with undefined values)
        if (hasIncompletePair) {
            // If both lists have undefined values, prioritize the first one
            if (hasUndefinedInTest1 && hasUndefinedInTest2) {
                const firstUndefinedIndex = Math.min(
                    undefinedIndexInTest1 !== -1 ? undefinedIndexInTest1 : Infinity,
                    undefinedIndexInTest2 !== -1 ? undefinedIndexInTest2 : Infinity
                );
                
                // Determine which list has the first undefined
                if (undefinedIndexInTest1 === firstUndefinedIndex) {
                    targetListToUse = 'test1';
                    
                    // Check if this would create a pair with the same variable
                    const potentialMatch = testVariables2[firstUndefinedIndex];
                    if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                        toast.error("Pasangan harus berisi dua variabel yang berbeda.");
                        return;
                    }
                } else {
                    targetListToUse = 'test2';
                    
                    // Check if this would create a pair with the same variable
                    const potentialMatch = testVariables1[firstUndefinedIndex];
                    if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                        toast.error("Pasangan harus berisi dua variabel yang berbeda.");
                        return;
                    }
                }
                
                // If targetList is specified but doesn't match our determined target
                if (targetList && targetList !== targetListToUse) {
                    toast.warning("Menyelesaikan pasangan yang belum lengkap terlebih dahulu.");
                }
            } else if (hasUndefinedInTest1) {
                // Only test1 has undefined values
                targetListToUse = 'test1';
                
                // Check if this would create a pair with the same variable
                const potentialMatch = testVariables2[undefinedIndexInTest1];
                if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                    toast.error("The pair must contain two different variables.");
                    return;
                }
                
                // If targetList is specified but doesn't match our determined target
                if (targetList && targetList !== targetListToUse) {
                    toast.warning("Menyelesaikan pasangan yang belum lengkap terlebih dahulu.");
                }
            } else {
                // Only test2 has undefined values
                targetListToUse = 'test2';
                
                // Check if this would create a pair with the same variable
                const potentialMatch = testVariables1[undefinedIndexInTest2];
                if (potentialMatch && potentialMatch.columnIndex === variable.columnIndex) {
                    toast.error("The pair must contain two different variables.");
                    return;
                }
                
                // If targetList is specified but doesn't match our determined target
                if (targetList && targetList !== targetListToUse) {
                    toast.warning("Menyelesaikan pasangan yang belum lengkap terlebih dahulu.");
                }
            }
        } else {
            // Handle uneven lists (different lengths but no undefined values)
            const hasUnevenLists = testVariables1.length !== testVariables2.length;
            
            if (hasUnevenLists) {
                // Determine which list needs completion
                const shorterList = testVariables1.length < testVariables2.length ? 'test1' : 'test2';
                const longerList = shorterList === 'test1' ? 'test2' : 'test1';
                const matchingIndex = Math.min(testVariables1.length, testVariables2.length);
                
                // Get the variable from the longer list
                const existingVariable = longerList === 'test1' 
                    ? testVariables1[matchingIndex] 
                    : testVariables2[matchingIndex];
                
                // Check if the variable being added is the same as the existing one
                if (existingVariable && existingVariable.columnIndex === variable.columnIndex) {
                    toast.error("The pair must contain two different variables.");
                    return;
                }
                
                targetListToUse = shorterList;
                
                // If targetList is specified but doesn't match the list that needs completion
                if (targetList && targetList !== shorterList) {
                    toast.warning("Menyelesaikan pasangan yang belum lengkap terlebih dahulu.");
                }
            } else if (!targetListToUse) {
                // If lists are even and no targetList specified, determine based on balance
                targetListToUse = testVariables1.length <= testVariables2.length ? 'test1' : 'test2';
            }
        }
        
        // Now add the variable to the appropriate list
        if (targetListToUse === 'test1') {
            if (hasUndefinedInTest1) {
                // Replace the first undefined value
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray[undefinedIndexInTest1] = variable;
                    return newArray;
                });
            } else {
                // Add to the end
                setTestVariables1(prev => [...prev, variable]);
                
                setPairNumbers(prev => {
                    const newPairNumber = prev.length > 0 ? Math.max(...prev) + 1 : 1;
                    return [...prev, newPairNumber];
                });
            }
        } else { // targetListToUse === 'test2'
            if (hasUndefinedInTest2) {
                // Replace the first undefined value
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray[undefinedIndexInTest2] = variable;
                    return newArray;
                });
            } else {
                // Add to the end
                setTestVariables2(prev => [...prev, variable]);
            }
        }
        
        setHighlightedVariable(null);
    }, [testVariables1, testVariables2]);

    // Remove a variable from a test list
    const removeVariable = useCallback((sourceList: 'test1' | 'test2', rowIndex: number) => {
        if (sourceList === 'test1') {
            const otherVariable = testVariables2[rowIndex];
            
            // Check if slot in variable2 is empty
            if (!otherVariable) {
                // Remove the entire row - pairs below will move up
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setPairNumbers(prev => {
                    const newArray = [...prev];
                    newArray.pop();
                    return newArray;
                });
            } else {
                // If variable2 is not empty, just empty this slot
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        } else { // sourceList === 'test2'
            const otherVariable = testVariables1[rowIndex];
            
            // Check if slot in variable1 is empty
            if (!otherVariable) {
                // Remove the entire row - pairs below will move up
                setTestVariables1(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray.splice(rowIndex, 1);
                    return newArray;
                });
                setPairNumbers(prev => {
                    const newArray = [...prev];
                    newArray.pop();
                    return newArray;
                });
            } else {
                // If variable1 is not empty, just empty this slot
                setTestVariables2(prev => {
                    const newArray = [...prev];
                    newArray[rowIndex] = undefined as any;
                    return newArray;
                });
            }
        }
        
        setHighlightedVariable(null);
    }, [testVariables1, testVariables2]);

    // Move variable between lists (swap variable1 and variable2)
    const moveVariableBetweenLists = useCallback((index: number) => {
        // Check if swapping would create a pair with the same variable
        if (testVariables1[index] && testVariables2[index] && 
            testVariables1[index].columnIndex === testVariables2[index].columnIndex) {
            toast.error("The pair must contain two different variables.");
            return;
        }
        
        // Move variable from list1 to list2 or vice versa
        const temp = testVariables1[index];
        setTestVariables1(prev => {
            const newArray = [...prev];
            newArray[index] = testVariables2[index];
            return newArray;
        });
        setTestVariables2(prev => {
            const newArray = [...prev];
            newArray[index] = temp;
            return newArray;
        });
    }, [testVariables1, testVariables2]);

    // Move a pair up in the list
    const moveUpPair = useCallback((index: number) => {
        if (index > 0) {
            setTestVariables1(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
                return newArray;
            });
            
            setTestVariables2(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
                return newArray;
            });
            
            setPairNumbers(Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, i) => i + 1));
            
            setHighlightedPair({ id: index - 1 });
        }
    }, [testVariables1, testVariables2]);

    // Move a pair down in the list
    const moveDownPair = useCallback((index: number) => {
        if (index < testVariables1.length - 1) {
            setTestVariables1(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                return newArray;
            });
            
            setTestVariables2(prev => {
                const newArray = [...prev];
                [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
                return newArray;
            });
            
            setPairNumbers(Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, i) => i + 1));
            
            setHighlightedPair({ id: index + 1 });
        }
    }, [testVariables1, testVariables2]);

    // Remove a pair
    const removePair = useCallback((index: number) => {
        setTestVariables1(prev => prev.filter((_, i) => i !== index));
        setTestVariables2(prev => prev.filter((_, i) => i !== index));
        setPairNumbers(Array.from({ length: Math.max(testVariables1.length, testVariables2.length) }).map((_, i) => i + 1));
        setHighlightedPair(null);
    }, [testVariables1.length, testVariables2.length]);

    // Reorder pairs based on a new array of pairs
    const reorderPairs = useCallback((pairs: [Variable, Variable][]) => {
        const newVariables1: Variable[] = [];
        const newVariables2: Variable[] = [];
        const newPairNumbers: number[] = [];
        
        pairs.forEach((pair, index) => {
            newVariables1.push(pair[0]);
            newVariables2.push(pair[1]);
            newPairNumbers.push(pairNumbers[index] || index + 1);
        });
        
        setTestVariables1(newVariables1);
        setTestVariables2(newVariables2);
        setPairNumbers(newPairNumbers);
    }, [pairNumbers]);

    // Check if a pair is valid
    const isPairValid = useCallback((index: number): boolean => {
        // Ensure both variables in pair exist and are different
        if (!testVariables1[index] || !testVariables2[index]) {
            return false;
        }
        
        // Check if variables are different (based on columnIndex)
        return testVariables1[index].columnIndex !== testVariables2[index].columnIndex;
    }, [testVariables1, testVariables2]);

    // Check if all pairs are valid
    const areAllPairsValid = useCallback((): boolean => {
        if (testVariables1.length === 0 || testVariables2.length === 0) {
            return false;
        }
        
        if (testVariables1.length !== testVariables2.length) {
            return false;
        }
        
        // Check all pairs for validity
        for (let i = 0; i < testVariables1.length; i++) {
            if (!isPairValid(i)) {
                return false;
            }
        }
        
        return true;
    }, [testVariables1, testVariables2, isPairValid]);

    // Check for duplicate pairs
    const hasDuplicatePairs = useCallback((): boolean => {
        const pairSignatures = new Set<string>();
        
        for (let i = 0; i < testVariables1.length; i++) {
            if (testVariables1[i] && testVariables2[i]) {
                // Create unique signature for each pair
                const var1Id = testVariables1[i].columnIndex;
                const var2Id = testVariables2[i].columnIndex;
                const pairSignature = `${var1Id}-${var2Id}`;
                
                // Check if signature already exists
                if (pairSignatures.has(pairSignature)) {
                    return true; // Found a duplicate
                }
                
                pairSignatures.add(pairSignature);
            }
        }
        
        return false;
    }, [testVariables1, testVariables2]);

    // Reset variable selection
    const resetVariableSelection = useCallback(() => {
        setAvailableVariables(variables.filter(v => v.name !== ""));
        setTestVariables1([]);
        setTestVariables2([]);
        setPairNumbers([]);
        setHighlightedVariable(null);
        setHighlightedPair(null);
    }, [variables]);

    return {
        availableVariables,
        testVariables1,
        testVariables2,
        pairNumbers,
        highlightedVariable,
        setHighlightedVariable,
        highlightedPair,
        setHighlightedPair,
        moveToTestVariables,
        removeVariable,
        moveVariableBetweenLists,
        moveUpPair,
        moveDownPair,
        removePair,
        isPairValid,
        areAllPairsValid,
        hasDuplicatePairs,
        reorderPairs,
        resetVariableSelection
    };
};