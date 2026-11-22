"""İçerik JSON'unu doğrular ve insan incelemesi için Markdown sayfası üretir.

Kullanım: python pipeline/render_review.py content/sorular/2021-yds-1/cumle-tamamlama.json
"""
import json
import sys
from pathlib import Path

TRAPS = {
    "T1": "Kelime tekrarı", "T2": "Zaman uyumsuzluğu", "T3": "Bağlaç yönü",
    "T4": "Kapsam kayması", "T5": "Gerçek ama alakasız", "T6": "Zamir uyumsuzluğu",
    "T7": "Neden-sonuç ters", "T8": "Özne kayması", "T9": "Olumsuzluk",
    "T10": "Konu doğru, odak yanlış", "T11": "Yapısal uyumsuzluk", "T12": "Eşdizim / edat",
    "T13": "Görüş sahibi karışıklığı", "T14": "Aşırı dar / geniş", "T15": "Benzer görünen kelime",
}


def validate(q: dict) -> list[str]:
    errors = []
    keys = [o["key"] for o in q["options"]]
    if keys != ["A", "B", "C", "D", "E"]:
        errors.append(f"şıklar A–E değil: {keys}")
    correct = [o for o in q["options"] if o["key"] == q["answer"]]
    if len(correct) != 1:
        errors.append("cevap anahtarı bir şıkla eşleşmiyor")
    for o in q["options"]:
        unknown = [t for t in o["traps"] if t not in TRAPS]
        if unknown:
            errors.append(f"{o['key']}: bilinmeyen tuzak kodu {unknown}")
        if o["key"] == q["answer"] and o["traps"]:
            errors.append(f"{o['key']}: doğru şıkta tuzak kodu olmamalı")
        if o["key"] != q["answer"] and not o["traps"]:
            errors.append(f"{o['key']}: yanlış şıkta en az bir tuzak kodu olmalı")
    return errors


def render(data: dict) -> str:
    exam = data["exam"]
    out = [f"# İnceleme: {exam['name']} — {data['questions'][0]['type'].replace('_', ' ')}\n"]
    trap_counts: dict[str, int] = {}
    for q in data["questions"]:
        for o in q["options"]:
            for t in o["traps"]:
                trap_counts[t] = trap_counts.get(t, 0) + 1
    summary = ", ".join(f"{t} {TRAPS[t]} ×{n}" for t, n in sorted(trap_counts.items(), key=lambda x: -x[1]))
    out.append(f"> {len(data['questions'])} soru · Tuzak dağılımı: {summary}\n")

    for q in data["questions"]:
        out.append(f"\n---\n\n## Soru {q['number']} · {q['sub_topic']}\n")
        out.append(f"**{q['stem']}**\n")
        out.append(f"<details><summary>Türkçesi</summary>\n\n{q['stem_tr']}\n\n</details>\n")
        for o in q["options"]:
            mark = "✅" if o["key"] == q["answer"] else "  "
            out.append(f"- {mark} **{o['key']})** {o['text']}")
        out.append("\n### Çözüm adımları\n")
        out.extend(f"{i}. {s}" for i, s in enumerate(q["solution_steps"], 1))
        out.append("\n### Şıklar\n")
        out.append("| Şık | Türkçesi | Tuzak | Neden |\n|---|---|---|---|")
        for o in q["options"]:
            traps = " ".join(f"`{t}` {TRAPS[t]}" for t in o["traps"]) or "✅ doğru"
            out.append(f"| {o['key']} | {o['text_tr']} | {traps} | {o['explanation']} |")
        out.append(f"\n**Yapı:** {q['structure']}\n")
        out.append(f"**⭐ Altın kural:** {q['golden_rule']}\n")
        out.append("**Kelimeler:** " + " · ".join(
            f"*{v['word']}* = {v['tr']}" for v in q["vocab"]) + "\n")
    return "\n".join(out) + "\n"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    problems = {q["number"]: validate(q) for q in data["questions"]}
    problems = {n: e for n, e in problems.items() if e}
    if problems:
        for n, errs in problems.items():
            print(f"Soru {n}: " + "; ".join(errs))
        sys.exit(1)
    out = path.with_name(path.stem + ".inceleme.md")
    out.write_text(render(data), encoding="utf-8")
    print(f"{len(data['questions'])} soru doğrulandı → {out}")


if __name__ == "__main__":
    main()
