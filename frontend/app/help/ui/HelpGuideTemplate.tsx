import React from "react";
import { 
  HelpLayout, 
  HelpSection, 
  HelpCard, 
  HelpAlert, 
  HelpStep, 
  HelpCodeBlock
} from "@/app/help/ui/HelpLayout";

import { Separator } from "@/components/ui/separator";

import { type LucideIcon, BookOpen, Settings, HelpCircle } from "lucide-react";

/**
 * Template standar untuk semua guide pages
 * Menyediakan struktur konsisten dengan section yang dapat dikustomisasi
 */

interface GuideStep {
  title: string;
  description?: string;
  content: React.ReactNode;
  code?: string;
  codeLanguage?: string;
}

interface GuideSection {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  content?: React.ReactNode;
  steps?: GuideStep[];
}

interface QuickAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary";
  icon?: LucideIcon;
}

interface HelpGuideTemplateProps {
  title: string;
  description?: string;
  category?: string;
  lastUpdated?: string;
  overview?: React.ReactNode;
  sections: GuideSection[];
  prerequisites?: string[];
  relatedTopics?: Array<{ title: string; href: string }>;
  quickActions?: QuickAction[];
  tips?: Array<{ type: "info" | "warning" | "success" | "tip"; title?: string; content: React.ReactNode }>;
  troubleshooting?: Array<{ problem: string; solution: React.ReactNode }>;
}

export const HelpGuideTemplate: React.FC<HelpGuideTemplateProps> = ({
  title,
  description,
  category,
  lastUpdated,
  overview,
  sections,
  prerequisites,
  relatedTopics: _relatedTopics,
  quickActions: _,
  tips,
  troubleshooting
}) => {
  return (
    <HelpLayout
      title={title}
      description={description}
      category={category}
      lastUpdated={lastUpdated}
    >


      {/* Overview Section */}
      {overview && (
        <HelpSection title="Gambaran Umum" icon={BookOpen}>
          {overview}
        </HelpSection>
      )}

      {/* Prerequisites */}
      {prerequisites && prerequisites.length > 0 && (
        <HelpSection title="Prasyarat" icon={Settings}>
          <HelpCard>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Sebelum memulai, pastikan Anda telah:
              </p>
              <ul className="space-y-1">
                {prerequisites.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </HelpCard>
        </HelpSection>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <HelpAlert
              key={index}
              variant={tip.type}
              title={tip.title}
            >
              {tip.content}
            </HelpAlert>
          ))}
        </div>
      )}

      {/* Main Sections */}
      <div className="space-y-8">
        {sections.map((section) => (
          <HelpSection
            key={section.id}
            title={section.title}
            description={section.description}
            icon={section.icon}
          >
            {section.content && section.content}
            
            {section.steps && section.steps.length > 0 && (
              <div className="space-y-6">
                {section.steps.map((step, index) => (
                  <HelpStep
                    key={index}
                    number={index + 1}
                    title={step.title}
                    description={step.description}
                  >
                    {step.content}
                    {step.code && (
                      <HelpCodeBlock
                        language={step.codeLanguage || "javascript"}
                        title={`Code Example ${index + 1}`}
                      >
                        {step.code}
                      </HelpCodeBlock>
                    )}
                  </HelpStep>
                ))}
              </div>
            )}
          </HelpSection>
        ))}
      </div>

      {/* Troubleshooting */}
      {troubleshooting && troubleshooting.length > 0 && (
        <HelpSection title="Pemecahan Masalah" icon={HelpCircle}>
          <div className="space-y-4">
            {troubleshooting.map((item, index) => (
              <HelpCard key={index} title={item.problem} variant="step">
                {item.solution}
              </HelpCard>
            ))}
          </div>
        </HelpSection>
      )}

      <Separator className="my-8" />

      {/* Footer */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Related Topics - COMMENTED OUT
        {relatedTopics && relatedTopics.length > 0 && (
          <HelpCard title="Topik Terkait">
            <div className="space-y-2">
              {relatedTopics.map((topic, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2"
                  onClick={() => {
                    // Navigate to topic
                    console.log(`Navigate to: ${topic.href}`);
                  }}
                >
                  <span className="text-sm">{topic.title}</span>
                </Button>
              ))}
            </div>
          </HelpCard>
        )}
        */}

        {/* Help & Support - COMMENTED OUT
        <HelpCard title="Butuh Bantuan?">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tidak menemukan yang Anda cari? Tim support kami siap membantu.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                FAQ
              </Button>
              <Button size="sm">
                Hubungi Support
              </Button>
            </div>
          </div>
        </HelpCard>
        */}
      </div>
    </HelpLayout>
  );
};

/**
 * Hook untuk navigasi guide - COMMENTED OUT
 */
/* export const useGuideNavigation = () => {
  const [currentSection, setCurrentSection] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);

  const navigateToSection = React.useCallback((sectionId: string) => {
    setHistory(prev => [...prev, currentSection].filter(Boolean));
    setCurrentSection(sectionId);
  }, [currentSection]);

  const goBack = React.useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentSection(previous);
    }
  }, [history]);

  const canGoBack = history.length > 0;

  return {
    currentSection,
    navigateToSection,
    goBack,
    canGoBack,
    history
  };
}; */