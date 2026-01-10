import {
    OptScaDefineMainType,
    OptScaDefineType,
} from "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/types/optimal-scaling-define";

export const OptScaDefineMainDefault: OptScaDefineMainType = {
    AllVarsMultiNominal: true,
    SomeVarsNotMultiNominal: false,
    OneSet: true,
    MultipleSets: false,
};

export const OptScaDefineDefault: OptScaDefineType = {
    main: OptScaDefineMainDefault,
};
