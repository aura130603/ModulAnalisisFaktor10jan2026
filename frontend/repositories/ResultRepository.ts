import db from "@/lib/db";
import { Log, Analytic, Statistic } from "@/types/Result";

export class ResultRepository {
  async getAllLogs(): Promise<Log[]> {
    try {
      return await db.getAllLogsWithRelations();
    } catch (error) {
      console.error("Failed to load logs with relations:", error);
      throw error;
    }
  }

  async getLog(id: number): Promise<Log | undefined> {
    try {
      return await db.getLogWithRelations(id);
    } catch (error) {
      console.error(`Failed to get log with ID ${id}:`, error);
      throw error;
    }
  }

  async saveLog(log: Log): Promise<number> {
    try {
      // Use put for simplicity (add or update)
      return await db.logs.put({ log: log.log, id: log.id });
    } catch (error) {
      console.error("Failed to save log:", error);
      throw error;
    }
  }

  async deleteLog(id: number): Promise<void> {
    try {
      // Delegate complex transactional delete to the db layer
      await db.deleteLogAndRelations(id);
    } catch (error) {
      console.error(`Failed to delete log with ID ${id}:`, error);
      throw error;
    }
  }

  async saveAnalytic(analytic: Analytic): Promise<number> {
    try {
      // Use put for simplicity (add or update)
      const { statistics, ...analyticData } = analytic; // Exclude relations
      return await db.analytics.put(analyticData);
    } catch (error) {
      console.error("Failed to save analytic:", error);
      throw error;
    }
  }

  async saveStatistic(statistic: Statistic): Promise<number> {
    try {
      // Use put for simplicity (add or update)
      return await db.statistics.put(statistic);
    } catch (error) {
      console.error("Failed to save statistic:", error);
      throw error;
    }
  }

  async deleteAnalytic(id: number): Promise<void> {
    try {
      // Wrap in a transaction to ensure atomicity
      await db.transaction('rw', db.analytics, db.statistics, async () => {
        // First delete all statistics for this analytic
        await db.statistics.where('analyticId').equals(id).delete();
        
        // Then delete the analytic itself
        await db.analytics.delete(id);
      });
    } catch (error) {
      console.error(`Failed to delete analytic with ID ${id}:`, error);
      throw error;
    }
  }

  async deleteStatistic(id: number): Promise<void> {
    try {
      await db.statistics.delete(id);
    } catch (error) {
      console.error(`Failed to delete statistic with ID ${id}:`, error);
      throw error;
    }
  }

  async clearResults(): Promise<void> {
    try {
      await db.transaction('rw', [db.logs, db.analytics, db.statistics], async () => {
        await db.statistics.clear();
        await db.analytics.clear();
        await db.logs.clear();
      });
    } catch (error) {
      console.error("Failed to clear results:", error);
      throw error;
    }
  }

  async getStatistic(id: number): Promise<Statistic | undefined> {
    try {
      return await db.statistics.get(id);
    } catch (error) {
      console.error(`Failed to get statistic with ID ${id}:`, error);
      throw error;
    }
  }
}

const resultRepository = new ResultRepository();
export default resultRepository; 