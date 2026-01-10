export interface ResourceItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    link?: string;
}

export interface DataAction {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    action: () => void;
    primary: boolean;
} 