import assert from "node:assert/strict";
import { test } from "node:test";
import renderMarkdown from "../src/utils/renderMarkdown.js";

test("renderMarkdown renders images and inline code", () => {
  const html = renderMarkdown("See ![diagram](/uploads/a.png) and `code`");

  assert.match(html, /<img src="\/uploads\/a\.png" alt="diagram"/);
  assert.match(html, /<code>code<\/code>/);
});

test("renderMarkdown renders single-line fenced code blocks", () => {
  const html = renderMarkdown("```const value = 1;```");

  assert.equal(html, "<pre><code>const value = 1;</code></pre>");
});

test("renderMarkdown renders multiline fenced code blocks with language class", () => {
  const html = renderMarkdown("```js\nconst value = 1;\nconsole.log(value);\n```");

  assert.equal(
    html,
    '<pre><code class="language-js">const value = 1;\nconsole.log(value);</code></pre>'
  );
});
