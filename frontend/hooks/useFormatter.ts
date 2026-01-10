import { Table } from "@/types/Table";

export function formatSig(value: any) {
    if (value === null || typeof value === "undefined" || isNaN(value)) {
        return null;
    }
    if (value < 0.001) {
        return "<.001";
    }
    return formatDisplayNumber(value);
}

export function formatDisplayNumber(
    num: number | undefined | null
): string | null {
    if (typeof num === "undefined") return "undefined";
    if (num === null || typeof num === "undefined" || isNaN(num)) {
        return null;
    }
    if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";

    // exact zero
    if (num === 0) {
        return "0";
    }

    // Treat values very close to zero as 0
    if (Math.abs(num) < 1e-20) {
        return "0.000";
    }

    // Show scientific notation for very small or very large numbers
    if (Math.abs(num) < 1e-4 || Math.abs(num) >= 1e16) {
        return num.toExponential(3).toUpperCase();
    }

    // Handle integers
    if (Number.isInteger(num)) {
        // Special case for 100
        if (num === 100) {
            return "100.0";
        }
        return num.toString();
    }

    // For regular decimal numbers
    return num.toFixed(4).replace(/\.?0+$/, "");
}

export function formatCorrelationValue(
    num: number | undefined | null
): string | null {
    if (typeof num === "undefined") return "undefined";
    if (num === null || typeof num === "undefined" || isNaN(num)) {
        return null;
    }
    if (!isFinite(num)) return num > 0 ? "Infinity" : "-Infinity";

    // Untuk nilai korelasi matriks pada output correlation matrix biar ditampilkan 3 digit dibelakang koma
    return num.toFixed(3);
}

// Helper function to ensure columnHeaders are sufficient for all rows
export function ensureEnoughHeaders(table: Table): Table {
    if (!table.rows || table.rows.length === 0) return table;

    // Get all unique column keys from all rows
    const allKeys = new Set<string>();
    table.rows.forEach((row) => {
        Object.keys(row).forEach((key) => {
            if (key !== "rowHeader") allKeys.add(key);
        });
    });

    // Check current column headers (excluding rowHeader columns)
    let headerCount = table.columnHeaders.length;
    const rowHeaderCount = table.rows[0].rowHeader
        ? Array.isArray(table.rows[0].rowHeader)
            ? table.rows[0].rowHeader.length
            : 1
        : 0;

    // Calculate how many non-rowHeader columns we have
    const dataColumnCount = allKeys.size;

    // Add empty headers if needed
    while (headerCount < rowHeaderCount + dataColumnCount) {
        table.columnHeaders.push({ header: "" });
        headerCount++;
    }

    return table;
}
