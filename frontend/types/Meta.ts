export interface Meta {
    id?: string;
    name: string;
    location: string;
    created: Date;
    weight: string;
    dates: string;
    filter: string;
}

// TODO: Replace MetaStoreError with the more robust RepositoryError class from ./RepositoryError.ts
// This provides better stack traces and a consistent error handling mechanism across the app.

export type MetaStoreError = {
    message: string;
    source: string;
    originalError?: any;
}; 