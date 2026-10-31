// WT-01'den WT-19'a kadar her türbin için özelleştirilmiş KKTC saha profili,
// farklı güncelleme zamanı (dakika farkı), 8 yönlü ölçüm matrisi ve özel analiz metni.

export const KKTC_TIME_OFFSET_MS = 60 * 60 * 1000; // Sistem saatinden 1 saat geri (KKTC saati)

export const TURBINE_TURBULENCE_PROFILES = {
  'WT-01': {
    id: 'WT-01',
    region: 'Lapta – Başpınar Dağ Sırtı',
    coords: '35.3320° K, 33.1680° D',
    altitude: '410 m',
    minutesAgo: 6,
    dominantDirection: 'NW',
    defaultYaw: 315,
    headline: 'Düşük Risk · WT-01 Lapta Kıyı Koridoru Kararlı',
    summary: 'WT-01 (Lapta – Başpınar) çevresindeki 8 istasyonda Kuzeybatı deniz meltemi 7,4 m/s ortalama hızla dengeli esiyor. Türbülans yoğunluğu %8,1 seviyesinde; kanat ve kule yükü nominal sınırların altında.',
    readings: [
      [7.1, 8.4, 0.54, 10, 6, 0.7, 99, 98],
      [6.8, 8.1, 0.51, 42, 7, 0.6, 98, 98],
      [6.4, 7.7, 0.48, 88, 5, 0.5, 98, 97],
      [6.0, 7.2, 0.45, 134, 6, 0.5, 97, 97],
      [5.9, 7.0, 0.44, 178, 5, 0.4, 98, 98],
      [6.5, 7.9, 0.49, 224, 7, 0.6, 98, 97],
      [7.2, 8.6, 0.56, 268, 8, 0.8, 99, 98],
      [7.4, 8.9, 0.60, 315, 7, 0.9, 99, 99]
    ]
  },
  'WT-02': {
    id: 'WT-02',
    region: 'Koruçam – Kayalar Rüzgâr Koridoru',
    coords: '35.3480° K, 33.0420° D',
    altitude: '285 m',
    minutesAgo: 9,
    dominantDirection: 'W',
    defaultYaw: 270,
    headline: 'Dikkat · WT-02 Batı Açık Deniz Koridorunda Hamle Artışı',
    summary: 'WT-02 (Koruçam – Kayalar) açıklarında Batı sektöründen gelen rüzgâr hamleleri 12,8 m/s seviyesine ulaştı. Yön değişimi 22° olarak ölçüldü; önleyici yaw dengelemesi hazır konumda tutuluyor.',
    readings: [
      [7.8, 9.2, 0.62, 6, 9, 1.0, 98, 97],
      [7.5, 8.9, 0.59, 44, 8, 0.9, 97, 97],
      [7.0, 8.4, 0.55, 92, 7, 0.8, 98, 97],
      [6.7, 8.0, 0.52, 136, 8, 0.7, 97, 96],
      [7.1, 8.5, 0.57, 182, 9, 0.9, 97, 97],
      [8.4, 10.6, 0.82, 226, 14, 1.8, 98, 97],
      [9.3, 12.8, 1.18, 272, 22, 2.6, 98, 98],
      [8.5, 10.4, 0.78, 314, 12, 1.5, 98, 97]
    ]
  },
  'WT-03': {
    id: 'WT-03',
    region: 'Çamlıbel – Hisarköy Rüzgâr Geçidi',
    coords: '35.3080° K, 33.0760° D',
    altitude: '360 m',
    minutesAgo: 12,
    dominantDirection: 'N',
    defaultYaw: 0,
    headline: 'Düşük Risk · WT-03 Çamlıbel Geçidinde Optimum Akış',
    summary: 'WT-03 (Çamlıbel – Hisarköy) vadi koridorunda rüzgâr akışı Kuzey yönünden 8,0 m/s sabit hızla ilerliyor. Sekiz istasyonun tamamında veri güvenilirliği %98 üzerinde ve türbülans etkisi minimum düzeyde.',
    readings: [
      [8.0, 9.4, 0.61, 2, 7, 0.8, 99, 98],
      [7.7, 9.1, 0.58, 46, 8, 0.7, 98, 98],
      [7.3, 8.6, 0.54, 90, 6, 0.6, 98, 97],
      [6.9, 8.2, 0.50, 134, 7, 0.6, 98, 98],
      [6.6, 7.9, 0.48, 180, 6, 0.5, 98, 97],
      [7.0, 8.3, 0.52, 224, 7, 0.7, 98, 98],
      [7.4, 8.8, 0.56, 270, 8, 0.8, 99, 98],
      [7.8, 9.2, 0.59, 316, 7, 0.8, 99, 98]
    ]
  },
  'WT-04': {
    id: 'WT-04',
    region: 'Karşıyaka – Kozan Dağ Yamaç Hattı',
    coords: '35.3210° K, 33.1240° D',
    altitude: '445 m',
    minutesAgo: 7,
    dominantDirection: 'NE',
    defaultYaw: 45,
    headline: 'Dikkat · WT-04 Kozan Yamaçlarında Termal Türbülans Etkisi',
    summary: 'WT-04 (Karşıyaka – Kozan) dağ yamacında Kuzeydoğu yönlü yükselim akımları nedeniyle TI %13,1 seviyesine çıktı. Kanat pitch açısı mikro düzeltmelerle rotor devrini dengeliyor.',
    readings: [
      [8.2, 10.1, 0.74, 12, 11, 1.3, 97, 97],
      [9.1, 12.4, 1.19, 48, 18, 2.7, 97, 96],
      [8.0, 9.8, 0.69, 91, 10, 1.1, 98, 97],
      [7.3, 8.8, 0.58, 135, 8, 0.8, 97, 97],
      [6.9, 8.3, 0.55, 179, 9, 0.7, 96, 96],
      [7.4, 9.0, 0.61, 225, 10, 0.9, 97, 96],
      [7.8, 9.5, 0.65, 269, 9, 1.0, 98, 97],
      [8.1, 9.9, 0.70, 314, 11, 1.2, 98, 97]
    ]
  },
  'WT-05': {
    id: 'WT-05',
    region: 'Alsancak – Karaman Dağ Yamaç Hattı',
    coords: '35.3120° K, 33.2280° D',
    altitude: '390 m',
    minutesAgo: 15,
    dominantDirection: 'NE',
    defaultYaw: 225,
    headline: 'Yüksek Risk · WT-05 Beşparmak Kuzey Yamacında Sert Hamleler',
    summary: 'WT-05 (Alsancak – Karaman) 25 km kuzeydoğu sensörlerinde rüzgâr hamlesi 17,6 m/s ve hız değişimi 5,4 m/s olarak tespit edildi. Yük azaltımı için Güneybatı (225°) yönüne önleyici yaw hizalaması öneriliyor.',
    readings: [
      [9.2, 12.1, 1.05, 14, 15, 2.1, 96, 96],
      [11.2, 17.6, 2.15, 46, 36, 5.4, 96, 95],
      [8.8, 11.4, 0.92, 92, 14, 1.8, 97, 96],
      [7.6, 9.4, 0.68, 136, 10, 1.1, 97, 97],
      [7.2, 8.8, 0.62, 180, 9, 0.9, 96, 96],
      [8.1, 10.2, 0.75, 224, 12, 1.4, 97, 96],
      [8.4, 10.6, 0.79, 270, 11, 1.3, 97, 97],
      [9.0, 11.8, 0.98, 315, 16, 1.9, 96, 96]
    ]
  },
  'WT-06': {
    id: 'WT-06',
    region: 'จGirne – Boğazköy Rüzgâr Boğazı'.replace('จ', ''),
    coords: '35.2960° K, 33.2840° D',
    altitude: '340 m',
    minutesAgo: 5,
    dominantDirection: 'N',
    defaultYaw: 0,
    headline: 'Düşük Risk · WT-06 Girne Boğaz Hattında Dengeli Üretim',
    summary: 'WT-06 (Girne – Boğazköy) geçiş hattında ortalama rüzgâr 8,3 m/s ve TI %7,8 olarak ölçüldü. Tüm çevre sensörleri senkronize durumda ve enerji üretimi maksimum verim eğrisinde.',
    readings: [
      [8.3, 9.7, 0.65, 4, 6, 0.8, 99, 99],
      [8.0, 9.4, 0.62, 45, 7, 0.8, 98, 98],
      [7.5, 8.9, 0.58, 89, 6, 0.7, 98, 98],
      [7.1, 8.4, 0.54, 135, 6, 0.6, 98, 97],
      [6.9, 8.1, 0.52, 180, 7, 0.6, 98, 98],
      [7.3, 8.6, 0.56, 225, 6, 0.7, 98, 98],
      [7.7, 9.1, 0.60, 270, 7, 0.8, 99, 98],
      [8.1, 9.5, 0.63, 315, 6, 0.8, 99, 99]
    ]
  },
  'WT-07': {
    id: 'WT-07',
    region: 'Güzelyurt – Kalkanlı Rüzgâr Sahası',
    coords: '35.2360° K, 33.0350° D',
    altitude: '230 m',
    minutesAgo: 10,
    dominantDirection: 'NE',
    defaultYaw: 245,
    headline: 'Dikkat · WT-07 Kalkanlı Sektöründe Rüzgâr İvmelenmesi',
    summary: 'WT-07 (Güzelyurt – Kalkanlı) hedef türbininin Kuzeydoğu 25 km istasyonunda 9,4 m/s hız ve +3,4 m/s kısa süreli değişim saptandı. Önleyici açı optimizasyonu ve termal izleme aktif.',
    readings: [
      [7.6, 9.1, 0.61, 14, 8, 0.8, 98, 97],
      [9.4, 12.2, 1.10, 18, 19, 3.4, 96, 95],
      [8.1, 10.2, 0.65, 13, 9, 1.2, 97, 96],
      [7.2, 9.1, 0.62, 12, 8, 0.9, 97, 97],
      [6.8, 8.2, 0.58, 11, 12, 1.0, 95, 96],
      [8.6, 10.6, 0.75, 15, 11, 1.6, 96, 95],
      [7.9, 9.9, 0.70, 13, 10, 1.1, 98, 97],
      [8.4, 10.8, 0.75, 14, 12, 1.5, 96, 96]
    ]
  },
  'WT-08': {
    id: 'WT-08',
    region: 'Zümrütköy – Serhatköy Rüzgâr Düzlüğü',
    coords: '35.2090° K, 33.0820° D',
    altitude: '175 m',
    minutesAgo: 17,
    dominantDirection: 'W',
    defaultYaw: 270,
    headline: 'Düşük Risk · WT-08 Ovada Laminer Rüzgâr Akışı',
    summary: 'WT-08 (Zümrütköy – Serhatköy) açık ova koridorunda Batı yönlü laminer akış 7,7 m/s hızla devam ediyor. Kayma gerilmesi ve yön sapması oldukça düşük (%99 veri kalitesi).',
    readings: [
      [6.9, 8.1, 0.49, 5, 5, 0.5, 99, 99],
      [6.6, 7.8, 0.47, 45, 6, 0.5, 99, 98],
      [6.5, 7.7, 0.46, 90, 5, 0.4, 98, 98],
      [6.7, 7.9, 0.48, 135, 6, 0.5, 98, 98],
      [7.0, 8.3, 0.51, 180, 6, 0.6, 99, 98],
      [7.4, 8.8, 0.55, 225, 7, 0.7, 99, 99],
      [7.7, 9.1, 0.58, 270, 6, 0.7, 99, 99],
      [7.3, 8.6, 0.53, 315, 6, 0.6, 99, 99]
    ]
  },
  'WT-09': {
    id: 'WT-09',
    region: 'Alayköy – Yılmazköy Enerji Koridoru',
    coords: '35.2280° K, 33.2420° D',
    altitude: '215 m',
    minutesAgo: 8,
    dominantDirection: 'SW',
    defaultYaw: 225,
    headline: 'Dikkat · WT-09 Güneybatı Koridorunda Yön Değişkenliği',
    summary: 'WT-09 (Alayköy – Yılmazköy) sektöründe Güneybatı rüzgârında 23° kısa süreli açı değişimi kaydedildi. Nacelle yaw motoru rüzgâr sapmasını sönümlemek için izleme modunda.',
    readings: [
      [7.2, 8.6, 0.58, 10, 8, 0.8, 98, 97],
      [7.0, 8.4, 0.55, 48, 9, 0.7, 97, 97],
      [6.8, 8.1, 0.53, 92, 8, 0.7, 97, 97],
      [7.4, 9.0, 0.61, 138, 11, 1.0, 97, 96],
      [8.1, 10.2, 0.74, 184, 15, 1.4, 97, 96],
      [9.0, 12.1, 1.12, 228, 23, 2.4, 97, 96],
      [8.3, 10.1, 0.76, 272, 13, 1.3, 98, 97],
      [7.6, 9.2, 0.63, 316, 10, 0.9, 98, 97]
    ]
  },
  'WT-10': {
    id: 'WT-10',
    region: 'Gönyeli – Kanlıköy Tepeleri',
    coords: '35.2490° K, 33.3050° D',
    altitude: '260 m',
    minutesAgo: 11,
    dominantDirection: 'NW',
    defaultYaw: 315,
    headline: 'Düşük Risk · WT-10 Gönyeli Sırtında Kararlı Üretim',
    summary: 'WT-10 (Gönyeli – Kanlıköy) çevresindeki 25 km sensör halkasında ortalama 7,9 m/s rüzgâr hızı ve %7,6 TI ölçüldü. Hiçbir sektörde türbülans eşiği tetiklenmedi.',
    readings: [
      [7.7, 9.0, 0.58, 8, 7, 0.7, 98, 98],
      [7.4, 8.7, 0.55, 44, 6, 0.6, 98, 98],
      [7.0, 8.2, 0.52, 88, 6, 0.6, 98, 97],
      [6.8, 8.0, 0.50, 134, 7, 0.5, 97, 97],
      [6.9, 8.1, 0.51, 178, 7, 0.6, 98, 97],
      [7.3, 8.6, 0.55, 224, 8, 0.7, 98, 98],
      [7.6, 9.0, 0.57, 268, 7, 0.8, 99, 98],
      [7.9, 9.3, 0.60, 314, 7, 0.8, 99, 99]
    ]
  },
  'WT-11': {
    id: 'WT-11',
    region: 'Çatalköy – Buffavento Dağ Sırtı',
    coords: '35.2840° K, 33.4080° D',
    altitude: '520 m',
    minutesAgo: 13,
    dominantDirection: 'N',
    defaultYaw: 0,
    headline: 'Dikkat · WT-11 Buffavento Yüksek Rakım Hamle Uyarısı',
    summary: 'WT-11 (Çatalköy – Buffavento, 520 m rakım) Kuzey istasyonunda dağ sırtı ivmelenmesiyle rüzgâr hamlesi 13,1 m/s değerine ulaştı. Rotor devri 12 RPM sınırında regüle ediliyor.',
    readings: [
      [9.5, 13.1, 1.16, 4, 17, 2.8, 97, 96],
      [8.7, 11.0, 0.84, 46, 13, 1.6, 97, 97],
      [7.9, 9.6, 0.68, 90, 10, 1.1, 98, 97],
      [7.2, 8.7, 0.59, 136, 8, 0.8, 97, 97],
      [6.9, 8.3, 0.56, 180, 9, 0.8, 97, 96],
      [7.4, 9.0, 0.62, 224, 10, 0.9, 97, 97],
      [8.0, 9.8, 0.70, 270, 11, 1.2, 98, 97],
      [8.8, 11.2, 0.86, 316, 14, 1.7, 98, 97]
    ]
  },
  'WT-12': {
    id: 'WT-12',
    region: 'Değirmenlik – Alevkayası Rüzgâr Sırtı',
    coords: '35.2760° K, 33.5180° D',
    altitude: '490 m',
    minutesAgo: 16,
    dominantDirection: 'NW',
    defaultYaw: 135,
    headline: 'Yüksek Risk · WT-12 Alevkayası Sırtında Yüksek Türbülans (%19,2 TI)',
    summary: 'WT-12 (Değirmenlik – Alevkayası) Kuzeybatı ve Kuzey sektörlerinde türbülans yoğunluğu %19,2 ile yüksek risk eşiğini aştı. Kule titreşimini azaltmak için Güneydoğu (135°) kaçış açısı öneriliyor.',
    readings: [
      [10.4, 15.8, 1.92, 12, 28, 4.2, 96, 95],
      [8.9, 11.4, 0.94, 48, 15, 1.9, 96, 96],
      [7.8, 9.6, 0.68, 92, 10, 1.1, 97, 96],
      [7.1, 8.6, 0.58, 136, 8, 0.8, 98, 97],
      [7.3, 8.9, 0.61, 182, 9, 0.9, 97, 97],
      [8.2, 10.4, 0.78, 226, 13, 1.5, 97, 96],
      [9.4, 12.6, 1.14, 272, 19, 2.6, 96, 96],
      [10.8, 17.2, 2.08, 318, 38, 5.5, 96, 95]
    ]
  },
  'WT-13': {
    id: 'WT-13',
    region: 'Haspolat – Mesarya Batı Rüzgâr Hattı',
    coords: '35.2140° K, 33.4420° D',
    altitude: '190 m',
    minutesAgo: 14,
    dominantDirection: 'E',
    defaultYaw: 90,
    headline: 'Dikkat · WT-13 Mesarya Koridorunda Doğu Rüzgârı İvmelenmesi',
    summary: 'WT-13 (Haspolat – Mesarya) Doğu istasyonunda ortalama rüzgâr 9,2 m/s ve hamle hızı 12,5 m/s olarak ölçüldü (TI %12,6). Kanat açısı otonom dengeleme modunda çalışıyor.',
    readings: [
      [7.5, 9.0, 0.60, 10, 8, 0.9, 98, 97],
      [8.3, 10.4, 0.76, 46, 12, 1.5, 97, 97],
      [9.2, 12.5, 1.16, 92, 21, 2.9, 97, 96],
      [8.4, 10.6, 0.79, 136, 13, 1.6, 97, 97],
      [7.4, 8.9, 0.61, 180, 9, 0.9, 98, 97],
      [7.1, 8.5, 0.57, 224, 8, 0.8, 98, 97],
      [7.0, 8.4, 0.56, 270, 7, 0.7, 98, 98],
      [7.3, 8.8, 0.59, 314, 8, 0.8, 98, 98]
    ]
  },
  'WT-14': {
    id: 'WT-14',
    region: 'Geçitkale – Mallıdağ Rüzgâr Sırtı',
    coords: '35.2620° K, 33.7140° D',
    altitude: '295 m',
    minutesAgo: 4,
    dominantDirection: 'SE',
    defaultYaw: 135,
    headline: 'Düşük Risk · WT-14 Mallıdağ Sırtında İdeal Rüzgâr Profili',
    summary: 'WT-14 (Geçitkale – Mallıdağ) bölgesinde Güneydoğu rüzgârı 8,2 m/s hızla oldukça kararlı esiyor. Son 4 dakika içinde güncellenen 8 istasyon verisinde hiçbir anomali saptanmadı.',
    readings: [
      [7.1, 8.4, 0.53, 6, 6, 0.6, 99, 98],
      [7.4, 8.8, 0.56, 45, 7, 0.7, 98, 98],
      [7.8, 9.2, 0.60, 90, 7, 0.8, 99, 98],
      [8.2, 9.6, 0.63, 135, 6, 0.8, 99, 99],
      [7.9, 9.3, 0.61, 180, 7, 0.7, 99, 98],
      [7.3, 8.6, 0.55, 225, 6, 0.6, 98, 98],
      [7.0, 8.3, 0.52, 270, 6, 0.6, 98, 98],
      [7.0, 8.2, 0.52, 315, 6, 0.6, 98, 98]
    ]
  },
  'WT-15': {
    id: 'WT-15',
    region: 'Tatlısu – Mersinlik Dağ Sırtı',
    coords: '35.3420° K, 33.7650° D',
    altitude: '370 m',
    minutesAgo: 19,
    dominantDirection: 'NE',
    defaultYaw: 225,
    headline: 'Yüksek Risk · WT-15 Tatlısu Kıyı Sırtında Şiddetli Rüzgâr Kesmesi',
    summary: 'WT-15 (Tatlısu – Mersinlik) Kuzeydoğu 25 km deniz üstü sensörlerinde 18,2 m/s hamle ve 39° yön sapması algılandı. Rotor hızı anomalisini önlemek için koruyucu yaw yönelimi öneriliyor.',
    readings: [
      [9.6, 13.0, 1.18, 16, 18, 2.5, 96, 96],
      [11.5, 18.2, 2.24, 48, 39, 5.8, 95, 95],
      [9.4, 12.6, 1.12, 94, 17, 2.3, 96, 96],
      [7.9, 9.8, 0.71, 138, 11, 1.2, 97, 96],
      [7.4, 9.0, 0.64, 182, 10, 1.0, 97, 96],
      [7.8, 9.6, 0.68, 226, 11, 1.1, 97, 97],
      [8.3, 10.4, 0.75, 270, 12, 1.4, 97, 96],
      [9.1, 11.9, 0.96, 316, 15, 1.9, 96, 96]
    ]
  },
  'WT-16': {
    id: 'WT-16',
    region: 'İskele – Boğaztepe Kıyı Koridoru',
    coords: '35.2780° K, 33.8920° D',
    altitude: '145 m',
    minutesAgo: 18,
    dominantDirection: 'SE',
    defaultYaw: 135,
    headline: 'Düşük Risk · WT-16 İskele Körfez Hattında Stabil Akış',
    summary: 'WT-16 (İskele – Boğaztepe) Güneydoğu kıyı koridorunda 7,8 m/s düzenli rüzgâr akışı ölçülüyor. Türbülans yoğunluğu %7,4 ile saha ortalamasının altında.',
    readings: [
      [6.8, 8.0, 0.50, 8, 6, 0.5, 98, 98],
      [7.1, 8.4, 0.53, 46, 6, 0.6, 98, 98],
      [7.5, 8.9, 0.56, 90, 7, 0.7, 99, 98],
      [7.8, 9.2, 0.58, 136, 6, 0.7, 99, 99],
      [7.6, 9.0, 0.57, 180, 7, 0.7, 98, 98],
      [7.2, 8.5, 0.53, 225, 6, 0.6, 98, 98],
      [6.9, 8.2, 0.51, 270, 6, 0.5, 98, 98],
      [6.7, 7.9, 0.49, 315, 5, 0.5, 98, 98]
    ]
  },
  'WT-17': {
    id: 'WT-17',
    region: 'Bafra – Mehmetçik Rüzgâr Platosu',
    coords: '35.3680° K, 34.0420° D',
    altitude: '240 m',
    minutesAgo: 21,
    dominantDirection: 'E',
    defaultYaw: 90,
    headline: 'Dikkat · WT-17 Mehmetçik Platosunda Doğu Sektörü Hareketliliği',
    summary: 'WT-17 (Bafra – Mehmetçik) Doğu ve Güneydoğu istasyonlarında rüzgâr hızı 9,1 m/s ve kısa süreli hız artışı +2,5 m/s düzeyinde. Sistem erken izleme eşiğinde dengeli çalışıyor.',
    readings: [
      [7.4, 8.9, 0.59, 10, 8, 0.8, 97, 97],
      [8.1, 10.0, 0.71, 46, 11, 1.3, 97, 97],
      [9.1, 12.3, 1.13, 92, 20, 2.5, 97, 96],
      [8.6, 10.9, 0.84, 136, 14, 1.7, 97, 96],
      [7.7, 9.3, 0.64, 180, 9, 1.0, 97, 97],
      [7.2, 8.6, 0.57, 225, 8, 0.8, 98, 97],
      [7.0, 8.4, 0.55, 270, 7, 0.7, 98, 97],
      [7.2, 8.7, 0.57, 315, 8, 0.8, 98, 97]
    ]
  },
  'WT-18': {
    id: 'WT-18',
    region: 'Yeni Erenköy – Karpaz Yarımadası Sırtı',
    coords: '35.5120° K, 34.1950° D',
    altitude: '275 m',
    minutesAgo: 15,
    dominantDirection: 'NE',
    defaultYaw: 45,
    headline: 'Düşük Risk · WT-18 Karpaz Sırtında Yüksek Verimli Akış',
    summary: 'WT-18 (Yeni Erenköy – Karpaz) yarımada koridorunda 8,5 m/s sürekli ve temiz deniz rüzgârı ölçülüyor. Türbülans yoğunluğu %7,9; kapasite faktörü en yüksek seviyede.',
    readings: [
      [8.2, 9.6, 0.64, 8, 7, 0.8, 99, 98],
      [8.5, 10.0, 0.67, 45, 7, 0.9, 99, 99],
      [8.1, 9.5, 0.63, 90, 6, 0.8, 99, 98],
      [7.6, 8.9, 0.58, 135, 6, 0.7, 98, 98],
      [7.3, 8.6, 0.55, 180, 6, 0.6, 98, 98],
      [7.4, 8.7, 0.56, 225, 7, 0.7, 98, 98],
      [7.7, 9.1, 0.59, 270, 7, 0.7, 99, 98],
      [8.0, 9.4, 0.62, 315, 7, 0.8, 99, 98]
    ]
  },
  'WT-19': {
    id: 'WT-19',
    region: 'Dipkarpaz – Zafer Burnu Açık Rüzgâr Hattı',
    coords: '35.6180° K, 34.3820° D',
    altitude: '195 m',
    minutesAgo: 23,
    dominantDirection: 'E',
    defaultYaw: 270,
    headline: 'Kritik Risk · WT-19 Dipkarpaz Uç Noktasında Fırtına Hamlesi (25,4 m/s)',
    summary: 'WT-19 (Dipkarpaz – Zafer Burnu) açık deniz istasyonunda Doğu yönünden 25,4 m/s fırtına hamlesi algılandı. 3 kademeli teleskopik kule indirme ve güvenli duruş (cut-out) protokolü öneriliyor.',
    readings: [
      [10.2, 13.8, 1.28, 14, 18, 2.6, 96, 96],
      [13.4, 18.6, 1.95, 48, 29, 4.8, 95, 95],
      [21.8, 25.4, 2.85, 92, 34, 6.4, 95, 95],
      [12.6, 16.9, 1.72, 136, 24, 3.9, 96, 95],
      [9.4, 12.2, 1.04, 180, 15, 1.9, 96, 96],
      [8.5, 10.8, 0.82, 225, 12, 1.4, 97, 96],
      [8.2, 10.4, 0.78, 270, 11, 1.3, 97, 97],
      [9.1, 11.8, 0.94, 315, 14, 1.8, 97, 96]
    ]
  }
};

export function getTurbineProfile(turbineId = 'WT-07') {
  return TURBINE_TURBULENCE_PROFILES[turbineId] || TURBINE_TURBULENCE_PROFILES['WT-07'];
}

export function getTurbineEvaluationTimeMs(turbineId = 'WT-07') {
  const profile = getTurbineProfile(turbineId);
  return Date.now() - KKTC_TIME_OFFSET_MS - profile.minutesAgo * 60 * 1000;
}

export function getTurbineSampleTimeMs(turbineId = 'WT-07', directionIndex = 0) {
  return getTurbineEvaluationTimeMs(turbineId) - (directionIndex % 3) * 12000;
}

