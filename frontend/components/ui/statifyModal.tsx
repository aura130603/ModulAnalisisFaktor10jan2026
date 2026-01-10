import React from 'react';
import {
    Dialog as ShadcnDialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogClose,
    DialogFooter,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ModalType } from '@/hooks/useModal';

// ======== Size Variants ========
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

const dialogContentVariants = cva(
    "bg-white text-black p-0 border-none shadow-[0px_4px_12px_rgba(0,0,0,0.08)] animate-in fade-in-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 data-[state=closed]:slide-out-to-bottom-[2px] data-[state=open]:slide-in-from-bottom-[2px] duration-200",
    {
        variants: {
            size: {
                sm: "sm:max-w-[320px] w-[calc(100%-32px)]",
                md: "sm:max-w-[440px] w-[calc(100%-32px)]",
                lg: "sm:max-w-[560px] w-[calc(100%-32px)]",
                xl: "sm:max-w-[800px] w-[calc(100%-32px)]",
                full: "sm:max-w-[90vw] w-[calc(100%-32px)] max-h-[90vh]"
            }
        },
        defaultVariants: {
            size: "md"
        }
    }
);

// ======== Button Components ========
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
}

export const PrimaryButton: React.FC<ButtonProps> = ({
                                                         className = '',
                                                         children,
                                                         ...props
                                                     }) => (
    <button
        className={cn(
            "bg-black text-white h-8 md:h-10 px-4 py-2 text-sm font-medium",
            "hover:opacity-90 active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:pointer-events-none",
            className
        )}
        {...props}
    >
        {children}
    </button>
);

export const SecondaryButton: React.FC<ButtonProps> = ({
                                                           className = '',
                                                           children,
                                                           ...props
                                                       }) => (
    <button
        className={cn(
            "bg-white text-black border border-[#CCCCCC] h-8 md:h-10 px-4 py-2 text-sm font-medium",
            "hover:bg-[#F7F7F7] active:scale-[0.98]",
            "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:pointer-events-none",
            className
        )}
        {...props}
    >
        {children}
    </button>
);

export const TertiaryButton: React.FC<ButtonProps> = ({
                                                          className = '',
                                                          children,
                                                          ...props
                                                      }) => (
    <button
        className={cn(
            "text-black bg-transparent px-2 py-1 text-sm font-medium",
            "hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1",
            "transition-all duration-200",
            "disabled:opacity-50 disabled:pointer-events-none",
            className
        )}
        {...props}
    >
        {children}
    </button>
);

// ======== Form Components ========
interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
                                                        className = '',
                                                        children,
                                                        ...props
                                                    }) => (
    <div className={cn("mb-6", className)} {...props}>
        {children}
    </div>
);

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
    className?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({
                                                        className = '',
                                                        children,
                                                        required = false,
                                                        ...props
                                                    }) => (
    <label
        className={cn("text-[#444444] text-xs font-medium block mb-2", className)}
        {...props}
    >
        {children}
        {required && <span className="text-black ml-1">*</span>}
    </label>
);

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    className?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
                                                        className = '',
                                                        error,
                                                        ...props
                                                    }) => (
    <>
        <input
            className={cn(
                "w-full h-10 px-3 py-2 border border-[#CCCCCC]",
                "focus:border-black focus:outline-none text-black transition-all duration-200",
                error ? 'border-l-4 border-l-black' : '',
                className
            )}
            {...props}
        />
        {error && <p className="text-black text-xs mt-1">{error}</p>}
    </>
);

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    error?: string;
    className?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
                                                          className = '',
                                                          error,
                                                          ...props
                                                      }) => (
    <>
        <select
            className={cn(
                "w-full h-10 px-3 py-2 border border-[#CCCCCC]",
                "focus:border-black focus:outline-none text-black transition-all duration-200",
                error ? 'border-l-4 border-l-black' : '',
                className
            )}
            {...props}
        />
        {error && <p className="text-black text-xs mt-1">{error}</p>}
    </>
);

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
    className?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
                                                              className = '',
                                                              error,
                                                              ...props
                                                          }) => (
    <>
    <textarea
        className={cn(
            "w-full min-h-[80px] px-3 py-2 border border-[#CCCCCC]",
            "focus:border-black focus:outline-none text-black transition-all duration-200",
            error ? 'border-l-4 border-l-black' : '',
            className
        )}
        {...props}
    />
        {error && <p className="text-black text-xs mt-1">{error}</p>}
    </>
);

