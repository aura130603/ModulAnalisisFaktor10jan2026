export class RepositoryError extends Error {
    source: string;
    originalError?: any;

    constructor(message: string, source: string, originalError?: any) {
        super(message);
        this.name = "RepositoryError";
        this.source = source;
        this.originalError = originalError;
        
        // Maintains proper stack trace in V8 environments (like Node.js, Chrome)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, RepositoryError);
        }
    }
} 