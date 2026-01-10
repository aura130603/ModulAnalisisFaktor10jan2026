"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import type { DataAction } from './types';

interface DataActionCardProps {
    action: DataAction;
}

export const DataActionCard: React.FC<DataActionCardProps> = ({ action }) => {
    return (
        <Card
            key={action.id}
            onClick={action.action}
            data-testid={`data-action-card-${action.id}`}
            className={`h-full border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                action.primary ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'
            }`}
        >
            <CardContent className="p-6 flex flex-col items-center text-center h-full">
                <div 
                    className={`p-4 rounded-full mb-4 ${
                        action.primary ? 'bg-primary-foreground/10' : 'bg-muted'
                    }`}
                    data-testid={`data-action-icon-${action.id}`}
                >
                    {action.icon}
                </div>
                <CardTitle 
                    className={`text-xl font-semibold mb-2 ${
                        action.primary ? 'text-primary-foreground' : 'text-card-foreground'
                    }`}
                    data-testid={`data-action-title-${action.id}`}
                >
                    {action.title}
                </CardTitle>
                <CardDescription 
                    className={
                        action.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                    }
                    data-testid={`data-action-description-${action.id}`}
                >
                    {action.description}
                </CardDescription>
            </CardContent>
        </Card>
    );
}; 