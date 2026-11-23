# YDS Strateji Motoru — Arayüz ve Kullanılabilirlik Araştırması

> Sürüm 0.1 · 2026-11-18 · Next.js (App Router) önyüzü için
> Temel: [TASARIM.md](TASARIM.md). Buradaki her karar, oradaki bir öğrenme ilkesine ya da "bunalmayı azalt" hedefine dayanır.

---

## 1. Kullanım bağlamı

| Soru | Cevap | Tasarıma etkisi |
|---|---|---|
| Kim kullanıyor? | Tek kullanıcı (ben), temel seviyede eksikler var, çabuk bunalıyorum | Az seçenek, tek ana eylem, kısa bloklar |
| Nerede? | Telefon (kısa oturumlar) + bilgisayar (uzun okuma parçaları) | **Mobil öncelikli**, masaüstünde iki sütun |
| Ne kadar? | Günde ~25 dk, bazen bölünerek | Oturum yarıda bırakılıp kaldığı yerden devam edebilmeli |
| En büyük risk | Bunalma → bırakma | Sürtünmeyi azalt, ilerlemeyi görünür yap, kırmızı/ceza dilinden kaçın |

---

## 2. Kullanılabilirlik ilkeleri

**K1 — Tek ana eylem.** Her ekranda bir tane birincil düğme olsun. Ana sayfa = "Başla". Soru ekranı = "Cevapla". Karar yorgunluğu bunalmanın ana kaynağı.

**K2 — Kademeli açılım (progressive disclosure).** Soru ilk açıldığında sadece soru ve şıklar görünür. Kelime, yapı ve mantık katmanları istenince açılır. Uzun açıklama duvarları gösterilmez, açıklamalar 2–3 cümlelik parçalara bölünür.

**K3 — Odak modu.** Oturum sırasında alt menü, bildirim ve istatistik görünmez. Sadece üstte ince bir ilerleme çubuğu ve çıkış düğmesi olur.

**K4 — Sınav davranışını taklit et.** Gerçek sınavda şıkların üstü çizilir, kelimelerin altı çizilir. Uygulamada da şık eleme (üstünü çizme) ve kelime işaretleme olmalı. Bu aynı zamanda kendine açıklama (self-explanation) verisini doğal yoldan toplar.

**K5 — Sürtünmeyi öğrenmeye harca, arayüze değil.** Güven seçimi ayrı bir adım olmamalı. "Eminim" ve "Emin değilim" düğmeleri cevabı gönderen düğmelerin kendisi olsun. Kendine açıklama her soruda değil, yanlış cevapta ve yaklaşık her 3 sorudan birinde istenmeli.

**K6 — Nazik geri bildirim.** Yanlış cevap kırmızı çarpıyla değil, tuzağın adıyla gösterilir: "T3 — Bağlaç yönü tuzağına düştün". Hata bir bilgi olarak sunulur, başarısızlık olarak değil. Yeşil/kırmızı yerine doğru = yeşil, yanlış = turuncu/amber.

**K7 — Okunabilirlik.** İngilizce metin 18px, satır aralığı 1.6, satır uzunluğu en fazla ~70 karakter. Türkçe açıklamalar biraz daha küçük ve farklı renk tonunda olsun ki iki dil karışmasın.

**K8 — Başparmak bölgesi.** Mobilde şıklar ve ana düğmeler ekranın alt yarısında olmalı. Dokunma alanları en az 48px.

**K9 — Kaldığın yerden devam.** Oturum durumu her cevaptan sonra sunucuya kaydedilir. Uygulama kapanırsa "Oturumuna devam et (3/12)" çıkar.

**K10 — Masaüstünde klavye.** `A–E` şık seçer, `Shift+A–E` şık eler, `Enter` "eminim" ile, `Shift+Enter` "emin değilim" ile cevaplar. `Space` sonraki soruya geçer, `1/2/3` katmanları açar.

**Kaçınılacaklar:** öğrenme aşamalarında geri sayım sayacı (stres yaratır, süre sadece deneme modunda olur), "Harika!!!" gibi abartılı animasyonlar, her soruda pop-up, 3'ten fazla tıklama gerektiren akışlar.

---

## 3. Ekranlar ve gezinme

**Gezinme:** Mobilde alt sekme çubuğu, 3 sekme. Masaüstünde sol kenar çubuğu.

| Sekme | Ekran | İçerik |
|---|---|---|
| **Bugün** | `/` | Bugünkü oturum kartı (süre, içerik dağılımı) + **Başla** + yarım kalan oturum + tekrar bekleyen sayısı |
| **İlerleme** | `/ilerleme` | Soru tipi × aşama haritası, tuzak yakalama oranları, haftalık grafik, tahmini puan |
| **Kütüphane** | `/kutuphane` | Strateji kartları, tuzak kataloğu, kelime listesi, geçmiş sorular (filtreli) |

**Sekmesiz (odak modu) ekranlar:**
- `/oturum/[id]` — soru akışı
- `/oturum/[id]/ozet` — oturum özeti
- `/ayarlar` — oturum süresi, tema, giriş

