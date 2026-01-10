import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools } from "zustand/middleware";
import resultService from "@/services/data/ResultService";
import { Log } from "@/types/Result";
import { Analytic } from "@/types/Result";
import { Statistic } from "@/types/Result";

export type ResultStoreError = {
  message: string;
  source: string;
  originalError?: any;
};

export interface ResultState {
  logs: Log[];
  isLoading: boolean;
  error: ResultStoreError | null;

  loadResults: () => Promise<void>;
  getLogById: (id: number) => Promise<Log | undefined>;

  addLog: (log: Omit<Log, "id" | "analytics">) => Promise<number>;
  updateLog: (
    id: number,
    logData: Partial<Omit<Log, "id" | "analytics">>
  ) => Promise<void>;
  deleteLog: (logId: number) => Promise<void>;

  addAnalytic: (
    logId: number,
    analytic: Omit<Analytic, "id" | "logId" | "statistics">
  ) => Promise<number>;
  updateAnalytic: (
    analyticId: number,
    analyticData: Partial<Omit<Analytic, "id" | "logId" | "statistics">>
  ) => Promise<void>;
  deleteAnalytic: (analyticId: number) => Promise<void>;

  addStatistic: (
    analyticId: number,
    statistic: Omit<Statistic, "id" | "analyticId">
  ) => Promise<number>;
  updateStatistic: (
    statisticId: number,
    statisticData: Partial<Omit<Statistic, "id" | "analyticId">>
  ) => Promise<void>;
  deleteStatistic: (statisticId: number) => Promise<void>;

  clearAll: () => Promise<void>;

  latestLogId: number | null;
  setLatestLogId: (id: number | null) => void;
}

