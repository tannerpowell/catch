#!/usr/bin/env node

/**
 * Categorize menu items by protein for batch image generation
 * Groups items thematically to ensure consistent AI output
 */

// All 180 items without images (from Sanity query)
const ITEMS_WITHOUT_IMAGES = [
  { name: "(12) Jumbo Shrimp", description: "12 count" },
  { name: "1/2lb Boiled Shrimp", description: "" },
  { name: "1/2lb Fried Snow Crab", description: "" },
  { name: "1/2lb Snow Crab", description: "" },
  { name: "1lb Boiled Shrimp", description: "" },
  { name: "1lb Fried Snow Crab", description: "" },
  { name: "1lb Snow Crab", description: "" },
  { name: "24 Jumbo Shrimp", description: "" },
  { name: "2lb Snow Crab", description: "" },
  { name: "3 Tender Basket", description: "" },
  { name: "4 Oysters", description: "fried" },
  { name: "5 Tender Basket", description: "" },
  { name: "7 Tender Basket", description: "" },
  { name: "8 Catfish & 12 Jumbo Shrimp", description: "" },
  { name: "8 Catfish, 12 Jumbo Shrimp & 8 Chicken Tenders", description: "" },
  { name: "Add (1) Catfish Fillet", description: "" },
  { name: "Add (2.5 oz) Crawfish Tails", description: "" },
  { name: "Add (2.5 oz) Popcorn Shrimp", description: "" },
  { name: "Add (3) Chicken Tenders", description: "" },
  { name: "Add (4) Fried Oysters", description: "" },
  { name: "Add (4) Jumbo Shrimp", description: "" },
  { name: "Add (4) Oysters", description: "" },
  { name: "Add 1/2lb Boiled Mushrooms", description: "" },
  { name: "Admirals Platter", description: "Catfish (2), Whitefish (1), Jumbo Shrimp (6), Fried Oysters (2), and Crawfish Tails with a side item and 4 hush puppies" },
  { name: "Alfredo Pasta (Blackened Shrimp or Chicken)", description: "Penne Pasta tossed in a Creamy Alfredo Sauce with your choice of Chicken or Shrimp" },
  { name: "Bang Bang Dip", description: "2oz" },
  { name: "Bayou Fries", description: "A Large order of Fries loaded with Monterey Jack cheese, queso, diced tomato, green onion, bacon bits and sour cream" },
  { name: "Bayou Trio", description: "" },
  { name: "Beignets", description: "" },
  { name: "Big Easy Style", description: "" },
  { name: "Boiled Egg", description: "" },
  { name: "Boiled Shrimp", description: "" },
  { name: "Bottle Water", description: "" },
  { name: "Bottled Water", description: "" },
  { name: "Boudin Egg Rolls (3)", description: "" },
  { name: "Bowl of Gumbo", description: "" },
  { name: "Bowl of butter", description: "16 oz of butter" },
  { name: "Bowl of Étouffée", description: "" },
  { name: "Buffalo Ranch - Catfish Nuggets & Shrimp", description: "" },
  { name: "Buffalo Ranch Catfish Nuggets & Shrimp Combo", description: "" },
  { name: "Buffalo Ranch Chicken Tender Sandwich", description: "" },
  { name: "Cajun Fries", description: "" },
  { name: "Cajun Style", description: "" },
  { name: "Cajun Tots", description: "" },
  { name: "Captains Combo", description: "Catfish (2), Jumbo Shrimp (4) and 4 Boudin Balls" },
  { name: "Catch 22", description: "Catfish (1), Whitefish (1), Oysters (2), Jumbo Shrimp (4), with side item and 3 hush puppies" },
  { name: "Catch Cookie (Chocolate Chip)", description: "" },
  { name: "Catch Fries", description: "" },
  { name: "Catch Tots", description: "" },
  { name: "Catfish & Cajun Tenders", description: "" },
  { name: "Catfish & Shrimp", description: "" },
  { name: "Catfish (1) & Chicken Tenders (3) Combo", description: "" },
  { name: "Catfish (1) & Crawfish Tails", description: "" },
  { name: "Catfish (1) & Crawfish Tails Combo", description: "" },
  { name: "Catfish (1) & Gator", description: "" },
  { name: "Catfish (1) & Gator Combo", description: "" },
  { name: "Catfish (1) & Tenders (3)", description: "" },
  { name: "Catfish (1) & Tenders (3) Combo", description: "" },
  { name: "Catfish (10)", description: "" },
  { name: "Catfish (2) & Fried Oysters (4)", description: "" },
  { name: "Catfish (2) & Gator Combo", description: "" },
  { name: "Catfish (8) & Jumbo Shrimp (12)", description: "" },
  { name: "Catfish (8), Jumbo Shrimp (12) & Chicken Tenders (8)", description: "" },
  { name: "Catfish Atchafalaya", description: "" },
  { name: "Catfish Nugget Basket", description: "" },
  { name: "Catfish Nuggets", description: "" },
  { name: "Catfish Nuggets & Shrimp Combo", description: "" },
  { name: "Catfish Po' Boy", description: "" },
  { name: "Cheesecake", description: "" },
  { name: "Cheesy OG Hot Chicken", description: "" },
  { name: "Chicken Tenders", description: "" },
  { name: "Chicken Tenders (16)", description: "" },
  { name: "Choc Chip Cookie", description: "" },
  { name: "Cole Slaw", description: "" },
  { name: "Corn (1) & Potatoes (2)", description: "" },
  { name: "Crawfish Tails Po' Boy", description: "" },
  { name: "Creamy Cajun Sauce", description: "8 oz" },
  { name: "Cup of Gumbo", description: "" },
  { name: "Cup of Ice", description: "" },
  { name: "Cup of butter", description: "8oz" },
  { name: "Cup of Étouffée", description: "" },
  { name: "Dipping Sauce", description: "" },
  { name: "Dips", description: "" },
  { name: "Dirty Rice", description: "" },
  { name: "Double", description: "" },
  { name: "Egg", description: "Sliced egg" },
  { name: "Extra Belgian Waffle", description: "" },
  { name: "Extra Garlic Bread", description: "" },
  { name: "Extra Tender", description: "" },
  { name: "Fountain Drink", description: "" },
  { name: "French Quarter Style", description: "" },
  { name: "Fried Green Beans", description: "" },
  { name: "Fried Okra", description: "" },
  { name: "Fried Oysters Po' Boy", description: "" },
  { name: "Fried Snow Crab", description: "" },
  { name: "Fries", description: "" },
  { name: "Gallon Sweet/Unsweet Tea", description: "" },
  { name: "Garlic Bread", description: "" },
  { name: "Green Beans", description: "" },
  { name: "Grilled Sausage", description: "" },
  { name: "Half & Half Po' Boy", description: "Shrimp & Oyster Po' Boy" },
  { name: "Jumbo Shrimp", description: "" },
  { name: "Jumbo Shrimp (4) & Chicken Tenders (4)", description: "" },
  { name: "Jumbo Shrimp (4) & Fried Oysters (4)", description: "" },
  { name: "Jumbo Shrimp (4) & Tenders (4)", description: "" },
  { name: "Jumbo Shrimp (4) & Whitefish (2)", description: "" },
  { name: "Jumbo Shrimp (6) & Catfish (1) Combo", description: "" },
  { name: "Jumbo Shrimp (6), Catfish (1) & Tenders (2) Combo", description: "" },
  { name: "Jumbo Shrimp (8) & Catfish (2) Combo", description: "" },
  { name: "Jumbo Shrimp Basket", description: "5, 8 or 12 Jumbo Shrimp with your choice of side item and 2 hush puppies" },
  { name: "Jumbo Shrimp Po' Boy", description: "" },
  { name: "Kids Catfish Nuggets", description: "" },
  { name: "Kids Chicken Tenders", description: "" },
  { name: "Kids Popcorn Shrimp", description: "" },
  { name: "Lemons", description: "" },
  { name: "Mac & Cheese", description: "" },
  { name: "Oyster Po' Boy", description: "" },
  { name: "Oysters & Shrimp Po' Boy", description: "" },
  { name: "Peanut Butter Cookie", description: "" },
  { name: "Popcorn Shrimp Basket", description: "" },
  { name: "Red Beans & Rice", description: "" },
  { name: "Shrimp Po' Boy", description: "" },
  { name: "Side Butter", description: "" },
  { name: "Single", description: "" },
  { name: "Stuffed Crab", description: "" },
  { name: "Sweet Potato Fries", description: "" },
  { name: "Tater Tots", description: "" },
  { name: "Triple", description: "" },
  { name: "Whitefish", description: "" },
  { name: "Whitefish (10)", description: "" },
  { name: "Whitefish Po' Boy", description: "" },
];

