import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { getPayload } from "payload";
import configPromise from "../payload.config";
import { readSeedContent } from "./content-source";

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

export async function getFrontendPortfolioData() {
  if (!process.env.DATABASE_URL) {
    return fromSeedFiles();
  }

  const payload = await getPayload({ config: configPromise });
  const [projectsResult, postsResult] = await Promise.all([
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

  return { projects, posts };
}

function fromSeedFiles() {
  const seed = readSeedContent();
  return {
    projects: seed.projects.map((project, index) => ({
      ...project,
      coverImage: null,
      num: String(index + 1).padStart(2, "0"),
    })),
    posts: seed.posts.map(({ body: _body, bodyLexical: _bodyLexical, ...post }) => post),
  };
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
