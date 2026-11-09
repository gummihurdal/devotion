#!/usr/bin/env python3
"""Grace for Every Day -- find the visible English text in the static HTML of every page, give each string a key, and
(in --patch mode) mark its element with data-i18n (plain text) or data-i18n-html (text with inline tags), so i18n.js
can swap it for the chosen language. Writes i18n/ui-strings.en.json: { page: { key: english } }.

    python3 -I i18n/extract_ui.py            # report only
    python3 -I i18n/extract_ui.py --patch    # rewrite the pages in place (offset-based: nothing else is touched)

Skipped: <script>, <style>, <svg>, <noscript>, elements already carrying data-i18n*, whitespace, strings without
letters, the brand names. <title> becomes the key "title"; placeholder= attributes become data-i18n-ph."""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index", "devotion", "learn", "topics", "calendar", "archive", "well", "blog", "contact", "settings", "sermons",
         "music", "ip", "privacy", "onboarding"]
SKIP_TAGS = {"script", "style", "svg", "noscript", "head", "title", "meta", "link"}
INLINE = {"a", "strong", "em", "b", "i", "span", "br", "u", "small", "sup", "sub", "code"}
BRAND = {"Grace", "Grace for Every Day", "Journey with God", "Blog", "OK", "✕", "✎", "→", "←", "…", "—", "·"}
PATCH = "--patch" in sys.argv


def has_letters(s: str) -> bool:
    return re.search(r"[A-Za-z]{2,}", s) is not None


class P(HTMLParser):
    def __init__(self, html: str):
        super().__init__(convert_charrefs=False)
        self.html = html
        self.lines = [0]
        for m in re.finditer("\n", html):
            self.lines.append(m.end())
        self.stack = []            # frames: dict(tag, start, start_end, keyed, children, mixed, texts)
        self.found = []            # (kind, start, end, text, frame)  kind: text | html | ph | title
        self.skip = 0
        self.in_title = False

    def off(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        raw = self.get_starttag_text() or ""
        start = self.off()
        a = dict(attrs)
        if tag in SKIP_TAGS and tag != "title":
            if tag not in ("meta", "link", "br"):
                self.skip += 1
            return
        if tag == "title":
            self.in_title = True
            self.title_start = start + len(raw)
            return
        if self.skip:
            return
        if tag not in ("br", "img", "input", "hr", "meta", "link", "source"):
            for fr in self.stack:
                fr["children"] += 1
                if tag not in INLINE:
                    fr["mixed_block"] = True
            self.stack.append({"tag": tag, "start": start, "start_end": start + len(raw),
                               "keyed": any(k.startswith("data-i18n") for k, _ in attrs), "children": 0,
                               "mixed_block": False, "texts": [], "inline_children": 0})
        else:
            for fr in self.stack:
                fr["children"] += 1
                if tag == "br":
                    fr["inline_children"] += 1
                else:
                    fr["mixed_block"] = True
        if tag in ("input", "textarea") and a.get("placeholder") and has_letters(a["placeholder"]) \
                and not any(k == "data-i18n-ph" for k, _ in attrs):
            m = re.search(r'placeholder="([^"]*)"', raw)
            if m:
                self.found.append(("ph", start, start + len(raw), m.group(1), {"start": start, "tag": tag}))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
            end = self.off()
            text = self.html[self.title_start:end]
            if has_letters(text):
                self.found.append(("title", self.title_start, end, text.strip(), None))
            return
        if tag in SKIP_TAGS:
            if tag not in ("meta", "link", "br"):
                self.skip = max(0, self.skip - 1)
            return
        if self.skip or not self.stack:
            return
        # pop to the matching frame
        idx = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                idx = i
                break
        if idx is None:
            return
        fr = self.stack[idx]
        del self.stack[idx:]
        end = self.off()
        inner = self.html[fr["start_end"]:end]
        if fr["keyed"] or not has_letters(inner):
            return
        if fr["children"] == 0 and fr["texts"]:
            text = inner
            if text.strip() and has_letters(text) and text.strip() not in BRAND:
                self.found.append(("text", fr["start_end"], end, text, fr))
        elif fr["children"] > 0 and not fr["mixed_block"] and fr["texts"] and "<" in inner and len(inner) < 1200:
            if inner.strip() not in BRAND and not re.search(r"<(a|span)[^>]*data-i18n", inner):
                self.found.append(("html", fr["start_end"], end, inner, fr))
                fr["taken"] = True

    def handle_data(self, data):
        if self.in_title or self.skip or not self.stack:
            return
        if data.strip():
            self.stack[-1]["texts"].append(data)
            for fr in self.stack[:-1]:
                pass

    def handle_entityref(self, name):
        self.handle_data("&" + name + ";")

    def handle_charref(self, name):
        self.handle_data("&#" + name + ";")


def slug(s: str, n: int) -> str:
    w = re.sub(r"<[^>]+>", " ", s)
    w = re.sub(r"&[a-z#0-9]+;", " ", w)
    w = re.findall(r"[A-Za-z]+", w)[:4]
    return ("_".join(x.lower() for x in w) or "s") + f"_{n}"


out = {}
for page in PAGES:
    path = ROOT / f"{page}.html"
    html = path.read_text()
    p = P(html)
    p.feed(html)
    # drop nested text finds inside an element taken as html
    taken = [(s, e) for k, s, e, t, fr in p.found if k == "html"]
    finds = []
    for k, s, e, t, fr in p.found:
        if k == "text" and any(ts <= s and e <= te for ts, te in taken if not (ts == s and te == e)):
            continue
        finds.append((k, s, e, t, fr))
    finds.sort(key=lambda x: x[1])
    strings = {}
    edits = []                      # (offset, insert_text)
    seen = set()
    for n, (k, s, e, t, fr) in enumerate(finds, 1):
        text = t.strip() if k != "ph" else t
        if (k, s) in seen:
            continue
        seen.add((k, s))
        key = "title" if k == "title" else slug(text, n)
        strings[key] = re.sub(r"\s+", " ", text) if k != "html" else re.sub(r"\s+", " ", text)
        if k == "text":
            edits.append((fr["start"] + 1 + len(fr["tag"]), f' data-i18n="{key}"'))
        elif k == "html":
            edits.append((fr["start"] + 1 + len(fr["tag"]), f' data-i18n-html="{key}"'))
        elif k == "ph":
            edits.append((fr["start"] + 1 + len(fr["tag"]), f' data-i18n-ph="{key}"'))
    out[page] = strings
    words = sum(len(re.sub(r"<[^>]+>", " ", v).split()) for v in strings.values())
    print(f"{page}: {len(strings)} strings, {words} words")
    if PATCH and edits:
        for offset, ins in sorted(edits, key=lambda x: -x[0]):
            html = html[:offset] + ins + html[offset:]
        path.write_text(html)

(ROOT / "i18n" / "ui-strings.en.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print("written i18n/ui-strings.en.json", "(pages patched)" if PATCH else "(report only)")
