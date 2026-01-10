import { resultRepository } from "@/repositories";
import { Log, Analytic, Statistic } from "@/types/Result";

export class ResultService {
  /**
   * Get all result logs with associated analytics and statistics
   */
  async getAllResults() {
    try {
      return await resultRepository.getAllLogs();
    } catch (error) {
      console.error("Error in ResultService.getAllResults:", error);
      throw error;
    }
  }

  /**
   * Get a specific log with its associated analytics and statistics
   */
  async getLog(id: number) {
    try {
      return await resultRepository.getLog(id);
    } catch (error) {
      console.error(`Error in ResultService.getLog for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a new result log entry
   */
  async addResultLog(log: Log) {
    try {
      return await resultRepository.saveLog(log);
    } catch (error) {
      console.error("Error in ResultService.addResultLog:", error);
      throw error;
    }
  }

  /**
   * Update an existing log
   */
  async updateLog(id: number, logData: Partial<Log>) {
    try {
      const updatedLog: Log = {
        id,
        log: logData.log || ""
      };
      return await resultRepository.saveLog(updatedLog);
    } catch (error) {
      console.error(`Error in ResultService.updateLog for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a new analytic entry associated with a log
   */
  async addAnalytic(logId: number, analytic: Analytic) {
    try {
      const enrichedAnalytic: Analytic = {
        ...analytic,
        logId: logId
      };
      return await resultRepository.saveAnalytic(enrichedAnalytic);
    } catch (error) {
      console.error("Error in ResultService.addAnalytic:", error);
      throw error;
    }
  }

  /**
   * Update an existing analytic
   */
  async updateAnalytic(id: number, analyticData: Partial<Analytic>) {
    try {
      const updatedAnalytic: Analytic = {
        id,
        title: analyticData.title || "",
        note: analyticData.note,
        logId: analyticData.logId
      };
      return await resultRepository.saveAnalytic(updatedAnalytic);
    } catch (error) {
      console.error(`Error in ResultService.updateAnalytic for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Add a new statistic entry associated with an analytic
   */
  async addStatistic(analyticId: number, statistic: Statistic) {
    try {
      // Pastikan semua field memiliki nilai default yang masuk akal
      const defaultValues = {
        title: "",
        output_data: "{}",
        components: "",
        description: ""
      };
      
      const enrichedStatistic: Statistic = {
        ...defaultValues,
        ...statistic, // Nilai yang disediakan akan menimpa nilai default
        analyticId: analyticId // Pastikan analyticId selalu sesuai dengan parameter
      };
      
      return await resultRepository.saveStatistic(enrichedStatistic);
    } catch (error) {
      console.error("Error in ResultService.addStatistic:", error);
      throw error;
    }
  }

  /**
   * Update an existing statistic
   */
  async updateStatistic(id: number, statisticData: Partial<Statistic>) {
    try {
      // Ambil data statistik yang sudah ada dari database
      const existingStatistic = await resultRepository.getStatistic(id);
      if (!existingStatistic) {
        throw new Error(`Statistic with ID ${id} not found`);
      }
      
      // Gabungkan data yang sudah ada dengan perubahan baru
      const updatedStatistic: Statistic = {
        ...existingStatistic,
        ...statisticData,
        id // Pastikan ID tetap sama
      };
      
      return await resultRepository.saveStatistic(updatedStatistic);
    } catch (error) {
      console.error(`Error in ResultService.updateStatistic for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a log and all its associated analytics and statistics
   */
  async deleteLog(id: number) {
    try {
      await resultRepository.deleteLog(id);
      return true;
    } catch (error) {
      console.error(`Error in ResultService.deleteLog for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an analytic and all its associated statistics
   */
  async deleteAnalytic(id: number) {
    try {
      await resultRepository.deleteAnalytic(id);
      return true;
    } catch (error) {
      console.error(`Error in ResultService.deleteAnalytic for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a statistic
   */
  async deleteStatistic(id: number) {
    try {
      await resultRepository.deleteStatistic(id);
      return true;
    } catch (error) {
      console.error(`Error in ResultService.deleteStatistic for ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Clear all results data (logs, analytics, statistics)
   */
  async clearAll() {
    try {
      await resultRepository.clearResults();
      return true;
    } catch (error) {
      console.error("Error in ResultService.clearAll:", error);
      throw error;
    }
  }
}

const resultService = new ResultService();
export default resultService; 