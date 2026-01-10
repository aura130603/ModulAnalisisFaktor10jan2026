import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { type LucideIcon, Info, AlertTriangle, CheckCircle, XCircle, Lightbulb } from "lucide-react";

/**
 * Base layout component untuk standardisasi desain help pages
 * Menyediakan struktur konsisten untuk semua halaman help
 */

interface HelpLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  category?: string;
  lastUpdated?: string;
  className?: string;
}

export const HelpLayout: React.FC<HelpLayoutProps> = ({
  children,
  title,
  description,
  category: _,
  lastUpdated,
  className
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Section - compact design - only show if title exists */}
      {(title || description || lastUpdated) && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                {title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}
                {description && (
                  <p className="text-sm text-muted-foreground max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
            </div>
            
            {lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Terakhir diperbarui:</span>
                <time>{lastUpdated}</time>
              </div>
            )}
          </div>
          
          <Separator className="opacity-50" />
        </>
      )}
      
      {/* Content */}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
};

/**
 * Section component untuk mengelompokkan konten
 */
interface HelpSectionProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

export const HelpSection: React.FC<HelpSectionProps> = ({
  children,
  title,
  description,
  icon: Icon,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-primary" />}
              <h2 className="text-lg font-medium">{title}</h2>
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Card component untuk konten yang dapat dikelompokkan
 */
interface HelpCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: "default" | "feature" | "step";
  className?: string;
}

export const HelpCard: React.FC<HelpCardProps> = ({
  children,
  title,
  description,
  icon: Icon,
  variant = "default",
  className
}) => {
  const cardVariants = {
    default: "border-border/50 shadow-sm bg-white dark:bg-slate-900",
    feature: "border-primary/50 bg-white dark:bg-slate-900 shadow-sm",
    step: "border-blue-500/50 bg-white dark:bg-slate-900 shadow-sm"
  };

  return (
    <Card className={cn(cardVariants[variant], className)}>
      {(title || description || Icon) && (
        <CardHeader className="pb-2 pt-3 px-3">
          {title && (
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={cn("px-3 pb-3", title || description || Icon ? "pt-0" : "pt-3")}>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Alert component untuk informasi penting
 */
interface HelpAlertProps {
  children: React.ReactNode;
  title?: string;
  variant?: "info" | "warning" | "success" | "error" | "tip";
  className?: string;
}

export const HelpAlert: React.FC<HelpAlertProps> = ({
  children,
  title,
  variant = "info",
  className
}) => {
  const alertConfig = {
    info: { icon: Info, className: "border-blue-500 bg-white text-slate-900 dark:border-blue-400 dark:bg-slate-900 dark:text-slate-100" },
    warning: { icon: AlertTriangle, className: "border-yellow-500 bg-white text-slate-900 dark:border-yellow-400 dark:bg-slate-900 dark:text-slate-100" },
    success: { icon: CheckCircle, className: "border-green-500 bg-white text-slate-900 dark:border-green-400 dark:bg-slate-900 dark:text-slate-100" },
    error: { icon: XCircle, className: "border-red-500 bg-white text-slate-900 dark:border-red-400 dark:bg-slate-900 dark:text-slate-100" },
    tip: { icon: Lightbulb, className: "border-purple-500 bg-white text-slate-900 dark:border-purple-400 dark:bg-slate-900 dark:text-slate-100" }
  };

  const config = alertConfig[variant];
  const Icon = config.icon;

  return (
    <Alert className={cn(config.className, className)}>
      <Icon className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription className={title ? "mt-2" : ""}>
        {children}
      </AlertDescription>
    </Alert>
  );
};

/**
 * Step component untuk panduan step-by-step
 * Interface diperbaiki untuk sesuai dengan penggunaan di komponen help
 */
interface HelpStepProps {
  number: number;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  colorClass?: string;
}

export const HelpStep: React.FC<HelpStepProps> = ({
  number,
  title,
  description,
  children,
  className,
  colorClass
}) => {
  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex-shrink-0">
        <div className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium transition-colors duration-200",
          colorClass || "bg-primary text-primary-foreground"
        )}>
          {number}
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <h3 className="font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Code block component untuk menampilkan kode
 */
interface HelpCodeBlockProps {
  children: React.ReactNode;
  language?: string;
  title?: string;
  className?: string;
}

export const HelpCodeBlock: React.FC<HelpCodeBlockProps> = ({
  children,
  language,
  title,
  className
}) => {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
        <code className={language ? `language-${language}` : ""}>
          {children}
        </code>
      </pre>
    </div>
  );
};

/**
 * Quick actions component untuk aksi cepat
 */
interface HelpQuickActionsProps {
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
    icon?: LucideIcon;
  }>;
  className?: string;
}

export const HelpQuickActions: React.FC<HelpQuickActionsProps> = ({
  actions,
  className
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant={action.variant || "default"}
            size="sm"
            onClick={action.onClick}
            className="flex items-center gap-2"
          >
            {Icon && <Icon className="h-4 w-4" />}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
};

/**
 * Table of Contents component
 */
interface HelpTOCProps {
  items: Array<{
    id: string;
    title: string;
    level?: number;
  }>;
  className?: string;
}

export const HelpTOC: React.FC<HelpTOCProps> = ({
  items,
  className
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-base">Daftar Isi</CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-1">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "block text-sm text-muted-foreground hover:text-foreground transition-colors",
                item.level === 2 && "ml-4",
                item.level === 3 && "ml-8"
              )}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
};