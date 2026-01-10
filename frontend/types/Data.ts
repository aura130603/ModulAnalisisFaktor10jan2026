export interface Cell {
    id?: number;
    col: number;
    row: number;
    value: string | number | null;
}

export type DataRow = (string | number | null)[];