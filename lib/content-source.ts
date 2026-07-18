import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { SerializedEditorState, SerializedLexicalNode } from "lexical";

const PROJECTS_DIR = "content/projects";
const POSTS_DIR = "content/posts";
const SLUG_RE = /^[a-z0-9-]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PROJECT_COLORS = new Set(["pink", "cyan", "yellow"]);

type TextNode = {
  detail: number;
  format: number;
  mode: "normal";
  style: "";
  text: string;
  type: "text";
  version: 1;
};

function fail(message: string): never {
  throw new Error(`[content-source] ${message}`);
}

function assertString(value: unknown, field: string, file: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${file}: field "${field}" must be a non-empty string`);
  }
}

function assertSlugMatchesFile(slug: string, file: string, dir: string) {
  const base = path.basename(file, ".md");
  if (base !== slug) fail(`${file}: filename "${base}" does not match frontmatter slug "${slug}"`);
  if (!SLUG_RE.test(slug)) fail(`${dir}/${file}: slug "${slug}" must match ^[a-z0-9-]+$`);
}

function assertHttpsUrl(value: unknown, field: string, file: string): asserts value is string {
  if (typeof value !== "string" || !/^https:\/\/[^\s]+$/.test(value)) {
    fail(`${file}: field "${field}" must be a valid https:// URL`);
  }
}

function textNode(text: string): TextNode {
  return {
    type: "text",
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    version: 1,
  };
}

function textContainer(type: "paragraph" | "quote", text: string) {
  return {
    type,
    children: [textNode(text)],
    direction: "ltr",
    format: "",
    indent: 0,
    ...(type === "paragraph" ? { textFormat: 0, textStyle: "" } : {}),
    version: 1,
  };
}

export function markdownToLexical(markdown: string): SerializedEditorState {
  const blocks = markdown.trim().split(/\n{2,}/);
  const children = blocks.map((block) => {
    const lines = block.split("\n");
    const isQuote = lines.every((line) => /^>\s?/.test(line));
    const text = lines.map((line) => (isQuote ? line.replace(/^>\s?/, "") : line)).join(" ").trim();
    if (!text) fail("post body contains an empty Markdown block");
    return textContainer(isQuote ? "quote" : "paragraph", text);
  }) as SerializedLexicalNode[];

  if (!children.length) fail("post body is empty");

  return {
    root: {
      type: "root",
      children,
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
    },
  };
}

export function markdownToHtml(markdown: string) {
  let firstParagraph = true;
  return markdown
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      const isQuote = lines.every((line) => /^>\s?/.test(line));
      const text = escapeHtml(lines.map((line) => (isQuote ? line.replace(/^>\s?/, "") : line)).join(" ").trim());
      if (isQuote) return `<blockquote class="notes-quote">${text}</blockquote>`;
      const className = firstParagraph ? ' class="first"' : "";
      firstParagraph = false;
      return `<p${className}>${text}</p>`;
    })
    .join("");
}

export function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/^>\s?/gm, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function readSeedContent(root = process.cwd()) {
  const projectsDir = path.join(root, PROJECTS_DIR);
  const postsDir = path.join(root, POSTS_DIR);
  if (!fs.existsSync(projectsDir)) fail(`missing directory ${PROJECTS_DIR}`);
  if (!fs.existsSync(postsDir)) fail(`missing directory ${POSTS_DIR}`);

  const projectSlugs = new Set<string>();
  const projects = fs
    .readdirSync(projectsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const full = path.join(projectsDir, file);
      const { data } = matter(fs.readFileSync(full, "utf8"));
      const label = `${PROJECTS_DIR}/${file}`;

      assertString(data.slug, "slug", label);
      assertSlugMatchesFile(data.slug, file, PROJECTS_DIR);
      if (projectSlugs.has(data.slug)) fail(`${label}: duplicate slug "${data.slug}"`);
      projectSlugs.add(data.slug);
      if (!Number.isInteger(data.order)) fail(`${label}: field "order" must be an integer`);
      assertString(data.title, "title", label);
      if (typeof data.year !== "string" || !/^\d{4}$/.test(data.year)) {
        fail(`${label}: field "year" must be a 4-digit string`);
      }
      assertString(data.tag, "tag", label);
      assertString(data.blurb, "blurb", label);
      if (!Array.isArray(data.stack) || data.stack.some((item) => typeof item !== "string" || !item.trim())) {
        fail(`${label}: field "stack" must be a non-empty array of strings`);
      }
      if (!PROJECT_COLORS.has(data.color)) fail(`${label}: field "color" must be pink, cyan, or yellow`);
      assertHttpsUrl(data.liveUrl, "liveUrl", label);
      assertHttpsUrl(data.repoUrl, "repoUrl", label);

      return {
        slug: data.slug,
        order: data.order,
        title: data.title,
        year: data.year,
        tag: data.tag,
        blurb: data.blurb,
        stack: data.stack as string[],
        color: data.color as "pink" | "cyan" | "yellow",
        liveUrl: data.liveUrl,
        repoUrl: data.repoUrl,
      };
    })
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  const postSlugs = new Set<string>();
  const posts = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const full = path.join(postsDir, file);
      const { data, content } = matter(fs.readFileSync(full, "utf8"));
      const label = `${POSTS_DIR}/${file}`;

      assertString(data.slug, "slug", label);
      assertSlugMatchesFile(data.slug, file, POSTS_DIR);
      if (postSlugs.has(data.slug)) fail(`${label}: duplicate slug "${data.slug}"`);
      postSlugs.add(data.slug);
      assertString(data.title, "title", label);
      if (typeof data.date !== "string" || !ISO_DATE_RE.test(data.date)) {
        fail(`${label}: field "date" must be an ISO date string (YYYY-MM-DD)`);
      }
      assertString(data.kicker, "kicker", label);
      assertString(data.excerpt, "excerpt", label);
      if (!Number.isInteger(data.readMin) || data.readMin <= 0) {
        fail(`${label}: field "readMin" must be a positive integer`);
      }

      const body = content.trim();
      if (!body) fail(`${label}: post body is empty`);

      return {
        slug: data.slug,
        title: data.title,
        date: data.date,
        kicker: data.kicker,
        excerpt: data.excerpt,
        readMin: data.readMin,
        body,
        bodyLexical: markdownToLexical(body),
        bodyHtml: markdownToHtml(body),
        bodyText: markdownToPlainText(body),
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

  return { projects, posts };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
