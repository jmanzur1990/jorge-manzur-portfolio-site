import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { Media } from "./collections/Media";
import { Posts } from "./collections/Posts";
import { Projects } from "./collections/Projects";
import { Users } from "./collections/Users";
import { About } from "./globals/About";
import { Contact } from "./globals/Contact";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseURL = process.env.DATABASE_URL;
const payloadSecret = process.env.PAYLOAD_SECRET;
const allowBuildTimeSecretPlaceholder =
  process.env.PAYLOAD_CONFIG_ALLOW_BUILD_PLACEHOLDER === "1" && process.env.npm_lifecycle_event === "build";

if (!databaseURL && process.env.NODE_ENV !== "production") {
  console.warn("DATABASE_URL is not set. Payload routes need a Postgres connection at runtime.");
}

if (!payloadSecret && process.env.NODE_ENV !== "production") {
  console.warn("PAYLOAD_SECRET is not set. Payload auth needs this at runtime.");
}

if (databaseURL && !payloadSecret) {
  throw new Error("PAYLOAD_SECRET is required when DATABASE_URL is configured.");
}

if (!payloadSecret && !allowBuildTimeSecretPlaceholder) {
  throw new Error("PAYLOAD_SECRET is required at runtime.");
}

const resolvedPayloadSecret = payloadSecret || "local-build-placeholder";

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Projects, Posts],
  globals: [About, Contact],
  db: postgresAdapter({
    pool: {
      connectionString: databaseURL,
    },
  }),
  editor: lexicalEditor({}),
  plugins: [
    vercelBlobStorage({
      collections: {
        media: {
          disableLocalStorage: true,
        },
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  secret: resolvedPayloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
