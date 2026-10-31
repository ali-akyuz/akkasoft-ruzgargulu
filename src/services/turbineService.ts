import { TurbineSummary, TurbineFaultAlert } from '../types/turbine';

/**
 * Türbin Servisi (Mock / API İskeleti)
 * Aşama 2'de canlı veri modelleri ve simülasyon döngüsü buraya bağlanacaktır.
 */
export const TurbineService = {
  /**
   * Tüm 19 türbinin anlık durum özetini getirir
   */
  async getTurbines(): Promise<TurbineSummary[]> {
    // Aşama 1: İskelet (Boş liste veya placeholder)
    return [];
  },

  /**
   * Belirli bir türbinin detaylarını getirir
   */
  async getTurbineById(id: string): Promise<TurbineSummary | null> {
    return null;
  },

  /**
   * Aktif arıza uyarılarını getirir
   */
  async getActiveAlerts(): Promise<TurbineFaultAlert[]> {
    return [];
  },
};

