import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

const VIRTUAL_ID = "virtual:portfolio-content";
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_ID;

const PROJECTS_DIR = "content/projects";
const POSTS_DIR = "content/posts";

const SLUG_RE = /^[a-z0-9-]+$/;
const HTTPS_URL_RE = /^https:\/\/[^\s]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PROJECT_COLORS = new Set(["pink", "cyan", "yellow"]);

function fail(message) {
  throw new Error(`[vite-plugin-content] ${message}`);
}

function assertString(value, field, file) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${file}: field "${field}" must be a non-empty string`);
  }
}

function assertSlugMatchesFile(slug, file, dir) {
  const base = path.basename(file, ".md");
  if (base !== slug) {
    fail(`${file}: filename "${base}" does not match frontmatter slug "${slug}"`);
  }
  if (!SLUG_RE.test(slug)) {
    fail(`${dir}/${file}: slug "${slug}" must match ^[a-z0-9-]+$`);
  }
}

function assertHttpsUrl(value, field, file) {
  if (typeof value !== "string" || !HTTPS_URL_RE.test(value)) {
    fail(`${file}: field "${field}" must be a valid https:// URL`);
  }
}

// marked Renderer that ignores/escapes raw HTML tokens instead of passing them through.
class NoRawHtmlRenderer extends marked.Renderer {
  html(token) {
    const raw = typeof token === "string" ? token : token?.raw || token?.text || "";
    return raw
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

const renderer = new NoRawHtmlRenderer();
marked.use({ renderer });

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ["p", "blockquote", "strong", "em", "a", "ul", "ol", "li"],
  ALLOWED_ATTR: ["href"],
  ALLOWED_URI_REGEXP: /^(?:https:|mailto:)/i,
};

function markdownToSafeHtml(markdown) {
  const rawHtml = marked.parse(markdown, { async: false });
  let safeHtml = DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);

  // Tag the first <p> with class="first" for the drop-cap effect (styles.css .notes-body p.first).
  let taggedFirst = false;
  safeHtml = safeHtml.replace(/<p>/, () => {
    taggedFirst = true;
    return '<p class="first">';
  });
  if (!taggedFirst) {
    // no <p> at all (edge case) — nothing to tag.
  }

  // Tag blockquotes with class="notes-quote" (styles.css .notes-quote).
  safeHtml = safeHtml.replace(/<blockquote>/g, '<blockquote class="notes-quote">');

  return safeHtml;
}

function markdownToPlainText(markdown) {
  return markdown
    .replace(/^>\s?/gm, "")
    .replace(/[#*_`>]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readProjects(root) {
  const dir = path.join(root, PROJECTS_DIR);
  if (!fs.existsSync(dir)) fail(`missing directory ${PROJECTS_DIR}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const seenSlugs = new Set();

  const projects = files.map((file) => {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data } = matter(raw);
    const label = `${PROJECTS_DIR}/${file}`;

    assertString(data.slug, "slug", label);
    assertSlugMatchesFile(data.slug, file, PROJECTS_DIR);
    if (seenSlugs.has(data.slug)) fail(`${label}: duplicate slug "${data.slug}"`);
    seenSlugs.add(data.slug);

    if (!Number.isInteger(data.order)) fail(`${label}: field "order" must be an integer`);
    assertString(data.title, "title", label);
    if (typeof data.year !== "string" || !/^\d{4}$/.test(data.year)) {
      fail(`${label}: field "year" must be a 4-digit string`);
    }
    assertString(data.tag, "tag", label);
    assertString(data.blurb, "blurb", label);
    if (!Array.isArray(data.stack) || data.stack.length === 0) {
      fail(`${label}: field "stack" must be a non-empty array of strings`);
    }
    for (const s of data.stack) {
      if (typeof s !== "string" || s.trim() === "") fail(`${label}: "stack" entries must be non-empty strings`);
    }
    if (!PROJECT_COLORS.has(data.color)) {
      fail(`${label}: field "color" must be one of ${[...PROJECT_COLORS].join(", ")}`);
    }
    assertHttpsUrl(data.liveUrl, "liveUrl", label);
    assertHttpsUrl(data.repoUrl, "repoUrl", label);

    let coverImage = null;
    if (data.coverImage != null) {
      if (typeof data.coverImage !== "string" || !data.coverImage.startsWith("/uploads/")) {
        fail(`${label}: field "coverImage" must be a string starting with "/uploads/"`);
      }
      coverImage = data.coverImage;
    }

    return {
      slug: data.slug,
      order: data.order,
      title: data.title,
      year: data.year,
      tag: data.tag,
      blurb: data.blurb,
      stack: data.stack,
      color: data.color,
      liveUrl: data.liveUrl,
      repoUrl: data.repoUrl,
      coverImage,
    };
  });

  projects.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  projects.forEach((p, i) => {
    p.num = String(i + 1).padStart(2, "0");
  });

  return projects;
}

function readPosts(root) {
  const dir = path.join(root, POSTS_DIR);
  if (!fs.existsSync(dir)) fail(`missing directory ${POSTS_DIR}`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const seenSlugs = new Set();

  const posts = files.map((file) => {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const { data, content } = matter(raw);
    const label = `${POSTS_DIR}/${file}`;

    assertString(data.slug, "slug", label);
    assertSlugMatchesFile(data.slug, file, POSTS_DIR);
    if (seenSlugs.has(data.slug)) fail(`${label}: duplicate slug "${data.slug}"`);
    seenSlugs.add(data.slug);

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

    const bodyHtml = markdownToSafeHtml(body);
    const bodyText = markdownToPlainText(body);

    return {
      slug: data.slug,
      title: data.title,
      date: data.date,
      kicker: data.kicker,
      excerpt: data.excerpt,
      readMin: data.readMin,
      bodyHtml,
      bodyText,
    };
  });

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));

  return posts;
}

function buildModuleCode(root) {
  const projects = readProjects(root);
  const posts = readPosts(root);
  return `export const projects = ${JSON.stringify(projects)};\nexport const posts = ${JSON.stringify(posts)};\n`;
}

export default function portfolioContentPlugin() {
  let root;

  return {
    name: "vite-plugin-content",

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return undefined;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) return buildModuleCode(root);
      return undefined;
    },

    configureServer(server) {
      const dirs = [path.join(root, PROJECTS_DIR), path.join(root, POSTS_DIR)];
      for (const dir of dirs) server.watcher.add(dir);
    },

    handleHotUpdate({ file, server }) {
      const normalized = file.replace(/\\/g, "/");
      if (normalized.includes(`/${PROJECTS_DIR}/`) || normalized.includes(`/${POSTS_DIR}/`)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: "full-reload" });
          return [];
        }
      }
      return undefined;
    },
  };
}
