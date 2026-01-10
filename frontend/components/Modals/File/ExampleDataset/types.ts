export interface ExampleDataset {
    name: string;
    path: string;
    tags: string[];
    description: string;
}

export interface ExampleFiles {
    sav: ExampleDataset[];
}

export interface UseExampleDatasetLogicProps {
    onClose: () => void;
}

export interface UseExampleDatasetLogicOutput {
    isLoading: boolean;
    error: string | null;
    loadDataset: (filePath: string) => Promise<void>;
} 