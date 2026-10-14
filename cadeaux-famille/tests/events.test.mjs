import { test } from "node:test";
import assert from "node:assert/strict";
import { upcomingEvents, formatCountdown } from "../events.js";

const at = (y, m, d) => new Date(y, m - 1, d, 15, 30);

test("Noël est toujours présent et le compte à rebours est juste", () => {
  const [noel] = upcomingEvents([], at(2026, 12, 20));
  assert.equal(noel.label, "Noël");
  assert.equal(noel.days, 5);
  assert.equal(upcomingEvents([], at(2026, 12, 26))[0].date.getFullYear(), 2027);
});

test("les anniversaires sont triés par date, avec l'âge", () => {
  const members = [
    { id: "a", name: "Léa", birthday: "2015-11-02" },
    { id: "b", name: "Tom", birthday: "1980-10-14" },
    { id: "c", name: "Sans date" },
  ];
  const events = upcomingEvents(members, at(2026, 10, 14));
  assert.deepEqual(events.map((e) => e.label), ["Anniversaire de Tom", "Anniversaire de Léa", "Noël"]);
  assert.equal(events[0].days, 0);
  assert.equal(events[0].age, 46);
  assert.equal(events[1].age, 11);
});

test("un anniversaire le 29 février tombe le 28 les années non bissextiles", () => {
  const [event] = upcomingEvents([{ id: "a", name: "Zoé", birthday: "2012-02-29" }], at(2027, 1, 1));
  assert.equal(event.date.getMonth(), 1);
  assert.equal(event.date.getDate(), 28);
});

test("formatCountdown", () => {
  assert.equal(formatCountdown(0), "aujourd'hui !");
  assert.equal(formatCountdown(1), "demain");
  assert.equal(formatCountdown(12), "dans 12 jours");
});
