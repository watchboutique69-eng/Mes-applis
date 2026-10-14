// Prochaines occasions d'offrir : Noël et les anniversaires des membres.

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Prochaine date (aujourd'hui inclus) tombant le jour/mois donné.
// Un 29 février est fêté le 28 les années non bissextiles.
function nextOccurrence(month, day, today) {
  for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
    const lastDay = new Date(year, month, 0).getDate();
    const date = new Date(year, month - 1, Math.min(day, lastDay));
    if (date >= today) return date;
  }
  return null;
}

// birthday au format "AAAA-MM-JJ" (valeur d'un <input type="date">).
function parseBirthday(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function upcomingEvents(members, now = new Date(), limit = 4) {
  const today = startOfDay(now);
  const events = [{ emoji: "🎄", label: "Noël", date: nextOccurrence(12, 25, today) }];

  for (const m of members) {
    const birthday = parseBirthday(m.birthday);
    if (!birthday) continue;
    const date = nextOccurrence(birthday.month, birthday.day, today);
    const age = birthday.year > 1900 ? date.getFullYear() - birthday.year : null;
    events.push({ emoji: "🎂", label: `Anniversaire de ${m.name}`, memberId: m.id, age, date });
  }

  return events
    .map((e) => ({ ...e, days: Math.round((e.date - today) / DAY) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, limit);
}

export function formatCountdown(days) {
  if (days === 0) return "aujourd'hui !";
  if (days === 1) return "demain";
  return `dans ${days} jours`;
}
