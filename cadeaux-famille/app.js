import { createStore, isShared } from "./storage.js";
import { drawPairs } from "./draw.js";
import { upcomingEvents, formatCountdown } from "./events.js";

const EMOJIS = ["🎅", "🤶", "🧑", "👩", "👨", "👧", "👦", "👶", "👵", "👴", "🐱", "🐶", "🦊", "🐻", "🦄", "⭐"];
const PRIORITIES = { 3: "Très envie", 2: "Envie", 1: "Si possible" };
const LS = {
  me: "cadeaux-famille:me",
  family: "cadeaux-famille:code",
  tab: "cadeaux-famille:tab",
};

const app = document.getElementById("app");
const tabs = document.getElementById("tabs");
const dialog = document.getElementById("dialog");
const meButton = document.getElementById("me-button");

let store;
let state = { members: [], wishes: [], draw: null };
const ui = {
  tab: readLocal(LS.tab) || "mine",
  viewing: null, // id du membre dont on consulte la liste dans l'onglet Famille
};

// ---------- utilitaires ----------

function readLocal(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLocal(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* stockage indisponible : on continue sans mémoriser */ }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
function formatPrice(price) {
  return typeof price === "number" && !Number.isNaN(price) ? euros.format(price) : "";
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; }, 2600);
}

async function run(action, success) {
  try {
    await action();
    if (success) toast(success);
  } catch (error) {
    console.error(error);
    toast("Oups, l'opération a échoué. Vérifiez la connexion.");
  }
}

function member(id) {
  return state.members.find((m) => m.id === id);
}
function memberLabel(id) {
  const m = member(id);
  return m ? `${m.emoji} ${esc(m.name)}` : "Quelqu'un";
}
function me() {
  return member(readLocal(LS.me));
}
// La personne concernée ne voit ni les idées suggérées par les autres, ni
// celles qu'elle a retirées. Les autres voient les suggestions, pas les retraits.
function wishesOf(ownerId, { forOwner = false } = {}) {
  return state.wishes
    .filter((w) => w.ownerId === ownerId && !w.removed && !(forOwner && w.suggestedBy))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.createdAt || 0) - (b.createdAt || 0));
}

// ---------- rendu ----------

function render() {
  const current = me();
  const ready = state.members.length > 0 && current;

  tabs.hidden = !ready;
  meButton.hidden = !ready;
  if (current) meButton.textContent = `${current.emoji} ${current.name}`;
  tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.tab === ui.tab));

  if (state.members.length === 0) return renderWelcome();
  if (!current) return renderWhoAmI();

  ({ mine: renderMine, family: renderFamily, gifts: renderGifts, draw: renderDraw }[ui.tab] || renderMine)(current);
}

function renderWelcome() {
  app.innerHTML = `
    <section class="card hero">
      <h2>Bienvenue !</h2>
      <p>Chacun crée sa liste d'envies, les autres réservent en secret ce qu'ils vont offrir :
      plus de doublons, et la surprise reste entière.</p>
      <p>Commencez par ajouter les membres de la famille.</p>
      <form id="welcome-form" class="stack">
        <label>Votre prénom <input name="name" required maxlength="40" autocomplete="given-name"></label>
        <button class="primary">Créer la famille</button>
      </form>
      ${isShared() ? `<p class="muted small">Code famille : <strong>${esc(readLocal(LS.family))}</strong></p>` : ""}
    </section>`;
  app.querySelector("#welcome-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = new FormData(event.target).get("name").trim();
    if (!name) return;
    run(async () => {
      const id = await store.add("members", { name, emoji: EMOJIS[0] });
      writeLocal(LS.me, id);
      render();
      openMembersDialog();
    });
  });
}

function renderWhoAmI() {
  app.innerHTML = `
    <section class="card">
      <h2>Qui êtes-vous ?</h2>
      <p class="muted">Choisissez votre profil sur cet appareil.</p>
      <div class="grid">
        ${state.members.map((m) => `
          <button class="member-tile" data-pick="${m.id}">
            <span class="emoji">${m.emoji}</span><span>${esc(m.name)}</span>
          </button>`).join("")}
      </div>
      <button class="link" data-action="members">+ Ajouter un membre</button>
    </section>`;
}

