import { useState, useRef, useCallback, useEffect } from "react";
import type { CSVProcessingOptions } from "../types";
import type { ProcessedCsvData } from "../services/services";
import { parseCsvWithWorker } from "../services/services";

export const useCsvWorker = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerPromiseRef = useRef<Promise<ProcessedCsvData> | null>(null);

  const parse = useCallback((fileContent: string, options: CSVProcessingOptions): Promise<ProcessedCsvData> => {
    setIsProcessing(true);
    setError(null);
    const promise = parseCsvWithWorker(fileContent, options)
      .then((res) => {
        setIsProcessing(false);
        return res;
      })
      .catch((err) => {
        setError(err.message || String(err));
        setIsProcessing(false);
        return Promise.reject(err);
      });
    workerPromiseRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    return () => {
      // no cleanup needed; worker terminates itself
    };
  }, []);

  return { isProcessing, error, parse };
};
