#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Generate the per-language landing pages from pages/landing.html.

The localized pages are not separate designs: they are landing.html with the
document language switched and every [data-i18n] element pre-filled with its
translation, so crawlers and the first paint both see real copy instead of
English. Regenerate after ANY edit to pages/landing.html.

    python scripts/build_landing_locales.py            # write the files
    python scripts/build_landing_locales.py --check     # verify only, exit 1 on drift

Run from the repository root.
"""
from __future__ import print_function
import io, json, os, re, sys

BASE_LANG = "en"

# dir + og:locale + the public BCP 47 tag written into <html lang> and hreflang.
# tk previously carried og:locale="en_US" and untranslated body copy — both
# are corrected here.
#
# The tag is spelled out because it is not always the file-name code: 'af' is
# the ISO 639-1 code for AFRIKAANS, a left-to-right Latin language, while these
# pages are Dari in Arabic script. Declaring lang="af" told screen readers and
# crawlers the wrong language and contradicted both dir="rtl" and the
# og:locale="fa_AF" already set below. assets/js/i18n.js maps the public tag
# back to the internal 'af' code when it picks the translation file.
LANGS = {
    "ar": ("rtl", "ar_AR", "ar"),
    "tr": ("ltr", "tr_TR", "tr"),
    "ru": ("ltr", "ru_RU", "ru"),
    "fa": ("rtl", "fa_IR", "fa"),
    "uz": ("ltr", "uz_UZ", "uz"),
    "af": ("rtl", "fa_AF", "fa-AF"),
    "tk": ("ltr", "tk_TM", "tk"),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = os.path.join(ROOT, "pages", "landing.html")
LANGDIR = os.path.join(ROOT, "assets", "lang")

# Element carrying data-i18n. The body is [^<]* on purpose: i18n.js assigns
# textContent, which would destroy child elements, so any element holding both
# a key and markup is a bug worth failing on rather than silently mangling.
EL = re.compile(
    r'(?P<open><(?P<tag>[a-zA-Z0-9]+)(?P<attrs>[^>]*?\sdata-i18n="(?P<key>[^"]+)"[^>]*?)>)'
    r'(?P<body>[^<]*)'
    r'(?P<close></(?P=tag)>)'
)
ANY_KEY = re.compile(r'\sdata-i18n="([^"]+)"')
ARIA_EL = re.compile(r'<(?P<tag>[a-zA-Z0-9]+)(?P<attrs>[^>]*?\sdata-i18n-aria="(?P<key>[^"]+)"[^>]*?)>')

# The FAQ rich-result block is rebuilt wholesale per language rather than
# patched, because its text lives inside JSON, not element content.
FAQ_BLOCK = re.compile(
    r'(?P<open><!-- FAQ-SCHEMA-START.*?-->\s*)'
    r'.*?'
    r'(?P<close>\s*<!-- FAQ-SCHEMA-END -->)',
    re.S,
)
FAQ_PAIRS = [("landing_page.faq.q%d" % i, "landing_page.faq.a%d" % i) for i in (1, 2, 3, 4)]

# <title> / meta description / the og + twitter pair that mirrors them. Leaving
# these in English across all eight pages meant eight URLs competing under one
# title, which undercuts the hreflang cluster they belong to.
META_TITLE_KEY = "landing_page.meta.title"
META_DESC_KEY = "landing_page.meta.description"
META_PATTERNS = [
    (r'<title>[^<]*</title>', '<title>%s</title>', META_TITLE_KEY),
    (r'<meta name="description" content="[^"]*">',
     '<meta name="description" content="%s">', META_DESC_KEY),
    (r'<meta property="og:title" content="[^"]*">',
     '<meta property="og:title" content="%s">', META_TITLE_KEY),
    (r'<meta property="og:description" content="[^"]*">',
     '<meta property="og:description" content="%s">', META_DESC_KEY),
    (r'<meta name="twitter:title" content="[^"]*">',
     '<meta name="twitter:title" content="%s">', META_TITLE_KEY),
    (r'<meta name="twitter:description" content="[^"]*">',
     '<meta name="twitter:description" content="%s">', META_DESC_KEY),
]


def attr_esc(text):
    """Escape for an HTML attribute value (quotes matter here, unlike esc())."""
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def lookup(tree, key):
    node = tree
    for part in key.split("."):
        if not isinstance(node, dict) or part not in node:
            return None
        node = node[part]
    return node if isinstance(node, str) else None


def esc(text):
    """Escape only what breaks element content. Quotes are left alone so the
    Arabic and Persian copy keeps its punctuation."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def sync_base(base_html, tree):
    """Fill the English page's own [data-i18n] bodies from en.json.

    landing.html is both the template and the English page. Its inline text was
    only a fallback, so it had drifted: eighteen elements still carried
    scaffolding copy ('Story 1', 'Client', 'Location', 'Step 1 description')
    that i18n.js only replaced at runtime. Crawlers and the first paint saw the
    placeholders, and swapping the longer real strings in afterwards reflowed
    the hero — the biggest layout shift left on the page.

    Structure stays owned by this file; copy stays owned by en.json. The
    rewrite is idempotent, so running the build repeatedly is a no-op.
    """
    changed = []

    def repl(m):
        value = lookup(tree, m.group("key"))
        if value is None or m.group("body") == esc(value):
            return m.group(0)
        changed.append(m.group("key"))
        return m.group("open") + esc(value) + m.group("close")

    return EL.sub(repl, base_html), changed


