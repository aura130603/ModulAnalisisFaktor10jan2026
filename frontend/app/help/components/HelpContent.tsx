import React, { cloneElement } from "react";
import { BookOpen, Book } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { HelpLayout } from "../ui/HelpLayout";
import { HelpSidebar } from "./HelpSidebar";

// Recursive type for nested sections
export type SectionItem = {
	key: string;
	label: string;
	content?: React.ReactElement;
	children?: SectionItem[];
	parentKey?: string;
	childContent?: string; // Used by StatisticsGuide children
};

type HelpContentProps = {
	sections: SectionItem[];
	selectedSectionKey: string;
	activeChildKey: string | null;
	onSectionSelect: (key: string) => void;
	searchValue: string;
	onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	displaySections: SectionItem[];
	expandedKeys: Set<string>;
};



export const HelpContent: React.FC<HelpContentProps> = ({
	sections,
	selectedSectionKey,
	activeChildKey,
	onSectionSelect,
	searchValue,
	onSearchChange,
	displaySections,
	expandedKeys,
}) => {


	const renderBreadcrumbs = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return null;

		const breadcrumbs = [{ key: "main", label: "Home", href: "/" }, { key: "home", label: "Help Center" }, { key: selectedSection.key, label: selectedSection.label }];
		
		// Add active child if exists
		if (activeChildKey) {
			const findChildPath = (items: SectionItem[], key: string, path: SectionItem[] = []): SectionItem[] | null => {
				for (const item of items) {
					if (item.key === key) return [...path, item];
					if (item.children) {
						const foundPath = findChildPath(item.children, key, [...path, item]);
						if (foundPath) return foundPath;
					}
				}
				return null;
			};
			
			const childPath = findChildPath(sections, activeChildKey);
			if (childPath) {
				// Start from index 1 to skip the top-level parent that's already added
				for (let i = 1; i < childPath.length; i++) {
					breadcrumbs.push({ key: childPath[i].key, label: childPath[i].label });
				}
			}
		}

		return (
			<Breadcrumb className="mb-2">
				<BreadcrumbList className="text-xs">
					{breadcrumbs.map((crumb, i) => (
						<React.Fragment key={crumb.key}>
							{i > 0 && <BreadcrumbSeparator className="w-3 h-3" />}
							<BreadcrumbItem>
								{i === breadcrumbs.length - 1 ? (
									<span className="font-medium text-foreground text-xs">{crumb.label}</span>
								) : (
									<BreadcrumbLink 
										{...(crumb.href ? { href: crumb.href } : { onClick: () => onSectionSelect(crumb.key) })}
										className="cursor-pointer hover:text-primary text-xs transition-colors"
									>
										{crumb.label}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
						</React.Fragment>
					))}
				</BreadcrumbList>
			</Breadcrumb>
		);
	};

	const renderContent = () => {
		const selectedSection = sections.find(s => s.key === selectedSectionKey);
		if (!selectedSection) return (
			<div className="text-center py-8">
				<Book className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
				<h2 className="text-lg font-semibold mb-2">Welcome to the Help Center</h2>
				<p className="text-muted-foreground max-w-md mx-auto mb-4 text-sm">
					Please select a topic from the sidebar to get started or use the search to find specific information.
				</p>
				<Button 
					variant="outline" 
					size="sm"
					className="mx-auto h-8 text-xs"
					onClick={() => onSectionSelect("getting-started")}
				>
					<BookOpen className="h-3.5 w-3.5 mr-1.5" />
					Browse Getting Started Guide
				</Button>
			</div>
		);

		// If there's an active child, we need to render the parent's content
		// but pass in the child's key to identify the sub-content.
		if (activeChildKey && selectedSection.content) {
			// Find the actual child item to get its 'childContent' property
			const findChild = (items: SectionItem[]): SectionItem | undefined => {
				for (const item of items) {
					if (item.key === activeChildKey) return item;
					if (item.children) {
						const found = findChild(item.children);
						if (found) return found;
					}
				}
			};
			const activeChildItem = findChild(selectedSection.children || []);
			
			if (React.isValidElement<{ section?: string }>(selectedSection.content)) {
				return cloneElement(selectedSection.content, {
					section: activeChildItem?.childContent || activeChildKey,
				});
			}
		}

		// Otherwise, render the main section's content
		return selectedSection.content;
	};

	// For responsive mobile view
	const [sidebarOpen, setSidebarOpen] = React.useState(false);

	return (
		<div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background">
			{/* Sidebar with new design */}
			<HelpSidebar
				sections={sections}
				selectedSectionKey={selectedSectionKey}
				activeChildKey={activeChildKey}
				onSectionSelect={onSectionSelect}
				searchValue={searchValue}
				onSearchChange={onSearchChange}
				displaySections={displaySections}
				expandedKeys={expandedKeys}
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>

			{/* Main Content - compact modern design matching sidebar */}
			<main className="flex-1 overflow-y-auto bg-background/50 animate-fadeIn">
				{/* Top navigation bar - compact design */}
				<div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 py-2 px-4">
					{renderBreadcrumbs()}
				</div>

				{/* Content container - more compact spacing */}
				<div className="container mx-auto px-4 py-6 max-w-5xl">
					<HelpLayout title="">
						{renderContent()}
					</HelpLayout>


				</div>
			</main>
		</div>
	);
};