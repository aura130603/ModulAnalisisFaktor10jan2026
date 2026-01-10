import React from "react";

/**
 * @deprecated Use HelpLayout from ../ui/HelpLayout instead
 * This component will be removed in future versions
 */
interface HelpContentWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  hasCard?: boolean;
}

/**
 * @deprecated Use HelpLayout from ../ui/HelpLayout instead
 * This component will be removed in future versions
 */
export const HelpContentWrapper: React.FC<HelpContentWrapperProps> = ({ 
  children, 
  title, 
  description,
  hasCard = true 
}) => {
  // Note: HelpContentWrapper is deprecated. Use HelpLayout from ../ui/HelpLayout instead.

  const content = (
    <>
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </>
  );

  if (hasCard) {
    return <div className="space-y-5">{content}</div>;
  }

  return content;
};