function wishCard(wish, { owner }) {
  const url = safeUrl(wish.url);
  const meId = me().id;
  let actions = "";
  let status = "";

  const editable = owner || wish.suggestedBy === meId;
  const editButtons = `
      <button class="ghost" data-edit-wish="${wish.id}">Modifier</button>
      <button class="ghost danger" data-delete-wish="${wish.id}">Supprimer</button>`;
  const suggestion = !owner && wish.suggestedBy
    ? `<span class="badge idea">💡 Idée de ${wish.suggestedBy === meId ? "vous" : memberLabel(wish.suggestedBy)}</span>` : "";

  if (owner) {
    actions = editButtons;
  } else if (wish.removed) {
    status = `<span class="badge warn">⚠️ ${esc(member(wish.ownerId)?.name || "La personne")} l'a retirée de sa liste</span>`;
    actions = `<button class="ghost danger" data-delete-wish="${wish.id}">Retirer de mes cadeaux</button>`;
  } else if (!wish.reservedBy) {
    actions = `<button class="primary" data-reserve="${wish.id}">🎁 Je l'offre</button>${editable ? editButtons : ""}`;
  } else if (wish.reservedBy === meId) {
    status = `<span class="badge mine">${wish.bought ? "✅ Acheté par vous" : "🔒 Réservé par vous"}</span>`;
    actions = `
      <button class="ghost" data-bought="${wish.id}">${wish.bought ? "Pas encore acheté" : "Marquer acheté"}</button>
      <button class="ghost danger" data-unreserve="${wish.id}">Annuler</button>`;
  } else {
    status = `<span class="badge taken">Réservé par ${memberLabel(wish.reservedBy)}</span>`;
  }

  return `
    <li class="wish ${!owner && wish.reservedBy && wish.reservedBy !== meId ? "is-taken" : ""}">
      <div class="wish-main">
        <div class="wish-title">
          ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(wish.title)}</a>` : esc(wish.title)}
        </div>
        <div class="wish-meta">
          ${wish.priority ? `<span class="prio p${wish.priority}">${"★".repeat(wish.priority)} ${PRIORITIES[wish.priority]}</span>` : ""}
          ${formatPrice(wish.price) ? `<span>${formatPrice(wish.price)}</span>` : ""}
          ${suggestion}
          ${status}
        </div>
        ${wish.note ? `<p class="wish-note">${esc(wish.note)}</p>` : ""}
      </div>
      <div class="wish-actions">${actions}</div>
    </li>`;
}

function renderMine(current) {
  const list = wishesOf(current.id, { forOwner: true });
  app.innerHTML = `
    <section>
      <div class="section-head">
        <h2>Ma liste d'envies</h2>
        <button class="primary" data-action="add-wish">+ Ajouter</button>
      </div>
      <p class="muted small">Vous ne voyez ni qui a réservé quoi, ni les idées suggérées par les autres : la surprise est préservée.</p>
      ${list.length
        ? `<ul class="wishes">${list.map((w) => wishCard(w, { owner: true })).join("")}</ul>`
        : `<p class="empty">Votre liste est vide. Ajoutez vos premières idées !</p>`}
    </section>`;
}

function renderFamily(current) {
  const target = ui.viewing && member(ui.viewing);
  if (target && target.id !== current.id) {
    const list = wishesOf(target.id);
    const free = list.filter((w) => !w.reservedBy).length;
    app.innerHTML = `
      <section>
        <button class="link" data-back>← Toute la famille</button>
        <div class="section-head">
          <h2>${target.emoji} Liste de ${esc(target.name)}</h2>
          <button class="ghost" data-suggest="${target.id}">💡 Suggérer</button>
        </div>
        <p class="muted small">${list.length} idée(s), ${free} encore disponible(s).
        ${esc(target.name)} ne voit ni les réservations, ni les idées suggérées.</p>
        ${list.length
          ? `<ul class="wishes">${list.map((w) => wishCard(w, { owner: false })).join("")}</ul>`
          : `<p class="empty">${esc(target.name)} n'a encore rien ajouté.</p>`}
      </section>`;
    return;
  }

  const others = state.members.filter((m) => m.id !== current.id);
  const events = upcomingEvents(state.members);
  app.innerHTML = `
    <section>
      <div class="card events">
        <h3>Prochaines occasions</h3>
        <ul>
          ${events.map((e) => `
            <li>
              <span>${e.emoji} ${esc(e.label)}${e.age ? ` (${e.age} ans)` : ""}</span>
              <span class="${e.days <= 14 ? "soon" : "muted"}">${formatCountdown(e.days)}</span>
            </li>`).join("")}
        </ul>
        ${state.members.some((m) => m.birthday) ? "" : `<p class="muted small">Ajoutez les dates d'anniversaire dans les réglages ⚙️.</p>`}
      </div>
      <h2>La famille</h2>
      ${others.length ? `
        <div class="grid">
          ${others.map((m) => {
            const list = wishesOf(m.id);
            const free = list.filter((w) => !w.reservedBy).length;
            return `
              <button class="member-tile" data-view="${m.id}">
                <span class="emoji">${m.emoji}</span>
                <span>${esc(m.name)}</span>
                <span class="muted small">${list.length} idée(s) · ${free} dispo</span>
              </button>`;
          }).join("")}
        </div>`
        : `<p class="empty">Ajoutez d'autres membres dans les réglages ⚙️.</p>`}
    </section>`;
}

function renderGifts(current) {
  const mine = state.wishes.filter((w) => w.reservedBy === current.id);
  const byRecipient = new Map();
  mine.forEach((w) => byRecipient.set(w.ownerId, [...(byRecipient.get(w.ownerId) || []), w]));
  const total = mine.reduce((sum, w) => sum + (typeof w.price === "number" ? w.price : 0), 0);
  const bought = mine.filter((w) => w.bought).length;

  app.innerHTML = `
    <section>
      <h2>Mes cadeaux à offrir</h2>
      ${mine.length ? `
        <div class="stats">
          <div><strong>${mine.length}</strong><span>réservé(s)</span></div>
          <div><strong>${bought}/${mine.length}</strong><span>acheté(s)</span></div>
          <div><strong>${euros.format(total)}</strong><span>budget estimé</span></div>
        </div>
        ${[...byRecipient].map(([ownerId, list]) => `
          <h3>Pour ${memberLabel(ownerId)}</h3>
          <ul class="wishes">${list.map((w) => wishCard(w, { owner: false })).join("")}</ul>`).join("")}`
        : `<p class="empty">Vous n'avez encore rien réservé. Allez voir les listes dans l'onglet Famille.</p>`}
    </section>`;
}

function renderDraw(current) {
  const draw = state.draw;
  const pairs = draw?.pairs || {};
  const receiverId = pairs[current.id];
  const exclusions = draw?.exclusions || [];
  const options = state.members.map((m) => `<option value="${m.id}">${m.emoji} ${esc(m.name)}</option>`).join("");

  app.innerHTML = `
    <section>
      <h2>Tirage au sort</h2>
      <p class="muted small">Chacun offre un cadeau à une seule personne tirée au sort.
      Chaque membre ne voit que son propre résultat.</p>

      ${draw?.pairs ? `
        <div class="card reveal">
          ${receiverId && member(receiverId) ? `
            <p>Cette année, vous offrez un cadeau à</p>
            <p class="reveal-name">${memberLabel(receiverId)}</p>
            <button class="primary" data-view-tab="${receiverId}">Voir sa liste</button>`
            : `<p>Vous ne faisiez pas partie du tirage. Relancez-le pour vous inclure.</p>`}
          <p class="muted small">Tirage du ${new Date(draw.date).toLocaleDateString("fr-FR")}</p>
        </div>` : ""}

      <div class="card">
        <h3>Exclusions</h3>
        <p class="muted small">Par exemple, un couple qui ne doit pas se tirer mutuellement.</p>
        <ul class="exclusions">
          ${exclusions.map(([a, b], i) => `
            <li>${memberLabel(a)} ↔ ${memberLabel(b)}
              <button class="ghost danger" data-remove-exclusion="${i}" aria-label="Retirer">✕</button></li>`).join("")
            || `<li class="muted small">Aucune exclusion.</li>`}
        </ul>
        <form id="exclusion-form" class="row">
          <select name="a" required>${options}</select>
          <span>↔</span>
          <select name="b" required>${options}</select>
          <button class="ghost">Ajouter</button>
        </form>
      </div>

      <button class="primary wide" data-action="run-draw" ${state.members.length < 2 ? "disabled" : ""}>
        ${draw?.pairs ? "🔄 Refaire le tirage" : "🎲 Lancer le tirage"}
      </button>
      ${state.members.length < 2 ? `<p class="muted small">Il faut au moins deux membres.</p>` : ""}
    </section>`;

  app.querySelector("#exclusion-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const a = data.get("a");
    const b = data.get("b");
    if (a === b) return toast("Choisissez deux personnes différentes.");
    if (exclusions.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return;
    run(() => store.setDraw({ ...(draw || {}), exclusions: [...exclusions, [a, b]] }));
  });
}

// ---------- dialogues ----------

function openDialog(html, onSubmit) {
  dialog.innerHTML = html;
  const form = dialog.querySelector("form");
  if (form && onSubmit) {
    form.addEventListener("submit", async (event) => {
      if (event.submitter?.value === "cancel") return;
      event.preventDefault();
      if ((await onSubmit(new FormData(form))) !== false) dialog.close();
    });
  }
  if (!dialog.open) dialog.showModal();
}

// `forMemberId` : suggérer une idée pour quelqu'un d'autre (invisible pour lui).
function openWishDialog(wish, forMemberId = null) {
  const editing = Boolean(wish);
  wish = wish || { priority: 2 };
  const target = forMemberId && member(forMemberId);
  openDialog(`
    <form method="dialog" class="stack">
      <h2>${editing ? "Modifier l'idée" : target ? `Idée pour ${esc(target.name)}` : "Nouvelle idée cadeau"}</h2>
      ${target ? `<p class="muted small">${esc(target.name)} ne verra pas cette idée. Les autres pourront la réserver.</p>` : ""}
      <label>Quoi ? <input name="title" required maxlength="120" value="${esc(wish.title)}" placeholder="Ex. Un livre de cuisine"></label>
      <label>Lien (optionnel) <input name="url" type="url" value="${esc(wish.url)}" placeholder="https://…"></label>
      <label>Prix indicatif en € (optionnel) <input name="price" type="number" min="0" step="0.01" inputmode="decimal" value="${wish.price ?? ""}"></label>
      <label>${target || wish.suggestedBy ? "Intérêt estimé" : "Envie"}
        <select name="priority">
          ${[3, 2, 1].map((p) => `<option value="${p}" ${wish.priority === p ? "selected" : ""}>${"★".repeat(p)} ${PRIORITIES[p]}</option>`).join("")}
        </select>
      </label>
      <label>Précisions (taille, couleur…) <textarea name="note" rows="3" maxlength="500">${esc(wish.note)}</textarea></label>
      <div class="row end">
        <button value="cancel" class="ghost" formnovalidate>Annuler</button>
        <button class="primary">${editing ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </form>`, (data) => {
    const price = data.get("price") === "" ? null : Number(data.get("price"));
    const fields = {
      title: data.get("title").trim(),
      url: data.get("url").trim(),
      price: Number.isFinite(price) ? price : null,
      priority: Number(data.get("priority")),
      note: data.get("note").trim(),
    };
    if (!fields.title) return false;
    if (editing) run(() => store.update("wishes", wish.id, fields), "Idée modifiée");
    else {
      const extra = target ? { ownerId: target.id, suggestedBy: me().id } : { ownerId: me().id };
      run(() => store.add("wishes", { ...fields, ...extra, createdAt: Date.now(), reservedBy: null, bought: false }),
        target ? "Idée suggérée en secret" : "Idée ajoutée");
    }
  });
}

function openMembersDialog() {
  const current = readLocal(LS.me);
  openDialog(`
    <form method="dialog" class="stack">
      <h2>Membres de la famille</h2>
      <ul class="members-list">
        ${state.members.map((m) => `
          <li>
            <button type="button" class="emoji-button" data-cycle-emoji="${m.id}" title="Changer l'emoji">${m.emoji}</button>
            <div class="member-fields">
              <input value="${esc(m.name)}" data-rename="${m.id}" maxlength="40" aria-label="Prénom de ${esc(m.name)}">
              <label class="small muted">🎂 <input type="date" value="${esc(m.birthday)}" data-birthday="${m.id}" aria-label="Anniversaire de ${esc(m.name)}"></label>
            </div>
            ${m.id === current ? `<span class="muted small">(vous)</span>`
              : `<button type="button" class="ghost danger" data-delete-member="${m.id}" aria-label="Supprimer">✕</button>`}
          </li>`).join("")}
      </ul>
      <div class="row">
        <input name="name" placeholder="Prénom du nouveau membre" maxlength="40">
        <button class="ghost" value="add">Ajouter</button>
      </div>
      <div class="row end"><button value="cancel" class="primary" formnovalidate>Terminé</button></div>
    </form>`, (data) => {
    const name = (data.get("name") || "").trim();
    if (name) {
      const emoji = EMOJIS[state.members.length % EMOJIS.length];
      run(async () => {
        await store.add("members", { name, emoji });
        openMembersDialog();
      });
    }
    return false;
  });
}

function openSettingsDialog() {
  const code = readLocal(LS.family);
  const invite = code ? `${location.origin}${location.pathname}?famille=${encodeURIComponent(code)}` : "";
  openDialog(`
    <form method="dialog" class="stack">
      <h2>Réglages</h2>
      <button type="button" class="ghost" data-action="members">👪 Gérer les membres</button>
      <button type="button" class="ghost" data-action="switch">🔁 Changer de profil</button>
      <div class="card">
        ${isShared() ? `
          <p><strong>Mode partagé</strong> : les listes sont synchronisées entre tous les appareils.</p>
          <p class="small">Code famille : <strong>${esc(code)}</strong></p>
          <button type="button" class="ghost" data-copy="${esc(invite)}">🔗 Copier le lien d'invitation</button>
          <button type="button" class="ghost" data-action="change-family">Rejoindre une autre famille</button>`
          : `
          <p><strong>Mode local</strong> : les données restent sur cet appareil.</p>
          <p class="small muted">Pour partager avec toute la famille, configurez Firebase (voir le README).
          En attendant, vous pouvez transférer les données par fichier.</p>`}
        <div class="row">
          <button type="button" class="ghost" data-action="export">⬇️ Exporter</button>
          <label class="ghost file-button">⬆️ Importer<input type="file" accept="application/json" data-import hidden></label>
        </div>
      </div>
      <div class="row end"><button value="cancel" class="primary" formnovalidate>Fermer</button></div>
    </form>`);
}

// ---------- actions ----------

async function removeMember(id) {
  const m = member(id);
  if (!m || !confirm(`Supprimer ${m.name} et sa liste d'envies ?`)) return;
  await run(async () => {
    const own = state.wishes.filter((w) => w.ownerId === id);
    const reserved = state.wishes.filter((w) => w.reservedBy === id && w.ownerId !== id);
    await Promise.all([
      ...own.map((w) => store.remove("wishes", w.id)),
      ...reserved.map((w) => store.update("wishes", w.id, { reservedBy: null, bought: false })),
    ]);
    if (state.draw) {
      const exclusions = (state.draw.exclusions || []).filter(([a, b]) => a !== id && b !== id);
      await store.setDraw({ ...state.draw, exclusions });
    }
    await store.remove("members", id);
  }, `${m.name} a été supprimé·e`);
}

