import { format } from "date-fns";

const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const switchMonth = (day: number, month: number, year: number): [number, number, number] => {
    switch (month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            if (day > 31) {
                day = 1;
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
                return [day, month, year];
            }
            break;
        case 4: case 6: case 9: case 11:
            if (day > 30) {
                day = 1;
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
                return [day, month, year];
            }
            break;
        case 2:
            if (day > (year % 4 === 0 ? 29 : 28)) {
                day = 1;
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
                return [day, month, year];
            }
            break;
        default:
            throw new Error("Invalid month");
    }
    return [day, month, year];
}

const stringDate = (day: number, month: number, year: number): string => {
    return (
        day < 10 && month < 10 ? `0${day}-0${month}-${year}` : 
        day < 10 ? `0${day}-${month}-${year}` :
        month < 10 ? `${day}-0${month}-${year}` :
        `${day}-${month}-${year}`
    )
}

const stringDateWithHour = (hour: number, day: number, month: number, year: number): string => {
    return (
        hour < 10 && day < 10 && month < 10? `0${day}-0${month}-${year} 0${hour}:00` : 
        hour < 10 && day < 10 ? `0${day}-${month}-${year} 0${hour}:00` :
        hour < 10 && month < 10 ? `${day}-0${month}-${year} 0${hour}:00` :
        day < 10 && month < 10 ? `0${day}-0${month}-${year} ${hour}:0` :
        hour < 10 ? `${day}-${month}-${year} 0${hour}:00` :
        day < 10 ? `0${day}-${month}-${year} ${hour}:00` :
        month < 10 ? `${day}-0${month}-${year} ${hour}:00` :
        `${day}-${month}-${year}`
    )
}

export async function generateDate(
    typeDate: string,
    startHour: number,
    startDay: number,
    startMonth: number,
    startYear: number,
    dataLength: number,
): Promise<string[]>{
    let dateArray: string[] = [];
    let hour = startHour;
    let day = startDay;
    let month = startMonth;
    let year = startYear;
    switch (typeDate) {
        case "y":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push((startYear + i).toString());
            }
            break;

        case "ys":
            for (let i = 0; i < dataLength; i++) {
                const year = startYear + Math.floor((i) / 2);
                const semester =  i % 2 + 1;
                dateArray.push(`${year}S${semester}`);
            }
            break;

        case "yq":
            for (let i = 0; i < dataLength; i++) {
                const year = startYear + Math.floor((i) / 4);
                const quarter = i % 4 + 1;
                dateArray.push(`${year}Q${quarter}`);
            }
            break;

        case "ym":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(`${months[month-1]} ${year}`);
                month++;
                if (month > 12) {
                    month = 1;
                    year++;
                }
            }
            break;

        case "wwd5":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(stringDate(day, month, year));
                day++;
                [day, month, year] = switchMonth(day, month, year);
                let dayName = format(new Date(`${year}-${month}-${day}`), 'EEEE');
                if (dayName === "Saturday"){
                    day += 2; // Skip to Monday
                } else if (dayName === "Sunday") {
                    day += 1; // Skip to Monday
                }
                [day, month, year] = switchMonth(day, month, year);
            }
            break;

        case "wwd6":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(stringDate(day, month, year));
                day++;
                [day, month, year] = switchMonth(day, month, year);
                let dayName = format(new Date(`${year}-${month}-${day}`), 'EEEE');
                if (dayName === "Sunday"){
                    day += 1; // Skip to Monday
                }
                [day, month, year] = switchMonth(day, month, year);
            }
            break;

        case "wd":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(stringDate(day, month, year));
                day++;
                [day, month, year] = switchMonth(day, month, year);
            }
            break;

        case "dwh":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(stringDateWithHour(hour, day, month, year));
                hour++;
                if (hour > 15) {
                    hour = 8;
                    day++;
                }
                [day, month, year] = switchMonth(day, month, year);
            }
            break;
        
        case "dh":
            for (let i = 0; i < dataLength; i++) {
                dateArray.push(stringDateWithHour(hour, day, month, year));
                hour++;
                if (hour > 23) {
                    hour = 0;
                    day++;
                }
                [day, month, year] = switchMonth(day, month, year);
            }
            break;
    }
    return dateArray;
}