import type { TrapCode } from "./schema";

/** Tuzak rehberi. Metinler docs/TASARIM.md §4 tablosundan birebir alındı (satır içi * vurgusu korunur). */
export const TRAP_GUIDE: Record<TrapCode, { how: string; catch: string }> = {
  T1: { how: "Metindeki kelime şıkta aynen geçer, tanıdık geldiği için seçilir ama söylenen şey farklıdır", catch: "Kelimeye değil iddiaya bak: \"Metin bunu *söylüyor mu*?\"" },
  T2: { how: "Anlam uygun ama tense yan cümleyle/metinle uyuşmaz", catch: "Önce verilen kısmın zamanını belirle, uyumsuzları anlamına bakmadan ele" },
  T3: { how: "Zıtlık beklenirken paralel ya da sonuç bildiren şık (veya tersi)", catch: "Bağlacı bul, yönü yaz (zıt / neden / sonuç / ek), şıkkın yönünü karşılaştır" },
  T4: { how: "*some→all, may→will, often→always, many→most*", catch: "Niceleyici ve modal kelimelerin altını çiz, birebir karşılaştır" },
  T5: { how: "Dünyada doğru bir bilgi ama soruyla/metinle bağı yok", catch: "\"Bunu metinden mi biliyorum, genel kültürden mi?\"" },
  T6: { how: "*they/it/this/such* yanlış şeyi gösterir, tekil-çoğul uyumsuz", catch: "Her zamirin neyi gösterdiğini bul" },
  T7: { how: "Sebep ile sonucun yeri değiştirilmiş", catch: "\"Hangisi önce oldu, hangisi diğerine yol açtı?\"" },
  T8: { how: "Cümlenin öznesi başka bir şeye dönmüş (özellikle çeviride)", catch: "Önce ana özne + ana yüklemi bul, şıklarda karşılaştır" },
  T9: { how: "*hardly, no longer, not only, few (vs a few), unless* anlamı tersine çevirir", catch: "Olumsuzluk sözcüklerini işaretle" },
  T10: { how: "Aynı konudan bahseder ama paragrafın akışından sapar", catch: "Konuya değil, paragrafın *söylediği şeye* bak" },
  T11: { how: "Anlam doğru ama yapı yanlış: *despite* + cümle, iki bağlaç, bağlaçsız iki cümle", catch: "Bağlacın ardından ne geldiğini kontrol et (isim öbeği mi, cümle mi?)" },
  T12: { how: "Anlamca yakın ama kalıp olarak birlikte kullanılmayan kelime/edat", catch: "Kalıbı ezberle: *depend on, responsible for, make a decision*" },
  T13: { how: "Metindeki bir kişinin görüşü yazarınki gibi sunulur", catch: "\"Bunu kim söylüyor?\"" },
  T14: { how: "Ana fikir sorusunda tek detay ya da metnin ötesine geçen genelleme", catch: "Şık, paragrafın *tamamını* kapsıyor mu ve *sadece* onu mu?" },
  T15: { how: "*adopt/adapt, affect/effect, economic/economical*", catch: "Yazılışa değil anlama bak" },
};
