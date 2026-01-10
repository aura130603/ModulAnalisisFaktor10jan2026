/**
 * Attempts to read text from the system clipboard.
 * @returns A Promise that resolves with the clipboard text if successful, or rejects with an error.
 */
export const readTextFromClipboard = async (): Promise<string> => {
    if (!navigator.clipboard?.readText) {
        return Promise.reject(new Error("Clipboard API not available."));
    }
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            return text;
        } else {
            // Clipboard API might return empty string if clipboard is empty or contains non-text data
            return Promise.reject(new Error("Clipboard is empty or contains non-text data."));
        }
    } catch (err: any) {
        console.error("Failed to read clipboard via API:", err);
        // Rethrow a more generic error or the original error, depending on desired error handling strategy
        // For now, rethrowing a new error with a user-friendly message.
        throw new Error("Could not read from clipboard. Permission might be denied or an unexpected error occurred.");
    }
}; 