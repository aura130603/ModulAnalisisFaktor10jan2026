import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMobile } from '@/hooks/useMobile';

interface ErrorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    errorMessage: string | null;
}

const ErrorDialog: React.FC<ErrorDialogProps> = ({
    open,
    onOpenChange,
    errorMessage
}) => {
    const { isMobile } = useMobile();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full p-0 border border-border rounded-md shadow-lg"
                style={{
                    maxWidth: isMobile ? "95vw" : "480px",
                    width: "100%",
                    maxHeight: isMobile ? "100vh" : "65vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden"
                }}
            >
                <div className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <DialogHeader className="p-0">
                        <DialogTitle className="text-base font-semibold">
                            Error
                        </DialogTitle>
                    </DialogHeader>
                </div>
                <Separator className="flex-shrink-0" />
                <div className="flex-grow overflow-y-auto p-3">
                    <div className="flex gap-3 items-start">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                </div>
                <Separator className="flex-shrink-0" />
                <DialogFooter className="px-4 py-2 flex-shrink-0 bg-muted/30">
                    <div className="flex ml-auto">
                        <Button
                            size="sm"
                            className="h-7 text-sm"
                            onClick={() => onOpenChange(false)}
                        >
                            OK
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export { ErrorDialog };