export const useResultStore = create<ResultState>()(
  devtools(
    immer((set) => ({
      logs: [],
      isLoading: false,
      error: null,

      latestLogId: null,
      setLatestLogId: (id: number | null) => {
        set({ latestLogId: id });
      },

      loadResults: async () => {
        set((draft) => {
          draft.isLoading = true;
          draft.error = null;
        });

        try {
          const logs = await resultService.getAllResults();
          set((draft) => {
            draft.logs = logs;
            draft.isLoading = false;
          });
        } catch (error: any) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch logs:", error);
          set((draft) => {
            draft.error = {
              message: error.message || "Failed to fetch logs",
              source: "fetchLogs",
              originalError: error,
            };
            draft.isLoading = false;
          });
        }
      },

      getLogById: async (id: number) => {
        try {
          return await resultService.getLog(id);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to fetch log by id:", error);
          return undefined;
        }
      },

      addLog: async (log) => {
        try {
          const id = await resultService.addResultLog({
            log: log.log,
          });

          // Update state after successful API call
          set((state) => {
            state.logs.push({ ...log, id, analytics: [] });
            state.latestLogId = id; // Set latestLogId as a signal
          });

          return id;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to add log:", error);
          throw error;
        }
      },

      updateLog: async (id, logData) => {
        try {
          await resultService.updateLog(id, logData);

          // Update state after successful API call
          set((state) => {
            const logIndex = state.logs.findIndex((log) => log.id === id);
            if (logIndex >= 0) {
              Object.assign(state.logs[logIndex], logData);
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to update log:", error);
          throw error;
        }
      },

      deleteLog: async (logId: number) => {
        try {
          await resultService.deleteLog(logId);
          // Update state after successful API call
          set((state) => {
            state.logs = state.logs.filter((log) => log && log.id !== logId);
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to delete log:", error);
          throw error;
        }
      },

      addAnalytic: async (logId, analyticData) => {
        try {
          const analytic: Analytic = {
            ...analyticData,
            logId: logId,
          };

          const analyticId = await resultService.addAnalytic(logId, analytic);

          // Update state after successful API call
          set((state) => {
            const logIndex = state.logs.findIndex((log) => log.id === logId);
            if (logIndex >= 0) {
              const analyticWithId = {
                ...analytic,
                id: analyticId,
                statistics: [],
              };
              if (!state.logs[logIndex].analytics) {
                state.logs[logIndex].analytics = [];
              }
              state.logs[logIndex].analytics.push(analyticWithId);
            }
          });

          return analyticId;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to add analytic:", error);
          throw error;
        }
      },

      updateAnalytic: async (analyticId, analyticData) => {
        try {
          await resultService.updateAnalytic(analyticId, analyticData);

          // Update state after successful API call
          set((state) => {
            for (const log of state.logs) {
              if (!log.analytics) continue;

              const analyticIndex = log.analytics.findIndex(
                (a) => a.id === analyticId
              );
              if (analyticIndex >= 0) {
                Object.assign(log.analytics[analyticIndex], analyticData);
                break;
              }
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to update analytic:", error);
          throw error;
        }
      },

      deleteAnalytic: async (analyticId) => {
        try {
          await resultService.deleteAnalytic(analyticId);

          // Update state after successful API call
          set((state) => {
            for (const log of state.logs) {
              if (!log.analytics) continue;

              const analyticIndex = log.analytics.findIndex(
                (a) => a.id === analyticId
              );
              if (analyticIndex >= 0) {
                log.analytics.splice(analyticIndex, 1);
                break;
              }
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to delete analytic:", error);
          throw error;
        }
      },

      addStatistic: async (analyticId, statisticData) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log('[useResultStore] Adding statistic', { analyticId, title: statisticData.title });
        }

        try {
          const statistic: Statistic = {
            ...statisticData,
            analyticId: analyticId,
          };

          const statisticId = await resultService.addStatistic(
            analyticId,
            statistic
          );
          const statisticWithId = { ...statistic, id: statisticId };

          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[useResultStore] Statistic saved to database with ID:', statisticId);
          }

          // Update state after successful API call
          set((state) => {
            outerLoop: for (const log of state.logs) {
              if (!log.analytics) continue;

              for (const analytic of log.analytics) {
                if (analytic.id === analyticId) {
                  if (!analytic.statistics) {
                    analytic.statistics = [];
                  }
                  analytic.statistics.push(statisticWithId);
                  if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.log('[useResultStore] Statistic added. Count:', analytic.statistics.length);
                  }
                  break outerLoop;
                }
              }
            }
          });

          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('[useResultStore] addStatistic completed:', statisticId);
          }
          return statisticId;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[useResultStore] Failed to add statistic:', error);
          throw error;
        }
      },

      updateStatistic: async (statisticId, statisticData) => {
        try {
          await resultService.updateStatistic(statisticId, statisticData);

          // Update state after successful API call
          set((state) => {
            outerLoop: for (const log of state.logs) {
              if (!log.analytics) continue;

              for (const analytic of log.analytics) {
                if (!analytic.statistics) continue;

                const statisticIndex = analytic.statistics.findIndex(
                  (s) => s.id === statisticId
                );
                if (statisticIndex >= 0) {
                  Object.assign(
                    analytic.statistics[statisticIndex],
                    statisticData
                  );
                  break outerLoop;
                }
              }
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to update statistic:", error);
          throw error;
        }
      },

      deleteStatistic: async (statisticId) => {
        try {
          await resultService.deleteStatistic(statisticId);

          // Update state after successful API call
          set((state) => {
            outerLoop: for (const log of state.logs) {
              if (!log.analytics) continue;

              for (const analytic of log.analytics) {
                if (!analytic.statistics) continue;

                const statisticIndex = analytic.statistics.findIndex(
                  (s) => s.id === statisticId
                );
                if (statisticIndex >= 0) {
                  analytic.statistics.splice(statisticIndex, 1);
                  break outerLoop;
                }
              }
            }
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to delete statistic:", error);
          throw error;
        }
      },

      clearAll: async () => {
        try {
          await resultService.clearAll();

          // Update state after successful API call
          set((state) => {
            state.logs = [];
            state.latestLogId = null;
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Failed to clear all data:", error);
          throw error;
        }
      },
    })),
    { name: "StatifyStore" }
  )
);
