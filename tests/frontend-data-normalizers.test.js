import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAbout, normalizeContact } from "../lib/frontend-data.ts";
import { STATIC_ABOUT, STATIC_CONTACT } from "../src/data.js";

test("normalizeAbout falls back for a missing document", () => {
  assert.deepEqual(normalizeAbout(null), STATIC_ABOUT);
});

test("normalizeContact falls back for a missing document", () => {
  assert.deepEqual(normalizeContact(null), STATIC_CONTACT);
});

test("normalizers fall back for all-null unsaved globals", () => {
  assert.deepEqual(
    normalizeAbout({
      paragraphs: null,
      nowPlaying: null,
      nowReading: null,
      nowBuilding: null,
    }),
    STATIC_ABOUT,
  );
  assert.deepEqual(
    normalizeContact({
      email: null,
      phone: null,
      socials: null,
    }),
    STATIC_CONTACT,
  );
});

test("normalizers fall back for empty strings and empty arrays", () => {
  assert.deepEqual(
    normalizeAbout({
      paragraphs: [],
      nowPlaying: " ",
      nowReading: "",
      nowBuilding: "\n",
    }),
    STATIC_ABOUT,
  );
  assert.deepEqual(
    normalizeContact({
      email: " ",
      phone: "",
      socials: [],
    }),
    STATIC_CONTACT,
  );
});

test("normalizers merge mixed partial content per field", () => {
  assert.deepEqual(normalizeAbout({
    paragraphs: [{ text: "  Uno  " }, { text: "" }, { text: "Dos" }],
    nowPlaying: "  Aphex Twin  ",
    nowReading: "",
    nowBuilding: "Patch bay",
  }), {
    paragraphs: ["Uno", "Dos"],
    nowPlaying: "Aphex Twin",
    nowReading: STATIC_ABOUT.nowReading,
    nowBuilding: "Patch bay",
  });

  assert.deepEqual(normalizeContact({
    email: "  hola@example.com ",
    phone: "",
    socials: [
      { label: " GitHub ", handle: " @jorge " },
      { label: "", handle: "@skip" },
      { label: "Skip", handle: " " },
    ],
  }), {
    email: "hola@example.com",
    phone: STATIC_CONTACT.phone,
    socials: [{ label: "GitHub", handle: "@jorge" }],
  });
});
