// "use client";
// import React, { useState, FC, useCallback, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Info } from "lucide-react";
// import type { RecodeRule } from './index'; // Import RecodeRule from the main modal component
// import type { VariableType } from "@/types/Variable";

// interface OldNewValuesSetupProps {
//     recodeListType: 'NUMERIC' | 'STRING' | null;
//     recodeRules: RecodeRule[];
//     setRecodeRules: React.Dispatch<React.SetStateAction<RecodeRule[]>>;
//     onCloseSetup: () => void; // To go back to the variable selection view
//     variableCount?: number; // Jumlah variabel yang akan direkode
// }

// const OldNewValuesSetup: FC<OldNewValuesSetupProps> = ({
//     recodeListType,
//     recodeRules,
//     setRecodeRules,
//     onCloseSetup,
//     variableCount = 0,
// }) => {
//     // --- State for Old Value inputs ---
//     const [oldValueSelectionType, setOldValueSelectionType] = useState<'value' | 'systemMissing' | 'systemOrUserMissing' | 'range' | 'rangeLowest' | 'rangeHighest' | 'else'>('value');
//     const [oldSingleValue, setOldSingleValue] = useState<string>("");
//     const [oldRangeMin, setOldRangeMin] = useState<string>("");
//     const [oldRangeMax, setOldRangeMax] = useState<string>("");
//     const [oldRangeLowestMax, setOldRangeLowestMax] = useState<string>(""); // For LOWEST through value
//     const [oldRangeHighestMin, setOldRangeHighestMin] = useState<string>(""); // For value through HIGHEST

//     // --- State for New Value inputs ---
//     const [newValueSelectionType, setNewValueSelectionType] = useState<'value' | 'systemMissing'>('value');
//     const [newSingleValue, setNewSingleValue] = useState<string>("");

//     // --- State for managing the list of rules ---
//     const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

//     const isNumeric = recodeListType === 'NUMERIC';
//     const isString = recodeListType === 'STRING';

//     // Effect to reset specific range inputs when main range type changes
//     useEffect(() => {
//         if (oldValueSelectionType !== 'range') {
//             setOldRangeMin("");
//             setOldRangeMax("");
//         }
//         if (oldValueSelectionType !== 'rangeLowest') {
//             setOldRangeLowestMax("");
//         }
//         if (oldValueSelectionType !== 'rangeHighest') {
//             setOldRangeHighestMin("");
//         }
//         if (oldValueSelectionType !== 'value') {
//             setOldSingleValue("");
//         }
//     }, [oldValueSelectionType]);

//     const populateFieldsFromSelectedRule = useCallback(() => {
//         if (!selectedRuleId) return;
//         const rule = recodeRules.find(r => r.id === selectedRuleId);
//         if (!rule) return;

//         setOldValueSelectionType(rule.oldValueType);
//         setNewValueSelectionType(rule.newValueType);

//         // Populate Old Value fields
//         switch (rule.oldValueType) {
//             case 'value':
//                 setOldSingleValue(String(rule.oldValue ?? ""));
//                 break;
//             case 'range':
//                 if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
//                     setOldRangeMin(String(rule.oldValue[0] ?? ""));
//                     setOldRangeMax(String(rule.oldValue[1] ?? ""));
//                 }
//                 break;
//             case 'rangeLowest':
//                  if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
//                     setOldRangeLowestMax(String(rule.oldValue[1] ?? ""));
//                 }
//                 break;
//             case 'rangeHighest':
//                 if (Array.isArray(rule.oldValue) && rule.oldValue.length === 2) {
//                     setOldRangeHighestMin(String(rule.oldValue[0] ?? ""));
//                 }
//                 break;
//             case 'systemMissing':
//             case 'systemOrUserMissing':
//             case 'else':
//                 // No specific input fields for these beyond the radio button
//                 break;
//         }

//         // Populate New Value fields
//         if (rule.newValueType === 'value') {
//             setNewSingleValue(String(rule.newValue ?? ""));
//         } else {
//             setNewSingleValue(""); // Clear if new value is systemMissing
//         }

//     }, [selectedRuleId, recodeRules]);

//     useEffect(() => {
//         populateFieldsFromSelectedRule();
//     }, [selectedRuleId, populateFieldsFromSelectedRule]);

//     const handleRuleAction = (action: 'add' | 'change') => {
//         const newId = action === 'add' ? Date.now().toString() : selectedRuleId;
//         if (!newId) return;

//         let tempOldValueDisplay = "";
//         let tempOldValueActual: string | number | [number | null, number | null] | null = null;

