import React from 'react';
import { FeaturePlaceholder } from '../components/common/FeaturePlaceholder';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Enerji Analizi ve Finansal Getiri</h2>
        <p className="mt-1 text-sm text-slate-400">
          Saatlik üretim tahminleri, rüzgâr yönü optimizasyonu ve tarife bazlı gelir analizleri.
        </p>
      </div>

      <FeaturePlaceholder
        featureName="Enerji Optimizasyon ve Gelir Motoru"
        badge="Optimizasyon Modülü"
        description="3-12-25 m/s güç eğrisi formülleri, 8 yönlü rüzgâr gülü analizi ve KKTC tarife modeliyle hesaplanan gelir simülasyonu entegre edilecektir."
        plannedCapabilities={[
          'Saatlik ve günlük tahmini enerji üretim grafikleri',
          'Rüzgâr yönüne (Yaw) göre akıllı kanat optimizasyon matrisi',
          'Saha toplamı ve türbin bazlı finansal gelir dağılımı',
          'Geçmiş üretim trendi ve kapasite faktörü raporlaması',
        ]}
      />
    </div>
  );
};