def build(base_html, lang, direction, og_locale, html_tag, tree):
    html = base_html
    problems = []

    # --- document language ---------------------------------------------
    old_root = '<html lang="%s" data-i18n-root="true" dir="ltr">' % BASE_LANG
    new_root = '<html lang="%s" data-i18n-root="true" dir="%s">' % (html_tag, direction)
    if html.count(old_root) != 1:
        problems.append("root <html> tag not found verbatim")
    html = html.replace(old_root, new_root, 1)

    # --- <title> / description / og / twitter ----------------------------
    for pattern, template, key in META_PATTERNS:
        value = lookup(tree, key)
        if value is None:
            problems.append("meta key absent: %s" % key)
            continue
        if not re.search(pattern, html):
            problems.append("meta pattern not found: %s" % pattern)
            continue
        html = re.sub(pattern, lambda m: template % attr_esc(value), html, count=1)

    # --- FAQ rich result --------------------------------------------------
    entries = []
    for qk, ak in FAQ_PAIRS:
        q, a = lookup(tree, qk), lookup(tree, ak)
        if q is None or a is None:
            problems.append("FAQ key absent: %s / %s" % (qk, ak))
            continue
        entries.append({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": {"@type": "Answer", "text": a},
        })
    if entries:
        payload = json.dumps(
            {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": entries},
            ensure_ascii=False, indent=2,
        )
        block = '<script type="application/ld+json">\n%s\n    </script>' % payload
        if not FAQ_BLOCK.search(html):
            problems.append("FAQ-SCHEMA markers not found")
        html = FAQ_BLOCK.sub(
            lambda m: m.group("open") + block + m.group("close"), html, count=1
        )

    # --- canonical / og:url / og:locale ---------------------------------
    for attr in ("rel=\"canonical\" href", "property=\"og:url\" content"):
        old = '%s="https://ikameti.com.tr/pages/landing.html"' % attr
        new = '%s="https://ikameti.com.tr/pages/landing.%s.html"' % (attr, lang)
        if old not in html:
            problems.append("missing %s" % attr)
        html = html.replace(old, new, 1)

    old_loc = '<meta property="og:locale" content="en_US">'
    new_loc = '<meta property="og:locale" content="%s">' % og_locale
    if old_loc not in html:
        problems.append("missing og:locale")
    html = html.replace(old_loc, new_loc, 1)

    # --- element text ----------------------------------------------------
    expected = len(ANY_KEY.findall(html))
    stats = {"done": 0, "missing": []}

    def repl(m):
        key = m.group("key")
        value = lookup(tree, key)
        if value is None:
            stats["missing"].append(key)
            return m.group(0)
        stats["done"] += 1
        return m.group("open") + esc(value) + m.group("close")

    html = EL.sub(repl, html)

    if stats["done"] != expected:
        problems.append(
            "translated %d of %d data-i18n elements — the rest hold child markup "
            "and would be wiped by i18n.js at runtime" % (stats["done"], expected)
        )
    if stats["missing"]:
        problems.append("keys absent from %s.json: %s" % (lang, sorted(set(stats["missing"]))))

    # --- aria-label -------------------------------------------------------
    def repl_aria(m):
        value = lookup(tree, m.group("key"))
        if value is None:
            problems.append("aria key missing: %s" % m.group("key"))
            return m.group(0)
        attrs = m.group("attrs")
        if 'aria-label="' in attrs:
            attrs = re.sub(r'aria-label="[^"]*"', 'aria-label="%s"' % value.replace('"', "&quot;"), attrs)
        else:
            attrs += ' aria-label="%s"' % value.replace('"', "&quot;")
        return "<%s%s>" % (m.group("tag"), attrs)

    html = ARIA_EL.sub(repl_aria, html)
    return html, problems


def main():
    check = "--check" in sys.argv
    if not os.path.exists(BASE):
        sys.exit("missing %s" % BASE)
    base_html = io.open(BASE, encoding="utf-8").read()

    failures = 0

    # --- keep the English page in step with en.json before fanning out -------
    en_file = os.path.join(LANGDIR, "%s.json" % BASE_LANG)
    if not os.path.exists(en_file):
        sys.exit("missing %s" % en_file)
    en_tree = json.load(io.open(en_file, encoding="utf-8"))
    synced, changed = sync_base(base_html, en_tree)
    if changed:
        if check:
            failures += 1
            print("  %-3s STALE  %d element(s) disagree with en.json: %s"
                  % (BASE_LANG, len(changed), sorted(set(changed))[:6]))
        else:
            with io.open(BASE, "w", encoding="utf-8", newline="") as f:
                f.write(synced)
            print("  %-3s synced pages/landing.html from en.json (%d element(s))"
                  % (BASE_LANG, len(changed)))
            base_html = synced
    else:
        print("  %-3s pages/landing.html already matches en.json" % BASE_LANG)
    for lang in sorted(LANGS):
        direction, og_locale, html_tag = LANGS[lang]
        lang_file = os.path.join(LANGDIR, "%s.json" % lang)
        if not os.path.exists(lang_file):
            print("  %-3s SKIP  no %s.json" % (lang, lang)); failures += 1; continue
        tree = json.load(io.open(lang_file, encoding="utf-8"))

        html, problems = build(base_html, lang, direction, og_locale, html_tag, tree)
        out = os.path.join(ROOT, "pages", "landing.%s.html" % lang)

        if problems:
            failures += 1
            print("  %-3s FAIL" % lang)
            for p in problems:
                print("        - %s" % p)
            continue

        if check:
            current = io.open(out, encoding="utf-8").read() if os.path.exists(out) else None
            state = "up to date" if current == html else "STALE"
            if current != html:
                failures += 1
            print("  %-3s %s" % (lang, state))
        else:
            with io.open(out, "w", encoding="utf-8", newline="") as f:
                f.write(html)
            print("  %-3s wrote pages/landing.%s.html  (%d KB)" % (lang, lang, len(html.encode("utf-8")) // 1024))

    if failures:
        print("\n%d locale(s) need attention" % failures)
        sys.exit(1)
    print("\nall %d locales OK" % len(LANGS))


if __name__ == "__main__":
    main()
