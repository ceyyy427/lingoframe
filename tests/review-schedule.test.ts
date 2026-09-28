import assert from "node:assert/strict";
import { test } from "node:test";
import { nextReviewAt, nextStreak } from "../lib/review/schedule";

test("failed review resets streak and schedules a short retry", () => {
  assert.equal(nextStreak(1, 4), 0);
  const diff = new Date(nextReviewAt(1, 4)).getTime() - Date.now();
  assert.ok(diff > 9 * 60_000 && diff < 11 * 60_000);
});

test("good review increments streak", () => assert.equal(nextStreak(4, 2), 3));
