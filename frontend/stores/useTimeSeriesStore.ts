import { create } from "zustand";
import { format } from "date-fns";

type TypeDate = 'y' | 'ys' | 'yq' | 'ym' | 'wwd5' | 'wwd6' | 'wd' | 'dwh' | 'dh' | 'nd';

/**
 * State dan aksi untuk store time series
 */
interface TimeSeriesStoreState {
    // Data
    typeDate: TypeDate; 
    year: number; 
    month: number; // Optional, not used in this store          
    week: number;          
    day: number;            
    hour: number;
    
    // Getter
    getTypeDate: () => TypeDate;
    getYear: () => number;
    getMonth: () => number;
    getWeek: () => number;
    getDay: () => number;
    getHour: () => number;
    getDayName: () => string;
    getMaximumDay: () => number;
    
    // Setter
    setTypeDate: (typeDate: TypeDate) => void;
    setYear: (year: number) => void;
    setMonth: (month: number) => void; 
    setWeek: (week: number) => void;
    setDay: (day: number) => void;
    setHour: (hour: number) => void;
}

/**
 * Validasi nilai tanggal
 */
const validateDate = {
    year: (value: number) => Math.max(1900, Math.min(2100, value)),
    week: (value: number) => Math.max(1, Math.min(52, value)),
    month: (value: number) => Math.max(1, Math.min(12, value)), // Not used in this store
    day: (value: number) => Math.max(1, Math.min(31, value)),
    hour: (value: number) => Math.max(0, Math.min(23, value))
};

/**
 * Custom hook untuk mengelola data time series
 */
export const useTimeSeriesStore = create<TimeSeriesStoreState>((set, get) => ({
    // Nilai default
    typeDate: 'nd',     // Not Dated
    year: 2025,         // Default tahun saat ini 
    month: 1,          // Bulan pertama (tidak digunakan di store ini)
    week: 1,           // Minggu pertama
    day: 1,             // Hari pertama
    hour: 0,            // Jam 00:00
    
    // Getter methods
    getTypeDate: () => get().typeDate,
    getYear: () => get().year,
    getMonth: () => get().month, 
    getWeek: () => get().week,
    getDay: () => {
        let day = get().day
        if (day < 1 || day > get().getMaximumDay()) {
            day = get().getMaximumDay(); // Reset to maximum day if out of range
        }
        return day;
    },
    getHour: () => get().hour,
    getDayName: () => {
        const day = get().day;
        const month = get().month;
        const year = get().year;
        let formatDate = `${year}-${month}-${day}`;
        return format(new Date(formatDate), 'EEEE');
    },
    getMaximumDay: () => {
        const month = get().month;
        const year = get().year;
        return new Date(year, month, 0).getDate(); // Menghitung jumlah hari maksimum dalam bulan
    },
    
    // Setter methods
    setTypeDate: (typeDate: TypeDate) => set({
        typeDate: typeDate
    }),
    setYear: (year: number) => set({ 
        year: validateDate.year(year) 
    }),
    setMonth: (month: number) => set({ 
        month: validateDate.month(month) 
    }),
    setWeek: (week: number) => set({ 
        week: validateDate.week(week) 
    }),
    setDay: (day: number) => set({ 
        day: validateDate.day(day) 
    }),
    setHour: (hour: number) => set({ 
        hour: validateDate.hour(hour) 
    }),
}));