"""Applique un thème visuel à l'index.html de Cadeaux en famille.

Usage : python3 themes/appliquer-theme.py <theme> <index.html> [sortie.html]
Thèmes : pastel, kraft, nuit, scandinave

Seule l'apparence change (couleurs, polices, arrondis) : le code de
l'application, Firebase et les données ne sont pas touchés. Le fichier doit
être la version d'origine (thème vert), pas une version déjà retouchée.
"""
import sys

COMMON = """
.btn,.btn.small{border-radius:var(--r-btn)}
.field input,.field select,.field textarea{border-radius:var(--r-field)!important}
.tab svg{padding:3px 14px;box-sizing:content-box}
.tab[aria-current="page"] svg{background:var(--ribbon-soft);border-radius:999px}
.kid .avatar{background:var(--kid-soft);color:var(--kid)}
.brand{color:var(--brand)}
.sec-head h2,.person-head h2,.sheet h2,.draw h3,.empty h3,.welcome h2{color:var(--heading)}
"""

THEMES = {
    "pastel": {
        "name": "Pastel joyeux",
        "about": "fond pêche, prune pour les actions, rose framboise pour Noël, miel pour les prix, menthe pour les enfants",
        "theme_color": "#FFF6EF",
        "fonts": "family=Baloo+2:wght@500;600;700;800&family=Caveat:wght@600",
        "tokens": """
  --bg:#FFF6EF; --surface:#FFFFFF; --ink:#3B2A3F; --muted:#7A6680; --line:#F1DED2;
  --ribbon:#C9375F; --ribbon-soft:#FFDDE4; --gold:#8F6200; --gold-soft:#FFF0C2;
  --pine:#5B2D6B; --pine-soft:#EDE0FF; --on-accent:#FFFFFF;
  --kid:#1F7A4F; --kid-soft:#D9F4E6; --brand:#5B2D6B; --heading:#5B2D6B;
  --f-display:"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --f-body:"Baloo 2", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-hand:"Caveat", "Segoe Print", "Bradley Hand", cursive;
  --r:22px; --r-btn:999px; --r-field:14px;""",
        "extra": """
body{font-size:17px;line-height:1.4}
.brand{font-size:1.95rem;font-weight:800;line-height:1}
.brand small{font-weight:600}
.sec-head h2,.person-head h2,.sheet h2,.draw h3,.empty h3,.welcome h2{font-weight:800}
.house,.wish,.draw,.date-row,.stats div,.fiche,.welcome,.hist{border-width:2px}
.avatar{font-weight:700}
.field input,.field select,.field textarea{border-width:2px!important}
.seg,.auth-tabs{border-radius:999px;border-width:2px}
.auth-tab{border-radius:999px}
.sheet{border-radius:28px 28px 0 0}
.bubble{border-width:2px;border-radius:20px 20px 20px 6px}
.msg.mine .bubble{border-radius:20px 20px 6px 20px}
.msg.cont .bubble{border-radius:20px}
.composer textarea{border-width:2px;border-radius:24px}
.toast{border-radius:999px}""",
    },
    "kraft": {
        "name": "Papier kraft",
        "about": "papier kraft et papier blanc comme un paquet cadeau, encre bleu marine, tampon rouge",
        "theme_color": "#E8D9C0",
        "fonts": "family=Zilla+Slab:wght@500;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&family=Caveat:wght@600",
        "tokens": """
  --bg:#E8D9C0; --surface:#FBF6EC; --ink:#26303F; --muted:#665C4C; --line:#D3BF9E;
  --ribbon:#B3392C; --ribbon-soft:#F4D9CF; --gold:#7A570E; --gold-soft:#F2E3BE;
  --pine:#2F4A6D; --pine-soft:#DCE4EE; --on-accent:#FFFFFF;
  --kid:#3D6A38; --kid-soft:#DFEBD6; --brand:#26303F; --heading:#26303F;
  --f-display:"Zilla Slab", "Rockwell", Georgia, serif;
  --f-body:"Nunito Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-hand:"Caveat", "Segoe Print", "Bradley Hand", cursive;
  --r:6px; --r-btn:6px; --r-field:6px;""",
        "extra": """
.brand{font-size:1.9rem;font-weight:700;line-height:1.05}
.brand small{color:var(--ribbon);font-weight:700}
.sec-head h2,.person-head h2,.sheet h2,.draw h3,.empty h3,.welcome h2{font-weight:700}
.house,.wish,.draw,.date-row,.stats div,.fiche,.welcome,.hist{box-shadow:0 2px 0 var(--line)}
.house{border-top:3px solid var(--ribbon)}
.avatar{border-radius:6px;font-weight:700}
.chip{border-radius:4px;border:1.5px dashed currentColor;background:transparent!important}
.me-btn{border-radius:6px}
.tab[aria-current="page"] svg{border-radius:6px}""",
    },
    "nuit": {
        "name": "Nuit étoilée",
        "about": "bleu nuit, or des étoiles et rose aurore, pour une ambiance de veillée de Noël",
        "theme_color": "#0F1530",
        "dark": True,
        "fonts": "family=Marcellus&family=Nunito:wght@400;600;700;800&family=Caveat:wght@600",
        "tokens": """
  --bg:#0F1530; --surface:#18204A; --ink:#EEF0FA; --muted:#A6ADCE; --line:#2B3568;
  --ribbon:#FF8197; --ribbon-soft:#3B2149; --gold:#F2C14E; --gold-soft:#3A3320;
  --pine:#9DBBFF; --pine-soft:#24315F; --on-accent:#0F1530;
  --kid:#7FE0C0; --kid-soft:#173F3C; --brand:#F2C14E; --heading:#F7E7B9;
  --f-display:"Marcellus", "Trajan Pro", Georgia, serif;
  --f-body:"Nunito", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-hand:"Caveat", "Segoe Print", "Bradley Hand", cursive;
  --r:16px; --r-btn:12px; --r-field:12px;""",
        "extra": """
body{background:radial-gradient(120% 60% at 85% -10%, #26357A 0%, transparent 60%) fixed, var(--bg)}
.brand{font-size:1.85rem;letter-spacing:.02em}
.brand small{color:var(--muted)}
.house,.wish,.draw,.date-row,.stats div,.fiche,.welcome,.hist{background:rgba(24,32,74,.82)}
.tabs{background:#121A3D}""",
    },
    "scandinave": {
        "name": "Scandinave",
        "about": "blanc cassé, noir franc et une seule touche de rouge, formes nettes et beaucoup d'air",
        "theme_color": "#F7F5F2",
        "fonts": "family=Outfit:wght@400;500;600;700&family=Caveat:wght@600",
        "tokens": """
  --bg:#F7F5F2; --surface:#FFFFFF; --ink:#141414; --muted:#6B6762; --line:#E3DFD9;
  --ribbon:#D2402A; --ribbon-soft:#FBE4DE; --gold:#7E6127; --gold-soft:#F1EADB;
  --pine:#141414; --pine-soft:#ECEAE6; --on-accent:#FFFFFF;
  --kid:#2B6B5A; --kid-soft:#E0EEE9; --brand:#141414; --heading:#141414;
  --f-display:"Outfit", system-ui, sans-serif;
  --f-body:"Outfit", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-hand:"Caveat", "Segoe Print", "Bradley Hand", cursive;
  --r:4px; --r-btn:4px; --r-field:4px;""",
        "extra": """
.brand{font-size:2rem;font-weight:700;letter-spacing:-.035em;line-height:1}
.brand small{letter-spacing:.14em}
.sec-head h2,.person-head h2,.sheet h2,.draw h3,.empty h3,.welcome h2{font-weight:600;letter-spacing:-.02em}
.house,.wish,.draw,.date-row,.stats div,.fiche,.welcome,.hist{border-color:var(--line);box-shadow:none}
.avatar{border-radius:4px;font-weight:600}
.chip,.me-btn{border-radius:4px}
.tab[aria-current="page"] svg{background:transparent;border-bottom:2px solid var(--ribbon);border-radius:0}""",
    },
}


