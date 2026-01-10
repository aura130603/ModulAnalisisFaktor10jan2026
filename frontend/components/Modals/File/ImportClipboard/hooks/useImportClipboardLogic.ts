import { useState, useCallback } from "react";
import { useMobile } from "@/hooks/useMobile";
import type { 
    ImportClipboardStage, 
    UseImportClipboardLogicProps, 
    UseImportClipboardLogicOutput 
} from "../types"; // Updated path

export const useImportClipboardLogic = ({
    onClose,
}: UseImportClipboardLogicProps): UseImportClipboardLogicOutput => {
    const [pastedText, setPastedText] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<ImportClipboardStage>("paste");

    const { isMobile, isPortrait } = useMobile();

    const handleTextPaste = useCallback((text: string) => {
        console.log('Text pasted - Excel Text to Columns analysis:');
        console.log('---------------------------------------------');
        setPastedText(text);
        setError(null);

        // Analyze text structure
        if (text.trim()) {
            console.log(`Total text length: ${text.length} characters`);
            
            const lineBreaks = text.match(/\r?\n/g);
            const rows = text.split(/\r?\n/);
            console.log(`Line breaks detected: ${lineBreaks ? lineBreaks.length : 0}`);
            console.log(`Rows detected: ${rows.length}`);
            
            const delimiterCounts = {
                tab: (text.match(/\t/g) || []).length,
                comma: (text.match(/,/g) || []).length,
                semicolon: (text.match(/;/g) || []).length,
                space: (text.match(/ /g) || []).length,
                pipe: (text.match(/\|/g) || []).length
            };
            
            console.log('Delimiter analysis:');
            console.log('- Tabs:', delimiterCounts.tab);
            console.log('- Commas:', delimiterCounts.comma);
            console.log('- Semicolons:', delimiterCounts.semicolon);
            console.log('- Spaces:', delimiterCounts.space);
            console.log('- Pipes:', delimiterCounts.pipe);
            
            const delimiters = Object.entries(delimiterCounts)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1]);
            
            if (delimiters.length > 0) {
                console.log(`Suggested delimiter: ${delimiters[0][0]} (${delimiters[0][1]} occurrences)`);
            } else {
                console.log('No common delimiters found - might be fixed width data');
            }
            
            const doubleQuotes = (text.match(/"/g) || []).length;
            const singleQuotes = (text.match(/'/g) || []).length;
            console.log('Text qualifier analysis:');
            console.log('- Double quotes:', doubleQuotes);
            console.log('- Single quotes:', singleQuotes);
            
            console.log('First 3 rows structure:');
            rows.slice(0, 3).forEach((row, i) => {
                if (row.trim()) {
                    const fields = delimiters.length > 0 
                        ? row.split(delimiters[0][0] === 'tab' ? '\t' : 
                                   delimiters[0][0] === 'comma' ? ',' : 
                                   delimiters[0][0] === 'semicolon' ? ';' : 
                                   delimiters[0][0] === 'pipe' ? '|' : ' ')
                        : [row];
                    console.log(`Row ${i + 1}: ${fields.length} fields`);
                }
            });

            try {
                const parsedRows = rows
                    .filter(row => row.trim() !== '')
                    .map(row => row.split('\t'));
                setParsedData(parsedRows);
            } catch (err) {
                console.error("Error parsing pasted text:", err);
                setError("Failed to parse pasted text. Please check the format.");
                setParsedData([]);
            }
        } else {
            setParsedData([]);
        }
    }, []);

    const handleContinueToConfigure = useCallback(() => {
        if (!pastedText || pastedText.trim() === '') {
            setError("Please paste some data first.");
            return;
        }

        if (parsedData.length === 0) {
            setError("No valid data could be parsed from the pasted text.");
            return;
        }
        setStage("configure");
    }, [pastedText, parsedData]);

    const handleBackToPaste = useCallback(() => {
        setStage("paste");
    }, []);

    const handleModalClose = useCallback(() => {
        onClose();
    }, [onClose]);

    return {
        pastedText,
        parsedData,
        isLoading,
        error,
        stage,
        isMobile,
        isPortrait,
        handleTextPaste,
        handleContinueToConfigure,
        handleBackToPaste,
        handleModalClose,
    };
}; 