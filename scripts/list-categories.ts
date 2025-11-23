import {createClient} from '@sanity/client'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false
})

async function listCategories() {
  const categories = await client.fetch('*[_type == "menuCategory"] | order(order asc) {_id, title, slug, order}')
  console.log(JSON.stringify(categories, null, 2))
}

listCategories()
