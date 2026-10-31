# RüzgarGülü

RüzgarGülü, rüzgâr enerjisi üretimini izlemek ve saha operasyonlarını yönetmek için hazırlanmış Türkçe bir ön yüz simülasyonudur. Uygulama giriş öncesi bir tanıtım sayfası ve beş oturum açılmış uygulama sayfası sunar:

- `index.html` — Tanıtım ana sayfası; enerji ve arıza CTA'ları girişten sonra ilgili ekrana yönlendirir
- `login.html` — Demo kullanıcı giriş ekranı
- `dashboard.html` — Genel Bakış
- `analytics.html` — Enerji Analizi
- `fault-center.html` — Arıza Kontrol Merkezi
- `simulasyon-merkezi.html` — Simülasyon Merkezi
- `turbulence-center.html` — Türbülans ve Erken Uyarı Merkezi

## Yerel olarak çalıştırma

İlk çalıştırmada Three.js bağımlılığını kurun:

```bash
npm install
```

Windows'ta proje klasöründeki `run-local.bat` dosyasını çalıştırın. Dosya, yerel sunucuyu başlatıp uygulamayı tarayıcıda açar. Simülasyon sayfaları ES modülleri kullandığından HTML dosyalarını doğrudan açmayın; tarayıcı `file://` güvenlik kısıtları modüllerin ve Three.js'in yüklenmesini engeller.

Diğer sistemlerde VS Code Live Server kullanın veya proje klasörünü basit bir statik HTTP sunucusuyla yayınlayın:

```bash
python -m http.server 8000
```

Ardından tarayıcıda `http://localhost:8000` adresini açın.

## Notlar

- Uygulama arka uç bağlantısı olmayan bir ön yüz simülasyonudur.
- Giriş öncesi ana sayfa tanıtım ekranıdır. “Giriş Yap” formu yerel demo oturumu açar; gerçek kimlik doğrulaması yapılmaz. Oturum tarayıcıda saklanır ve “Çıkış” ile kapatılır.
- Oturum açıldığında Genel Bakış, Enerji Analizi, Arıza Kontrol, Türbülans ve Simülasyon sayfaları kullanılabilir; üst çubukta “Hoş Geldin, AKKA Soft” görünür.
- Üst çubuktaki zil, sayfa değiştirmeden açılır bildirim listesini gösterir; bildirimler buradan okundu olarak işaretlenebilir. Canlı bildirim kartı sağ üst köşede belirdiğinde Web Audio API ile önem derecesine uygun (kritik alarm, uyarı, bilgi) kristal çan sesi çalar; bildirim panelindeki ses düğmesinden (`🔊` / `🔇`) ses açılıp kapatılabilir.
- Ölçümler örnek/simülasyon verileridir.
- Türbülans Merkezi'ndeki Three.js tabanlı 3D türbin modelini fareyle veya dokunmatik ekranda sürükleyerek çevirebilir, kaydırma tekerleğiyle yakınlaştırabilir ve kamerayı başlangıç görünümüne sıfırlayabilirsiniz.
- 3D kule simülasyonunda üç teleskopik katman, durdurma sırasında 3 → 2 → 1 sırasıyla geri çekilir; yeniden başlatmada 1 → 2 → 3 sırasıyla açılır. Bu hareketler yalnızca görsel demo değerleridir.
- Simülasyon Merkezi, Türbülans Merkezi'ndekiyle aynı Three.js türbin geometrisini kullanarak üç türbini tek sırada gösterir.
- Simülasyon Merkezi'nde teleskopik kule yüksekliği 0–3 kademe arasında seçili türbin için ayarlanabilir; bu görsel demo ayarı güç üretimini değiştirmez ve türbin başına yerel simülasyon durumunda saklanır. Türbin bilgi kartındaki çizgi grafik, simülasyon çalışırken seçili türbinin her tamamlanan gerçek 60 saniyedeki enerji üretimini gösterir; kısmi dakika üretimi grafiğe eklenmez. Sütun grafik kayıtlı satış fiyatına göre tahmini saatlik geliri gösterir. Veri noktaları ve sütunlar üzerine gelindiğinde dakika/saat bilgisi görüntülenir. Başlat/duraklat/devam kontrolleri üretim ve rotor animasyonunu birlikte yönetir. Fırtına tetikleme, yalnızca seçili türbinde tehlike uyarısı gösterir; “Koru” ile kanatları tek konumda toplar, kuleyi 1. kademeye indirir ve o türbinin üretimini durdurur. Koruma sonrasında “Devam et”, türbinin fırtına öncesi ayarlarını geri yükleyip çalışmayı yeniden başlatır. Bu yalnızca yerel demo davranışıdır ve gerçek türbine komut göndermez. Kontrol çubuğu sayfa kaydırılırken üst menünün altında sabit kalır; sıfırlama demo durumunu başlangıca döndürür.
- Türbülans Merkezi'ndeki “Yönetilen türbin” seçimi WT-01–WT-19 arasından demo hedefini belirler; seçim ve her türbinin simüle edilmiş yaw/çalışma durumu ayrı ayrı tarayıcıda saklanır.
- Finansal analizdeki türbin bazlı üretim ve gelir değerleri, saha toplamının tahmini türbin üretim paylarına dağıtılmasıyla hesaplanır; gerçek sayaç ölçümü değildir.
- Enerji Analizi'ndeki akıllı yön karar desteği, Türbülans Merkezi ile aynı Three.js türbin modelini kullanır. Yön ve katman işlemleri önce demo türbülans değerlendirmesi, ardından ayrı bir kullanıcı onayı gerektirir; yüksek/kritik veya değerlendirilemeyen koşullarda normal demo işlemleri engellenir. Demo yön ölçümleri, durum ve seçili türbin `windora-energy-optimization-v1` anahtarıyla bu sayfanın yerel simülasyonunda saklanır; mevcut gelir grafiği türbin filtresi bağımsız kalır.
- Enerji yönü üretim karşılaştırması, açıkça demo varsayımı olarak tanımlanan 3–12–25 m/s güç eğrisi ile seçili türbinin tahmini günlük üretimini normalize eder; gerçek güç eğrisi, sayaç verisi veya doğrulanmış mühendislik sınırı değildir.
- Türbülans Merkezi, sekiz yön için 25 km çevre ölçümleri ile risk ve kontrol senaryolarını yalnızca tarayıcıda simüle eder; yaw yönelimi, rotor hızı ve kanat pitch aşamalarının görselleştirmesi gerçek türbin komutu veya performans modeli değildir. Gerçek türbine komut göndermez ve IEC 61400-1 uygunluğu/sertifikasyonu iddia etmez.
- Türbülans senaryosu, seçili türbin, türbinlerin simüle edilmiş çalışma durumları ve olay geçmişi `windora-turbulence-simulation-v1` anahtarıyla tarayıcı yerel depolamasında tutulur; simülasyon sıfırlama olay geçmişini ve seçili türbini korur.
- Rapor dönemi, filtreler ve arıza durumları tarayıcı yerel depolamasında saklanır.
- Arıza bildiriminde seçilen türbinin doğrulanmış KKTC saha ve koridor konumu otomatik doldurulur. Saha arıza müdahale koordinasyon hattına WhatsApp üzerinden mesaj şablonu yönlendirilir; mesaj ayrıca önizlenebilir ve kopyalanabilir. Mesaj gönderimi kullanıcı onayıyla tamamlanır.
