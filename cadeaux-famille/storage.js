// Couche de stockage : même interface en mode local (localStorage) et en mode
// partagé (Firebase Firestore).
//
// État exposé aux abonnés :
//   { members: [{id, name, emoji}],
//     wishes:  [{id, ownerId, title, url, price, note, priority, createdAt,
//                reservedBy, bought}],
//     draw:    {exclusions: [[idA, idB]], pairs: {giverId: receiverId}, date} | null }

import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "10.12.2";
const COLLECTIONS = ["members", "wishes"];

export function newId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function isShared() {
  return Boolean(firebaseConfig && firebaseConfig.apiKey);
}

export async function createStore(familyCode) {
  if (isShared()) return createFirebaseStore(familyCode);
  return createLocalStore(familyCode);
}

function emptyState() {
  return { members: [], wishes: [], draw: null };
}

function createLocalStore(familyCode) {
  const key = `cadeaux-famille:data:${familyCode || "local"}`;
  const listeners = new Set();
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(key);
      return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
    } catch {
      return emptyState();
    }
  }

  function commit() {
    localStorage.setItem(key, JSON.stringify(state));
    listeners.forEach((fn) => fn(state));
  }

  // Synchronise les onglets ouverts sur le même appareil.
  window.addEventListener("storage", (event) => {
    if (event.key !== key) return;
    state = load();
    listeners.forEach((fn) => fn(state));
  });

  return {
    mode: "local",
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    async add(collection, data) {
      const item = { id: newId(), ...data };
      state = { ...state, [collection]: [...state[collection], item] };
      commit();
      return item.id;
    },
    async update(collection, id, patch) {
      state = {
        ...state,
        [collection]: state[collection].map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };
      commit();
    },
    async remove(collection, id) {
      state = { ...state, [collection]: state[collection].filter((item) => item.id !== id) };
      commit();
    },
    async setDraw(draw) {
      state = { ...state, draw };
      commit();
    },
    async replaceAll(data) {
      state = { ...emptyState(), ...data };
      commit();
    },
  };
}

async function createFirebaseStore(familyCode) {
  if (!familyCode) throw new Error("Un code famille est nécessaire en mode partagé.");
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const { initializeApp } = await import(`${base}/firebase-app.js`);
  const fs = await import(`${base}/firebase-firestore.js`);

  const app = initializeApp(firebaseConfig);
  const db = fs.getFirestore(app);
  const root = ["familles", familyCode];
  const col = (name) => fs.collection(db, ...root, name);
  const drawRef = fs.doc(db, ...root, "meta", "draw");

  const listeners = new Set();
  let state = emptyState();
  const notify = () => listeners.forEach((fn) => fn(state));

  for (const name of COLLECTIONS) {
    fs.onSnapshot(col(name), (snap) => {
      state = { ...state, [name]: snap.docs.map((d) => ({ ...d.data(), id: d.id })) };
      notify();
    });
  }
  fs.onSnapshot(drawRef, (snap) => {
    state = { ...state, draw: snap.exists() ? snap.data() : null };
    notify();
  });

  return {
    mode: "firebase",
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
    async add(collection, data) {
      const id = newId();
      await fs.setDoc(fs.doc(col(collection), id), data);
      return id;
    },
    async update(collection, id, patch) {
      await fs.updateDoc(fs.doc(col(collection), id), patch);
    },
    async remove(collection, id) {
      await fs.deleteDoc(fs.doc(col(collection), id));
    },
    async setDraw(draw) {
      if (draw) await fs.setDoc(drawRef, draw);
      else await fs.deleteDoc(drawRef);
    },
    async replaceAll(data) {
      const batch = fs.writeBatch(db);
      for (const name of COLLECTIONS) {
        state[name].forEach((item) => batch.delete(fs.doc(col(name), item.id)));
        (data[name] || []).forEach(({ id, ...rest }) => batch.set(fs.doc(col(name), id || newId()), rest));
      }
      if (data.draw) batch.set(drawRef, data.draw);
      else batch.delete(drawRef);
      await batch.commit();
    },
  };
}