function runDraw() {
  const exclusions = state.draw?.exclusions || [];
  if (state.draw?.pairs && !confirm("Refaire le tirage ? Les résultats actuels seront remplacés.")) return;
  const pairs = drawPairs(state.members.map((m) => m.id), exclusions);
  if (!pairs) return toast("Impossible de faire un tirage avec ces exclusions.");
  run(() => store.setDraw({ exclusions, pairs, date: Date.now() }), "Tirage effectué ! Chacun peut voir son résultat.");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `cadeaux-famille-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data.members) || !Array.isArray(data.wishes)) throw new Error("format");
    if (!confirm("Remplacer toutes les données actuelles par ce fichier ?")) return;
    await store.replaceAll({ members: data.members, wishes: data.wishes, draw: data.draw || null });
    if (!member(readLocal(LS.me))) writeLocal(LS.me, null);
    dialog.close();
    toast("Données importées");
  } catch {
    toast("Fichier invalide.");
  }
}

function setTab(tab) {
  ui.tab = tab;
  ui.viewing = null;
  writeLocal(LS.tab, tab);
  render();
}

function wishById(id) {
  return state.wishes.find((w) => w.id === id);
}

document.addEventListener("click", (event) => {
  const el = event.target.closest("button, [data-copy]");
  if (!el) return;
  const d = el.dataset;
  const meId = readLocal(LS.me);

  if (d.tab) return setTab(d.tab);
  if (d.pick) { writeLocal(LS.me, d.pick); return render(); }
  if (d.view) { ui.viewing = d.view; return render(); }
  if (d.viewTab) { ui.tab = "family"; ui.viewing = d.viewTab; writeLocal(LS.tab, "family"); return render(); }
  if ("back" in d) { ui.viewing = null; return render(); }
  if (d.editWish) return openWishDialog(wishById(d.editWish));
  if (d.deleteWish) {
    const w = wishById(d.deleteWish);
    if (!w || !confirm(`Supprimer « ${w.title} » ?`)) return;
    // Si quelqu'un d'autre l'a déjà réservée, on la masque seulement pour
    // que la personne qui l'offre soit prévenue au lieu de la perdre de vue.
    const keepForGiver = w.reservedBy && w.reservedBy !== meId;
    return run(() => (keepForGiver ? store.update("wishes", w.id, { removed: true }) : store.remove("wishes", w.id)), "Idée supprimée");
  }
  if (d.suggest) return openWishDialog(null, d.suggest);
  if (d.reserve) return run(() => store.update("wishes", d.reserve, { reservedBy: meId, bought: false }), "Réservé ! Personne d'autre ne l'offrira.");
  if (d.unreserve) return run(() => store.update("wishes", d.unreserve, { reservedBy: null, bought: false }), "Réservation annulée");
  if (d.bought) {
    const w = wishById(d.bought);
    return w && run(() => store.update("wishes", w.id, { bought: !w.bought }));
  }
  if (d.removeExclusion) {
    const exclusions = (state.draw?.exclusions || []).filter((_, i) => i !== Number(d.removeExclusion));
    return run(() => store.setDraw({ ...state.draw, exclusions }));
  }
  if (d.cycleEmoji) {
    const m = member(d.cycleEmoji);
    const next = EMOJIS[(EMOJIS.indexOf(m.emoji) + 1) % EMOJIS.length];
    el.textContent = next;
    return run(() => store.update("members", m.id, { emoji: next }));
  }
  if (d.deleteMember) return removeMember(d.deleteMember).then(() => dialog.open && openMembersDialog());
  if (d.copy) {
    navigator.clipboard?.writeText(d.copy).then(() => toast("Lien copié"), () => prompt("Lien d'invitation :", d.copy));
    return;
  }

  switch (d.action) {
    case "add-wish": return openWishDialog();
    case "members": return openMembersDialog();
    case "switch": dialog.close(); writeLocal(LS.me, null); return render();
    case "run-draw": return runDraw();
    case "export": return exportData();
    case "change-family":
      if (confirm("Quitter cette famille sur cet appareil ?")) {
        writeLocal(LS.family, null);
        writeLocal(LS.me, null);
        location.search = "";
      }
      return;
  }
});

document.addEventListener("change", (event) => {
  const el = event.target;
  if ("birthday" in el.dataset) {
    run(() => store.update("members", el.dataset.birthday, { birthday: el.value || null }));
  }
  if (el.dataset.rename) {
    const name = el.value.trim();
    if (name) run(() => store.update("members", el.dataset.rename, { name }));
  }
  if ("import" in el.dataset && el.files[0]) importData(el.files[0]);
});

meButton.addEventListener("click", () => { writeLocal(LS.me, null); render(); });
document.getElementById("settings-button").addEventListener("click", openSettingsDialog);

// ---------- démarrage ----------

function askFamilyCode() {
  return new Promise((resolve) => {
    app.innerHTML = `
      <section class="card hero">
        <h2>Rejoindre votre famille</h2>
        <p>Entrez le code partagé par votre famille, ou inventez-en un pour créer un nouvel espace.</p>
        <form id="code-form" class="stack">
          <label>Code famille <input name="code" required minlength="4" maxlength="40" pattern="[A-Za-z0-9-]+" placeholder="ex. dupont-noel-2026"></label>
          <p class="muted small">Lettres, chiffres et tirets. Choisissez un code difficile à deviner :
          toute personne qui le connaît peut voir les listes.</p>
          <button class="primary">Continuer</button>
        </form>
      </section>`;
    app.querySelector("#code-form").addEventListener("submit", (event) => {
      event.preventDefault();
      resolve(new FormData(event.target).get("code").trim().toLowerCase());
    });
  });
}

async function start() {
  const fromUrl = new URLSearchParams(location.search).get("famille");
  if (fromUrl && /^[a-z0-9-]{4,40}$/i.test(fromUrl) && fromUrl.toLowerCase() !== readLocal(LS.family)) {
    writeLocal(LS.family, fromUrl.toLowerCase());
    writeLocal(LS.me, null);
  }
  if (isShared() && !readLocal(LS.family)) writeLocal(LS.family, await askFamilyCode());

  try {
    store = await createStore(isShared() ? readLocal(LS.family) : null);
  } catch (error) {
    console.error(error);
    app.innerHTML = `<p class="empty">Impossible de se connecter. Vérifiez votre connexion internet puis rechargez la page.</p>`;
    return;
  }
  store.subscribe((next) => {
    state = next;
    if (ui.viewing && !member(ui.viewing)) ui.viewing = null;
    if (dialog.open) return; // évite de fermer un formulaire en cours de saisie
    render();
  });
}

dialog.addEventListener("close", render);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

start();
