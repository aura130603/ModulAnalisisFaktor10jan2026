import type { TimeComponent } from "../types";

export const getTimeComponentsFromCase = (selectedCase: string): TimeComponent[] => {
    const components: TimeComponent[] = [];

    if (selectedCase.includes("Years")) {
        components.push({ name: "Year", value: 1900 });
    }

    if (selectedCase.includes("quarters")) {
        components.push({ name: "Quarter", value: 1, periodicity: 4 });
    }

    if (selectedCase.includes("months")) {
        components.push({ name: "Month", value: 1, periodicity: 12 });
    }

    if (selectedCase.includes("Weeks")) {
        components.push({ name: "Week", value: 1 });
    }

    if (selectedCase === "Days") {
        components.push({ name: "Day", value: 1 });
    } else if (selectedCase.startsWith("Days,")) {
        components.push({ name: "Day", value: 1 });
    } else if (selectedCase.includes("work days")) {
        if (selectedCase.includes("work days(6)")) {
            components.push({ name: "Work day", value: 1, periodicity: 6 });
        } else {
            components.push({ name: "Work day", value: 1, periodicity: 5 });
        }
    } else if (
        selectedCase.includes("days") &&
        !selectedCase.includes("work hour")
    ) {
        if (selectedCase.includes("Weeks")) {
            components.push({ name: "Day", value: 1, periodicity: 7 });
        } else {
            components.push({ name: "Day", value: 1 });
        }
    }

    if (selectedCase.includes("work hour(8)")) {
        components.push({ name: "Work hour", value: 1, periodicity: 8 });
    } else if (selectedCase.includes("work hour")) {
        components.push({ name: "Work hour", value: 1, periodicity: 8 });
    } else if (
        selectedCase.includes("Hours") ||
        selectedCase.includes("hours")
    ) {
        if (selectedCase.includes("Days") || selectedCase.includes("days")) {
            components.push({ name: "Hour", value: 0, periodicity: 24 });
        } else {
            components.push({ name: "Hour", value: 0 });
        }
    }

    if (
        selectedCase.includes("Minutes") ||
        selectedCase.includes("minutes")
    ) {
        if (selectedCase.includes("Hours") || selectedCase.includes("hours")) {
            components.push({ name: "Minute", value: 0, periodicity: 60 });
        } else {
            components.push({ name: "Minute", value: 0 });
        }
    }

    if (
        selectedCase.includes("Seconds") ||
        selectedCase.includes("seconds")
    ) {
        if (
            selectedCase.includes("Minutes") ||
            selectedCase.includes("minutes")
        ) {
            components.push({ name: "Second", value: 0, periodicity: 60 });
        } else {
            components.push({ name: "Second", value: 0 });
        }
    }

    return components;
};

export const formatDateForMetaStore = (
    selectedCase: string,
    timeComponents: TimeComponent[]
): string => {
    if (selectedCase === "Not dated") return "";

    return timeComponents
        .map((component) => {
            const periodicityStr = component.periodicity ? `;${component.periodicity}` : "";
            return `${component.name}(${component.value}${periodicityStr})`;
        })
        .join("");
};

export const getDateFormatString = (timeComponents: TimeComponent[]): string => {
    if (timeComponents.length === 0) return "";

    const formatParts: string[] = [];

    const hasYear = timeComponents.some((c) => c.name === "Year");
    const hasQuarter = timeComponents.some((c) => c.name === "Quarter");
    const hasMonth = timeComponents.some((c) => c.name === "Month");
    const hasWeek = timeComponents.some((c) => c.name === "Week");
    const hasDay =
        timeComponents.some((c) => c.name === "Day") ||
        timeComponents.some((c) => c.name === "Work day");
    const hasHour =
        timeComponents.some((c) => c.name === "Hour") ||
        timeComponents.some((c) => c.name === "Work hour");
    const hasMinute = timeComponents.some((c) => c.name === "Minute");
    const hasSecond = timeComponents.some((c) => c.name === "Second");

    if (hasYear) {
        if (hasQuarter && hasMonth) {
            formatParts.push("YYYY-QQ-MM");
        } else if (hasQuarter) {
            formatParts.push("YYYY-QQ");
        } else if (hasMonth) {
            formatParts.push("YYYY-MM");
        } else {
            formatParts.push("YYYY");
        }
    } else if (hasWeek) {
        if (hasDay) {
            formatParts.push("WW-D");
        } else {
            formatParts.push("WW");
        }
    } else if (hasDay) {
        formatParts.push("DD");
    }

    if (hasHour) {
        if (hasMinute) {
            if (hasSecond) {
                formatParts.push("HH:MM:SS");
            } else {
                formatParts.push("HH:MM");
            }
        } else {
            formatParts.push("HH");
        }
    } else if (hasMinute) {
        if (hasSecond) {
            formatParts.push("MM:SS");
        } else {
            formatParts.push("MM");
        }
    } else if (hasSecond) {
        formatParts.push("SS");
    }

    return formatParts.join(" ");
};

export const formatDateString = (
    values: Record<string, number>,
    timeComponents: TimeComponent[]
): string => {
    const componentNames = timeComponents.map((c) => c.name.toLowerCase());
    const dateParts: string[] = [];
    const timeParts: string[] = [];

    // --- Date Parts ---
    let yearPart = "";
    if (componentNames.includes("year")) {
        yearPart = String(values["year"]);
        if (componentNames.includes("month")) {
            yearPart += `-${String(values["month"]).padStart(2, "0")}`;
        }
        // Quarter is usually exclusive of month
        else if (componentNames.includes("quarter")) {
            yearPart += `-Q${values["quarter"]}`;
        }
    }
    if (yearPart) {
        dateParts.push(yearPart);
    }

    if (componentNames.includes("week")) {
        dateParts.push(`W${values["week"]}`);
    }

    if (componentNames.includes("day") || componentNames.includes("work day")) {
        const dayValue = values["day"] || values["work day"];
        dateParts.push(String(dayValue));
    }

    // --- Time Parts ---
    if (componentNames.includes("hour") || componentNames.includes("work hour")) {
        const hourValue = values["hour"] !== undefined ? values["hour"] : values["work hour"];
        if (hourValue !== undefined) {
            timeParts.push(String(hourValue).padStart(2, "0"));
        }
    }

    if (componentNames.includes("minute") && values["minute"] !== undefined) {
        timeParts.push(String(values["minute"]).padStart(2, "0"));
    }

    if (componentNames.includes("second") && values["second"] !== undefined) {
        timeParts.push(String(values["second"]).padStart(2, "0"));
    }

    // --- Combination ---
    const finalParts = [];
    if (dateParts.length > 0) {
        finalParts.push(dateParts.join(" "));
    }
    if (timeParts.length > 0) {
        finalParts.push(timeParts.join(":"));
    }

    return finalParts.join(" ");
};

export const formatCurrentDates = (
    selectedCase: string,
    timeComponents: TimeComponent[]
): string => {
    if (selectedCase === "Not dated") return "Not dated";

    return timeComponents
        .map((component) => {
            const periodicityStr = component.periodicity ? `(${component.periodicity})` : "";
            return `${component.name}(${component.value})${periodicityStr}`;
        })
        .join("");
};

export const getMaxRow = (data: any[]): number => {
    return data.length;
}; 