// ======== Modal Components ========
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogContent> {
    size?: ModalSize;
    className?: string;
}

export const StatifyDialogContent: React.FC<DialogContentProps> = ({
                                                                       className = '',
                                                                       size = 'md',
                                                                       children,
                                                                       ...props
                                                                   }) => (
    <DialogContent
        className={dialogContentVariants({ size, className })}
        {...props}
    >
        {children}
    </DialogContent>
);

interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    onClose?: () => void;
    className?: string;
}

export const StatifyModalHeader: React.FC<ModalHeaderProps> = ({
                                                                   title,
                                                                   description,
                                                                   onClose,
                                                                   className = '',
                                                                   ...props
                                                               }) => (
    <DialogHeader
        className={cn("bg-[#F7F7F7] h-16 px-6 py-5 flex flex-row items-center justify-between border-b border-[#E6E6E6]", className)}
        {...props}
    >
        <div>
            <DialogTitle className="font-semibold text-lg text-black">
                {title}
            </DialogTitle>
            {description && (
                <DialogDescription className="text-sm text-[#888888]">
                    {description}
                </DialogDescription>
            )}
        </div>
        <DialogClose
            className="h-6 w-6 rounded-md text-[#444444] hover:bg-[#E6E6E6] transition-colors"
            aria-label="Close"
            onClick={onClose}
        >
            <X size={24} />
        </DialogClose>
    </DialogHeader>
);

interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export const StatifyModalBody: React.FC<ModalBodyProps> = ({
                                                               className = '',
                                                               children,
                                                               ...props
                                                           }) => (
    <div
        className={cn("px-6 py-6 overflow-auto max-h-[calc(80vh-8rem)]", className)}
        {...props}
    >
        {children}
    </div>
);

interface ModalFooterProps extends React.ComponentPropsWithoutRef<typeof DialogFooter> {
    className?: string;
}

export const StatifyModalFooter: React.FC<ModalFooterProps> = ({
                                                                   className = '',
                                                                   children,
                                                                   ...props
                                                               }) => (
    <DialogFooter
        className={cn(
            "bg-[#F7F7F7] h-16 px-6 py-5",
            "flex flex-row-reverse items-center justify-between gap-4",
            "border-t border-[#E6E6E6]",
            "sm:flex-row-reverse",
            className
        )}
        {...props}
    >
        {children}
    </DialogFooter>
);

// ======== Main Modal Component ========
export interface StatifyModalProps {
    // Core props
    title: string;
    description?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    size?: ModalSize;

    // For standalone usage
    open?: boolean;
    onOpenChange?: (open: boolean) => void;

    // For integration with existing modal architecture
    modalType?: ModalType;
    onClose?: () => void;
}

export const StatifyModal: React.FC<StatifyModalProps> = ({
                                                              // Core props
                                                              title,
                                                              description,
                                                              children,
                                                              footer,
                                                              className = '',
                                                              size = 'md',

                                                              // Standalone props
                                                              open,
                                                              onOpenChange,

                                                              // Integration props
                                                              modalType,
                                                              onClose,
                                                          }) => {
    // If modalType is provided, we're using it as a wrapper for the existing architecture
    if (modalType !== undefined && onClose) {
        return (
            <StatifyDialogContent size={size} className={className}>
                <StatifyModalHeader title={title} description={description} onClose={onClose} />
                <StatifyModalBody>
                    {children}
                </StatifyModalBody>
                {footer && <StatifyModalFooter>{footer}</StatifyModalFooter>}
            </StatifyDialogContent>
        );
    }

    // Otherwise, use it as a standalone modal
    return (
        <ShadcnDialog
            open={open}
            onOpenChange={(newOpen) => {
                if (onOpenChange) onOpenChange(newOpen);
                if (!newOpen && onClose) onClose();
            }}
        >
            <StatifyDialogContent size={size} className={className}>
                <StatifyModalHeader title={title} description={description} onClose={onClose} />
                <StatifyModalBody>
                    {children}
                </StatifyModalBody>
                {footer && <StatifyModalFooter>{footer}</StatifyModalFooter>}
            </StatifyDialogContent>
        </ShadcnDialog>
    );
};

// Export the Dialog for extensibility
export const Dialog = ShadcnDialog;
export { DialogClose };