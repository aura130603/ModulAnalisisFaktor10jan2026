declare module 'sav-reader' {
    import type { SavMeta } from './sav.types';

    export class SavBufferReader {
        constructor(buffer: Buffer);
        open(): Promise<void>;
        meta: SavMeta;
        readAllRows(): Promise<Record<string, unknown>[]>;
    }
}

declare module 'sav-writer' {
    import type { TransformedVariable } from './sav.types';

    export const VariableType: {
        Numeric: number;
        String: number;
        Date: number;
        DateTime: number;
    };

    export const VariableAlignment: {
        Left: number;
        Centre: number;
        Right: number;
    };

    export const VariableMeasure: {
        Nominal: number;
        Ordinal: number;
        Continuous: number;
    };

    export function saveToFile(
        filePath: string,
        data: Array<Record<string, string | number | Date | null>>,
        variables: TransformedVariable[]
    ): void;
}