//         switch (oldValueSelectionType) {
//             case 'value':
//                 if (oldSingleValue.trim() === "") { alert("Old value cannot be empty."); return; }
//                 tempOldValueDisplay = oldSingleValue;
//                 tempOldValueActual = isNumeric ? parseFloat(oldSingleValue) : oldSingleValue;
//                 break;
//             case 'range':
//                 if (oldRangeMin.trim() === "" || oldRangeMax.trim() === "") { alert("Both min and max range values must be provided."); return; }
//                 const min = parseFloat(oldRangeMin);
//                 const max = parseFloat(oldRangeMax);
//                 if (isNaN(min) || isNaN(max)) { alert("Range values must be numeric."); return;}
//                 if (min > max) { alert("Min range value cannot be greater than Max."); return; }
//                 tempOldValueDisplay = `${oldRangeMin}-${oldRangeMax}`;
//                 tempOldValueActual = [min, max];
//                 break;
//             case 'rangeLowest':
//                 if (oldRangeLowestMax.trim() === "") { alert("Max value for LOWEST range must be provided."); return; }
//                 const lowestMax = parseFloat(oldRangeLowestMax);
//                 if (isNaN(lowestMax)) { alert("Range value must be numeric."); return;}
//                 tempOldValueDisplay = `LOWEST-${oldRangeLowestMax}`;
//                 tempOldValueActual = [null, lowestMax];
//                 break;
//             case 'rangeHighest':
//                 if (oldRangeHighestMin.trim() === "") { alert("Min value for HIGHEST range must be provided."); return; }
//                 const highestMin = parseFloat(oldRangeHighestMin);
//                 if (isNaN(highestMin)) { alert("Range value must be numeric."); return;}
//                 tempOldValueDisplay = `${oldRangeHighestMin}-HIGHEST`;
//                 tempOldValueActual = [highestMin, null];
//                 break;
//             case 'systemMissing':
//                 tempOldValueDisplay = "SYSMIS";
//                 tempOldValueActual = null;
//                 break;
//             case 'systemOrUserMissing':
//                 tempOldValueDisplay = "MISSING";
//                 tempOldValueActual = null;
//                 break;
//             case 'else':
//                 tempOldValueDisplay = "ELSE";
//                 tempOldValueActual = null;
//                 break;
//         }

//         let tempNewValueDisplay = "";
//         let tempNewValueActual: string | number | null = null;

//         if (newValueSelectionType === 'value') {
//             if (newSingleValue.trim() === "") { alert("New value cannot be empty if type is 'Value'."); return; }
//             tempNewValueDisplay = newSingleValue;
//             tempNewValueActual = isNumeric ? parseFloat(newSingleValue) : newSingleValue;
//         } else {
//             tempNewValueDisplay = "SYSMIS";
//             tempNewValueActual = null;
//         }

//         const rule: RecodeRule = {
//             id: newId,
//             oldValueType: oldValueSelectionType,
//             oldValue: tempOldValueActual,
//             oldValueDisplay: tempOldValueDisplay,
//             newValueType: newValueSelectionType,
//             newValue: tempNewValueActual,
//             newValueDisplay: tempNewValueDisplay,
//         };

//         if (action === 'add') {
//             setRecodeRules(prev => [...prev, rule].sort(sortRules));
//         } else {
//             setRecodeRules(prev => prev.map(r => r.id === newId ? rule : r).sort(sortRules));
//         }

//         // Reset input fields only on add
//         if (action === 'add') {
//              setOldSingleValue(""); setOldRangeMin(""); setOldRangeMax("");
//              setOldRangeLowestMax(""); setOldRangeHighestMin("");
//              setNewSingleValue("");
//              // setOldValueSelectionType('value'); // Optionally reset radio selections
//              // setNewValueSelectionType('value');
//         }
//        setSelectedRuleId(null); // Deselect after add/change
//     };

//     const handleRemoveRule = () => {
//         if (selectedRuleId) {
//             setRecodeRules(prev => prev.filter(rule => rule.id !== selectedRuleId));
//             setSelectedRuleId(null);
//         }
//     };

//     const sortRules = (a: RecodeRule, b: RecodeRule): number => {
//         const typeOrder: RecodeRule['oldValueType'][] = ['systemMissing', 'systemOrUserMissing', 'value', 'range', 'rangeLowest', 'rangeHighest', 'else'];
//         const typeAIndex = typeOrder.indexOf(a.oldValueType);
//         const typeBIndex = typeOrder.indexOf(b.oldValueType);

//         if (typeAIndex !== typeBIndex) {
//             return typeAIndex - typeBIndex;
//         }

