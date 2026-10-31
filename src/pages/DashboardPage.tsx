import React from 'react';
import { Activity, Wind, Zap, AlertCircle, Compass, Radio } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { FeaturePlaceholder } from '../components/common/FeaturePlaceholder';

export const DashboardPage: React.FC = () => {
  // Saha KPI verileri (Canlı servis entegrasyonu hazırlığı)
  const placeholderKpis = [
    { title: 'Aktif Türbin Parkı', value: '-- / 19', unit: 'Türbin', icon: Wind, desc: 'Tüm üniteler hazır' },
    { title: 'Anlık Saha Üretimi', value: '--.--', unit: 'MW', icon: Zap, desc: 'Telemetri bekleniyor' },
    { title: 'Ortalama Rüzgâr Hızı', value: '--.-', unit: 'm/s', icon: Activity, desc: 'Kuzey-Kuzeydoğu' },
    { title: 'Kritik Türbülans Riski', value: '0', unit: 'Uyarı', icon: AlertCircle, desc: 'Erken uyarı devrede' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Sayfa Başlığı */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Saha Operasyonları Genel Bakış</h2>
            <Badge variant="emerald">Canlı Saha</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Kuzey Kıbrıs 19 türbinlik santral sahasının gerçek zamanlı telemetri, güç ve tele-kontrol paneli.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            Otomatik Polling: <strong className="text-white">5 sn</strong>
          </span>
        </div>
      </div>

      {/* KPI Kartları İskeleti */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {placeholderKpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx} className="relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{kpi.title}</span>
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight font-mono">
                  {kpi.value}
                </span>
                <span className="text-xs font-medium text-slate-400">{kpi.unit}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/50 pt-2">
                <span>{kpi.desc}</span>
                <span className="text-slate-400 font-mono">Hazırlanıyor</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modül Tanıtım ve Özellik Kartı */}
      <FeaturePlaceholder
        featureName="Çekirdek Telemetri ve Türbin Yönetim Katmanı"
        badge="Telemetri Modülü"
        description="WT-01 ile WT-19 arasındaki 19 türbinin teleskopik kule seviyeleri, yaw açıları ve anlık üretim hesaplamalarını içeren servis katmanı yapılandırılmaktadır."
        plannedCapabilities={[
          'Türbin telemetrisi REST/WebSocket istemcisi ve anlık veri döngüsü',
          '19 Türbinin tek tek durum kartları (WT-01 ... WT-19)',
          'Teleskopik kule kademesi (0-3 kademe) ve rotor devir göstergeleri',
          'Erken türbülans algılama ve acil güvenli durdurma protokolü',
        ]}
      />

      {/* İskelet Tablo Alanı */}
      <Card title="Türbin Saha Listesi" subtitle="19 Türbinin Anlık Durum Çizelgesi">
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <div className="h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
            <Compass className="h-6 w-6 animate-pulse text-emerald-400" />
          </div>
          <h4 className="text-base font-semibold text-white">Türbin Telemetrisi Yükleniyor</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-md">
            Veri modelleri ve servis katmanı bağlandığında 19 türbinin canlı telemetri tablosu burada listelenecektir.
          </p>
        </div>
      </Card>
    </div>
  );
};