### Ekran taslakları (mobil)

```
┌─────────────────────────┐     ┌─────────────────────────┐
│ Bugün                   │     │ ✕   ▓▓▓▓▓░░░░░   5/12   │
│                         │     │                         │
│ ┌─────────────────────┐ │     │ ⓘ Cümle tamamlama       │
│ │ Bugünün oturumu     │ │     │ Önce bağlacı bul, yönü  │
│ │ ~25 dk              │ │     │ belirle. ⚠ T3           │
│ │ • 8 tekrar          │ │     │                         │
│ │ • 5 cümle tamamlama │ │     │ Although renewable      │
│ │   (Aşama 2)         │ │     │ energy sources have...  │
│ │                     │ │     │ ----.                   │
│ │   [    Başla    ]   │ │     │                         │
│ └─────────────────────┘ │     │ ┌ A  fossil fuels st… ┐ │
│                         │     │ ┌ B  g̶o̶v̶e̶r̶n̶m̶e̶n̶t̶s̶…  T3 ┐ │
│ Bu hafta: 4/5 gün       │     │ ┌ C  solar power ge…  ┐ │
│ Zıtlık bağlacı: %55→%68 │     │ ┌ D  most developin…  ┐ │
│                         │     │                         │
├─────────────────────────┤     │ [Emin değilim][Eminim]  │
│  Bugün  İlerleme  Kütüp.│     │  Kelime · Yapı · Mantık │
└─────────────────────────┘     └─────────────────────────┘
       Ana sayfa                       Soru ekranı
```

Masaüstünde okuma parçaları için iki sütun olur: solda metin (kendi içinde kaydırılır), sağda soru ve şıklar. Mobilde metin üstte daraltılabilir bir panelde durur, soru ve şıklar her zaman görünür kalır.

---

## 4. Soru akışı (durum makinesi)

Soru ekranı karmaşık bir akış olduğundan `useReducer` tabanlı açık bir durum makinesiyle yönetilir.

```
 ┌──────────┐   ┌───────────┐   ┌───────────────┐   ┌──────────┐   ┌──────┐
 │ directive│──▶│ answering │──▶│ explaining?   │──▶│ feedback │──▶│ next │
 └──────────┘   └───────────┘   └───────────────┘   └──────────┘   └──────┘
  (aşama 1-3)    seç, ele,       (yanlışsa veya      doğru gerekçe,
                 güvenle gönder   ~1/3 soruda)        şık tuzakları,
                                  elenen şık için     katmanlar
                                  tuzak kodu seç
```

**Aşama 2 (rehberli)** için `answering` adımı alt adımlara bölünür. `GuidedStepper` sırayla şunları sorar: "Bağlacı işaretle" → "Yönü ne?" → "Hangi şıkları elersin?" → "Cevabın?". Her alt adım anında geri bildirim verir.

| Durum | Görünen | Kaydedilen |
|---|---|---|
| `directive` | Strateji direktifi + tuzak uyarısı (aşama 3'te tek satır, aşama 4'te yok) | — |
| `answering` | Soru, şıklar, eleme, kelime işaretleme | Elenen şıklar, işaretlenen kelimeler, süre |
| `explaining` | "B'yi neden eledin?" → tuzak kodu çipleri | Kendine açıklama kodları |
| `feedback` | Doğru/yanlış, gerekçe, her şıkta tuzak çipi, katman sekmeleri | Cevap, güven, doğruluk |

---

## 5. Bileşen yapısı

### 5.1 Klasör yapısı (özellik tabanlı)

```
apps/web/
├─ app/
│  ├─ (tabs)/                  # alt sekme çubuklu düzen
│  │  ├─ layout.tsx
│  │  ├─ page.tsx              # Bugün
│  │  ├─ ilerleme/page.tsx
│  │  └─ kutuphane/
│  │     ├─ page.tsx
│  │     ├─ kartlar/[tip]/page.tsx
│  │     └─ tuzaklar/[kod]/page.tsx
│  ├─ oturum/[id]/
│  │  ├─ page.tsx              # odak modu
│  │  └─ ozet/page.tsx
│  ├─ ayarlar/page.tsx
│  ├─ giris/page.tsx
│  └─ manifest.ts              # PWA
├─ features/
│  ├─ session/                 # oturum akışı
│  │  ├─ session-machine.ts    # reducer + durum tipleri
│  │  ├─ use-session.ts
│  │  └─ components/
│  ├─ question/                # soru gösterimi
│  ├─ review/                  # SM-2 tekrar kartları
│  ├─ progress/                # grafikler, haritalar
│  └─ library/                 # kartlar, tuzaklar, kelimeler
├─ components/
│  ├─ ui/                      # shadcn/ui bileşenleri
│  └─ layout/                  # TabBar, Sidebar, FocusShell
├─ lib/
│  ├─ api/                     # API istemcisi + OpenAPI'den üretilen tipler
│  └─ keyboard.ts
└─ styles/
```

### 5.2 Bileşen ağacı (soru ekranı)

