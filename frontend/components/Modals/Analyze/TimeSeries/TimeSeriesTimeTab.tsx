import React, { FC } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTimeSeriesStore } from "@/stores/useTimeSeriesStore";

interface PeriodOption {
    value: string;
    label: string;
    id: string;
}

interface TimeTabProps{
    periods: PeriodOption[],
    selectedPeriod: [string, string],
    handleSelectedPeriod: (id: string) => void,
    inputPeriods: (period: string) => React.ReactNode
}

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const TimeTab: FC<TimeTabProps> = ({
    periods,
    selectedPeriod,
    handleSelectedPeriod,
    inputPeriods,
})  => {
    const { getTypeDate, getYear, getMonth, getDay, getHour, getDayName } = useTimeSeriesStore();
    return(
        <div className="flex flex-row">
            <div className="rounded-md border-2 sm:p-4 p-4 h-full w-full">
                <div>
                        <label className="font-semibold">Time Option</label>
                </div>
                <div className="flex items-center mt-4">
                    <div className="flex flex-row w-3/4">
                        <div className="flex items-center">
                            <label className="w-[130px] text-sm font-semibold">
                                time spesification :
                            </label>
                        </div>
                        <Select 
                            onValueChange={handleSelectedPeriod} 
                            defaultValue={selectedPeriod[1]}
                        >
                            <SelectTrigger className="">
                                <SelectValue>{selectedPeriod[1]}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {periods.map((period) => (
                                    <SelectItem key={period.id} value={period.id}>
                                        {period.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-col mt-5">
                    {inputPeriods(getTypeDate())}
                </div>
                <div className="mt-4 w-full text-sm font-semibold">
                    <label>
                        periodicity : {selectedPeriod[0] === '0' ? "don't have periodicity" : selectedPeriod[0]}
                    </label>
                </div>
                <div className="mt-4 w-full text-sm font-semibold">
                    <label>
                        start time : {
                            getTypeDate() === 'y' ? `${getYear()}` : 
                            getTypeDate() === 'ys' ? `Semester 1 in ${getYear()}` : 
                            getTypeDate() === 'yq' ? `Quartal 1 in ${getYear()}` : 
                            getTypeDate() === 'ym' ? `${months[getMonth()-1]} ${getYear()}` : 
                            getTypeDate() === 'wwd5' ? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()}` : 
                            getTypeDate() === 'wwd6' ? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()}` : 
                            getTypeDate() === 'wd' ? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()}` : 
                            getTypeDate() === 'dwh' && getHour() < 10? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()} at 0${getHour()}:00` : 
                            getTypeDate() === 'dwh'? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()} at ${getHour()}:00` : 
                            getTypeDate() === 'dh' && getHour() < 10? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()} at 0${getHour()}:00` : 
                            getTypeDate() === 'dh'? `${getDayName()}, ${getDay()} ${months[getMonth()-1]} ${getYear()} at ${getHour()}:00` : 
                            '00:00'
                        }
                    </label>
                </div>
            </div>
        </div>
    )
};

export default TimeTab;