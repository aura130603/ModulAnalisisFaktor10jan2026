// components/OptionsLinear.tsx
import React, { useState, useEffect } from 'react';
// Remove Dialog imports
// import {
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

// Define and Export Params Type
export interface OptionsLinearParams {
  steppingMethod: string;
  probEntry: string;
  probRemoval: string;
  fvalueEntry: string;
  fvalueRemoval: string;
  includeConstant: boolean;
  replaceWithMean: boolean;
}

// Update Props interface
interface OptionsLinearProps {
  params: OptionsLinearParams;
  onChange: (newParams: Partial<OptionsLinearParams>) => void;
  showAlert: (title: string, description: string) => void;
}

const OptionsLinear: React.FC<OptionsLinearProps> = ({ params, onChange }) => {
  // Local state initialized from props
  const [includeConstant, setIncludeConstant] = useState(params.includeConstant);
  const [replaceWithMean, setReplaceWithMean] = useState(params.replaceWithMean);

  // Effect to sync local state with incoming params prop changes
  useEffect(() => {
    setIncludeConstant(params.includeConstant);
    setReplaceWithMean(params.replaceWithMean);
  }, [params]);

  // Generic handler to update local state and call onChange prop
  const handleChange = (field: keyof OptionsLinearParams, value: any) => {
    switch (field) {
        case 'includeConstant':
            setIncludeConstant(value);
            onChange({ [field]: value });
            break;
        case 'replaceWithMean':
            setReplaceWithMean(value);
            onChange({ [field]: value });
            break;
    }
  };
  
    return (
    <div className="p-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Model Section */}
          <div className="border rounded-lg p-4 bg-background">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Model Parameters</h4>
            <div className="flex items-center pl-2">
              <Checkbox
                checked={includeConstant}
                onCheckedChange={(checked) => handleChange('includeConstant', !!checked)}
                id="includeConstant"
              />
              <label htmlFor="includeConstant" className="ml-3 text-sm">
                Include constant in equation
              </label>
            </div>
          </div>

          {/* Missing Values Section */}
          <div className="border rounded-lg p-4 bg-background">
            <h4 className="font-medium mb-3 text-sm text-muted-foreground">Missing Values</h4>
             <div className="flex flex-col space-y-2 pl-2">
                <div className="flex items-center">
                    <Checkbox
                        id="replaceWithMean"
                        checked={replaceWithMean}
                        onCheckedChange={(checked) => handleChange('replaceWithMean', !!checked)}
                    />
                     <label htmlFor="replaceWithMean" className="ml-3 text-sm">
                        Replace with mean
                    </label>
                </div>
             </div>
          </div>
        </div>
    </div>
  );
};

export default OptionsLinear;