def apply(theme_key, s):
    t = THEMES[theme_key]
    if "/* Thème « " in s:
        sys.exit("Un thème est déjà appliqué : repartez de la version d'origine.")

    def replace(old, new):
        nonlocal s
        if s.count(old) != 1:
            sys.exit(f"Repère introuvable ou ambigu : {old[:60]!r}")
        s = s.replace(old, new)

    replace('<meta name="theme-color" content="#2D5A4D">', f'<meta name="theme-color" content="{t["theme_color"]}">')
    replace("family=Young+Serif&family=Figtree:wght@400;500;600;700&family=Caveat:wght@600", t["fonts"])
    scheme = "dark" if t.get("dark") else "light"
    replace("html{color-scheme:light}", f"html{{color-scheme:{scheme}}}")

    start = s.index("/* Layout : une colonne")
    end = s.index("*{box-sizing:border-box}")
    s = s[:start] + (
        "/* Layout : une colonne étroite façon carnet, barre d'onglets en bas (usage téléphone), étiquette cadeau pour le tirage */\n"
        f"/* Thème « {t['name']} » : {t['about']}. Identique quel que soit le réglage clair/sombre du téléphone. */\n"
        ":root{" + t["tokens"] + f"\n  color-scheme:{scheme};\n}}\n\n"
    ) + s[end:]

    overrides = f"/* ---- {t['name']} : ajustements ---- */" + COMMON + t["extra"].lstrip("\n") + "\n"
    head_end = s.index("</head>")
    last_style = s.rindex("</style>", 0, head_end)
    return s[:last_style] + overrides + s[last_style:]


if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] not in THEMES:
        sys.exit(__doc__)
    key, src = sys.argv[1], sys.argv[2]
    dst = sys.argv[3] if len(sys.argv) > 3 else src
    out = apply(key, open(src, encoding="utf-8").read())
    open(dst, "w", encoding="utf-8").write(out)
    print(f"Thème {THEMES[key]['name']} appliqué : {dst}")