//         // Secondary sorting for rules of the same type
//         switch (a.oldValueType) {
//             case 'value':
//                 if (typeof a.oldValue === 'number' && typeof b.oldValue === 'number') {
//                     return a.oldValue - b.oldValue;
//                 }
//                 return String(a.oldValue ?? '').localeCompare(String(b.oldValue ?? ''));
//             case 'range':
//                 // Assuming oldValue is [min, max] and both are numbers for numeric recode
//                 if (Array.isArray(a.oldValue) && Array.isArray(b.oldValue) && isNumeric) {
//                     const aMin = a.oldValue[0] as number;
//                     const bMin = b.oldValue[0] as number;
//                     if (aMin !== bMin) return aMin - bMin;
//                     const aMax = a.oldValue[1] as number;
//                     const bMax = b.oldValue[1] as number;
//                     return aMax - bMax;
//                 }
//                 break;
//             case 'rangeLowest':
//                 // Sort by the max value (oldValue[1])
//                 if (Array.isArray(a.oldValue) && Array.isArray(b.oldValue) && isNumeric) {
//                     const aMax = a.oldValue[1] as number;
//                     const bMax = b.oldValue[1] as number;
//                     return aMax - bMax;
//                 }
//                 break;
//             case 'rangeHighest':
//                 // Sort by the min value (oldValue[0])
//                 if (Array.isArray(a.oldValue) && Array.isArray(b.oldValue) && isNumeric) {
//                     const aMin = a.oldValue[0] as number;
//                     const bMin = b.oldValue[0] as number;
//                     return aMin - bMin;
//                 }
//                 break;
//             // systemMissing, systemOrUserMissing, else usually don't have multiple distinct entries to sort among themselves in complex ways
//             // but if they did, further logic could be added here.
//         }
//         return 0; // Default if no other sorting applies
//     };

//     return (
//         <>
//             {/* Info Alert - rules apply to all variables */}
//             <Alert className="mb-4 bg-blue-50 border border-blue-200">
//                 <Info className="h-4 w-4 text-blue-500" />
//                 <AlertDescription>
//                     The recode rules defined here will apply to all {variableCount} selected {recodeListType?.toLowerCase()} variable{variableCount !== 1 ? 's' : ''}.
//                 </AlertDescription>
//             </Alert>

//             <div className="grid grid-cols-3 gap-4">
//                 {/* Old Value Section (Column 1) */}
//                 <div className="border rounded-md p-3 bg-[#FAFAFA]">
//                     <h3 className="font-semibold mb-2">Old Value</h3>
//                     <RadioGroup
//                         value={oldValueSelectionType}
//                         onValueChange={(v) => setOldValueSelectionType(v as any)}
//                         className="space-y-2"
//                     >
//                         <div className="flex items-center space-x-2">
//                             <RadioGroupItem value="value" id="old-value" />
//                             <Label htmlFor="old-value" className="text-sm cursor-pointer">Value</Label>
//                             {oldValueSelectionType === 'value' && (
//                                 <div className="ml-2 flex-1">
//                                     <Input
//                                         className="h-7"
//                                         value={oldSingleValue}
//                                         onChange={(e) => setOldSingleValue(e.target.value)}
//                                         placeholder={isNumeric ? "e.g. 42" : "e.g. Male"}
//                                     />
//                                 </div>
//                             )}
//                         </div>

//                         {isNumeric && (
//                             <>
//                                 <div className="flex items-center space-x-2">
//                                     <RadioGroupItem value="systemMissing" id="old-sysmis" />
//                                     <Label htmlFor="old-sysmis" className="text-sm cursor-pointer">System-missing</Label>
//                                 </div>

//                                 <div className="flex items-center space-x-2">
//                                     <RadioGroupItem value="systemOrUserMissing" id="old-missing" />
//                                     <Label htmlFor="old-missing" className="text-sm cursor-pointer">System- or user-missing</Label>
//                                 </div>

//                                 <div className="flex items-center space-x-2">
//                                     <RadioGroupItem value="range" id="old-range" />
//                                     <Label htmlFor="old-range" className="text-sm cursor-pointer">Range</Label>
//                                 </div>

//                                 {oldValueSelectionType === 'range' && (
//                                     <div className="ml-6 grid grid-cols-2 gap-2 items-center">
//                                         <Input
//                                             className="h-7"
//                                             value={oldRangeMin}
//                                             onChange={(e) => setOldRangeMin(e.target.value)}
//                                             placeholder="Min"
//                                         />
//                                         <span className="text-center">through</span>
//                                         <Input
//                                             className="h-7"
//                                             value={oldRangeMax}
//                                             onChange={(e) => setOldRangeMax(e.target.value)}
//                                             placeholder="Max"
//                                         />
//                                     </div>
//                                 )}

