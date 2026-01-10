"use client";
import React, { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Trash2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useResultStore } from "@/stores/useResultStore";
import type { Log } from "@/types/Result";
import type { Statistic } from "@/types/Result";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SidebarItem {
    id?: number;
    type?: 'log' | 'analytic' | 'statistic';
    title: string;
    url?: string;
    items?: SidebarItem[];
    analyticId?: number;
}

const SidebarMenuItem: React.FC<{
    item: SidebarItem;
    depth?: number;
    isOpen: boolean;
    deleteLog: (logId: number) => Promise<void>;
    deleteAnalytic: (analyticId: number) => Promise<void>;
    deleteStatistic: (statisticId: number) => Promise<void>;
}> = ({ item, depth = 0, isOpen, deleteLog, deleteAnalytic, deleteStatistic }) => {

    const [open, setOpen] = useState(false);
    const hasChildren = item.items && item.items.length > 0;
    const isDeletable = item.type !== undefined && item.id !== undefined;

    const handleDelete = async () => {
        if (!item.id) return;
        try {
            if (item.type === 'log' && item.id) {
                // Delete the whole log entry
                await deleteLog(item.id);
            } else if (item.type === 'analytic' && item.id) {
                /*
                 * The UI no longer exposes the Log hierarchy, so an analytic represents
                 * the entire log. When an analytic is deleted from the sidebar we also
                 * need to remove its parent log. We locate the parent log from the
                 * current store, then delete that log directly – this will cascade and
                 * remove the analytic & statistics in a single call.
                 */
                const state = useResultStore.getState();
                const parentLog = state.logs.find((l) =>
                    l.analytics?.some((a) => a.id === item.id)
                );

                if (parentLog?.id) {
                    await deleteLog(parentLog.id);
                } else {
                    // Fallback – if we cannot find the parent log for some reason, fallback to the original behaviour
                    await deleteAnalytic(item.id);
                }
            } else if (item.type === 'statistic' && item.id) {
                await deleteStatistic(item.id);
            }
            const itemTypeLabel = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item';
            toast.success(`Item deleted: ${itemTypeLabel} "${item.title}" has been deleted.`);
        } catch (error: unknown) {
            if (process.env.NODE_ENV !== 'production') {
                // eslint-disable-next-line no-console
                console.error(`Failed to delete ${item.type}:`, error);
            }
            const message = error instanceof Error ? error.message : '';
            toast.error(`Error deleting item: Failed to delete ${item.type} "${item.title}". ${message}`);
        }
    };

    const handleToggle = () => {
        if (hasChildren) setOpen(!open);
    };

    const paddingLeft = depth * 4;

    const renderDeleteButton = () => (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`sidebar-delete-button-${item.type}-${item.id}`}
                >
                    <Trash2 size={14} />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-[425px] bg-popover text-popover-foreground border-border rounded-lg p-4 shadow-lg" data-testid={`delete-dialog-${item.type}-${item.id}`}>
                <AlertDialogHeader className="pb-2">
                    <AlertDialogTitle className="text-lg font-semibold text-popover-foreground">Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                        This action cannot be undone. This will permanently delete the {item.type} &quot;{item.title}&quot;
                        {item.type === 'log' && ' and all its associated analytics and statistics.'}
                        {item.type === 'analytic' && ' and all its associated statistics.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-3 sm:justify-end">
                    <AlertDialogCancel className="border border-border hover:bg-accent text-accent-foreground h-8 px-3 text-sm" data-testid={`delete-cancel-${item.type}-${item.id}`}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 px-3 text-sm" data-testid={`delete-confirm-${item.type}-${item.id}`}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );

    // For collapsed sidebar mode, render a simplified version
    if (!isOpen) {
        if (item.type === 'analytic') {
            return (
                <div className="flex justify-center py-2 hover:bg-accent rounded-md cursor-pointer" data-testid={`sidebar-collapsed-analytic-${item.id}`}>
                    <a href={item.url ?? `#output-${item.id}`} title={item.title}>
                        <BarChart2 size={20} />
                    </a>
                </div>
            );
        }
        return null; // Don't render non-analytic items in collapsed mode
    }

    return (
        <div className="flex flex-col group" data-testid={`sidebar-item-${item.type}-${item.id}`}>
            {hasChildren ? (
                <div className={cn(
                    "flex items-center text-sm text-foreground rounded group relative hover:bg-accent",
                    { "pl-3 pr-1 py-1": depth > 0, "py-2 px-3 pr-1": depth === 0 }
                )}
                    style={{ paddingLeft: `${paddingLeft}px` }}
                    data-testid={`sidebar-expandable-${item.type}-${item.id}`}
                >
                    <button
                        onClick={handleToggle}
                        className="flex items-center grow focus:outline-none"
                        data-testid={`sidebar-toggle-${item.type}-${item.id}`}
                    >
                        <span className="truncate mr-1">{item.title}</span>
                        <span className="ml-auto flex-shrink-0 pl-1">
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </span>
                    </button>
                    {isDeletable && (
                        <div className="flex-shrink-0 ml-1">
                            {renderDeleteButton()}
                        </div>
                    )}
                </div>
            ) : (
                <div className={cn(
                    "flex items-center text-sm text-foreground rounded group relative hover:bg-accent",
                    { "pl-6 pr-1 py-1": depth > 0, "py-2 px-3 pr-1": depth === 0 }
                )}
                     style={{ paddingLeft: `${paddingLeft}px` }}
                     data-testid={`sidebar-link-${item.type}-${item.id}`}
                >
                    <a
                        href={item.url}
                        className="flex items-center grow truncate mr-1 focus:outline-none"
                        data-testid={`sidebar-link-anchor-${item.type}-${item.id}`}
                    >
                        {item.title}
                    </a>
                    {isDeletable && (
                        <div className="flex-shrink-0 ml-1">
                            {renderDeleteButton()}
                        </div>
                    )}
                </div>
            )}
            {/* Nested items rendered outside the clickable area */}
            {open && item.items && (
                <div className="ml-2" data-testid={`sidebar-nested-items-${item.type}-${item.id}`}>
                    {item.items.map((child, idx) => (
                        <SidebarMenuItem
                            key={generateKey(child, idx)}
                            item={child}
                            depth={depth + 1}
                            isOpen={isOpen}
                            deleteLog={deleteLog}
                            deleteAnalytic={deleteAnalytic}
                            deleteStatistic={deleteStatistic}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

function buildSidebarData(logs: Log[]): SidebarItem[] {
    const sidebarItems: SidebarItem[] = [];

    logs.forEach((log) => {
        if (!log.analytics || log.analytics.length === 0) {
            return;
        }

        // Iterate through each analytic within the log and push it directly
        // to the sidebar data, effectively removing the "Log" hierarchy level.
        log.analytics.forEach((analytic) => {
            if (!analytic.statistics || analytic.statistics.length === 0) return;

            // Link the icon in collapsed mode to the first statistic of this analytic
            const firstStatisticId = analytic.statistics[0]?.id;
            const analyticItem: SidebarItem = {
                id: analytic.id,
                analyticId: analytic.id,
                title: analytic.title,
                type: 'analytic',
                url: firstStatisticId ? `#output-${analytic.id}-${firstStatisticId}` : undefined,
                items: [],
            };

            const componentsMap = analytic.statistics.reduce((acc: Record<string, Statistic[]>, stat) => {
                const component = stat.components ?? "General";
                if (!acc[component]) acc[component] = [];
                acc[component].push(stat);
                return acc;
            }, {});

            const childItems: SidebarItem[] = [];

            Object.keys(componentsMap).forEach((component) => {
                const stats = componentsMap[component];
                if (stats.length > 1) {
                    const componentItem: SidebarItem = {
                        title: component,
                        items: stats.map((stat) => ({
                            id: stat.id,
                            analyticId: analytic.id,
                            type: 'statistic',
                            title: stat.title,
                            url: `#output-${analytic.id}-${stat.id}`
                        }))
                    };
                    childItems.push(componentItem);
                } else if (stats.length === 1) {
                    const stat = stats[0];
                    childItems.push({
                        id: stat.id,
                        analyticId: analytic.id,
                        type: 'statistic',
                        title: stat.title,
                        url: `#output-${analytic.id}-${stat.id}`
                    });
                }
            });

            if (childItems.length > 0) {
                analyticItem.items = childItems;
                sidebarItems.push(analyticItem);
            }
        });
    });

    return sidebarItems;
}

const Sidebar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { logs, deleteLog, deleteAnalytic, deleteStatistic, clearAll } = useResultStore();
    const [sidebarData, setSidebarData] = useState<SidebarItem[]>([]);

    useEffect(() => {
        const data = buildSidebarData(logs);
        setSidebarData(data);
    }, [logs]);

    return (
        <div
            className={cn(
                "bg-background border-r border-border transition-all duration-300 flex flex-col h-full overflow-y-auto",
                isOpen ? "w-64" : "w-14"
            )}
            data-testid="result-sidebar"
        >
            <div className="flex items-center p-3 border-b border-border flex-shrink-0" data-testid="result-sidebar-header">
                {isOpen && <h1 className="text-md font-semibold truncate" data-testid="result-sidebar-title">Result</h1>}

                {/* Trash icon to clear all results (only visible when sidebar is expanded) */}
                {isOpen && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("flex-shrink-0 ml-2 text-muted-foreground hover:text-destructive")}
                                disabled={logs.length === 0}
                                onClick={(e) => e.stopPropagation()}
                                data-testid="clear-all-results-button"
                            >
                                <Trash2 size={14} />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="sm:max-w-[425px] bg-popover text-popover-foreground border-border rounded-lg p-4 shadow-lg" data-testid="clear-all-results-dialog">
                            <AlertDialogHeader className="pb-2">
                                <AlertDialogTitle className="text-lg font-semibold text-popover-foreground">Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                                    This action cannot be undone. This will permanently delete all results including logs, analytics, and statistics.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-3 sm:justify-end">
                                <AlertDialogCancel className="border border-border hover:bg-accent text-accent-foreground h-8 px-3 text-sm" data-testid="clear-all-cancel">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async () => {
                                        try {
                                            await clearAll();
                                            toast.success("All results deleted: All result logs, analytics, and statistics have been removed.");
                                        } catch (error: unknown) {
                                            const message = error instanceof Error ? error.message : "Failed to delete results.";
                                            toast.error(`Error deleting results: ${message}`);
                                        }
                                    }}
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 px-3 text-sm"
                                    data-testid="clear-all-confirm"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}

                {/* Sidebar collapse / expand toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("flex-shrink-0", isOpen ? "ml-auto" : "mx-auto")}
                    onClick={() => setIsOpen(!isOpen)}
                    data-testid="result-sidebar-toggle"
                >
                    <ChevronRight
                        className={cn(
                            "w-4 h-4 transform transition-transform",
                            isOpen ? "rotate-180" : "rotate-0"
                        )}
                    />
                </Button>
            </div>
            <div className={cn("overflow-y-auto flex-grow", { "overflow-x-auto": isOpen })} data-testid="result-sidebar-content">
                <nav className={cn("p-2", { "flex flex-col items-center": !isOpen })} data-testid="result-sidebar-nav">
                    {sidebarData.map((item, index) => (
                        <SidebarMenuItem
                            key={generateKey(item, index)}
                            item={item}
                            isOpen={isOpen}
                            deleteLog={deleteLog}
                            deleteAnalytic={deleteAnalytic}
                            deleteStatistic={deleteStatistic}
                        />
                    ))}
                </nav>
            </div>
        </div>
    );
};

const generateKey = (item: SidebarItem, index: number): string => {
    if (item.type === 'log' && item.id) return `log-${item.id}`;
    if (item.type === 'analytic' && item.id) return `analytic-${item.id}`;
    if (item.type === 'statistic' && item.id) return `stat-${item.id}`;
    return `item-${item.title}-${index}`;
}

export default Sidebar;