import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { Meta, MetaStoreError } from '@/types/Meta';
import metaService from '@/services/data/MetaService';

interface MetaStoreState {
    meta: Meta;
    isLoading: boolean;
    error: MetaStoreError | null;
    isLoaded: boolean;

    loadMeta: () => Promise<void>;
    setMeta: (newMeta: Partial<Meta>) => Promise<void>;
    clearDates: () => Promise<void>;
    setFilter: (filter: Meta['filter']) => Promise<void>;
    resetMeta: () => Promise<void>;
    saveMeta: () => Promise<void>;
}

const initialMetaState: Meta = {
    name: '',
    location: '',
    created: new Date(),
    weight: '',
    dates: '',
    filter: ''
};

export const useMetaStore = create<MetaStoreState>()(
    devtools(
        immer((set, get) => ({
            meta: {
                name: '',
                location: '',
                created: new Date(),
                weight: '',
                dates: '',
                filter: ''
            },
            isLoading: false,
            error: null,
            isLoaded: false,

            loadMeta: async () => {
                if (get().isLoading || get().isLoaded) return;

                set(state => {
                    state.isLoading = true;
                    state.error = null;
                });

                try {
                    const storedMeta = await metaService.loadMeta();
                    if (storedMeta) {
                        set(state => {
                            state.meta = storedMeta;
                            if (!(state.meta.created instanceof Date)) {
                                state.meta.created = new Date(state.meta.created);
                            }
                        });
                    } else {
                        console.log("No metadata found in DB, initializing with defaults.");
                        await metaService.saveMeta(get().meta);
                    }
                    set(state => { state.isLoaded = true; });
                } catch (error: any) {
                    console.error("Failed to load metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to load metadata",
                            source: "loadMeta",
                            originalError: error
                        };
                    });
                } finally {
                    set(state => { state.isLoading = false; });
                }
            },

            setMeta: async (newMeta) => {
                const updatedMeta = { ...get().meta, ...newMeta };
                set({ meta: updatedMeta });
                await metaService.saveMeta(updatedMeta);
            },

            clearDates: async () => {
                const updatedMeta = { ...get().meta, dates: '' };
                set({ meta: updatedMeta });
                await metaService.saveMeta(updatedMeta);
            },

            setFilter: async (filter) => {
                const updatedMeta = { ...get().meta, filter };
                set({ meta: updatedMeta });
                await metaService.saveMeta(updatedMeta);
            },

            resetMeta: async () => {
                try {
                    await metaService.resetMeta();
                    const newMeta = { ...initialMetaState, created: new Date() };
                    set(state => {
                        state.meta = newMeta;
                        state.error = null;
                        state.isLoaded = false;
                    });
                    await metaService.saveMeta(newMeta);
                } catch (error: any) {
                    console.error("Failed to reset metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to reset metadata",
                            source: "resetMeta",
                            originalError: error
                        };
                    });
                }
            },

            saveMeta: async () => {
                const currentMeta = get().meta;
                try {
                    await metaService.saveMeta(currentMeta);
                    set(state => { state.error = null; });
                } catch (error: any) {
                    console.error("Failed to explicitly save metadata:", error);
                    set(state => {
                        state.error = {
                            message: error.message || "Failed to save metadata during explicit save",
                            source: "saveMeta",
                            originalError: error
                        };
                    });
                    throw error;
                }
            }
        })),
        { name: "MetaStore" }
    )
);