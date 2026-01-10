// /stores/useStoreMediator.ts
import React from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Event-driven mediator to eliminate circular dependencies between stores
 * Minimal implementation focusing on critical data flow coordination
 */

export type StoreEvent = 
  | { type: 'DATA_UPDATED'; payload: { rowCount: number; colCount: number } }
  | { type: 'VARIABLES_UPDATED'; payload: { variableCount: number; maxColumnIndex: number } }
  | { type: 'STRUCTURE_CHANGED'; payload: { source: 'data' | 'variables' } }
  | { type: 'SYNC_STATUS_CHANGED'; payload: { status: 'idle' | 'syncing' | 'error' } };

type EventHandler = (event: StoreEvent) => void;

export interface StoreMediatorState {
  subscribers: Map<string, EventHandler[]>;
  // Cached values (derived from events) for quick access
  _cachedDataDimensions?: { rows: number; cols: number };
  _cachedVariableCount?: number;
  
  // Core methods
  subscribe: (eventType: string, handler: EventHandler) => () => void;
  emit: (event: StoreEvent) => void;
  
  // Optimized getters for common queries
  getDataDimensions: () => { rows: number; cols: number } | null;
  getVariableCount: () => number;
}

export const useStoreMediator = create<StoreMediatorState>()(devtools(
  (set, get) => ({
    subscribers: new Map(),
    
    subscribe: (eventType: string, handler: EventHandler) => {
      const { subscribers } = get();
      const handlers = subscribers.get(eventType) || [];
      handlers.push(handler);
      subscribers.set(eventType, handlers);
      
      // Return unsubscribe function
      return () => {
        const currentHandlers = subscribers.get(eventType) || [];
        const index = currentHandlers.indexOf(handler);
        if (index > -1) {
          currentHandlers.splice(index, 1);
          if (currentHandlers.length === 0) {
            subscribers.delete(eventType);
          } else {
            subscribers.set(eventType, currentHandlers);
          }
        }
      };
    },
    
    emit: (event: StoreEvent) => {
      const { subscribers } = get();
      const handlers = subscribers.get(event.type) || [];
      
      // Cache frequently accessed data
      if (event.type === 'DATA_UPDATED') {
        set(state => ({ 
          ...state,
          _cachedDataDimensions: { rows: event.payload.rowCount, cols: event.payload.colCount }
        }));
      } else if (event.type === 'VARIABLES_UPDATED') {
        set(state => ({ 
          ...state,
          _cachedVariableCount: event.payload.variableCount 
        }));
      }
      
      // Notify subscribers
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('Error in store mediator event handler:', error);
        }
      });
    },
    
    getDataDimensions: () => {
      const { _cachedDataDimensions } = get();
      return _cachedDataDimensions || null;
    },
    
    getVariableCount: () => {
      const { _cachedVariableCount } = get();
      return _cachedVariableCount || 0;
    }
  }),
  { name: 'StoreMediator' }
));

// Utility hook for selective store subscriptions
export const useSelectiveSubscription = <T>(
  selector: () => T,
  deps: React.DependencyList = []
) => {
  const [value, setValue] = React.useState<T>(selector);
  const prevDepsRef = React.useRef(deps);
  
  React.useEffect(() => {
    // Only update if dependencies actually changed
    const depsChanged = deps.some((dep, i) => dep !== prevDepsRef.current[i]);
    if (depsChanged) {
      setValue(selector());
      prevDepsRef.current = deps;
    }
  }, [selector, ...deps]);
  
  return value;
};