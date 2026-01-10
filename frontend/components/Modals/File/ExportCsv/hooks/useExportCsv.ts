import { useState, useTransition } from "react";
import { useDataStore } from "@/stores/useDataStore";
import { useVariableStore } from "@/stores/useVariableStore";
import { toast } from "sonner";
import { generateCsvContent } from "../utils/exportCsvUtils"; // Adjusted path
import type { CsvExportOptions, UseExportCsvOptions } from "../types"; // Import from new types.ts
import { useModal } from "@/hooks/useModal";

const initialState = {
    filename: "dataset_export",
    delimiter: ",",
    includeHeaders: true,
    includeVariableProperties: false,
    quoteStrings: false,
    encoding: "utf-8", 
};

export const useExportCsv = (options?: UseExportCsvOptions) => {
    const { closeModal } = useModal();

    const data = useDataStore((state) => state.data);
    const [isExporting, startExportTransition] = useTransition();

    const [exportOptions, setExportOptions] = useState<Omit<CsvExportOptions, 'delimiter'> & { filename: string, delimiter: string, encoding: string }>(() => ({
        filename: options?.initialFilename || "statify-export",
        delimiter: options?.initialDelimiter || ",",
        includeHeaders: options?.initialIncludeHeaders === undefined ? true : options.initialIncludeHeaders,
        includeVariableProperties: options?.initialIncludeVariableProperties === undefined ? false : options.initialIncludeVariableProperties,
        quoteStrings: options?.initialQuoteStrings === undefined ? true : options.initialQuoteStrings,
        encoding: options?.initialEncoding || "utf-8"
    }));

    const handleChange = (field: keyof typeof exportOptions, value: string | boolean) => {
        setExportOptions(prev => ({ ...prev, [field]: value }));
    };

  const handleFilenameChange = (value: string) => {
    const sanitized = value.replace(/[\/:*?"<>|]/g, '');
    handleChange("filename", sanitized);
  };

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error("Export Failed: No data available to export.");
      return;
    }
    if (!exportOptions.filename.trim()) {
      toast.error("Export Failed: Please enter a valid file name.");
      return;
    }

    startExportTransition(async () => {
      try {
        await useVariableStore.getState().loadVariables();
        await useDataStore.getState().loadData();

        const freshData = useDataStore.getState().data;
        const freshVariables = useVariableStore.getState().variables;

        if (!freshData || freshData.length === 0) {
          toast.error("Export Failed: No data to export after syncing with server.");
          return;
        }

        const csvOptions: CsvExportOptions = {
          delimiter: exportOptions.delimiter === '\\t' ? '\t' : exportOptions.delimiter,
          includeHeaders: exportOptions.includeHeaders,
          includeVariableProperties: exportOptions.includeVariableProperties,
          quoteStrings: exportOptions.quoteStrings,
        };

        const csvContent = generateCsvContent(freshData, freshVariables, csvOptions);
        const blob = new Blob([csvContent], {
          type: `text/csv;charset=${exportOptions.encoding}`
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const finalFilename = `${exportOptions.filename.trim()}.csv`;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Export Successful: Data successfully exported to ${finalFilename}`);

        closeModal();

      } catch (error) {
        console.error("Export error:", error);
        toast.error("Export Failed: An error occurred during export. Please check console for details.");
      }
    });
  };

  return {
    exportOptions,
    isExporting,
    handleChange,
    handleFilenameChange,
    handleExport,
  };
};