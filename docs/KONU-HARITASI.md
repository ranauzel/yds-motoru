# Konu haritası

Her soru tipi konulara ayrılır. Her konunun bir **tarifi** vardır: o tür soruyu tanıma ve çözme adımları. Uygulamada her soru tek bir konuya bağlıdır. Zayıf konular panoda görünür, tarif de ipucu panelinde ve konuya ilk girişte gösterilir.

- Tipin genel çözüm kartı [TASARIM.md §5](TASARIM.md#5-soru-tipi-strateji-kartları)'te. Bu doküman onun altındaki **konu** düzeyidir.
- Tuzak kodları (T1–T15) [TASARIM.md §4](TASARIM.md#4-tuzak-kataloğu)'te.
- Örnekler bizim yazdığımız kısa cümlelerdir, ÖSYM sorusu değildir.
- Kod adları (`zitlik` gibi) uygulamada kullanılır. Değiştirmek gerekirse önce burada değiştirilir.
- Tasarım: [docs/superpowers/specs/2026-11-23-konu-haritasi-ve-tekrar-design.md](superpowers/specs/2026-11-23-konu-haritasi-ve-tekrar-design.md)

**Durum:** cümle tamamlama gerçek 90 soruya göre yazıldı. Diğer 9 tip için konular, o tipin soruları çıkarılırken gerçek sorulara bakılarak düzeltilecek.

---

## 1. Kelime (soru 1–6)

**Eşdizim / edat kalıbı** (`esdizim`)
- **Tanınır:** boşluğun hemen yanında bir edat var ya da kalıp bir isim (*___ on*, *make a ___*).
- **Tarif:**
  1. Boşluğun önündeki ve arkasındaki kelimeyi oku.
  2. Hangi şık bu edatla ya da isimle kalıp kurar? (*depend on*, *comply with*)
  3. Kalıp kurmayanları anlamına bakmadan ele.
- **Tuzak:** T12, T15
- **Örnek:** *The success of the project will largely ___ on funding.* → **depend** (rely de olur; *count* olmaz)

**Bağlamdan yön** (`baglam_yonu`)
- **Tanınır:** cümlede *but, although, and, as well as, because* gibi yön bildiren bir kelime var.
- **Tarif:**
  1. Yön kelimesini bul.
  2. Boşluk karşı taraftakiyle zıt mı, benzer mi olmalı? Bunu yaz.
  3. Şıkların olumlu/olumsuz anlamını karşılaştır.
  4. Ters yöndeki şıkları ele.
- **Tuzak:** T3, T9
- **Örnek:** *Although the task seemed simple, it proved extremely ___.* → **demanding**

**Phrasal verb** (`phrasal_verb`)
- **Tanınır:** bütün şıklar aynı fiil + farklı edat (*carry out / carry on / carry off*) ya da farklı fiil + aynı edat.
- **Tarif:**
  1. Cümlenin Türkçe anlamını boşluksuz kur ("araştırmayı ___ yaptılar").
  2. Gerekli anlamı tek kelimeyle yaz ("yürütmek").
  3. Anlamı ezberinden eşleştir. Emin değilsen nesneye bak: *carry out* + research/experiment.
- **Tuzak:** T12, T15
- **Örnek:** *Scientists ___ a series of experiments last year.* → **carried out**

**Benzer görünen kelime** (`benzer_kelime`)
- **Tanınır:** şıklarda yazılışı benzeyen çiftler var (*adopt/adapt, affect/effect, economic/economical*).
- **Tarif:**
  1. Benzer çifti fark et.
  2. Her birinin Türkçesini yaz.
  3. Cümleye Türkçe yerleştir.
- **Tuzak:** T15
- **Örnek:** *Animals must ___ to changes in their habitat.* → **adapt** (adopt değil)

**Anlam ve ton** (`anlam`)
- **Tanınır:** yukarıdaki ipuçlarından hiçbiri yok; soru düz anlam bilgisini ölçüyor.
- **Tarif:**
  1. Cümlenin tonunu belirle (olumlu/olumsuz, bilimsel/gündelik).
  2. Ters tondaki şıkları ele.
  3. Kalanları Türkçe olarak yerleştir.
  4. Anlam en kesin olanı seç.
- **Tuzak:** T5, T15
- **Örnek:** *The new drug had a ___ effect: symptoms disappeared within days.* → **remarkable**

---

## 2. Dilbilgisi (soru 7–16)

**Tense** (`tense`)
- **Tanınır:** şıklar aynı fiilin farklı zamanları.
- **Tarif:**
  1. Zaman ifadesini bul:
     - *since/for/so far/recently* → present perfect
     - *by the time* + past → past perfect
     - *ago/in 1990/last* → past simple
     - *by* + gelecek → future perfect
  2. İfade yoksa cümledeki diğer fiilin zamanına uy.
  3. Uymayanları ele.
- **Tuzak:** T2
- **Örnek:** *By the time the firefighters arrived, the building ___.* → **had collapsed**

**Modal** (`modal`)
- **Tanınır:** şıklar *must/might/should/could* (+ have V3).
- **Tarif:**
  1. Kesinlik mi, olasılık mı, gereklilik mi, tavsiye mi? Belirle.
  2. Geçmişe dair mi? Öyleyse *modal + have V3*.
  3. *must have* (kesin çıkarım), *might have* (olasılık), *should have* (yapılmadı, yapılmalıydı) farkına bak.
- **Tuzak:** T4, T2
- **Örnek:** *The streets are wet; it ___ during the night.* → **must have rained**

**Edilgen yapı** (`edilgen`)
- **Tanınır:** şıklarda *be + V3* ile etken biçim karışık.
- **Tarif:**
  1. Özne eylemi yapan mı, eylemden etkilenen mi?
  2. Etkilenen ise edilgen.
  3. Sonra zamanı Tense tarifiyle seç.
- **Tuzak:** T8, T2
- **Örnek:** *The bridge ___ in 1932 and is still in use.* → **was built**

**If ve koşul** (`kosul`)
- **Tanınır:** cümlede *if, unless, provided that, had + özne* (devrik) var.
- **Tarif:**
  1. Tipi belirle:
     - gerçek (*if* + present, *will*)
     - hayali şimdi (*if* + past, *would*)
     - hayali geçmiş (*if* + had V3, *would have* V3)
  2. İki tarafın zaman uyumunu kontrol et.
  3. Devrik yapıyı (*Had I known…*) if'li yapı olarak oku.
- **Tuzak:** T2, T9
- **Örnek:** *If she had left earlier, she ___ the train.* → **would have caught**

**Relative clause** (`relative`)
- **Tanınır:** şıklar *who/which/whose/where/that*, ya da edat + *which*.
- **Tarif:**
  1. Boşluktan önceki ismi bul: insan mı, şey mi, yer mi?
  2. Boşluktan sonra özne var mı? Yoksa *who/which/that*. Varsa ve iyelik gerekiyorsa *whose*. Yer ise *where* ya da edat + *which*.
  3. Virgülden sonra *that* gelmez.
- **Tuzak:** T11
- **Örnek:** *The village ___ I grew up has changed a lot.* → **where**

**Noun clause** (`noun_clause`)
- **Tanınır:** boşluk bir fiilin nesnesi ya da cümlenin öznesi; şıklar *what/whether/that/how*.
- **Tarif:**
  1. Boşluktan sonraki cümlede eksik öğe var mı?
     - Varsa *what*.
     - Yoksa ve evet/hayır anlamı varsa *whether*.
     - Yoksa ve bilgi bildiriyorsa *that*.
  2. Soru düzeni değil düz cümle düzeni olmalı.
- **Tuzak:** T11
- **Örnek:** *Researchers still do not know ___ causes the disease.* → **what**

**Gerund / infinitive** (`gerund_inf`)
- **Tanınır:** şıklar *to V / V-ing / to have V3 / being V3*.
- **Tarif:**
  1. Önündeki fiil ya da edat neyi ister? (*avoid/enjoy* + V-ing; *decide/manage* + to V; edat + V-ing)
  2. Etken mi edilgen mi?
  3. Önceki zaman mı? (*having V3 / to have V3*)
- **Tuzak:** T12, T11
- **Örnek:** *He finally managed ___ the exam on his third attempt.* → **to pass**

**Edat** (`edat`)
- **Tanınır:** şıklar edat (*in/on/at/by/with/for*) ya da edat öbeği.
- **Tarif:**
  1. Edatın bağlandığı kelimeye bak: sıfat, fiil ya da isim kalıbı (*responsible for, in terms of*).
  2. Zaman/yer edatıysa ölçeğe bak: *in* yıl/ay, *on* gün, *at* saat.
- **Tuzak:** T12
- **Örnek:** *The museum is famous ___ its ancient manuscripts.* → **for**

**Bağlaç** (`baglac`)
- **Tanınır:** şıklar bağlaç ya da bağlaç işlevli edat (*although/despite/because/because of*).
- **Tarif:**
  1. İki tarafın ilişkisini yaz: zıt / neden / sonuç / koşul / zaman.
  2. Yapıya bak:
     - Ardından tam cümle geliyorsa *although/because*.
     - Ardından isim öbeği geliyorsa *despite/because of*.
  3. İkisine de uyan şıkkı seç.
- **Tuzak:** T3, T11
- **Örnek:** *___ the heavy rain, the match went ahead.* → **Despite**

**Karşılaştırma ve niceleyici** (`karsilastirma`)
- **Tanınır:** şıklar *more/most/as…as/the…the*, ya da *few/a few/little/much/each*.
- **Tarif:**
  1. Karşılaştırma iki şey mi, grup mu? (-er/more ya da -est/most)
  2. *as … as* ve *the more…, the more…* kalıbını tamamla.
  3. Niceleyicide sayılabilirlik (*few* sayılabilen, *little* sayılamayan) ve olumsuzluk (*few* = az, *a few* = birkaç) kontrolü yap.
- **Tuzak:** T4, T9
- **Örnek:** *The more you practise, ___ you become.* → **the more confident**

---

## 3. Cloze test (soru 17–26)

Cloze'da her boşluk aslında küçük bir kelime ya da dilbilgisi sorusudur. Tarif önce bağlamı kurar, sonra ilgili tarife gönderir.

**Cümleler arası bağlaç** (`baglac`)
- **Tanınır:** boşluk cümle başında ya da noktalı virgülden sonra; şıklar *however/therefore/moreover/for instance*.
- **Tarif:**
  1. Önceki cümlenin söylediğini tek satırda yaz.
  2. Boşluklu cümleninkini de yaz.
  3. İlişkiyi adlandır: zıt / sonuç / ek / örnek.
  4. O ilişkideki bağlacı seç.
- **Tuzak:** T3
- **Örnek:** *The method is cheap. ___, it is not very accurate.* → **However**

**Tense** (`tense`)
- **Tanınır:** şıklar aynı fiilin zamanları.
- **Tarif:**
  1. Paragrafın genel zamanını belirle: bilimsel metin çoğunlukla present, tarihsel metin past.
  2. Boşluklu cümledeki zaman ifadesine bak.
  3. Dilbilgisi › Tense tarifini uygula.
- **Tuzak:** T2
- **Örnek:** *In 1928, Fleming ___ penicillin by accident.* → **discovered**

**Edat** (`edat`)
- **Tanınır:** şıklar edat.
- **Tarif:** Dilbilgisi › Edat tarifi. Kalıbı boşluğun hemen yanında ara.
- **Tuzak:** T12
- **Örnek:** *The decline was due ___ a lack of rainfall.* → **to**

**Kelime** (`kelime`)
- **Tanınır:** şıklar aynı türden farklı kelimeler.
- **Tarif:**
  1. Paragrafın konusunu ve tonunu belirle.
  2. Kelime › Eşdizim ve Kelime › Bağlamdan yön tariflerini uygula.
  3. Seçtiğin kelime önceki cümleyle de uyumlu mu? Kontrol et.
- **Tuzak:** T12, T15, T5
- **Örnek:** *Bees play a ___ role in pollination.* → **vital**

**Zamir ve gönderge** (`gonderge`)
- **Tanınır:** şıklar *it/they/this/those/which/whose*.
- **Tarif:**
  1. Boşluğun gösterdiği ismi önceki cümlede bul.
  2. Tekil mi çoğul mu, insan mı şey mi? Belirle.
  3. Uyanı seç.
- **Tuzak:** T6
- **Örnek:** *Many species migrate; ___ journeys can exceed 5,000 km.* → **their**

---

## 4. Cümle tamamlama (soru 27–36)

Genel adımlar [TASARIM.md §5.4](TASARIM.md#54-cümle-tamamlama)'te: bağlacı bul, yapıyı kontrol et, zaman ve zamir uyumuna bak, yönü karşılaştır. Konular bağlacın işlevine göredir.

**Koşul** (`kosul`)
- **Tanınır:** *if, unless, provided/providing that, as long as, only if*. Ya da verilen kısımda *will/must* ile gelecek bir sonuç var ve boşluk o sonucun tetikleyicisi.
- **Tarif:**
  1. Verilen kısım bağımsız mı? Öyleyse şık bağlaçla başlamalı.
  2. Koşul ile sonuç mantıklı mı? Koşul sonucu gerçekten tetiklemeli.
  3. *unless* = *if … not*. Olumlu bir genel yargıya istisna getirir.
  4. Zaman uyumu: *if* + present → *will*, *if* + past → *would*.
- **Tuzak:** T2, T3, T11
- **Örnek:** *We will soon run out of fresh water ___.* → **unless we change how we use it**

**Zıtlık** (`zitlik`)
- **Tanınır:** *although, even though, while, whereas, despite, however, yet*.
- **Tarif:**
  1. Bağlaçtan sonra gelen bilgi, diğer taraftaki eylemi **beklenmedik** kılmalı.
  2. Eylemi destekleyen bilgi zıtlık kurmaz, ele.
  3. Ana cümlede beklenmedik bir neden varsa (*mostly because of X*), yan cümlede asıl beklenen nedenin eksikliğini ara.
  4. Yapıyı kontrol et: *despite* + isim öbeği, *although* + cümle.
- **Tuzak:** T3, T5, T11
- **Örnek:** *Although the drug was cheap, ___.* → **few doctors prescribed it**

**Neden-sonuç** (`neden_sonuc`)
- **Tanınır:** *because, since, as, so, therefore, so … that, such … that, as a result*.
- **Tarif:**
  1. Bağlacın neden mi sonuç mu getirdiğini yaz (*since* → neden, *so* → sonuç).
  2. Şıktaki bilgi gerçekten o rolde mi? İki neden bağlaçlı şık varsa biri aslında sonuçtur.
  3. Yönü kontrol et: kim kime ihtiyaç duyuyor, ne neye yol açıyor?
- **Tuzak:** T7, T3
- **Örnek:** *Since the bridge was closed for repairs, ___.* → **drivers had to take a long detour**

**Ekleme** (`ek`)
- **Tanınır:** *in addition to, besides, as well as, moreover, not only … but also, for example*.
- **Tarif:**
  1. Ekleme aynı yönde devam ister: olumsuz bilgiye olumsuz, olumlu bilgiye olumlu.
  2. Verilen kısımda bir alan geçiyorsa (*physical*), doğru şık çoğunlukla onun eşini içerir (*psychological*).
  3. *for example* geliyorsa şık genel iddianın somut örneği olmalı.
- **Tuzak:** T3, T5
- **Örnek:** *In addition to its physical benefits, regular exercise ___.* → **improves mood and memory**

**Zaman** (`zaman`)
- **Tanınır:** *when, while, as soon as, until, before, after, by the time, once*. Ya da *After/Before + -ing*.
- **Tarif:**
  1. Zaman ilişkisini yaz: önce / sonra / aynı anda / bitiş noktası.
  2. Zamanları uyumlu kur:
     - *by the time* + past → past perfect
     - *until* + present (perfect)
  3. *After/Before + -ing*: gizli özne, ana cümlenin öznesiyle aynı olmalı.
  4. Süre bildiren bir eylem varsa (*protect, wait*) bitiş noktasını *until* ile ara.
- **Tuzak:** T2, T6, T8
- **Örnek:** *Baby turtles stay in the nest ___.* → **until they are strong enough to swim**

**Amaç** (`amac`)
- **Tanınır:** *so that, in order to, so as to, to + V* (başta), *for the purpose of*.
- **Tarif:**
  1. Amaç bağlacı varsa boşlukta o amaca yönelik **bilinçli bir eylem** olmalı.
  2. Yalnızca durum ya da sonuç bildiren şıkları ele.
  3. Amacı olumsuzlukla bozan ya da ters yöne götüren şıkları ele.
  4. *so that* + *can/could/will* zaman uyumunu kontrol et.
- **Tuzak:** T3, T5
- **Örnek:** *To reduce traffic in the city centre, ___.* → **the council introduced a congestion charge**

**Karşılaştırma** (`karsilastirma`)
- **Tanınır:** *more/less … than, as … as, the … the, compared to, unlike, similar to*.
- **Tarif:**
  1. Neyin neyle karşılaştırıldığını bul. İki taraf aynı türden olmalı (*the climate of X* ↔ *that of Y*).
  2. Karşılaştırmanın yönünü kontrol et (*more* mi *less* mi).
  3. *the more …, the more …* kalıbında iki tarafın da aynı yapıda olmasına bak.
- **Tuzak:** T4, T11
- **Örnek:** *The older the tree is, ___.* → **the thicker its bark becomes**

**İlişkili yapı ve gönderge** (`iliskili_yapi`)
- **Tanınır:**
  - *both … and, either … or, neither … nor, not only … but also*
  - *such … that, so … that*
  - şıkta *it/they/this* gibi önceki kısma gönderme yapan zamir
- **Tarif:**
  1. Çift bağlacın eşini bul: *either* → *or*, *neither* → *nor*.
  2. Çift bağlacın iki tarafı aynı yapıda olmalı (isim–isim, fiil–fiil).
  3. Şıktaki zamirin neyi gösterdiğini kontrol et: tekil/çoğul ve anlam uyumu.
- **Tuzak:** T6, T11
- **Örnek:** *Neither the manager ___.* → **nor his assistants knew about the change**

---

## 5. Çeviri (soru 37–42)

Genel adımlar [TASARIM.md §5.5](TASARIM.md#55-çeviri)'te. Konu, şıklar arasında **farkın olduğu** unsurdur. Şıkları karşılaştırınca hangi unsurun test edildiği görülür.

**Ana ve yan cümle** (`ana_yan`)
- **Tanınır:** uzun cümle; şıklarda hangi kısmın yüklem olduğu değişiyor.
- **Tarif:**
  1. Kaynak cümlenin ana yüklemini bul (İngilizcede ana fiil, Türkçede sondaki yüklem).
  2. Yan cümleleri ayır (*which, although, while*).
  3. Ana yüklemi doğru yerde tutan şıkkı seç.
- **Tuzak:** T8, T10
- **Örnek:** *The study, which lasted ten years, showed that…* → "On yıl süren çalışma … **gösterdi**." ("Çalışma on yıl sürdü ve…" değil.)

**Etken / edilgen** (`edilgen`)
- **Tanınır:** şıklarda "-ildi / yaptı" farkı var.
- **Tarif:**
  1. Kaynakta *be + V3* var mı?
  2. Varsa Türkçede "-il/-in" ile verilmeli ya da özneyi değiştirmeden aktarılmalı.
  3. Yapanı (*by …*) kaybeden ya da ekleyen şıkkı ele.
- **Tuzak:** T8
- **Örnek:** *The vaccine was developed by a small team.* → "Aşı küçük bir ekip **tarafından geliştirildi**."

**Kapsam ve niceleyici** (`kapsam`)
- **Tanınır:** şıklarda "bazı/çoğu/tüm", "-ebilir/-ecek", "sık sık/her zaman" farkları var.
- **Tarif:**
  1. Kaynaktaki niceleyici ve modal kelimelerin altını çiz.
  2. Her şıkta birebir karşılığını ara.
  3. Bir derece kaymış olan şıkkı ele.
- **Tuzak:** T4
- **Örnek:** *Some experts believe it may…* → "Bazı uzmanlar … **-ebileceğine** inanıyor." ("Uzmanlar … -eceğine" değil.)

**Karşılaştırma** (`karsilastirma`)
- **Tanınır:** *more/less than, as … as, the … the*.
- **Tarif:**
  1. Karşılaştırılan iki tarafı ve yönü yaz.
  2. Yönü ters çeviren ya da tarafları değiştiren şıkkı ele.
- **Tuzak:** T4, T7
- **Örnek:** *Cities are less polluted than they were twenty years ago.* → "Şehirler yirmi yıl öncesine göre **daha az** kirli."

**Olumsuzluk** (`olumsuzluk`)
- **Tanınır:** *hardly, no longer, not until, few, unless, rarely*.
- **Tarif:**
  1. Olumsuzluk sözcüğünü işaretle.
  2. Türkçede karşılığı var mı ("artık … değil", "ancak … -ince", "pek az")?
  3. Olumsuzluğu kaybeden ya da fazladan ekleyen şıkkı ele.
- **Tuzak:** T9
- **Örnek:** *It was not until 1990 that the law changed.* → "Yasa **ancak** 1990'da değişti."

**Zaman ve modal** (`zaman_modal`)
- **Tanınır:** şıklar zaman ya da kip bakımından farklı ("-di / -miş / -mekte", "-meli / -ebilir").
- **Tarif:**
  1. Kaynağın zamanını belirle (present perfect → "-di / -miştir"; *used to* → "-erdi").
  2. Modalı eşle (*must* → "-meli", *may* → "-ebilir", *should have* → "-meliydi").
  3. Uymayanları ele.
- **Tuzak:** T2, T4
- **Örnek:** *They should have warned us.* → "Bizi **uyarmalıydılar**."

**Bağlaç** (`baglac`)
- **Tanınır:** şıklarda "-e rağmen / çünkü / -dikçe / -mek için" farkları var.
- **Tarif:**
  1. Kaynaktaki bağlacın ilişkisini yaz.
  2. Türkçede aynı ilişkiyi kuran şıkkı seç.
  3. İlişkiyi değiştiren şıkkı (neden ↔ amaç) ele.
- **Tuzak:** T3, T7
- **Örnek:** *Despite the cost, …* → "Maliyetine **rağmen** …"

---

## 6. Okuma parçaları (soru 43–62)

Genel adımlar [TASARIM.md §5.6](TASARIM.md#56-okuma-parçaları)'da. Konu, **soru kökünün türüdür**. Önce soru kökünü oku, türünü belirle.

**Ana fikir ve başlık** (`ana_fikir`)
- **Tanınır:** *main idea, mainly about, best title, primary purpose of the passage*.
- **Tarif:**
  1. İlk ve son cümleyi oku.
  2. Paragrafın tamamını kapsayan tek cümleyi kendin kur.
  3. Tek bir detayı anlatan (çok dar) ve metnin ötesine geçen (çok geniş) şıkları ele.
- **Tuzak:** T14, T1, T10
- **Örnek:** Paragraf arıların tozlaşmadaki rolünü ve azalmalarının tarıma etkisini anlatıyorsa, doğru başlık **"Arıların azalması tarımı tehdit ediyor"** olur. "Arıların yaşam süresi" çok dar kalır.

**Detay** (`detay`)
- **Tanınır:** *according to the passage, it is stated that, which of the following is true*.
- **Tarif:**
  1. Soru kökündeki anahtar kelimeyi metinde bul.
  2. O cümleyi ve bir önceki/sonraki cümleyi oku.
  3. Şıkkı metindeki cümleyle birebir karşılaştır.
  4. Metindeki kelimeyi aynen tekrar eden ama iddiayı değiştiren şıkka dikkat et.
- **Tuzak:** T1, T4, T9
- **Örnek:** Metin *"most patients recovered within a week"* diyorsa *"All patients recovered"* yanlıştır (T4).

**Çıkarım** (`cikarim`)
- **Tanınır:** *it can be inferred, it is implied, the author suggests*.
- **Tarif:**
  1. Cevap metinde açıkça yazmaz ama metinden **zorunlu olarak** çıkar.
  2. Her şık için "metne göre bu kesin mi?" diye sor.
  3. Genel kültürle doğru olan ama metinden çıkmayan şıkkı ele.
- **Tuzak:** T5, T4
- **Örnek:** Metin *"the treatment was abandoned after side effects were reported"* diyorsa, çıkarım şudur: **yan etkiler ciddiydi.**

**Yazarın tutumu ve amacı** (`tutum`)
- **Tanınır:** *the author's attitude/tone, the author's purpose in mentioning X, the author would most likely agree*.
- **Tarif:**
  1. Yazarın kendi sesini, aktardığı görüşlerden ayır ("*critics argue*" yazarın görüşü değildir).
  2. Değer bildiren kelimelere bak (*unfortunately, remarkably, merely*).
  3. Tutumu tek kelimeyle yaz: eleştirel / destekleyici / tarafsız / şüpheci.
- **Tuzak:** T13, T5
- **Örnek:** *"Some claim the policy worked; the data, however, tell a different story."* Bu cümlede yazar **şüpheci**.

**Gönderge ve kelime anlamı** (`gonderge`)
- **Tanınır:** *the word "it" in line X refers to, the underlined word is closest in meaning to*.
- **Tarif:**
  1. Kelimenin geçtiği cümleyi ve bir önceki cümleyi oku.
  2. Zamirse yerine şıkları tek tek koy, anlam bozulmuyorsa doğrudur.
  3. Kelimeyse sözlük anlamına değil bağlamdaki anlamına bak.
- **Tuzak:** T6, T15
- **Örnek:** *"The bacteria multiply quickly; they can double in twenty minutes."* Burada *they* = **the bacteria**.

---

## 7. Diyalog tamamlama (soru 63–67)

Genel adımlar [TASARIM.md §5.7](TASARIM.md#57-diyalog-tamamlama)'de. Konu, boşluğun diyalogdaki **işlevidir**.

**Soru-cevap uyumu** (`soru_cevap`)
- **Tanınır:** boşluktan sonraki replik bir cevap (ya da boşluk, önceki soruya cevap).
- **Tarif:**
  1. Sonraki repliği oku.
  2. Evet/hayır mı, bilgi mi (*where/why/how*) veriyor? Belirle.
  3. Boşluktaki soru o türde olmalı.
- **Tuzak:** T10
- **Örnek:** Sonraki replik *"Since last March."* ise boşluk ***How long have you been working here?*** olmalı.

**Katılma ve itiraz** (`katilma_itiraz`)
- **Tanınır:** sonraki replik *I agree / Exactly / I'm not so sure / But…* ile başlıyor.
- **Tarif:**
  1. Sonraki konuşmacının tutumunu belirle.
  2. Boşluk, o tutumun yöneldiği bir iddia olmalı.
  3. Konusu doğru ama tutuma bağlanmayan şıkkı ele.
- **Tuzak:** T10, T3
- **Örnek:** Sonraki replik *"I disagree — it would cost far too much."* ise boşlukta bir **öneri ya da iddia** olmalı: ***I think we should build a new stadium.***

**Öneri ve tavsiye** (`oneri`)
- **Tanınır:** bir sorun anlatılmış; sonraki replik bir öneriye tepki (*That's a good idea / I've already tried that*).
- **Tarif:**
  1. Sorunu belirle.
  2. Öneri sorunla doğrudan ilgili olmalı.
  3. Sonraki tepkiyle uyumlu olmalı ("zaten denedim" → daha önce denenebilecek bir şey).
- **Tuzak:** T10, T5
- **Örnek:** *"I can't sleep at night."* — ___ — *"I've already stopped drinking coffee."* → ***Maybe you should cut down on caffeine.***

**Gerekçe ve açıklama** (`gerekce`)
- **Tanınır:** önceki replik *why / how come*; ya da sonraki replik *I see / That explains it*.
- **Tarif:**
  1. Neyin açıklandığını bul.
  2. Boşluk o şeyin nedenini ya da açıklamasını vermeli.
  3. Neden-sonuç yönünü kontrol et.
- **Tuzak:** T7, T10
- **Örnek:** *"Why was the flight cancelled?"* — ___ — *"I see, safety comes first."* → ***There was a technical problem with the engine.***

---

## 8. Yakın anlamlı cümle (soru 68–71)

Genel adımlar [TASARIM.md §5.8](TASARIM.md#58-yakın-anlamlı-cümle)'de: unsurları çıkar, her şıkta tek tek kontrol et. Konu, cümlenin **ana unsurudur**. Şıklar en çok o unsurda değişir.

**Karşılaştırma** (`karsilastirma`)
- **Tanınır:** *more/less than, as … as, not as … as, the most*.
- **Tarif:**
  1. Kim kimden ne bakımdan fazla? Yaz.
  2. *not as … as* = *less … than* dönüşümünü tanı.
  3. Yönü ya da tarafları ters çeviren şıkkı ele.
- **Tuzak:** T4, T7
- **Örnek:** *"X is not as expensive as Y."* = ***"Y is more expensive than X."***

**Neden-sonuç** (`neden_sonuc`)
- **Tanınır:** *because, due to, so, therefore, led to, resulted in*.
- **Tarif:**
  1. Neden ve sonucu ayrı ayrı yaz.
  2. Şıkta aynı neden aynı sonuca mı bağlanıyor?
  3. *led to* ↔ *resulted from* yön değişimine dikkat et.
- **Tuzak:** T7
- **Örnek:** *"The flood was caused by heavy rain."* = ***"Heavy rain led to the flood."***

**Zaman ve modal** (`zaman_modal`)
- **Tanınır:** *used to, no longer, must have, may, should*.
- **Tarif:**
  1. Kaynağın zamanını ve kesinlik derecesini yaz.
  2. *must have* ↔ *certainly*, *may* ↔ *possibly* eşleşmesini tanı.
  3. Dereceyi değiştiren şıkkı ele.
- **Tuzak:** T4, T2
- **Örnek:** *"He used to live in Paris."* = ***"He lived in Paris in the past, but not now."***

**Kapsam** (`kapsam`)
- **Tanınır:** *some/most/all/only/hardly any/mainly*.
- **Tarif:**
  1. Niceleyicinin altını çiz.
  2. Her şıkta karşılığına bak.
  3. *only* ve *mainly* gibi sınırlayıcıları kaybeden şıkkı ele.
- **Tuzak:** T4
- **Örnek:** *"Only a few students passed."* ≠ *"Some students passed."* (vurgu kaybı)

**Olumsuzluk** (`olumsuzluk`)
- **Tanınır:** *hardly, rarely, never, not until, unless, no sooner*.
- **Tarif:**
  1. Olumsuz anlamı olumlu bir cümleyle yeniden kur.
  2. Şıklarda aynı anlamı ara.
  3. Olumsuzluğu çift kullanıp anlamı tersine çeviren şıkkı ele.
- **Tuzak:** T9
- **Örnek:** *"No sooner had we arrived than it started to rain."* = ***"It started to rain as soon as we arrived."***

**Bağlaç dönüşümü** (`baglac_donusumu`)
- **Tanınır:** kaynakta bir bağlaç var; şıklar aynı ilişkiyi farklı bağlaçla kuruyor (*although* → *despite*, *if not* → *unless*).
- **Tarif:**
  1. Kaynaktaki ilişkiyi yaz.
  2. Şıktaki bağlacın aynı ilişkiyi kurup kurmadığına bak.
  3. Bağlaç doğru olsa bile iki tarafın yeri değişmiş mi? Kontrol et.
- **Tuzak:** T3, T7
- **Örnek:** *"Although it was late, she kept working."* = ***"Despite the late hour, she kept working."***

---

## 9. Paragraf tamamlama (soru 72–75)

Genel adımlar [TASARIM.md §5.9](TASARIM.md#59-paragraf-tamamlama)'da. Konu, boşluğun paragraftaki **yeridir**.

**Giriş cümlesi** (`giris`)
- **Tanınır:** boşluk paragrafın başında.
- **Tarif:**
  1. Sonraki cümlelerin ortak konusunu bul.
  2. Giriş cümlesi bu konuyu genel olarak tanıtmalı.
  3. Sonraki cümledeki zamir (*it/they/this*) giriş cümlesindeki bir isme dönmeli.
- **Tuzak:** T6, T14
- **Örnek:** Sonraki cümle *"It was first used in the 1950s…"* ise boşlukta *it*'in gösterdiği tekil bir isim (bir teknoloji) tanıtılmalı.

**Ara cümle** (`ara`)
- **Tanınır:** boşluk paragrafın ortasında.
- **Tarif:**
  1. Önceki ve sonraki cümleyi oku.
  2. Boşluk ikisine birden bağlanmalı: öncekinden devam etmeli, sonrakini hazırlamalı.
  3. Sonraki cümledeki zamir ve *this/such* göndergesini karşılamalı.
- **Tuzak:** T6, T10
- **Örnek:** Sonraki cümle *"This discovery changed medicine forever."* ise boşlukta **bir keşif** anlatılmalı.

**Geçiş** (`gecis`)
- **Tanınır:** sonraki cümle *However / Therefore / For example / In contrast* ile başlıyor.
- **Tarif:**
  1. Sonraki cümlenin bağlacını bul.
  2. Boşluk, o bağlacın gerektirdiği ilişkiyi kurmalı. *However* geliyorsa boşluk ters bir şey söylemeli.
- **Tuzak:** T3
- **Örnek:** Sonraki cümle *"However, recent studies question this view."* ise boşlukta **yaygın bir görüş** olmalı.

**Sonuç cümlesi** (`sonuc`)
- **Tanınır:** boşluk paragrafın sonunda.
- **Tarif:**
  1. Paragrafın ana fikrini tek cümleyle yaz.
  2. Boşluk bu fikri toparlamalı ya da sonucunu vermeli.
  3. Yeni bir konu açan şıkkı ele.
- **Tuzak:** T10, T14
- **Örnek:** Paragraf bir yöntemin artı ve eksilerini sıraladıysa, son cümle **genel bir değerlendirme** yapar.

---

## 10. Anlamı bozan cümle (soru 76–80)

Genel adımlar [TASARIM.md §5.10](TASARIM.md#510-anlamı-bozan-cümle)'da. Konu, uymayan cümlenin **neden** uymadığıdır.

**Konudan sapma** (`konu_sapmasi`)
- **Tanınır:** bir cümle tamamen başka bir konudan bahsediyor.
- **Tarif:**
  1. İlk cümleden konuyu yaz.
  2. Her cümleyi bu konuyla karşılaştır.
  3. Bambaşka konudaki cümleyi seç. En kolay türdür.
- **Tuzak:** T5
- **Örnek:** Kahvenin sağlığa etkisini anlatan paragrafta *"Brezilya en büyük kahve üreticisidir."* cümlesi.

**Odak sapması** (`odak_sapmasi`)
- **Tanınır:** bütün cümleler aynı konuda ama biri farklı bir **yönüne** geçiyor.
- **Tarif:**
  1. Konuyu değil **odağı** yaz ("X'in faydaları", "X'in tarihi").
  2. Aynı anahtar kelimeyi içerip odağı değiştiren cümleyi bul.
  3. Onu çıkarıp oku: paragraf akıcılaşıyorsa cevap odur.
- **Tuzak:** T10, T1
- **Örnek:** Kahvenin **sağlığa etkisini** anlatan paragrafta *"Kahve ilk kez Etiyopya'da keşfedildi."* cümlesi. Konu kahve ama odak tarih.

**Zaman ve bakış açısı kopması** (`zaman_kopmasi`)
- **Tanınır:** bir cümlenin zamanı ya da anlatıcısı akıştan kopuyor (geçmiş anlatımda bir gelecek tahmini, nesnel metinde kişisel görüş).
- **Tarif:**
  1. Paragrafın zamanını ve anlatım biçimini belirle.
  2. Uymayan cümleyi bul.
  3. Gerçekten kopuyor mu, yoksa bilinçli bir geçiş mi (*today, however*)? Kontrol et.
- **Tuzak:** T2, T13
- **Örnek:** 19. yüzyıl buluşlarını anlatan paragrafta *"Gelecekte robotlar bu işleri yapacak."* cümlesi.

**Gönderge zinciri kopması** (`zincir_kopmasi`)
- **Tanınır:** bir cümlenin zamiri ya da bağlacı önceki cümleye bağlanmıyor. Ya da cümle çıkarılınca sonraki cümlenin zamiri anlam kazanıyor.
- **Tarif:**
  1. Her cümledeki *it/they/this/however/therefore* gibi bağlantıları önceki cümleye bağla.
  2. Zincirin koptuğu yeri bul.
  3. Şüpheli cümleyi çıkar: sonraki cümlenin zamiri artık doğru şeyi gösteriyorsa cevap odur.
- **Tuzak:** T6, T10
- **Örnek:** Arılar anlatılırken araya *"Kuşlar da göç eder."* girer, sonraki cümlenin *"They pollinate flowers."* öznesi kuşlara kayar. Cümle çıkarılınca *they* yine arıları gösterir.
