# RüzgarGülü — Akıllı Rüzgâr Enerjisi & Telemetri Yönetim Platformu

> **Hackathon Sürümü (v0.1.0-scaffold)**  
> Kuzey Kıbrıs genelindeki 19 rüzgâr türbinini merkezi olarak izleyen, erken türbülans algılayan ve teleskopik kule koruma mekanizmalarını yöneten modern IoT ve saha kontrol paneli.

---

## 🏗️ Mimari ve Geliştirme Yaklaşımı (Clean Architecture)

Bu proje, hackathon sürecinde modülerlik, sürdürülebilirlik ve tip güvenliğini garanti altına almak amacıyla **katmanlı (Clean / Feature-Modular Architecture)** prensipleri doğrultusunda yapılandırılmıştır.

```text
src/
├── assets/           # Global stiller, Tailwind tanımları ve medya varlıkları
├── components/       # Atomik ve yeniden kullanılabilir UI bileşenleri
│   ├── common/       # Card, Badge, FeaturePlaceholder gibi genel bileşenler
│   └── layout/       # MainLayout, Navbar, Sidebar, Footer iskelet katmanı
├── pages/            # Yönlendirme (Route) seviyesindeki görünüm katmanları
├── services/         # API, HTTP istemcileri ve mock veri sağlayıcıları
├── store/            # Context API tabanlı reaktif durum yönetimi
├── hooks/            # Veri çekme ve polling için custom React kancaları
├── utils/            # Matematiksel hesaplayıcılar, formatlayıcılar ve sabitler
└── types/            # TypeScript veri modelleri ve tip kontratları
```

---

## 🧭 Modüler Mimari & Yol Haritası

Platform aşağıdaki modüler yapı çerçevesinde genişletilebilir şekilde tasarlanmıştır:

- **Çekirdek İskelet:** Proje klasör yapısı, tip güvenliği (TypeScript), stil altyapısı (Tailwind CSS) ve responsive uygulama kabuğu.
- **Saha Telemetrisi:** 19 türbinin anlık güç, rüzgâr hızı, yaw açısı ve operasyonel verilerinin toplanması.
- **Erken Uyarı & Koruma:** Anomali tespiti ve otomatik rüzgâr koruma protokolleri.
- **Arıza & Saha Koordinasyonu:** Saha operasyon ekibine bildirim iletimi.

---

## 🚀 Kurulum ve Yerel Çalıştırma

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya pnpm

### Adımlar

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

Uygulama yerel ortamda `http://localhost:3000` adresinde çalışacaktır.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **İkonlar:** Lucide React
- **Yönlendirme:** React Router DOM
- **Paketleme / Derleme:** Vite
