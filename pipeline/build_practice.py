"""İçerik JSON'undan tek dosyalık, yerelde açılan bir pratik sayfası üretir.

Kullanım: python pipeline/build_practice.py content/sorular/2021-yds-1/cumle-tamamlama.json
Çıktı: aynı klasörde <ad>.pratik.html (ÖSYM içeriği içerir — yalnızca yerel kullanım, yayımlama).
"""
import json
import sys
from pathlib import Path

TEMPLATE = r"""<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>YDS Pratik</title>
<style>
:root {
  --bg: #f7f6f2; --surface: #ffffff; --text: #1d1d1f; --muted: #6b6b70; --border: #e3e1da;
  --accent: #2f5bd3; --accent-soft: #e8eefc; --ok: #1f8a4c; --ok-soft: #e4f4ea;
  --warn: #b26a00; --warn-soft: #fdf1dc; --conj: #6b3fd1; --conj-soft: #efe8fd;
  --ref: #0b7a83; --ref-soft: #e1f4f5;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #141416; --surface: #1d1d21; --text: #ececef; --muted: #9a9aa3; --border: #2e2e34;
    --accent: #7c9cff; --accent-soft: #1f2840; --ok: #4fc483; --ok-soft: #16301f;
    --warn: #f0a83a; --warn-soft: #33260f; --conj: #b49bff; --conj-soft: #2a2140;
    --ref: #4fd0d9; --ref-soft: #123033;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 680px; margin: 0 auto; padding: 16px 16px 96px; }
.top { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; color: var(--muted); font-size: 14px; }
.bar { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.bar > i { display: block; height: 100%; background: var(--accent); transition: width .3s; }
.directive { font-size: 14px; color: var(--muted); margin: 12px 0 16px; }
.directive b { color: var(--text); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px; }
.en { font-family: Georgia, "Times New Roman", serif; font-size: 19px; line-height: 1.6; }
.tr { color: var(--muted); font-size: 14px; }
.hl-conj { background: var(--conj-soft); color: var(--conj); border-radius: 4px; padding: 0 3px; font-weight: 600; }
.hl-ref { background: var(--ref-soft); color: var(--ref); border-radius: 4px; padding: 0 3px; }
.blank { letter-spacing: 2px; color: var(--accent); font-weight: 700; }
.gloss { display: flex; flex-wrap: wrap; gap: 10px 8px; }
.chunk { border: 1px solid var(--border); border-radius: 10px; padding: 6px 10px; max-width: 100%; }
.chunk .en { font-size: 17px; }
.chunk .tr { display: block; margin-top: 2px; }
.chunk.conj { border-color: var(--conj); background: var(--conj-soft); }
.chunk.conj .en, .chunk.conj .tr { color: var(--conj); }
.chunk.ref { border-color: var(--ref); background: var(--ref-soft); }
.chunk.blank { border-style: dashed; border-color: var(--accent); }
.tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  border-radius: 6px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; font-family: system-ui, sans-serif; }
.tag.label { background: var(--conj); color: var(--surface); }
.tag.sign { background: var(--border); color: var(--text); }
.tools { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
button { font: inherit; color: inherit; cursor: pointer; }
.chip { border: 1px solid var(--border); background: var(--surface); border-radius: 999px; padding: 6px 14px; font-size: 14px; }
.chip[aria-pressed="true"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.hint { background: var(--accent-soft); border-radius: 10px; padding: 10px 14px; font-size: 15px; margin-bottom: 12px; }
.options { display: grid; gap: 10px; margin-top: 4px; }
.opt { display: flex; gap: 12px; align-items: flex-start; text-align: left; width: 100%; min-height: 48px;
  background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; padding: 12px 14px; }
.opt .k { flex: none; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid var(--border);
  display: grid; place-items: center; font-weight: 700; font-size: 14px; }
.opt .t { font-family: Georgia, serif; font-size: 16.5px; line-height: 1.45; }
.opt .t .tr { display: block; font-family: system-ui, sans-serif; margin-top: 4px; }
.opt.sel { border-color: var(--accent); background: var(--accent-soft); }
.opt.sel .k { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.opt.right { border-color: var(--ok); background: var(--ok-soft); }
.opt.right .k { background: var(--ok); border-color: var(--ok); color: var(--surface); }
.opt.wrong { border-color: var(--warn); background: var(--warn-soft); }
.opt.wrong .k { background: var(--warn); border-color: var(--warn); color: var(--surface); }
.opt.dim { opacity: .55; }
.opt:disabled { cursor: default; }
.answerbar { position: fixed; left: 0; right: 0; bottom: 0; background: var(--surface); border-top: 1px solid var(--border);
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); }
.answerbar .in { max-width: 680px; margin: 0 auto; display: flex; gap: 10px; }
.btn { flex: 1; min-height: 48px; border-radius: 12px; border: 1.5px solid var(--border); background: var(--surface); font-weight: 600; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.btn:disabled { opacity: .45; cursor: default; }
.verdict { border-radius: 12px; padding: 14px 16px; margin-top: 16px; }
.verdict.ok { background: var(--ok-soft); }
.verdict.warn { background: var(--warn-soft); }
.verdict h3 { margin: 0 0 6px; font-size: 17px; }
.verdict.ok h3 { color: var(--ok); }
.verdict.warn h3 { color: var(--warn); }
.verdict p { margin: 6px 0 0; }
.trap { display: inline-block; font-size: 13px; font-weight: 600; border-radius: 6px; padding: 1px 7px; margin: 2px 4px 2px 0;
  background: var(--warn-soft); color: var(--warn); border: 1px solid var(--warn); }
.rule { margin-top: 12px; border-left: 4px solid var(--accent); padding: 8px 12px; background: var(--surface); border-radius: 0 10px 10px 0; }
.rule b { color: var(--accent); }
details { margin-top: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
summary { cursor: pointer; padding: 12px 16px; font-weight: 600; }
details > div { padding: 0 16px 14px; }
details ol { margin: 0; padding-left: 20px; } details li { margin: 6px 0; }
.why { padding: 8px 0; border-top: 1px solid var(--border); } .why:first-child { border-top: 0; }
.why .tr { display: block; }
.vocab { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; }
.vocab .w { font-family: Georgia, serif; font-weight: 600; }
.note { font-size: 14px; color: var(--muted); margin-top: 10px; }
.center { text-align: center; padding: 32px 8px; }
.big { font-size: 42px; font-weight: 800; margin: 8px 0; }
.wword { font-family: Georgia, serif; font-size: 30px; font-weight: 700; margin: 6px 0 2px; }
.wctx { font-family: Georgia, serif; font-style: italic; color: var(--muted); margin-bottom: 18px; }
.wlist { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; background: var(--accent-soft); border-radius: 10px; padding: 10px 14px; margin-bottom: 12px; }
.wlist .w { font-family: Georgia, serif; font-weight: 600; }
.skip { background: none; border: 0; color: var(--muted); text-decoration: underline; font-size: 14px; padding: 8px; }
kbd { font: 12px ui-monospace, monospace; border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 4px; padding: 0 4px; }
@media (max-width: 520px) { .kbd-help { display: none; } }
</style>
</head>
<body>
<main id="app"></main>
<div class="answerbar" id="bar"></div>
<script>
const DATA = __DATA__;
const TRAPS = {T1:"Kelime tekrarı",T2:"Zaman uyumsuzluğu",T3:"Bağlaç yönü",T4:"Kapsam kayması",T5:"Gerçek ama alakasız",
  T6:"Zamir uyumsuzluğu",T7:"Neden-sonuç ters",T8:"Özne kayması",T9:"Olumsuzluk",T10:"Konu doğru, odak yanlış",
  T11:"Yapısal uyumsuzluk",T12:"Eşdizim / edat",T13:"Görüş sahibi karışıklığı",T14:"Aşırı dar / geniş",T15:"Benzer görünen kelime"};
const DIRECTIVE = {cumle_tamamlama: "<b>Önce bağlacı bul</b>, yönünü belirle (zıtlık / neden / ek / koşul). Sonra zaman ve zamir uyumuna bak."};
const QS = DATA.questions;
const KEY = "yds-pratik-" + DATA.exam.id + "-" + QS[0].type;
const BREAK_AFTER = 4;          // blok boyutu: mola + kelime ısınması her 4 soruda bir
const WARM_MAX = 30;            // bir ısınmada en fazla kaç kelime (kullanıcı tercihi: bloktaki tüm kelimeler)
const KNOWN_AFTER = 2;          // üst üste kaç doğrudan sonra kelime "biliniyor" sayılır

const fresh = () => ({ i: 0, answers: {}, breakSeen: false, warmDone: {}, known: {}, glossUsed: {} });
let S = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.answers) S = Object.assign(fresh(), s); } catch (e) {}
const freshUI = () => ({ sel: null, gloss: false, hint: false, words: false, onBreak: false, warm: null });
let ui = freshUI();
const ALL_TR = [...new Set(QS.flatMap(q => q.vocab.map(v => v.tr)))];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function warmItems(start) {
  const seen = new Set(), items = [];
  for (const q of QS.slice(start, start + BREAK_AFTER))
    for (const v of q.vocab)
      if (v.warmup && !seen.has(v.word) && (S.known[v.word] || 0) < KNOWN_AFTER) { seen.add(v.word); items.push(v); }
  return items.slice(0, WARM_MAX).map(v => ({
    v, choices: shuffle([v.tr, ...shuffle(ALL_TR.filter(t => t !== v.tr)).slice(0, 3)]), picked: null }));
}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const trapChips = ts => ts.map(t => `<span class="trap">${t} · ${esc(TRAPS[t])}</span>`).join("");
const $ = id => document.getElementById(id);

function stemHTML(q) {
  if (ui.gloss) {
    return `<div class="gloss">` + q.stem_chunks.map(c => {
      const cls = c.tag === "conj" ? "conj" : c.tag === "ref" ? "ref" : c.tag === "blank" ? "blank" : "";
      const label = c.label ? `<span class="tag label">${esc(c.label)}</span>` : "";
      const sign = c.sign ? `<span class="tag sign">${esc(c.sign)}</span>` : "";
      const tr = c.tag === "blank" ? "" : `<span class="tr">${esc(c.tr)}</span>`;
      return `<div class="chunk ${cls}"><span class="en">${esc(c.en)}</span>${label}${sign}${tr}</div>`;
    }).join("") + `</div>`;
  }
  return `<div class="en">` + q.stem_chunks.map(c => {
    if (c.tag === "conj") return `<span class="hl-conj">${esc(c.en)}</span>`;
    if (c.tag === "ref") return `<span class="hl-ref">${esc(c.en)}</span>`;
    if (c.tag === "blank") return `<span class="blank">${esc(c.en)}</span>`;
    return esc(c.en);
  }).join(" ") + `</div>`;
}

function render() {
  window.scrollTo(0, 0);
  if (ui.onBreak) return renderBreak();
  if (S.i >= QS.length) return renderEnd();
  if (S.i % BREAK_AFTER === 0 && !S.warmDone[S.i]) {
    if (!ui.warm) ui.warm = { items: warmItems(S.i), idx: 0, score: 0 };
    if (ui.warm.items.length) return renderWarm();
    S.warmDone[S.i] = true; save();
  }
  const q = QS[S.i], a = S.answers[q.number], done = !!a;
  const pct = Math.round((S.i / QS.length) * 100);
  let h = `<div class="top"><span>Soru ${S.i + 1} / ${QS.length}</span><div class="bar"><i style="width:${pct}%"></i></div><span>${DATA.exam.name} · ${q.number}</span></div>`;
  h += `<div class="directive">${DIRECTIVE[q.type] || ""}</div>`;
  h += `<div class="card">${stemHTML(q)}</div>`;
  h += `<div class="tools">
    <button class="chip" id="tGloss" aria-pressed="${ui.gloss}">Parça parça çeviri</button>
    ${done ? "" : `<button class="chip" id="tWords" aria-pressed="${ui.words}">Kelimeler</button>`}
    ${done ? "" : `<button class="chip" id="tHint" aria-pressed="${ui.hint}">İpucu</button>`}
  </div>`;
  if (ui.words && !done) h += `<div class="wlist">${q.vocab.filter(v => v.warmup).map(v =>
    `<span class="w">${esc(v.word)}</span><span>${esc(v.tr)}</span>`).join("")}</div>`;
  if (ui.hint && !done) h += `<div class="hint">💡 ${esc(q.solution_steps[0])}</div>`;
  h += `<div class="options">` + q.options.map(o => {
    let cls = "";
    if (done) cls = o.key === q.answer ? "right" : o.key === a.choice ? "wrong" : "dim";
    else if (ui.sel === o.key) cls = "sel";
    const extra = done ? `<span class="tr">${esc(o.text_tr)}</span>${o.traps.length ? `<span>${trapChips(o.traps)}</span>` : ""}` : "";
    return `<button class="opt ${cls}" data-k="${o.key}" ${done ? "disabled" : ""}><span class="k">${o.key}</span><span class="t">${esc(o.text)}${extra}</span></button>`;
  }).join("") + `</div>`;
  if (done) h += feedbackHTML(q, a);
  $("app").innerHTML = h;

  $("tGloss").onclick = toggleGloss;
  if ($("tHint")) $("tHint").onclick = () => { ui.hint = !ui.hint; render(); };
  if ($("tWords")) $("tWords").onclick = () => { ui.words = !ui.words; render(); };
  document.querySelectorAll(".opt:not([disabled])").forEach(b => b.onclick = () => { ui.sel = b.dataset.k; render(); });

  const bar = $("bar");
  if (!done) {
    bar.innerHTML = `<div class="in"><button class="btn" id="bUnsure" ${ui.sel ? "" : "disabled"}>Emin değilim</button><button class="btn primary" id="bSure" ${ui.sel ? "" : "disabled"}>Eminim</button></div>`;
    $("bUnsure").onclick = () => submit(false);
    $("bSure").onclick = () => submit(true);
  } else {
    bar.innerHTML = `<div class="in"><button class="btn primary" id="bNext">${S.i + 1 < QS.length ? "Sonraki soru →" : "Sonuçları gör →"}</button></div>`;
    $("bNext").onclick = next;
  }
}

function feedbackHTML(q, a) {
  const ok = a.choice === q.answer;
  const chosen = q.options.find(o => o.key === a.choice);
  let h = `<div class="verdict ${ok ? "ok" : "warn"}">`;
  if (ok) {
    h += `<h3>✓ Doğru${a.sure ? "" : " — ve tahminin tuttu"}</h3><p>${esc(q.summary)}</p>`;
  } else {
    h += `<h3>${a.choice} şıkkı bir tuzaktı</h3><div>${trapChips(chosen.traps)}</div><p>${esc(chosen.explanation)}</p>`;
    h += `<p><b>Doğru cevap ${q.answer}.</b> ${esc(q.summary)}</p>`;
    if (a.sure) h += `<p class="note">“Eminim” deyip yanlış yaptığın sorular en kalıcı öğrenilenlerdir. Bu soru tekrar listesinde önce gelecek.</p>`;
  }
  h += `</div>`;
  h += `<div class="rule"><b>⭐ Altın kural:</b> ${esc(q.golden_rule)}</div>`;
  h += `<details><summary>Adım adım çözüm</summary><div><ol>${q.solution_steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
        <p class="note"><b>Yapı:</b> ${esc(q.structure)}</p></div></details>`;
  h += `<details><summary>Şıklar neden yanlış?</summary><div>${q.options.map(o =>
        `<div class="why"><b>${o.key})</b> ${o.key === q.answer ? "✅ " : trapChips(o.traps)} ${esc(o.explanation)}</div>`).join("")}</div></details>`;
  h += `<details><summary>Kelimeler (${q.vocab.length})</summary><div><div class="vocab">${q.vocab.map(v =>
        `<span class="w">${esc(v.word)}</span><span>${esc(v.tr)}${v.note ? ` <span class="tr">· ${esc(v.note)}</span>` : ""}</span>`).join("")}</div></div></details>`;
  return h;
}

function toggleGloss() {
  ui.gloss = !ui.gloss;
  const q = QS[S.i];
  if (ui.gloss && !S.answers[q.number]) { S.glossUsed[q.number] = true; save(); }
  render();
}

function renderWarm() {
  const w = ui.warm, n = w.items.length;
  if (w.idx >= n) {
    $("app").innerHTML = `<div class="center"><div style="font-size:40px">🔤</div><h2>Isınma bitti</h2>
      <p>${w.score} / ${n} kelimeyi bildin.</p>
      <p class="note">Bu kelimeler şimdi sorularda karşına çıkacak. Takılırsan “Kelimeler” düğmesine bas.</p></div>`;
    $("bar").innerHTML = `<div class="in"><button class="btn primary" id="bGo">Sorulara geç →</button></div>`;
    $("bGo").onclick = endWarm;
    return;
  }
  const it = w.items[w.idx], ans = it.picked !== null;
  let h = `<div class="top"><span>Kelime ısınması ${w.idx + 1} / ${n}</span><div class="bar"><i style="width:${Math.round(w.idx / n * 100)}%"></i></div></div>`;
  h += `<div class="center" style="padding:20px 8px 8px"><div class="wword">${esc(it.v.word)}</div>
        <div class="wctx">“…${esc(it.v.context || "")}…”</div></div>`;
  h += `<div class="options">` + it.choices.map((c, k) => {
    let cls = "";
    if (ans) cls = c === it.v.tr ? "right" : k === it.picked ? "wrong" : "dim";
    return `<button class="opt ${cls}" data-c="${k}" ${ans ? "disabled" : ""}><span class="k">${"ABCD"[k]}</span><span>${esc(c)}</span></button>`;
  }).join("") + `</div>`;
  h += `<div class="center" style="padding:12px"><button class="skip" id="bSkip">Isınmayı atla</button></div>`;
  $("app").innerHTML = h;
  document.querySelectorAll(".opt:not([disabled])").forEach(b => b.onclick = () => pickWarm(+b.dataset.c));
  $("bSkip").onclick = endWarm;
  $("bar").innerHTML = ans ? `<div class="in"><button class="btn primary" id="bWNext">Devam →</button></div>` : "";
  if (ans) $("bWNext").onclick = () => { w.idx++; render(); };
}

function pickWarm(k) {
  const w = ui.warm, it = w.items[w.idx];
  if (it.picked !== null) return;
  it.picked = k;
  const ok = it.choices[k] === it.v.tr;
  if (ok) w.score++;
  S.known[it.v.word] = ok ? (S.known[it.v.word] || 0) + 1 : 0;
  save(); render();
}

function endWarm() { S.warmDone[S.i] = true; ui.warm = null; save(); render(); }

function submit(sure) {
  if (!ui.sel) return;
  S.answers[QS[S.i].number] = { choice: ui.sel, sure };
  save(); render();
}

function next() {
  ui = freshUI();
  S.i++;
  if (S.i === BREAK_AFTER && !S.breakSeen && S.i < QS.length) { S.breakSeen = true; ui.onBreak = true; }
  save(); render();
}

function renderBreak() {
  const n = QS.slice(0, S.i).filter(q => S.answers[q.number]?.choice === q.answer).length;
  $("app").innerHTML = `<div class="center"><div style="font-size:40px">☕</div><h2>${S.i} soru bitti</h2>
    <p>${n} / ${S.i} doğru. Kısa bir mola dikkatini toplamana yardımcı olur.</p>
    <p class="note">Sayfayı kapatabilirsin, kaldığın yerden devam eder.</p></div>`;
  $("bar").innerHTML = `<div class="in"><button class="btn primary" id="bGo">Devam et</button></div>`;
  $("bGo").onclick = () => { ui.onBreak = false; render(); };
}

function renderEnd() {
  const res = QS.map(q => ({ q, a: S.answers[q.number] })).filter(r => r.a);
  const right = res.filter(r => r.a.choice === r.q.answer);
  const wrong = res.filter(r => r.a.choice !== r.q.answer);
  const sureWrong = wrong.filter(r => r.a.sure).length;
  const trapCount = {};
  wrong.forEach(r => r.q.options.find(o => o.key === r.a.choice).traps.forEach(t => trapCount[t] = (trapCount[t] || 0) + 1));
  const traps = Object.entries(trapCount).sort((a, b) => b[1] - a[1]);
  let h = `<div class="center"><div class="tr">Oturum özeti</div><div class="big">${right.length} / ${res.length}</div>
    <div class="tr">doğru</div></div>`;
  if (traps.length) h += `<div class="card"><b>Düştüğün tuzaklar</b><div style="margin-top:8px">${traps.map(([t, n]) => `<span class="trap">${t} · ${esc(TRAPS[t])} ×${n}</span>`).join("")}</div>
    ${traps[0] ? `<p class="note">En sık: <b>${esc(TRAPS[traps[0][0]])}</b>. Bir sonraki oturumda buna dikkat et.</p>` : ""}</div>`;
  if (wrong.length) h += `<h3 style="margin-top:24px">Bu oturumdan aklında kalsın</h3>` +
    wrong.map(r => `<div class="rule"><b>Soru ${r.q.number}:</b> ${esc(r.q.golden_rule)}</div>`).join("");
  if (sureWrong) h += `<p class="note">${sureWrong} soruda emin olduğun halde yanlış yaptın. Bunlar ilk tekrar edilecekler.</p>`;
  const glossN = Object.keys(S.glossUsed).length;
  h += `<p class="note">Çeviriyi ${glossN} / ${res.length} soruda açtın. Bu sayı zamanla düştükçe ilerlediğini göreceksin.</p>`;
  if (!wrong.length) h += `<p class="center">Hiç tuzağa düşmedin. Harika iş! 🎯</p>`;
  $("app").innerHTML = h;
  $("bar").innerHTML = `<div class="in"><button class="btn" id="bReview">Soruları gözden geçir</button><button class="btn primary" id="bRestart">Baştan başla</button></div>`;
  $("bRestart").onclick = () => { const known = S.known; S = fresh(); S.known = known; ui = freshUI(); save(); render(); };
  $("bReview").onclick = () => { S.i = 0; S.breakSeen = true; save(); render(); };
}

document.addEventListener("keydown", e => {
  if (e.target.closest("summary") || e.ctrlKey || e.metaKey || e.altKey) return;
  if (ui.onBreak) { if (e.key === "Enter") { ui.onBreak = false; render(); } return; }
  if (S.i >= QS.length) return;
  if (ui.warm) {
    const w = ui.warm, it = w.items[w.idx];
    if (!it) { if (e.key === "Enter") endWarm(); return; }
    const k = "ABCD".indexOf(e.key.toUpperCase());
    if (it.picked === null && k >= 0 && e.key.length === 1) pickWarm(k);
    else if (it.picked !== null && e.key === "Enter") { w.idx++; render(); }
    return;
  }
  const q = QS[S.i], done = !!S.answers[q.number];
  if (done) { if (e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); next(); } return; }
  const k = e.key.toUpperCase();
  if ("ABCDE".includes(k) && k.length === 1) { ui.sel = k; render(); }
  else if (e.key === "Enter" && ui.sel) { e.preventDefault(); submit(!e.shiftKey); }
  else if (k === "T") toggleGloss();
  else if (k === "K") { ui.words = !ui.words; render(); }
  else if (k === "I") { ui.hint = !ui.hint; render(); }
});

render();
</script>
</body>
</html>
"""


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    missing = [q["number"] for q in data["questions"] if "stem_chunks" not in q or "summary" not in q]
    if missing:
        sys.exit(f"stem_chunks/summary eksik: {missing}")
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    out = path.with_name(path.stem + ".pratik.html")
    out.write_text(TEMPLATE.replace("__DATA__", payload), encoding="utf-8")
    print(f"{len(data['questions'])} soru → {out}")


if __name__ == "__main__":
    main()