```
FocusShell
├─ SessionProgressBar
├─ DirectiveBanner                 (strateji direktifi + TrapBadge uyarısı)
├─ QuestionLayout                  (mobil: tek sütun · masaüstü: iki sütun)
│  ├─ PassagePanel                 (varsa; daraltılabilir, kelime işaretlenebilir)
│  │  └─ MarkableText → WordPopover
│  ├─ QuestionStem
│  │  └─ MarkableText → WordPopover
│  └─ OptionList
│     └─ OptionItem × 4-5          (durumlar: default | selected | eliminated |
│        └─ TrapBadge?              correct | wrong | revealed)
├─ GuidedStepper                   (sadece aşama 2)
├─ AnswerBar                       (Emin değilim / Eminim)
├─ EliminationReasonSheet          (explaining durumu)
└─ FeedbackPanel
   ├─ VerdictLine                  ("Doğru" / "T3 — Bağlaç yönü")
   ├─ OptionExplanations
   └─ LayerTabs                    (Kelime · Yapı · Mantık)
      ├─ VocabLayer
      ├─ StructureLayer
      └─ LogicLayer
```

### 5.3 Bileşen sözlüğü

| Bileşen | Sorumluluk | Not |
|---|---|---|
| `OptionItem` | Şık kartı. Dokun = seç, sola kaydır / uzun bas = ele | En kritik bileşen. 6 durum, net görsel ayrım |
| `TrapBadge` | `T3` gibi çip. Dokununca tuzak kartı küçük bir pencerede açılır | Uygulamanın her yerinde aynı görünüm, tuzak kodları görsel dil olur |
| `MarkableText` | Kelime işaretleme + dokununca anlam | Seçilen kelimeler kelime havuzuna eklenir |
| `WordPopover` | Kelimenin anlamı, örnek, "Tekrar listeme ekle" | Mobilde alttan açılan panel |
| `DirectiveBanner` | Aşamaya göre tam/kısa/yok | Aşama 3'te tek satır, dokununca genişler |
| `GuidedStepper` | Aşama 2'nin alt adımları | Her adım tek bir soru sorar |
| `EliminationReasonSheet` | Elenen şık için tuzak kodu seçimi | En sık kullanılan 4 kod + "Diğer" |
| `LayerTabs` | Kelime / yapı / mantık | Varsayılan sekme yanlış cevapta Mantık, doğru cevapta kapalı |
| `CoachSheet` | "Koça sor" sohbet paneli: öneri çipleri, seçili metinden soru, akışlı yanıt, "Tekrar kartı yap" | Alttan açılır, soru ekranı arkada görünür kalır. Masaüstünde sağ panel. Klavye: `?` |
| `ReviewCard` | SM-2 kartı (ön/arka) + Tekrar/Zor/İyi/Kolay | Anki benzeri 4 düğme yerine 3 düğme de olabilir |
| `MasteryMap` | Soru tipi × 4 aşama ızgarası | İlerlemenin ana görseli |
| `TrapStats` | Tuzak bazında yakalama oranı | Yatay çubuk, en zayıf üstte |
| `SessionSummary` | Öğrenilen kelimeler, tuzaklar, gelişim | Oturumun sonunda olumlu kapanış |

---

## 6. Önyüz teknik seçimleri

| Konu | Seçim | Gerekçe |
|---|---|---|
| Çatı | Next.js App Router, TypeScript | İstek |
| UI kiti | Tailwind + shadcn/ui | Kod projede durur, özelleştirmesi kolay, erişilebilir (Radix tabanlı) |
| Sunucu verisi | TanStack Query | Önbellek, yeniden deneme, iyimser güncelleme |
| Oturum durumu | `useReducer` durum makinesi | Akış açık ve test edilebilir olur, ekstra kütüphane gerekmez |
| API tipleri | `openapi-typescript` ile FastAPI şemasından üretim | Önyüz ve arka yüz tipleri hep senkron kalır |
| Grafikler | Recharts | Basit, yeterli |
| Animasyon | motion ve canvas-confetti | `prefers-reduced-motion`'a saygı |
| Mobil | PWA (manifest + ana ekrana ekle) | Uygulama mağazası gerekmez, telefonda uygulama gibi açılır |
| Tema | Açık/koyu, sistem varsayılanı | Gece çalışması için |

---

## 7. Doğrulama planı

Tek kullanıcı için ağır bir test sürecine gerek yok. Ama şunlar ölçülmeli:
- **Oturum tamamlama oranı:** başlanan oturumların kaçı bitiyor? Düşükse oturum çok uzun ya da zor demektir.
- **Bırakma noktası:** oturum hangi soruda/adımda bırakılıyor?
- **Katman kullanımı:** hangi katman ne sıklıkla açılıyor? Zamanla Kelime katmanının azalması gerekir.
- **Haftalık öz değerlendirme:** "Bu hafta bunaldım mı?" (1–5). Ayarlar ekranında küçük bir not alanı.

İlk 2 haftadan sonra bu verilere bakılarak oturum süresi, blok boyutu ve kendine açıklama sıklığı ayarlanır.
