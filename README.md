# RüzgarGülü — Akıllı Rüzgâr Enerjisi & Telemetri Yönetim Platformu

RüzgarGülü; Kuzey Kıbrıs genelindeki 19 rüzgâr türbinini tek ekrandan izleyen, 25 km uzaktaki fırtınayı erken tespit edip türbini koruyan ve Three.js tabanlı 3D dijital ikiz simülasyonu sunan akıllı bir saha operasyon platformudur.

---

## 🚀 Canlı Sistem ve Sayfalar

Platform modüler olarak aşağıdaki bağımsız ve entegre merkezlerden oluşur:

- **`index.html`** — Tanıtım ve karşılama ana sayfası (Landing Page).
- **`login.html`** — Saha operatörü demo yetkilendirme ekranı.
- **`dashboard.html`** — Saha genel bakış paneli, anlık üretim sayaçları ve 19 türbinlik interaktif harita.
- **`analytics.html`** — Enerji üretim eğrileri, yön optimizasyonu ve finansal getiri analizi.
- **`fault-center.html`** — Anomali takip ve nöbetçi teknisyene tek tıkla WhatsApp sevk merkezi.
- **`simulasyon-merkezi.html`** — Three.js WebGL tabanlı 3D teleskopik kule, kanat rotasyonu ve fırtına koruma simülasyonu.
- **`turbulence-center.html`** — 8 yönlü 25 km çevre rüzgâr ve türbülans erken uyarı merkezi.
- **`turbulence-detail.html`** — Seçili türbin için mikro-türbülans telemetri detay ekranı.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend & Görselleştirme:** Three.js (WebGL 3D Modelleme & Animasyon), Modern ES Modülleri, HTML5, CSS3 Koyu Tema Tasarım Sistemi
- **Veri & Simülasyon:** Gerçekçi 3-12-25 m/s rüzgâr güç eğrisi hesaplama motoru, 5 sn polling döngüsü
- **Bildirim & Entegrasyon:** Otomatik durum filtreleme, WhatsApp API sevk köprüsü

---

## 💻 Yerel Olarak Çalıştırma

Three.js 3D modelleri ve ES modülleri tarayıcı `file://` protokolü kısıtlarına takılmaması için yerel bir statik HTTP sunucusu üzerinden çalıştırılmalıdır:

### 1. Hızlı Başlatma (Windows)
Proje kök dizinindeki **`run-local.bat`** dosyasını çift tıklayarak çalıştırın. Otomatik olarak yerel sunucuyu açıp tarayıcınızda uygulamayı başlatacaktır.

### 2. NPM ile Çalıştırma
```bash
npm install
npm run dev
```

### 3. Python ile Basit Sunucu
```bash
python -m http.server 8000
```
Ardından tarayıcınızda `http://localhost:8000` adresini açabilirsiniz.

---

## 🌟 Öne Çıkan Mühendislik Özellikleri

1. **3D Teleskopik Kule Simülasyonu:** Üç kademeli teleskopik kule hareketi, fırtına anında 3 → 2 → 1 kademeli geri çekilme ve kanat koruma pozisyonlaması.
2. **25 km Erken Uyarı:** Çevresel sensörlerden alınan yön ve türbülans verileriyle fırtına riski önceden hesaplanır.
3. **Gerçek Zamanlı Saha İzleme:** 19 türbinin anlık yaw açısı, rotor devri ve üretim kapasitesinin merkezi yönetimi.
