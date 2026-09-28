import assert from "node:assert/strict";
import { test } from "node:test";
import { identifyVideo, parseVtt } from "../lib/video/provider";

test("identifies YouTube watch and short URLs", () => {
  assert.deepEqual(identifyVideo("https://www.youtube.com/watch?v=abc123").externalId, "abc123");
  assert.deepEqual(identifyVideo("https://youtu.be/xyz789?t=4").externalId, "xyz789");
});

test("parses VTT timestamps and removes duplicate cues", () => {
  const result = parseVtt("WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nHello\n\n00:00:03.000 --> 00:00:05.000\nHello\n\n00:00:05.000 --> 00:00:07.000\nWorld");
  assert.equal(result.length, 2); assert.equal(result[0].start, 1); assert.equal(result[1].text, "World");
});
