import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { hasMeaningfulDraft, loadDraft } from "../src/hooks/useDraftNote.js";
import { installLocalStorageMock } from "./helpers/testEnvironment.js";

let cleanupLocalStorage;

afterEach(() => {
  cleanupLocalStorage?.();
  cleanupLocalStorage = null;
});

test("hasMeaningfulDraft ignores empty rich text html", () => {
  assert.equal(hasMeaningfulDraft({ title: "", content: "<p></p>", tags: "" }), false);
  assert.equal(hasMeaningfulDraft({ title: "", content: "<p><br></p>", tags: "" }), false);
});

test("loadDraft removes stale empty draft", () => {
  cleanupLocalStorage = installLocalStorageMock({
    "study-note-draft": JSON.stringify({ title: "", content: "<p></p>", tags: "" }),
  });

  assert.equal(loadDraft(), null);
  assert.equal(localStorage.getItem("study-note-draft"), null);
});

test("loadDraft keeps meaningful draft", () => {
  cleanupLocalStorage = installLocalStorageMock({
    "study-note-draft": JSON.stringify({ title: "Draft", content: "<p></p>", tags: "" }),
  });

  assert.equal(loadDraft().title, "Draft");
});
