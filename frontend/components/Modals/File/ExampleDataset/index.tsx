"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { File, Database, Loader2 } from 'lucide-react';
import { useExampleDatasetLogic } from './hooks/useExampleDatasetLogic';
import { exampleFiles } from './example-datasets';
import type { BaseModalProps } from '@/types/modalTypes';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ExampleDataset } from './types';

const renderFileList = (
    files: ExampleDataset[],
    handleFileClick: (path: string) => void,
    isLoading: boolean
) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {files.map((file) => (
            <div key={file.path} className="flex flex-col">
                <div 
                    className="border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => handleFileClick(file.path)}
                    data-testid={`example-dataset-${file.name.replace(/\s+/g, '-').toLowerCase()}`}
                >
                    <div className="p-4">
                        <div className="flex items-start">
                            <File className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate" data-testid={`dataset-name-${file.name.replace(/\s+/g, '-').toLowerCase()}`}>
                                    {file.name}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const ExampleDatasetModal: React.FC<BaseModalProps> = ({ onClose }) => {
    const { isLoading, error, loadDataset } = useExampleDatasetLogic({ onClose });
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);

    const filteredFiles = exampleFiles.sav.filter(file =>
        selectedTags.length === 0 || selectedTags.some(tag => file.tags?.includes(tag))
    );

    

    return (
        <div className="flex flex-col h-full" data-testid="example-dataset-modal">
            <div className="px-6 py-4 border-b border-border flex items-center flex-shrink-0" data-testid="modal-header">
                <Database size={18} className="mr-2.5 flex-shrink-0 text-primary" />
                <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold text-lg text-popover-foreground" data-testid="modal-title">
                        Example Data
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate" data-testid="modal-description">
                        Select a dataset (.sav) to start your analysis.
                    </p>
                </div>
            </div>

            <div className="relative p-6 flex-grow overflow-y-auto" data-testid="modal-content">
                <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-2" data-testid="tags-container">
                    {Array.from(new Set(exampleFiles.sav.flatMap(f => f.tags))).map(tag => (
                        <Button 
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            size="sm"
                            className="whitespace-nowrap"
                            data-testid={`tag-button-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                            onClick={() => setSelectedTags(prev =>
                                prev.includes(tag) 
                                    ? prev.filter(t => t !== tag) 
                                    : [...prev, tag]
                            )}
                        >
                            {tag}
                        </Button>
                    ))}
                </div>
                
                {isLoading && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center z-10">
                        <Loader2
                            className="h-8 w-8 animate-spin text-foreground"
                            data-testid="loading-spinner"
                            role="status"
                            aria-label="loading"
                        />
                    </div>
                )}
                {error && (
                    <Alert variant="destructive" className="mb-4" data-testid="error-alert">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                <h4 className="text-base font-semibold text-popover-foreground mb-1" data-testid="datasets-title">SPSS Datasets (.sav)</h4>
                <p className="text-sm text-muted-foreground mb-4" data-testid="datasets-description">
                    Choose from the example datasets below.
                </p>
                <div data-testid="datasets-grid">
                    {renderFileList(filteredFiles, loadDataset, isLoading)}
                </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex items-center justify-end bg-secondary flex-shrink-0" data-testid="modal-footer">
                <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="cancel-button">
                    Cancel
                </Button>
            </div>
        </div>
    );
};