// Categorization rules by protein/type
const CATEGORIES = {
  shrimp: {
    keywords: ['shrimp', 'popcorn shrimp'],
    referenceImage: 'big-bang-shrimp__hero_4x3.jpg',
    description: 'Gulf shrimp, golden-fried or boiled, served Cajun style'
  },
  catfish: {
    keywords: ['catfish'],
    referenceImage: 'catfish-basket__hero_4x3.jpg',
    description: 'Southern fried catfish fillets, golden and crispy'
  },
  chicken: {
    keywords: ['chicken', 'tender', 'tenders'],
    referenceImage: 'chicken-and-waffles__hero_4x3.jpg',
    description: 'Crispy fried chicken tenders, golden brown'
  },
  crab: {
    keywords: ['crab', 'snow crab'],
    referenceImage: 'the-catch-boil__hero_4x3.jpg',
    description: 'Snow crab legs, steamed or fried Cajun style'
  },
  oyster: {
    keywords: ['oyster', 'oysters'],
    referenceImage: 'french-quarter-plate__hero_4x3.jpg',
    description: 'Fried oysters, golden and crispy'
  },
  crawfish: {
    keywords: ['crawfish'],
    referenceImage: 'cajun-special__hero_4x3.jpg',
    description: 'Louisiana crawfish tails, Cajun seasoned'
  },
  gator: {
    keywords: ['gator', 'alligator'],
    referenceImage: 'cajun-special__hero_4x3.jpg',
    description: 'Crispy fried alligator bites'
  },
  combo: {
    keywords: ['combo', 'platter', '&', 'and'],
    referenceImage: 'the-big-easy__hero_4x3.jpg',
    description: 'Seafood combo platter with multiple proteins'
  },
  poboy: {
    keywords: ["po'", 'po-boy', 'sandwich'],
    referenceImage: 'chicken-and-waffles__hero_4x3.jpg',
    description: "New Orleans style po' boy sandwich"
  },
  sides: {
    keywords: ['fries', 'tots', 'rice', 'beans', 'slaw', 'okra', 'corn', 'potato', 'mac', 'cheese', 'salad', 'bread'],
    referenceImage: 'swamp-fries__hero_4x3.jpg',
    description: 'Southern side dish'
  },
  soups: {
    keywords: ['gumbo', 'étouffée', 'etouffee', 'bowl', 'cup'],
    referenceImage: 'gumbo__hero_4x3.jpg',
    description: 'Louisiana soup or stew'
  },
  desserts: {
    keywords: ['beignet', 'cookie', 'cheesecake', 'pudding', 'pie', 'waffle'],
    referenceImage: 'warm-beignets__hero_4x3.jpg',
    description: 'Southern dessert'
  },
  sauces: {
    keywords: ['sauce', 'dip', 'butter', 'dips'],
    referenceImage: 'hush-puppies__hero_4x3.jpg',
    description: 'Dipping sauce or condiment'
  },
  drinks: {
    keywords: ['water', 'drink', 'tea', 'ice'],
    referenceImage: null, // Skip drinks
    description: 'Beverage'
  },
  addons: {
    keywords: ['add', 'extra', 'lemons', 'egg'],
    referenceImage: null, // Skip small add-ons
    description: 'Menu add-on item'
  }
};

