import { useState, useEffect, useCallback, useRef } from "react";
import { FindReplaceMode, TabType } from "../types"; // Adjust path as necessary
import { useVariableStore } from "@/stores/useVariableStore";
import { useDataStore } from "@/stores/useDataStore";
import { useTableRefStore } from "@/stores/useTableRefStore";
import { Variable } from "@/types/Variable";

interface UseFindReplaceFormProps {
    // columns?: string[]; // Will be fetched from useVariableStore
    defaultTab?: FindReplaceMode;
    // activeView?: 'data' | 'variable'; // To know which table to target, if necessary
}

export const useFindReplaceForm = ({
    defaultTab = FindReplaceMode.FIND,
    // activeView = 'data', // Assuming data table for now
}: UseFindReplaceFormProps) => {
    const variables = useVariableStore(state => state.variables);
    const data = useDataStore(state => state.data);
    const updateCell = useDataStore(state => state.updateCell);
    const updateCells = useDataStore(state => state.updateCells);
    const dataTableRef = useTableRefStore(state => state.dataTableRef);
    // const variableTableRef = useTableRefStore(state => state.variableTableRef); // If find/replace on var table is needed

    const [activeTab, setActiveTab] = useState<TabType>(
        defaultTab === FindReplaceMode.REPLACE ? TabType.REPLACE : TabType.FIND
    );

    const [columnNames, setColumnNames] = useState<string[]>([]);
    const [selectedColumnName, setSelectedColumnName] = useState<string>("");
    const [selectedColumnIndex, setSelectedColumnIndex] = useState<number>(-1);

    const [findText, setFindText] = useState<string>("");
    const [replaceText, setReplaceText] = useState<string>("");
    const [matchCase, setMatchCase] = useState<boolean>(false);
    const [showOptions, setShowOptions] = useState<boolean>(false);
    const [matchTo, setMatchTo] = useState<"contains" | "entire_cell" | "begins_with" | "ends_with">("contains");
    const [direction, setDirection] = useState<"up" | "down">("down");

    const [findError, setFindError] = useState<string>("");
    const [replaceError, setReplaceError] = useState<string>("");

    const [searchResults, setSearchResults] = useState<Array<{row: number, col: number}>>([]);
    const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState<number>(-1);
    const [lastSearchOptions, setLastSearchOptions] = useState<any>(null);
    const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false); // New state for loading

    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Ref for debounce timer

    useEffect(() => {
        const names = [...variables].sort((a,b) => a.columnIndex - b.columnIndex).map(v => v.name);
        setColumnNames(names);
        if (names.length > 0 && !selectedColumnName) {
            setSelectedColumnName(names[0]);
        }
    }, [variables, selectedColumnName]);

    useEffect(() => {
        const variable = variables.find(v => v.name === selectedColumnName);
        if (variable) {
            setSelectedColumnIndex(variable.columnIndex);
        } else {
            setSelectedColumnIndex(-1);
        }
    }, [selectedColumnName, variables]);

    const clearSearch = useCallback(() => {
        setSearchResults([]);
        setCurrentSearchResultIndex(-1);
        if (dataTableRef?.current?.hotInstance) {
            dataTableRef.current.hotInstance.deselectCell();
        }
        setLastSearchOptions(null); // Clear last search options as well
        // setFindError(""); // Avoid clearing find error here, let actions decide
    }, [dataTableRef]);

    const performSearchCallback = useCallback(() => {
        // The search logic is now wrapped in a stable callback
        if (activeTab === TabType.REPLACE && !findText.trim()) {
            clearSearch();
            return;
        }
        if (!findText.trim()) {
            setFindError("Find text cannot be empty.");
            setSearchResults([]);
            setCurrentSearchResultIndex(-1);
            return;
        }
        if (selectedColumnIndex === -1) {
            setFindError("Please select a valid column.");
            setSearchResults([]);
            setCurrentSearchResultIndex(-1);
            return;
        }

        const currentSearchOptions = { findText, selectedColumnIndex, matchCase, matchTo, direction, activeTab };
        if (JSON.stringify(currentSearchOptions) === JSON.stringify(lastSearchOptions) && searchResults.length > 0) {
            return;
        }
        const results: Array<{row: number, col: number}> = [];
        const searchData = data;
        for (let r = 0; r < searchData.length; r++) {
            const cellValue = searchData[r]?.[selectedColumnIndex];
            let actualValue = String(cellValue ?? "");
            let term = findText;
            if (!matchCase) {
                actualValue = actualValue.toLowerCase();
                term = term.toLowerCase();
            }
            let isMatch = false;
            switch (matchTo) {
                case "contains": isMatch = actualValue.includes(term); break;
                case "entire_cell": isMatch = actualValue === term; break;
                case "begins_with": isMatch = actualValue.startsWith(term); break;
                case "ends_with": isMatch = actualValue.endsWith(term); break;
            }
            if (isMatch) results.push({ row: r, col: selectedColumnIndex });
        }
        setSearchResults(results);
        setCurrentSearchResultIndex(-1);
        setLastSearchOptions(currentSearchOptions);
        setFindError(results.length === 0 ? "No results found." : "");
    }, [data, findText, selectedColumnIndex, matchCase, matchTo, direction, activeTab, lastSearchOptions, clearSearch, searchResults.length]);

    const performSearchRef = useRef(performSearchCallback);
    useEffect(() => {
        performSearchRef.current = performSearchCallback;
    });

    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        if (findText.trim() === "") {
            clearSearch();
            setIsLoadingSearch(false);
            setFindError("");
            return;
        }
        if (selectedColumnIndex === -1) {
            clearSearch();
            setIsLoadingSearch(false);
            setFindError("Please select a column to search in.");
            return;
        }

        setFindError("");
        setIsLoadingSearch(true);
        debounceTimerRef.current = setTimeout(() => {
            performSearchRef.current();
            setIsLoadingSearch(false);
        }, 500); // Reduced debounce time for better UX

        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [findText, selectedColumnIndex, matchCase, matchTo, activeTab, direction, clearSearch]);

    const navigateToResult = useCallback((index: number) => {
        if (index >= 0 && index < searchResults.length) {
            const {row, col} = searchResults[index];
            const hotInstance = dataTableRef?.current?.hotInstance;
            if (hotInstance) {
                hotInstance.selectCell(row, col);
                hotInstance.scrollViewportTo(row, col, true, true);
            }
            setCurrentSearchResultIndex(index);
        } else {
             if (dataTableRef?.current?.hotInstance) {
                dataTableRef.current.hotInstance.deselectCell();
            }
        }
    }, [searchResults, dataTableRef]);

    const performSearch = performSearchCallback; // Keep the name for other handlers

    const handleFindNext = () => {
        if(searchResults.length === 0 || JSON.stringify(lastSearchOptions) !== JSON.stringify({ findText, selectedColumnIndex, matchCase, matchTo, direction, activeTab })){
            performSearch(); 
             if (searchResults.length > 0) { 
                navigateToResult(0);
            } else {
                navigateToResult(-1);
            }
            return;
        }

        if (searchResults.length > 0) {
            const nextIndex = direction === 'down' 
                ? (currentSearchResultIndex + 1) % searchResults.length
                : (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
            navigateToResult(nextIndex);
        }
    };

    const handleFindPrevious = () => {
        // Temporarily reverse direction for this call logic, then revert for consistency of the state itself
        const tempDirection = direction === 'down' ? 'up' : 'down'; 
        
        if(searchResults.length === 0 || JSON.stringify(lastSearchOptions) !== JSON.stringify({ findText, selectedColumnIndex, matchCase, matchTo, direction : tempDirection, activeTab })){
            // performSearch will use the current `direction` state. To find previous effectively, we might need to adjust how performSearch considers direction or manage indices differently.
            // For simplicity, we make "Find Previous" behave like "Find Next" but in the opposite direction of iteration from the current selection.
            performSearch(); // Re-perform search if needed
            if (searchResults.length > 0) {
                navigateToResult(searchResults.length -1); // Start from the end for previous
            }
             else {
                navigateToResult(-1); // No results
            }
            return;
        }

        if (searchResults.length > 0) {
             const prevIndex = direction === 'up' 
                ? (currentSearchResultIndex + 1) % searchResults.length 
                : (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
            navigateToResult(prevIndex);
        }
    };

    const handleReplace = async () => {
        if (currentSearchResultIndex === -1 && searchResults.length > 0) {
            // If there are search results but none selected, select the first one before replacing.
            navigateToResult(0);
            // The actual replacement will happen on the next click or if we call replace logic here.
            // For now, let's assume user clicks again after cell is selected.
             if(currentSearchResultIndex === -1) { // still -1 after navigate (e.g. no results)
                console.log("No cell selected to replace. Find a match first.");
                return;
             }
        }

        if (currentSearchResultIndex !== -1 && searchResults.length > 0) {
            const {row, col} = searchResults[currentSearchResultIndex];
            if (data[row]?.[col] !== replaceText) { // Only update if different
                 await updateCell(row, col, replaceText);
            }
            // After replacing, automatically find the next one
            // But remove the replaced item from searchResults or mark it to avoid re-finding it if text becomes same
            const newResults = searchResults.filter((_,idx) => idx !== currentSearchResultIndex);
            setSearchResults(newResults);
            if(newResults.length === 0) {
                setCurrentSearchResultIndex(-1);
                 if (dataTableRef?.current?.hotInstance) dataTableRef.current.hotInstance.deselectCell();
                console.log("All found instances replaced.");
                return;
            }
            // Decide which index to go to next
            const nextIndex = (currentSearchResultIndex) % newResults.length; // Stays at current or moves if last was removed
            navigateToResult(nextIndex);
        } else {
            // If no search result is selected, try to find one first
            handleFindNext();
            // User might need to click replace again once a cell is highlighted.
            console.log("No cell currently selected for replacement. A search was initiated.");
        }
    };

    const handleReplaceAll = async () => {
        if (searchResults.length === 0) {
            performSearch(); // Ensure search results are populated if not already
            // Need to wait for state update or use callback if performSearch is fully async for state
            // For this implementation, let's assume performSearch updates searchResults synchronously enough for the next check
        }

        if (searchResults.length === 0 && findText) { // Recheck after performSearch
             performSearch(); // Call it again if it was empty and text is present
        }

        // Must use a local variable for search results if performSearch is async and we don't wait.
        // However, `searchResults` from state should be up-to-date if `performSearch` was called and completed.
        const currentSearchResults = searchResults; // Capture current state

        if (currentSearchResults.length > 0) {
            const updates: Array<{row: number, col: number, value: string | number}> = [];
            currentSearchResults.forEach(res => {
                if (data[res.row]?.[res.col] !== replaceText) {
                     updates.push({ ...res, value: replaceText });
                }
            });
            if(updates.length > 0) {
                await updateCells(updates);
            }
            console.log(`Replaced ${updates.length} instances.`);
            clearSearch();
        } else {
            console.log("No matches found to replace all.");
        }
    };

    const handleFindChange = (value: string) => {
        setFindText(value);
        // The useEffect above will handle calling performSearch or clearSearch.
        // Errors related to empty text or no column will be set by performSearch
        // or by the useEffect if text is empty.
    };

    const handleReplaceChange = (value: string) => {
        setReplaceText(value);
        // No validation for replace text being empty, it's a valid replacement
        setReplaceError(""); 
    };

    // Exposed state and handlers
    return {
        activeTab,
        setActiveTab,
        columnNames, // Use this for the select dropdown
        selectedColumnName,
        setSelectedColumnName,
        findText,
        handleFindChange,
        replaceText,
        handleReplaceChange,
        matchCase,
        setMatchCase,
        showOptions,
        setShowOptions,
        matchTo,
        setMatchTo,
        direction,
        setDirection,
        findError,
        replaceError,
        handleFindNext,
        handleFindPrevious, // Added this
        handleReplace,
        handleReplaceAll,
        searchResultsCount: searchResults.length,
        currentResultNumber: currentSearchResultIndex + 1, // For display (1-based)
        isLoadingSearch, // Expose loading state
    };
}; 