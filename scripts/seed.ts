import { getPayload } from "payload";
import configPromise from "../payload.config";
import { readSeedContent } from "../lib/content-source";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed Payload collections.");
  }

  const payload = await getPayload({ config: configPromise });
  const existingProjects = await payload.find({ collection: "projects", limit: 1 });
  const existingPosts = await payload.find({ collection: "posts", limit: 1 });

  if (existingProjects.totalDocs > 0 || existingPosts.totalDocs > 0) {
    payload.logger.info("Projects or posts already exist; seed skipped to avoid duplicates.");
    return;
  }

  const { projects, posts } = readSeedContent();

  for (const project of projects) {
    await payload.create({
      collection: "projects",
      data: {
        ...project,
        stack: project.stack.map((value) => ({ value })),
      },
    });
  }

  for (const post of posts) {
    await payload.create({
      collection: "posts",
      data: {
        slug: post.slug,
        title: post.title,
        date: post.date,
        kicker: post.kicker,
        excerpt: post.excerpt,
        readMin: post.readMin,
        body: post.bodyLexical as any,
      },
    });
  }

  payload.logger.info(`Seeded ${projects.length} projects and ${posts.length} posts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
