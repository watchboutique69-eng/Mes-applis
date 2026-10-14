import { test } from "node:test";
import assert from "node:assert/strict";
import { drawPairs } from "../draw.js";

function check(ids, pairs, exclusions = []) {
  assert.deepEqual(Object.keys(pairs).sort(), [...ids].sort());
  assert.deepEqual(Object.values(pairs).sort(), [...ids].sort());
  for (const [giver, receiver] of Object.entries(pairs)) {
    assert.notEqual(giver, receiver);
    assert.ok(!exclusions.some(([a, b]) => (a === giver && b === receiver) || (a === receiver && b === giver)));
  }
}

test("chacun offre et reçoit exactement une fois, jamais à soi-même", () => {
  const ids = ["a", "b", "c", "d", "e", "f"];
  for (let i = 0; i < 200; i++) check(ids, drawPairs(ids));
});

test("les exclusions sont respectées", () => {
  const ids = ["a", "b", "c", "d"];
  const exclusions = [["a", "b"], ["c", "d"]];
  for (let i = 0; i < 200; i++) check(ids, drawPairs(ids, exclusions), exclusions);
});

test("retourne null quand le tirage est impossible", () => {
  assert.equal(drawPairs(["a"]), null);
  assert.equal(drawPairs(["a", "b"], [["a", "b"]]), null);
  assert.equal(drawPairs(["a", "b", "c"], [["a", "b"], ["a", "c"]]), null);
});
