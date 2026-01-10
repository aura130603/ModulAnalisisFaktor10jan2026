import React from 'react';
import Link from 'next/link';
import { HelpCard, HelpAlert, HelpStep } from '@/app/help/ui/HelpLayout';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standardized content components for consistent tab content
 * Enhanced with modern design patterns following globals.css
 * Includes improved animations, responsiveness, and accessibility
 */

// Enhanced intro section with modern styling
interface IntroSectionProps {
  title: string;
  description: string;
  variant?: 'info' | 'warning' | 'success' | 'error' | 'tip';
  className?: string;
}

export const IntroSection: React.FC<IntroSectionProps> = ({
  title,
  description,
  variant = 'info',
  className
}) => (
  <div className={cn("animate-fadeIn", className)}>
    <HelpAlert 
      variant={variant} 
      title={title} 
      className={cn(
        "transition-all duration-200 ease-out",
        "hover:shadow-md hover:scale-[1.01]",
        "border-border bg-card"
      )}
    >
      <p className={cn(
        "text-sm mt-3 leading-relaxed",
        "text-muted-foreground"
      )}>
        {description}
      </p>
    </HelpAlert>
  </div>
);

// Enhanced feature grid with improved responsiveness and animations
interface FeatureGridProps {
  features: Array<{
    title: string;
    icon: LucideIcon;
  items?: string[];
  description?: string;
  link?: string;
    variant?: 'default' | 'feature' | 'step';
  }>;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  features,
  columns = 2,
  className
}) => (
  <div className={cn(
    "grid gap-6 animate-fadeIn",
    // Enhanced responsive grid system
    columns === 1 && "grid-cols-1",
    columns === 2 && "grid-cols-1 lg:grid-cols-2",
    columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    "container-type: inline-size", // Enable container queries
    className
  )}>
    {features.map((feature, index) => (
      <div 
        key={index}
        className={cn(
          "group transition-all duration-300 ease-out",
          "hover:scale-[1.02] hover:shadow-lg",
          "animate-fadeIn"
        )}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {feature.link ? (
          <Link
            href={(function normalize(link: string) {
              // Convert "/help/<parent>/<child>" into "/help#<parent>:<child>" for in-page routing
              if (!link.startsWith('/help')) return link;
              const withoutBase = link.replace(/^\/help\/?/, '');
              const parts = withoutBase.split('?')[0].split('#')[0].split('/').filter(Boolean);
              const parent = parts[0] || '';
              const child = parts[1] || '';
              const hash = parent + (child ? `:${child}` : '');
              return `/help#${hash}`;
            })(feature.link)}
            className="block focus:outline-none"
          >
            <HelpCard 
              title={feature.title} 
              icon={feature.icon} 
              variant={feature.variant || 'feature'}
              className={cn(
                "h-full border-border bg-card",
                "transition-all duration-200 ease-out",
                "group-hover:border-primary/20"
              )}
            >
              <ul className={cn(
                "text-sm space-y-3 mt-4",
                "text-muted-foreground"
              )}>
                {(Array.isArray(feature.items) && feature.items.length > 0
                  ? feature.items
                  : (feature.description ? [feature.description] : [])
                ).map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <span className={cn(
                      "w-2 h-2 bg-primary/80 rounded-full mt-1.5 flex-shrink-0",
                      "transition-colors duration-200",
                      "group-hover:bg-primary"
                    )} />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </HelpCard>
          </Link>
        ) : (
          <HelpCard 
            title={feature.title} 
            icon={feature.icon} 
            variant={feature.variant || 'feature'}
            className={cn(
              "h-full border-border bg-card",
              "transition-all duration-200 ease-out",
              "group-hover:border-primary/20"
            )}
          >
            <ul className={cn(
              "text-sm space-y-3 mt-4",
              "text-muted-foreground"
            )}>
              {(Array.isArray(feature.items) && feature.items.length > 0
                ? feature.items
                : (feature.description ? [feature.description] : [])
              ).map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  <span className={cn(
                    "w-2 h-2 bg-primary/80 rounded-full mt-1.5 flex-shrink-0",
                    "transition-colors duration-200",
                    "group-hover:bg-primary"
                  )} />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </HelpCard>
        )}
      </div>
    ))}
  </div>
);

// Enhanced concept section with modern design and CSS variables
interface ConceptSectionProps {
  title: string;
  icon?: LucideIcon;
  concepts: Array<{
    title: string;
    formula?: string;
    description: string;
    color?: 'blue' | 'purple' | 'emerald' | 'orange' | 'red' | 'primary' | 'secondary';
  }>;
  className?: string;
}

export const ConceptSection: React.FC<ConceptSectionProps> = ({
  title,
  icon: Icon,
  concepts,
  className
}) => {
  const colorClasses = {
    blue: 'bg-blue-600 dark:bg-blue-500',
    purple: 'bg-violet-600 dark:bg-violet-500',
    emerald: 'bg-emerald-600 dark:bg-emerald-500',
    orange: 'bg-amber-600 dark:bg-amber-500',
    red: 'bg-rose-600 dark:bg-rose-500',
    primary: 'bg-primary',
    secondary: 'bg-secondary-foreground'
  };

  return (
    <div className={cn(
      "p-6 bg-card border border-border rounded-lg shadow-sm",
      "transition-all duration-200 ease-out animate-fadeIn",
      "hover:shadow-md hover:border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3 mb-6">
        {Icon ? (
          <div className={cn(
            "w-10 h-10 bg-muted rounded-lg flex items-center justify-center",
            "transition-colors duration-200",
            "group-hover:bg-primary/10"
          )}>
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        ) : null}
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
      </div>
      
      <div className="space-y-5">
        {concepts.map((concept, index) => (
          <div 
            key={index}
            className={cn(
              "p-5 bg-muted/30 rounded-lg border border-border/50",
              "transition-all duration-200 ease-out",
              "hover:bg-muted/50 hover:border-border",
              "animate-fadeIn"
            )}
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className={cn(
                "w-3 h-3 rounded-full transition-all duration-200",
                colorClasses[concept.color || 'blue']
              )} />
              <h4 className="font-semibold text-foreground">
                {concept.title}
              </h4>
            </div>
            
            {concept.formula && (
              <div className={cn(
                "bg-muted p-4 rounded-md border text-sm mb-4",
                "text-muted-foreground font-mono",
                "transition-colors duration-200",
                "hover:bg-muted/80"
              )}>
                {concept.formula}
              </div>
            )}
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {concept.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced example grid with modern design and improved animations
interface ExampleGridProps {
  title: string;
  icon: LucideIcon;
  examples: Array<{
    title: string;
    description: string;
    color?: 'blue' | 'emerald' | 'purple' | 'amber' | 'red';
  }>;
  columns?: 2 | 4;
  className?: string;
}

export const ExampleGrid: React.FC<ExampleGridProps> = ({
  title,
  icon: Icon,
  examples,
  columns = 2,
  className
}) => {
  const colorClasses = {
    blue: 'bg-white dark:bg-slate-900 border-blue-500 dark:border-blue-400 text-slate-900 dark:text-slate-100',
    emerald: 'bg-white dark:bg-slate-900 border-emerald-500 dark:border-emerald-400 text-slate-900 dark:text-slate-100',
    purple: 'bg-white dark:bg-slate-900 border-violet-500 dark:border-violet-400 text-slate-900 dark:text-slate-100',
    amber: 'bg-white dark:bg-slate-900 border-amber-500 dark:border-amber-400 text-slate-900 dark:text-slate-100',
    red: 'bg-white dark:bg-slate-900 border-rose-500 dark:border-rose-400 text-slate-900 dark:text-slate-100'
  };

  const descriptionColorClasses = {
    blue: 'text-slate-700 dark:text-slate-300',
    emerald: 'text-slate-700 dark:text-slate-300',
    purple: 'text-slate-700 dark:text-slate-300',
    amber: 'text-slate-700 dark:text-slate-300',
    red: 'text-slate-700 dark:text-slate-300'
  };

  return (
    <div className={cn(
      "p-6 bg-card border border-border rounded-lg shadow-sm",
      "transition-all duration-200 ease-out animate-fadeIn",
      "hover:shadow-md hover:border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "w-10 h-10 bg-muted rounded-lg flex items-center justify-center",
          "transition-colors duration-200",
          "group-hover:bg-primary/10"
        )}>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>
      </div>
      
      <div className={cn(
        "grid gap-5",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}>
        {examples.map((example, index) => (
          <div 
            key={index}
            className={cn(
              "p-5 rounded-lg border transition-all duration-300 ease-out",
              "hover:scale-[1.02] hover:shadow-md",
              "animate-fadeIn",
              colorClasses[example.color || 'blue']
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="font-semibold mb-3 leading-tight">
              {example.title}
            </p>
            <p className={cn(
              "text-sm leading-relaxed",
              descriptionColorClasses[example.color || 'blue']
            )}>
              {example.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced step list with modern design and improved layout
interface StepListProps {
  title: string;
  icon: LucideIcon;
  steps: Array<{
    number: number;
    title: string;
    description: string;
  }>;
  variant?: 'default' | 'feature' | 'step';
  className?: string;
}

export const StepList: React.FC<StepListProps> = ({
  title,
  icon: Icon,
  steps,
  variant = 'feature',
  className
}) => {
  const stepColors = [
    'bg-blue-600 dark:bg-blue-500',
    'bg-emerald-600 dark:bg-emerald-500',
    'bg-violet-600 dark:bg-violet-500',
    'bg-amber-600 dark:bg-amber-500',
    'bg-rose-600 dark:bg-rose-500',
    'bg-indigo-600 dark:bg-indigo-500',
    'bg-teal-600 dark:bg-teal-500',
    'bg-pink-600 dark:bg-pink-500'
  ];

  return (
    <div className={cn("animate-fadeIn", className)}>
      <HelpCard 
        title={title} 
        icon={Icon} 
        variant={variant} 
        className={cn(
          "border-border bg-card",
          "transition-all duration-200 ease-out",
          "hover:shadow-md hover:border-primary/20"
        )}
      >
        <div className="space-y-5 mt-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={cn(
                "animate-fadeIn transition-all duration-200 ease-out",
                "hover:bg-muted/30 rounded-lg p-1 -m-1"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <HelpStep
                number={step.number}
                title={step.title}
                description={step.description}
                colorClass={stepColors[index % stepColors.length]}
              />
            </div>
          ))}
        </div>
      </HelpCard>
    </div>
  );
};

const StandardizedContentLayout = {
  IntroSection,
  FeatureGrid,
  ConceptSection,
  ExampleGrid,
  StepList
};

export default StandardizedContentLayout;