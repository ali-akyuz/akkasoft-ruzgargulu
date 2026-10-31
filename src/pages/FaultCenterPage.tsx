import React from 'react';
import { FeaturePlaceholder } from '../components/common/FeaturePlaceholder';

export const FaultCenterPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Arıza Takip ve Müdahale Merkezi</h2>
        <p className="mt-1 text-sm text-slate-400">
          Otomatik anomali algılama, acil durum protokolleri ve WhatsApp saha yönlendirme merkezi.
        </p>
      </div>

      <FeaturePlaceholder
        featureName="Arıza Sevk ve Saha Bildirim Katmanı"
        badge="Saha Müdahale"
        description="Türbin sensörlerinden gelen anomali sinyalleri otomatik olarak sınıflandırılıp nöbetçi saha teknisyenine doğrudan WhatsApp formatlı mesajla sevk edilecektir."
        plannedCapabilities={[
          'Kritik, yüksek ve orta öncelikli arıza alarm kuyruğu',
          'WhatsApp üzerinden tek tıkla saha ekibine koordinatlı sevk',
          'Arıza geçmişi, çözüm süreleri (MTTR) ve parça kayıtları',
          'Tek tuşla uzaktan türbin frenleme ve kanat feathering emri',
        ]}
      />
    </div>
  );
};

