"""Applique le thème « Pastel joyeux » à l'index.html de Cadeaux en famille.

Usage : python3 themes/appliquer-pastel.py cadeaux-netlify/index.html

Ne change que l'apparence (couleurs, polices, arrondis) : le code de
l'application, Firebase et les données ne sont pas touchés.
"""
import sys

path = sys.argv[1]
s = open(path, encoding="utf-8").read()
if "Pastel joyeux" in s:
    sys.exit("Le thème Pastel est déjà appliqué.")


def replace(old, new):
    global s
    if s.count(old) != 1:
        sys.exit(f"Repère introuvable ou ambigu : {old[:60]!r}")
    s = s.replace(old, new)


replace('<meta name="theme-color" content="#2D5A4D">', '<meta name="theme-color" content="#FFF6EF">')
replace("family=Young+Serif&family=Figtree:wght@400;500;600;700&family=Caveat:wght@600",
        "family=Baloo+2:wght@500;600;700;800&family=Caveat:wght@600")

start = s.index("/* Layout : une colonne")
end = s.index("*{box-sizing:border-box}")
s = s[:start] + """/* Layout : une colonne étroite façon carnet, barre d'onglets en bas (usage téléphone), étiquette cadeau pour le tirage */
/* Thème « Pastel joyeux » : fond pêche, prune pour les actions, rose framboise pour Noël et « toi »,
   miel pour les prix et cagnottes, menthe pour les enfants. Toujours clair, quel que soit le réglage du téléphone. */
:root{
  --bg:#FFF6EF; --surface:#FFFFFF; --ink:#3B2A3F; --muted:#7A6680; --line:#F1DED2;
  --ribbon:#C9375F; --ribbon-soft:#FFDDE4; --gold:#8F6200; --gold-soft:#FFF0C2;
  --pine:#5B2D6B; --pine-soft:#EDE0FF; --on-accent:#FFFFFF;
  --mint:#1F7A4F; --mint-soft:#D9F4E6;
  --f-display:"Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif;
  --f-body:"Baloo 2", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-hand:"Caveat", "Segoe Print", "Bradley Hand", cursive;
  --r:22px;
}

""" + s[end:]

overrides = """
/* ---- Pastel joyeux : formes arrondies et titres ronds ---- */
body{font-size:17px;line-height:1.4}
.brand{font-size:1.95rem;font-weight:800;color:var(--pine);line-height:1}
.brand small{font-weight:600}
.sec-head h2,.person-head h2,.sheet h2,.draw h3,.empty h3,.welcome h2{font-weight:800;color:var(--pine)}
.house,.wish,.draw,.date-row,.stats div,.fiche,.welcome,.hist{border-width:2px}
.avatar{font-weight:700}
.kid .avatar{background:var(--mint-soft);color:var(--mint)}
.btn,.btn.small{border-radius:999px}
.field input,.field select,.field textarea{border-radius:14px!important;border-width:2px!important}
.seg,.auth-tabs{border-radius:999px;border-width:2px}
.auth-tab{border-radius:999px}
.sheet{border-radius:28px 28px 0 0}
.tab svg{padding:3px 14px;box-sizing:content-box}
.tab[aria-current="page"] svg{background:var(--ribbon-soft);border-radius:999px}
.bubble{border-width:2px;border-radius:20px 20px 20px 6px}
.msg.mine .bubble{border-radius:20px 20px 6px 20px}
.msg.cont .bubble{border-radius:20px}
.composer textarea{border-width:2px;border-radius:24px}
.toast{border-radius:999px}
</style>"""
# Le dernier bloc <style> de l'en-tête reçoit les ajustements du thème.
head_end = s.index("</head>")
last_style = s.rindex("</style>", 0, head_end)
s = s[:last_style] + overrides.lstrip("\n").replace("</style>", "") + "</style>" + s[last_style + len("</style>"):]

open(path, "w", encoding="utf-8").write(s)
print("Thème Pastel appliqué à", path)
