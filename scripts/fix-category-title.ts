import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

async function fixCategoryTitle() {
  try {
    // Find the category with slug "sandwiches-more"
    const category = await client.fetch(
      `*[_type == "menuCategory" && slug.current == "sandwiches-more"][0]`
    );

    if (!category) {
      console.log('Category not found');
      return;
    }

    console.log('Found category:', category.title);

    // Update the title
    const result = await client
      .patch(category._id)
      .set({ title: 'Sandwiches & More' })
      .commit();

    console.log('Updated category title to:', result.title);
  } catch (error) {
    console.error('Error updating category:', error);
  }
}

fixCategoryTitle();
