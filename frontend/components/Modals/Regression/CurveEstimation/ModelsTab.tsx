import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ModelsTabProps {
    selectedModels: string[];
    handleModelChange: (model: string) => void;
    includeConstant: boolean;
    setIncludeConstant: (value: boolean) => void;
    plotModels: boolean;
    setPlotModels: (value: boolean) => void;
    upperBound: string;
    setUpperBound: (value: string) => void;
    isProcessing: boolean;
}

const ModelsTab: React.FC<ModelsTabProps> = ({
                                                 selectedModels,
                                                 handleModelChange,
                                                 includeConstant,
                                                 setIncludeConstant,
                                                 plotModels,
                                                 setPlotModels,
                                                 upperBound,
                                                 setUpperBound,
                                                 isProcessing
                                             }) => {
    // List of available models
    const availableModels = [
        'Linear',
        'Quadratic',
        'Compound',
        'Growth',
        'Logarithmic',
        'Cubic',
        'S',
        'Exponential',
        'Inverse',
        'Power',
        'Logistic',
    ];

    return (
        <div className="p-4">
            <div className="space-y-4">
                {/* Model Selection */}
                <div className="border border-border rounded-md p-4 bg-background">
                    <div className="text-sm font-medium mb-3 text-muted-foreground">Model Selection</div>
                    <div className="grid grid-cols-3 gap-2">
                        {availableModels.map((model) => (
                            <div key={model} className="flex items-center">
                                <Checkbox
                                    id={`model-${model}`}
                                    checked={selectedModels.includes(model)}
                                    onCheckedChange={() => handleModelChange(model)}
                                    disabled={isProcessing}
                                    className="mr-2"
                                />
                                <Label htmlFor={`model-${model}`} className="text-sm font-normal cursor-pointer">{model}</Label>
                            </div>
                        ))}
                    </div>

                    {selectedModels.includes('Logistic') && (
                        <div className="mt-4">
                            <Label htmlFor="upperBound" className="text-sm">Upper Bound:</Label>
                            <Input
                                id="upperBound"
                                type="number"
                                placeholder="Enter upper bound"
                                value={upperBound}
                                onChange={(e) => setUpperBound(e.target.value)}
                                className="mt-1 h-8 text-sm"
                                disabled={isProcessing}
                            />
                        </div>
                    )}
                </div>

                {/* Options */}
                <div className="border border-border rounded-md p-4 bg-background">
                    <div className="text-sm font-medium mb-3 text-muted-foreground">Options</div>

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Checkbox
                                id="includeConstant"
                                checked={includeConstant}
                                onCheckedChange={(checked) => setIncludeConstant(!!checked)}
                                disabled={isProcessing}
                                className="mr-2"
                            />
                            <Label htmlFor="includeConstant" className="text-sm font-normal cursor-pointer">Include constant in equation</Label>
                        </div>

                        <div className="flex items-center">
                            <Checkbox
                                id="plotModels"
                                checked={plotModels}
                                onCheckedChange={(checked) => setPlotModels(!!checked)}
                                disabled={isProcessing}
                                className="mr-2"
                            />
                            <Label htmlFor="plotModels" className="text-sm font-normal cursor-pointer">Plot models</Label>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelsTab;