export type PopupPosition = "top" | "bottom";
export type HorizontalPosition = "left" | "right";

export type TourStep = {
    title: string;
    content: string;
    targetId: string;
    defaultPosition: PopupPosition;
    defaultHorizontalPosition: HorizontalPosition | null;
    position?: PopupPosition;
    horizontalPosition?: HorizontalPosition | null;
    icon: string | null;
};