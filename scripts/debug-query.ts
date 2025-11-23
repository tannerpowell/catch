import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@sanity/client";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2025-10-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false
});

(async () => {
  const count = await client.fetch('count(*[_type == "menuItem"])');
  console.log('count', count);
  const doc = await client.fetch('*[_type == "menuItem" && slug.current == $slug][0]{_id, "asset": image.asset->_ref, image}', { slug: 'catfish' });
  console.log('catfish', doc);
})();
