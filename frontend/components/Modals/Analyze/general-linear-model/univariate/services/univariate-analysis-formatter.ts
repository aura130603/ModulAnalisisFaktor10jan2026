import { ResultJson } from "@/types/Table";
import { formatPart1 } from "./formatter_part1";
import { formatPart2 } from "./formatter_part2";
import { formatPart3 } from "./formatter_part3";

export function transformUnivariateResult(
    data: any,
    errors: string[] = []
): ResultJson {
    const resultJson: ResultJson = {
        tables: [],
    };

    formatPart1(data, resultJson);
    formatPart2(data, resultJson);
    formatPart3(data, resultJson, errors);

    return resultJson;
}
