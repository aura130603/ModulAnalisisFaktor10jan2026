export interface TimeComponent {
    name: string;
    value: number;
    periodicity?: number;
}

export interface DefineDateTimeProps {
    onClose: () => void;
    containerType?: "dialog" | "sidebar";
} 