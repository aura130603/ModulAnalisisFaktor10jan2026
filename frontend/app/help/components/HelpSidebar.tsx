"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  BookOpen, 
  HelpCircle, 
  MessageSquare, 
  ChevronRight, 
  Book, 
  Archive, 
  Database,
  ArrowLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type SectionItem } from "./HelpContent";

interface HelpSidebarProps {
  sections: SectionItem[];
  selectedSectionKey: string;
  activeChildKey: string | null;
  onSectionSelect: (key: string) => void;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  displaySections: SectionItem[];
  expandedKeys: Set<string>;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Helper to get icon based on section key
const getSectionIcon = (key: string) => {
  switch(key) {
    case 'getting-started':
      return <BookOpen className="w-4 h-4" />;
    case 'file-guide':
      return <Archive className="w-4 h-4" />;
    case 'data-guide':
      return <Database className="w-4 h-4" />;
    case 'statistics-guide':
      return <Book className="w-4 h-4" />;
    case 'faq':
      return <HelpCircle className="w-4 h-4" />;
    case 'feedback':
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <Book className="w-4 h-4" />;
  }
};

export const HelpSidebar: React.FC<HelpSidebarProps> = ({
  sections: _sections,
  selectedSectionKey,
  activeChildKey,
  onSectionSelect,
  searchValue,
  onSearchChange,
  displaySections,
  expandedKeys,
  sidebarOpen,
  setSidebarOpen
}) => {
  const renderSidebarItems = (items: SectionItem[], level = 0): React.JSX.Element[] => {
    return items.map(item => {
      const isSelected = item.key === selectedSectionKey;
  // Consider leaf items (no children) active when either explicitly selected as a child
  // or when they are the selected section (e.g., top-level leaf like "Getting Started").
  const hasChildren = item.children && item.children.length > 0;
  const isActiveChild = item.key === activeChildKey || (!hasChildren && isSelected);
  const isExpanded = expandedKeys.has(item.key);

      if (hasChildren && level === 0) {
        // Top-level items with children - compact modern design
        return (
          <div key={item.key} className="space-y-1">
            <Card 
              className={cn(
                "border border-border/50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group",
                isSelected && !activeChildKey ? "bg-primary/5 border-primary/30" : "bg-card/50 hover:bg-card"
              )}
              onClick={() => onSectionSelect(item.key)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={cn(
                      "p-1.5 rounded-lg mr-2.5 transition-colors",
                      isSelected && !activeChildKey ? "bg-primary/10" : "bg-muted/50 group-hover:bg-muted"
                    )}>
                      <div className={cn(
                        "w-4 h-4",
                        isSelected && !activeChildKey ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {getSectionIcon(item.key)}
                      </div>
                    </div>
                    <div>
                      <h3 className={cn(
                        "text-sm font-medium leading-tight",
                        isSelected && !activeChildKey ? "text-primary" : "text-foreground group-hover:text-foreground"
                      )}>
                        {item.label}
                      </h3>
                      {item.children && (
                        <p className={cn(
                          "text-xs mt-0.5",
                          isSelected && !activeChildKey ? "text-primary/70" : "text-muted-foreground"
                        )}>
                          {item.children.length} topics
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 transition-all duration-200",
                      isExpanded && "transform rotate-90",
                      isSelected && !activeChildKey ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {isExpanded && item.children && (
              <div className="ml-3 space-y-1 animate-fadeIn">
                {renderSidebarItems(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else {
        // Child items - compact modern style
        return (
          <Card
            key={item.key}
            className={cn(
              "border border-border/30 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer group",
              isActiveChild ? "bg-primary/5 border-primary/30" : "bg-card/30 hover:bg-card/60"
            )}
            onClick={() => onSectionSelect(item.key)}
          >
            <CardContent className="p-2.5">
              <div className="flex items-center">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mr-2.5 transition-colors",
                  isActiveChild ? "bg-primary" : "bg-muted-foreground/40 group-hover:bg-muted-foreground/60"
                )}></div>
                <div className="flex-1">
                  <h4 className={cn(
                    "text-xs font-medium leading-tight",
                    isActiveChild ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </h4>
                </div>
                {searchValue && item.label.toLowerCase().includes(searchValue.toLowerCase()) && (
                  <Badge variant="outline" className="text-xs h-4 px-1.5 bg-primary/10 text-primary border-primary/20">Match</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      }
    });
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-30">
        <Button 
          size="sm" 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className="rounded-full w-10 h-10 shadow-lg flex items-center justify-center"
        >
          {sidebarOpen ? 
            <ArrowLeft className="h-4 w-4" /> : 
            <Book className="h-4 w-4" />
          }
        </Button>
      </div>
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "lg:w-72 lg:min-h-screen bg-background/95 backdrop-blur-sm border-r border-border/50 shadow-sm overflow-y-auto z-20 transition-all duration-300",
          sidebarOpen 
            ? "fixed inset-y-0 left-0 w-72 transform translate-x-0" 
            : "fixed inset-y-0 left-0 w-72 transform -translate-x-full lg:transform-none lg:static"
        )}
      >
        {/* Header - compact modern style */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 p-4 border-b border-border/50">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-foreground mb-1 flex items-center">
              <Book className="w-5 h-5 mr-2" />
              Help Center
            </h1>
            <p className="text-xs text-muted-foreground">Find guides and documentation for Statify.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search guides..."
              value={searchValue}
              onChange={onSearchChange}
              className="w-full pl-9 h-8 text-sm bg-background/50 border-border/50 focus:ring-1 ring-primary/30 focus:border-primary/30"
            />
          </div>
        </div>
        
        {/* Navigation - compact modern design */}
        <nav className="p-3">
          {displaySections.length > 0 ? (
            <div className="space-y-2">
              {renderSidebarItems(displaySections)}
            </div>
          ) : (
            <Card className="border border-border/50">
              <CardContent className="p-3 text-center">
                <Search className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Try different keywords</p>
              </CardContent>
            </Card>
          )}
        </nav>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};