import type { Variable } from '@/types/Variable';
import type { UnusualCasesHook } from '../types';

interface UnusualCasesResult {
    variablesToCreate: Partial<Variable>[];
    // In a real implementation, a worker would produce cellUpdates here.
}

/**
 * Creates a default variable definition.
 * The `addVariables` store action will handle name processing and column indexing.
 */
const createDefaultVariable = (
    name: string,
    label: string,
    type: 'NUMERIC' | 'STRING' = 'NUMERIC'
): Partial<Variable> => ({
    name,
    label,
    type,
    width: type === 'STRING' ? 20 : 8,
    decimals: type === 'NUMERIC' ? 2 : 0,
    align: type === 'STRING' ? 'left' : 'right',
    measure: type === 'STRING' ? 'nominal' : 'scale',
    role: 'input',
});

/**
 * Prepares the definitions for new variables based on the user's save selections.
 * This service does not interact with stores directly.
 * @param saveOptions - The state of the save options from the UI.
 * @returns An object containing an array of new variable definitions.
 */
export const prepareNewUnusualCasesVariables = (
    saveOptions: Pick<UnusualCasesHook, 'saveAnomalyIndex' | 'anomalyIndexName' | 'savePeerGroups' | 'saveReasons'>
): UnusualCasesResult => {

    const variablesToCreate: Partial<Variable>[] = [];

    if (saveOptions.saveAnomalyIndex) {
        variablesToCreate.push(createDefaultVariable(saveOptions.anomalyIndexName, 'Anomaly Index'));
    }

    if (saveOptions.savePeerGroups) {
        variablesToCreate.push(createDefaultVariable('PeerGroupID', 'Peer Group ID'));
        variablesToCreate.push(createDefaultVariable('PeerGroupSize', 'Peer Group Size'));
        variablesToCreate.push(createDefaultVariable('PeerGroupSizePct', 'Peer Group Size (%)'));
    }

    if (saveOptions.saveReasons) {
        // As per the README, this could create multiple variables.
        // We'll create one set of reason variables as an example.
        const reasonNumber = 1;
        variablesToCreate.push(createDefaultVariable(`ReasonVariable_${reasonNumber}`, `Reason ${reasonNumber}: Variable`, 'STRING'));
        variablesToCreate.push(createDefaultVariable(`ReasonValue_${reasonNumber}`, `Reason ${reasonNumber}: Value`, 'STRING'));
        variablesToCreate.push(createDefaultVariable(`ReasonNorm_${reasonNumber}`, `Reason ${reasonNumber}: Deviation from Norm`));
    }

    return { variablesToCreate };
}; 