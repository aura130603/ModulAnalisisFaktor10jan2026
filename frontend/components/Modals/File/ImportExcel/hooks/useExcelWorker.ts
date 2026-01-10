import { useState, useCallback } from "react";
import type { SheetData} from "../services/services";
import { parseExcelWithWorker } from "../services/services";

export const useExcelWorker = () => {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = useCallback((file: File): Promise<SheetData[]> => {
    setIsParsing(true);
    setError(null);
    const promise = parseExcelWithWorker(file)
      .then((result) => {
        setIsParsing(false);
        return result;
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setIsParsing(false);
        return Promise.reject(err);
      });
    return promise;
  }, []);

  return { isParsing, error, parse };
};