function categorizeItem(item) {
  const nameLower = item.name.toLowerCase();
  const descLower = (item.description || '').toLowerCase();
  const combined = `${nameLower} ${descLower}`;

  for (const [category, config] of Object.entries(CATEGORIES)) {
    for (const keyword of config.keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return 'other';
}

// Categorize all items
const categorized = {};
for (const item of ITEMS_WITHOUT_IMAGES) {
  const category = categorizeItem(item);
  if (!categorized[category]) {
    categorized[category] = [];
  }
  categorized[category].push(item);
}

// Output summary
console.log('\n=== Menu Items Categorized by Protein ===\n');
for (const [category, items] of Object.entries(categorized).sort((a, b) => b[1].length - a[1].length)) {
  const config = CATEGORIES[category] || { referenceImage: null };
  console.log(`${category.toUpperCase()} (${items.length} items)${config.referenceImage ? ` - ref: ${config.referenceImage}` : ' - SKIP'}`);
  for (const item of items.slice(0, 5)) {
    console.log(`  - ${item.name}`);
  }
  if (items.length > 5) {
    console.log(`  ... and ${items.length - 5} more`);
  }
  console.log('');
}

// Export for batch processing
const batchGroups = Object.entries(categorized)
  .filter(([cat]) => CATEGORIES[cat]?.referenceImage) // Only categories with references
  .map(([category, items]) => ({
    category,
    referenceImage: CATEGORIES[category].referenceImage,
    baseDescription: CATEGORIES[category].description,
    items: items.map(i => ({ name: i.name, description: i.description }))
  }));

console.log('\n=== Batch Groups for Generation ===');
console.log(`Total items to generate: ${batchGroups.reduce((acc, g) => acc + g.items.length, 0)}`);
console.log(`Categories with reference images: ${batchGroups.length}`);

// Write batch config
import { writeFileSync } from 'fs';
writeFileSync(
  './data/batch-groups.json',
  JSON.stringify(batchGroups, null, 2)
);
console.log('\nWrote batch-groups.json');
