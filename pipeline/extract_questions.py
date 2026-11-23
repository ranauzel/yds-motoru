"""ÖSYM YDS PDF'inden soru metni + şıkları yapay zekasız çıkarır (metin katmanı gerekir).

Kullanım:
  python pipeline/extract_questions.py data/raw/2019-yds-1.pdf --aralik 1-16 --anahtar data/raw/2019-yds-1-anahtar.txt

Çıktı (stdout, JSON): [{"number", "stem", "options": {"A".."E"}, "answer"}]. Doğru cevap anahtardan gelir.
Bulunamayan ya da şıkları eksik soru varsa hata verir (sessizce atlamaz). Analiz (çeviri, tuzak, adım) bu betiğin işi değil.
"""
import argparse
import json
import re
import sys

NOISE = [
    re.compile(r"^\d{4}-YDS/\d/English.*$"),
    re.compile(r"^Go on to the next page\.?$"),
    re.compile(r"^TEST OF ENGLISH$"),
    re.compile(r"^ENGLISH$"),  # sayfa altı başlığı
    re.compile(r"^\d{1,2}$"),  # sayfa numarası
    re.compile(r"^This test consists of \d+ questions\.?$"),
    re.compile(r"^\d+\s*-\s*\d+\s*:.*$"),  # bölüm yönergesi: "7-16: For these questions ..."
    re.compile(r"^\d+\.\s*-\s*\d+\.\s*sorularda.*$"),  # Türkçe yönerge (2016): "1. - 6. sorularda ..."
]
QUESTION_START = re.compile(r"(?m)^(\d{1,2})\.\s+")
OPTIONS = re.compile(r"\bA\)\s*(.*?)\s*\bB\)\s*(.*?)\s*\bC\)\s*(.*?)\s*\bD\)\s*(.*?)\s*\bE\)\s*(.*)$", re.S)


def horizontal_text(page, clip) -> str:
    """Yalnızca yatay satırlar: bazı PDF'lerdeki çapraz telif filigranı (eğik yazı) metne karışmasın.
    Bloklar arasına boş satır konur (şıklar boş satırla ayrılır)."""
    # Yatay satır parçaları (y, x, yükseklik, metin); aynı yükseklikteki parçalar soldan sağa tek satır olur.
    pieces = []
    for b in page.get_text("dict", clip=clip)["blocks"]:
        for line in b.get("lines", []):
            dx, dy = line["dir"]
            if abs(dy) > 0.01 or dx <= 0:
                continue
            text = "".join(s["text"] for s in line["spans"]).strip()
            if text:
                x0, y0, _, y1 = line["bbox"]
                pieces.append((y0, x0, y1 - y0, text))
    pieces.sort()
    rows: list[list] = []  # [y, yükseklik, [(x, metin)]]
    for y, x, h, text in pieces:
        if rows and abs(y - rows[-1][0]) < h * 0.5:
            rows[-1][2].append((x, text))
        else:
            rows.append([y, h, [(x, text)]])
    out = []
    prev_bottom = None
    for y, h, parts in rows:
        if prev_bottom is not None and y - prev_bottom > h * 0.6:
            out.append("")  # dikey boşluk: şıklar ve sorular boş satırla ayrılır
        out.append("   ".join(t for _, t in sorted(parts)))
        prev_bottom = y + h
    return "\n".join(out)


def pdf_text(path: str) -> str:
    """Her sayfa iki sütun: önce sol yarı, sonra sağ yarı okunur (sütunlar karışmasın)."""
    import fitz  # PyMuPDF

    parts = []
    with fitz.open(path) as doc:
        for page in doc:
            r = page.rect
            mid = r.x0 + r.width / 2
            for clip in (fitz.Rect(r.x0, r.y0, mid, r.y1), fitz.Rect(mid, r.y0, r.x1, r.y1)):
                parts.append(horizontal_text(page, clip))
    # Boşluk bazı yazı tiplerinde üç tire ("---") okunur: tek biçime getir.
    return re.sub(r"-{3,}", "----", "\n".join(parts))


def clean(text: str) -> str:
    lines = []
    for line in text.splitlines():
        s = line.strip()
        if not any(p.match(s) for p in NOISE):
            lines.append(s)
    return "\n".join(lines)


def squash(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def parse_questions(text: str, first: int, last: int) -> dict[int, dict]:
    """Metindeki [first, last] aralığındaki soruları numarasına göre döndürür. Sütunlar yüzünden sıra karışık olabilir."""
    text = clean(text)
    starts = [(m.start(), int(m.group(1)), m.end()) for m in QUESTION_START.finditer(text)]
    found: dict[int, dict] = {}
    for i, (_, n, body_start) in enumerate(starts):
        if not first <= n <= last or n in found:
            continue
        end = starts[i + 1][0] if i + 1 < len(starts) else len(text)
        block = text[body_start:end]
        a = re.search(r"\bA\)", block)
        if not a:
            continue  # "1990. " gibi yanlış eşleşme: şık yoksa soru değil
        m = OPTIONS.search(block[a.start():])
        if not m:
            raise ValueError(f"Soru {n}: şıklar okunamadı: {squash(block)[:200]}")
        groups = list(m.groups())
        groups[4] = re.split(r"\n\s*\n", groups[4].strip())[0]  # E şıkkı ilk boş satırda biter (ardı başka bölüm olabilir)
        opts = dict(zip("ABCDE", (squash(x) for x in groups)))
        if not all(opts.values()):
            raise ValueError(f"Soru {n}: boş şık var: {opts}")
        found[n] = {"number": n, "stem": squash(block[: a.start()]), "options": opts}
    missing = [n for n in range(first, last + 1) if n not in found]
    if missing:
        raise ValueError(f"Bulunamayan sorular: {missing}")
    return found


def read_key(path: str) -> dict[int, str]:
    key = {}
    for line in open(path, encoding="utf-8"):
        m = re.match(r"\s*(\d+)\s*:\s*([A-E])\s*$", line)
        if m:
            key[int(m.group(1))] = m.group(2)
    return key


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--aralik", required=True, help="ör. 1-16")
    ap.add_argument("--anahtar", required=True)
    a = ap.parse_args()
    first, last = map(int, a.aralik.split("-"))
    qs = parse_questions(pdf_text(a.pdf), first, last)
    key = read_key(a.anahtar)
    out = []
    for n in range(first, last + 1):
        if n not in key:
            print(f"Soru {n}: anahtarda yok (iptal?), atlandı", file=sys.stderr)
            continue
        out.append({**qs[n], "answer": key[n]})
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
