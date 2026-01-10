import Dexie, { type Table } from "dexie";
import type { DataRow } from "@/types/Data";
import type { Variable } from "@/types/Variable";
import type { ValueLabel } from "@/types/Variable";
import type { Log } from "@/types/Result";
import type { Analytic } from "@/types/Result";
import type { Statistic } from "@/types/Result";
import type { Meta } from "@/types/Meta";

class MyDatabase extends Dexie {
  dataRows!: Table<{ id: number; data: DataRow }, number>;
  variables!: Table<Variable, number>;
  valueLabels!: Table<ValueLabel, number>;

  logs!: Table<Log, number>;
  analytics!: Table<Analytic, number>;
  statistics!: Table<Statistic, number>;

  metadata!: Table<Meta & { id: string }, string>;

  constructor() {
    super("Statify");

    this.version(7).stores({
      dataRows: "++id",
      variables: "++id, &columnIndex, &name, type",
      valueLabels: "++id, variableId, value",

      logs: "++id",
      analytics: "++id, logId, title",
      statistics: "++id, analyticId",

      metadata: "&id",
    });

    this.dataRows = this.table("dataRows");
    this.variables = this.table("variables");
    this.valueLabels = this.table("valueLabels");
    this.logs = this.table("logs");
    this.analytics = this.table("analytics");
    this.statistics = this.table("statistics");
    this.metadata = this.table("metadata");
  }

  async getLogWithRelations(logId: number): Promise<Log | undefined> {
    const log = await this.logs.get(logId);
    if (!log) return undefined;

    const analytics = await this.analytics
      .where("logId")
      .equals(logId)
      .toArray();
    const analyticIds = analytics
      .map((a) => a.id)
      .filter((id): id is number => id !== undefined);

    if (analyticIds.length > 0) {
      const statistics = await this.statistics
        .where("analyticId")
        .anyOf(analyticIds)
        .toArray();
      const statisticMap = new Map<number, Statistic[]>();

      for (const statistic of statistics) {
        if (!statistic.analyticId) continue;
        if (!statisticMap.has(statistic.analyticId)) {
          statisticMap.set(statistic.analyticId, []);
        }
        const statistics = statisticMap.get(statistic.analyticId);
        if (statistics) {
          statistics.push(statistic);
        }
      }

      for (const analytic of analytics) {
        if (analytic.id) {
          analytic.statistics = statisticMap.get(analytic.id) ?? [];
        }
      }
    }

    log.analytics = analytics;
    return log;
  }

  async getAllLogsWithRelations(): Promise<Log[]> {
    const logs = await this.logs.toArray();
    const analytics = await this.analytics.toArray();
    const statistics = await this.statistics.toArray();

    const analyticMap = new Map<number, Analytic[]>();
    const statisticMap = new Map<number, Statistic[]>();

    for (const statistic of statistics) {
      if (!statistic.analyticId) continue;

      if (!statisticMap.has(statistic.analyticId)) {
        statisticMap.set(statistic.analyticId, []);
      }
      const statistics = statisticMap.get(statistic.analyticId);
      if (statistics) {
        statistics.push(statistic);
      }
    }

    for (const analytic of analytics) {
      if (!analytic.id) continue;
      analytic.statistics = statisticMap.get(analytic.id) ?? [];

      if (!analytic.logId) continue;
      if (!analyticMap.has(analytic.logId)) {
        analyticMap.set(analytic.logId, []);
      }
      const analytics = analyticMap.get(analytic.logId);
      if (analytics) {
        analytics.push(analytic);
      }
    }

    for (const log of logs) {
      if (!log.id) continue;
      log.analytics = analyticMap.get(log.id) ?? [];
    }

    return logs;
  }

  async deleteLogAndRelations(logId: number): Promise<void> {
    await this.transaction(
      "rw",
      this.logs,
      this.analytics,
      this.statistics,
      async () => {
        // Find all analytics related to the log
        const analyticsToDelete = await this.analytics
          .where("logId")
          .equals(logId)
          .toArray();
        const analyticIds = analyticsToDelete
          .map((a) => a.id)
          .filter((id): id is number => id !== undefined);

        if (analyticIds.length > 0) {
          // Delete all statistics that are children of the analytics to be deleted
          await this.statistics.where("analyticId").anyOf(analyticIds).delete();
        }

        // Delete all analytics related to the log
        await this.analytics.where("logId").equals(logId).delete();

        // Finally, delete the log itself
        await this.logs.delete(logId);
      }
    );
  }
}

const db = new MyDatabase();
export default db;
