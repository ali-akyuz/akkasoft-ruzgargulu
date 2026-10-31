export type TurbineStatus = 'active' | 'warning' | 'critical' | 'maintenance';

export interface TurbineSummary {
  id: string;
  code: string;
  model: string;
  status: TurbineStatus;
  currentPowerKw: number;
  windSpeedMs: number;
  rotorRpm: number;
  telescopicLevel: number; // 0, 1, 2, 3
  yawAngleDeg: number;
  efficiencyPercent: number;
  lastUpdated: string;
}

export interface MetricCardData {
  title: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  trend?: 'up' | 'down' | 'neutral';
  subtext?: string;
}

export interface TurbineFaultAlert {
  id: string;
  turbineCode: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  timestamp: string;
  resolved: boolean;
}