//                                 <div className="flex items-center space-x-2">
//                                     <RadioGroupItem value="rangeLowest" id="old-range-lowest" />
//                                     <Label htmlFor="old-range-lowest" className="text-sm cursor-pointer">Range LOWEST through</Label>
//                                 </div>

//                                 {oldValueSelectionType === 'rangeLowest' && (
//                                     <div className="ml-6">
//                                         <Input
//                                             className="h-7"
//                                             value={oldRangeLowestMax}
//                                             onChange={(e) => setOldRangeLowestMax(e.target.value)}
//                                             placeholder="Max value"
//                                         />
//                                     </div>
//                                 )}

//                                 <div className="flex items-center space-x-2">
//                                     <RadioGroupItem value="rangeHighest" id="old-range-highest" />
//                                     <Label htmlFor="old-range-highest" className="text-sm cursor-pointer">Range through HIGHEST</Label>
//                                 </div>

//                                 {oldValueSelectionType === 'rangeHighest' && (
//                                     <div className="ml-6">
//                                         <Input
//                                             className="h-7"
//                                             value={oldRangeHighestMin}
//                                             onChange={(e) => setOldRangeHighestMin(e.target.value)}
//                                             placeholder="Min value"
//                                         />
//                                     </div>
//                                 )}
//                             </>
//                         )}

//                         <div className="flex items-center space-x-2">
//                             <RadioGroupItem value="else" id="old-else" />
//                             <Label htmlFor="old-else" className="text-sm cursor-pointer">All other values</Label>
//                         </div>
//                     </RadioGroup>
//                 </div>

//                 {/* New Value Section (Column 2) */}
//                 <div className="border rounded-md p-3 bg-[#FAFAFA]">
//                     <h3 className="font-semibold mb-2">New Value</h3>
//                     <RadioGroup
//                         value={newValueSelectionType}
//                         onValueChange={(v) => setNewValueSelectionType(v as any)}
//                         className="space-y-2"
//                     >
//                         <div className="flex items-center space-x-2">
//                             <RadioGroupItem value="value" id="new-value" />
//                             <Label htmlFor="new-value" className="text-sm cursor-pointer">Value</Label>
//                             {newValueSelectionType === 'value' && (
//                                 <div className="ml-2 flex-1">
//                                     <Input
//                                         className="h-7"
//                                         value={newSingleValue}
//                                         onChange={(e) => setNewSingleValue(e.target.value)}
//                                         placeholder={isNumeric ? "e.g. 99" : "e.g. Unknown"}
//                                     />
//                                 </div>
//                             )}
//                         </div>

//                         {isNumeric && (
//                             <div className="flex items-center space-x-2">
//                                 <RadioGroupItem value="systemMissing" id="new-sysmis" />
//                                 <Label htmlFor="new-sysmis" className="text-sm cursor-pointer">System-missing</Label>
//                             </div>
//                         )}
//                     </RadioGroup>

//                     <div className="mt-4 space-y-2">
//                         <Button
//                             type="button"
//                             size="sm"
//                             onClick={() => handleRuleAction('add')}
//                             className="w-full"
//                         >
//                             Add
//                         </Button>
//                         <Button
//                             type="button"
//                             size="sm"
//                             onClick={() => handleRuleAction('change')}
//                             disabled={!selectedRuleId}
//                             className="w-full"
//                             variant="outline"
//                         >
//                             Change
//                         </Button>
//                         <Button
//                             type="button"
//                             size="sm"
//                             onClick={handleRemoveRule}
//                             disabled={!selectedRuleId}
//                             className="w-full"
//                             variant="outline"
//                         >
//                             Remove
//                         </Button>
//                     </div>
//                 </div>

//                 {/* Old -&gt; New Rules Display (Column 3) */}
//                 <div className="border rounded-md p-3 bg-[#FAFAFA]">
//                     <h3 className="font-semibold mb-2">Old -&gt; New</h3>
//                     <div className="h-[300px]">
//                         <ScrollArea className="h-full pr-2">
//                             {recodeRules.length === 0 ? (
//                                 <div className="text-sm text-gray-500 italic">No rules defined.</div>
//                             ) : (
//                                 recodeRules.map(rule => (
//                                     <div
//                                         key={rule.id}
//                                         className={`mb-1 p-1.5 rounded-md text-sm cursor-pointer hover:bg-gray-100 ${selectedRuleId === rule.id ? 'bg-blue-100 hover:bg-blue-100' : ''}`}
//                                         onClick={() => setSelectedRuleId(rule.id === selectedRuleId ? null : rule.id)}
//                                     >
//                                         <div>
//                                             {rule.oldValueDisplay} to {rule.newValueDisplay}
//                                         </div>
//                                     </div>
//                                 ))
//                             )}
//                         </ScrollArea>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// };

// export default OldNewValuesSetup;
