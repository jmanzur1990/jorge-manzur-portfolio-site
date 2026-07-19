import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { createPortfolioData, STATIC_ABOUT, STATIC_CONTACT } from "../src/data.js";

type PayloadProject = {
  slug: string;
  order: number;
  title: string;
  year: string;
  tag: string;
  blurb: string;
  stack?: { value?: string }[];
  color: "pink" | "cyan" | "yellow";
  liveUrl: string;
  repoUrl: string;
};

type PayloadPost = {
  slug: string;
  title: string;
  date: string;
  kicker: string;
  excerpt: string;
  readMin: number;
  body: Parameters<typeof convertLexicalToHTML>[0]["data"];
};

type PayloadAbout = {
  paragraphs?: { text?: string | null }[] | null;
  nowPlaying?: string | null;
  nowReading?: string | null;
  nowBuilding?: string | null;
} | null;

type PayloadContact = {
  email?: string | null;
  phone?: string | null;
  socials?: { label?: string | null; handle?: string | null }[] | null;
} | null;

type StaticAbout = typeof STATIC_ABOUT;
type StaticContact = typeof STATIC_CONTACT;

export function normalizeAbout(doc: PayloadAbout): StaticAbout {
  const paragraphs = Array.isArray(doc?.paragraphs)
    ? doc.paragraphs.map((row) => row.text?.trim()).filter(isNonEmptyString)
    : [];

  return {
    paragraphs: paragraphs.length ? paragraphs : STATIC_ABOUT.paragraphs,
    nowPlaying: normalizeString(doc?.nowPlaying, STATIC_ABOUT.nowPlaying),
    nowReading: normalizeString(doc?.nowReading, STATIC_ABOUT.nowReading),
    nowBuilding: normalizeString(doc?.nowBuilding, STATIC_ABOUT.nowBuilding),
  };
}

export function normalizeContact(doc: PayloadContact): StaticContact {
  const socials = Array.isArray(doc?.socials)
    ? doc.socials
        .map((row) => ({
          label: row.label?.trim() || "",
          handle: row.handle?.trim() || "",
        }))
        .filter((row) => row.label && row.handle)
    : [];

  return {
    email: normalizeString(doc?.email, STATIC_CONTACT.email),
    phone: normalizeString(doc?.phone, STATIC_CONTACT.phone),
    socials: socials.length ? socials : STATIC_CONTACT.socials,
  };
}

export async function getFrontendPortfolioData() {
  if (!process.env.DATABASE_URL) {
    const { readSeedContent } = await import("./content-source");
    return createPortfolioData(fromSeedFiles(readSeedContent()));
  }

  const [{ getPayload }, { default: configPromise }] = await Promise.all([
    import("payload"),
    import("../payload.config"),
  ]);
  const payload = await getPayload({ config: configPromise });
  const [projectsResult, postsResult, aboutResult, contactResult] = await Promise.all([
    payload.find({
      collection: "projects",
      depth: 0,
      limit: 100,
      sort: "order",
    }),
    payload.find({
      collection: "posts",
      depth: 0,
      limit: 100,
      sort: "-date",
    }),
    findGlobalWithFallback(payload, "about"),
    findGlobalWithFallback(payload, "contact"),
  ]);

  const projects = (projectsResult.docs as unknown as PayloadProject[]).map((project, index) => ({
    slug: project.slug,
    order: project.order,
    title: project.title,
    year: project.year,
    tag: project.tag,
    blurb: project.blurb,
    stack: (project.stack || []).map((item) => item.value || "").filter(Boolean),
    color: project.color,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    coverImage: null,
    num: String(index + 1).padStart(2, "0"),
  }));

  const posts = (postsResult.docs as unknown as PayloadPost[]).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date.slice(0, 10),
    kicker: post.kicker,
    excerpt: post.excerpt,
    readMin: post.readMin,
    bodyHtml: decoratePostHtml(convertLexicalToHTML({ data: post.body, disableContainer: true })),
    bodyText: lexicalPlainText(post.body),
  }));

  return createPortfolioData({
    about: normalizeAbout(aboutResult as PayloadAbout),
    contact: normalizeContact(contactResult as PayloadContact),
    projects,
    posts,
  });
}

function fromSeedFiles(seed: ReturnType<typeof import("./content-source").readSeedContent>) {
  return {
    projects: seed.projects.map((project, index) => ({
      ...project,
      coverImage: null,
      num: String(index + 1).padStart(2, "0"),
    })),
    posts: seed.posts.map(({ body: _body, bodyLexical: _bodyLexical, ...post }) => post),
  };
}

async function findGlobalWithFallback(payload: Awaited<ReturnType<typeof import("payload").getPayload>>, slug: "about" | "contact") {
  try {
    return await payload.findGlobal({ slug });
  } catch (error) {
    console.warn(`Payload global "${slug}" could not be loaded. Falling back to static content.`, error);
    return null;
  }
}

function normalizeString(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function isNonEmptyString(value: string | undefined): value is string {
  return Boolean(value);
}

function decoratePostHtml(html: string) {
  let next = html.replace(/<p>/, '<p class="first">');
  next = next.replace(/<blockquote>/g, '<blockquote class="notes-quote">');
  return next;
}

function lexicalPlainText(data: PayloadPost["body"]) {
  const chunks: string[] = [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const current = node as { children?: unknown[]; text?: unknown };
    if (typeof current.text === "string") chunks.push(current.text);
    if (Array.isArray(current.children)) current.children.forEach(visit);
  };
  visit(data.root);
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}
