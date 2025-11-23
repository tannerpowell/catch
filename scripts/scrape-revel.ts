import fs from "node:fs";
import path from "node:path";
import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "https://conroe.mw.revelup.online/graphql";
const STORE_ID = Number(process.env.REVEL_STORE_ID || 105);
const TIMEZONE = process.env.REVEL_TIMEZONE || "US/Central";
const MENU_MODE = "ONLINE_ORDERING";

const HEADERS = {
  accept: "*/*",
  "content-type": "application/json",
  referer: "https://conroe.revelup.online/",
  "x-oo-xt-loaded-modules": '["loyalty","config","applepay","giftcard","branding","frontend","paymentmethods","common"]',
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

const FETCH_CATEGORY_LIST = `
  query fetchCategoryList($storeId: Int!, $menuMode: MenuModeTypeChoices!) {
    categories(establishmentId: $storeId, menuMode: $menuMode) {
      id
      name
      subcategories {
        id
        name
        __typename
      }
      __typename
    }
  }
`;

const PRODUCT_LIST = `
  query productList(
    $categoryId: Int!
    $orderTime: SchedulingDataType!
    $timezone: String!
    $menuMode: MenuModeTypeChoices!
  ) {
    products(categoryId: $categoryId, schedulingData: $orderTime, timezone: $timezone, menuMode: $menuMode) {
      availability {
        isAvailable
        nextAvailableDate
        nextAvailableTimeInterval {
          intervalFrom
          intervalTo
          __typename
        }
        __typename
      }
      products {
        __typename
        ... on ProductType {
          id
          name
          image
          description
          price
          subcategoryId
          hasModifiers
          availability {
            isAvailable
            nextAvailableDate
            nextAvailableTimeInterval {
              intervalFrom
              intervalTo
              __typename
            }
            __typename
          }
        }
        ... on MatrixProductType {
          id
          name
          image
          description
          price
          subcategoryId
          hasModifiers
        }
        ... on ComboProductType {
          id
          name
          image
          description
          price
          subcategoryId
          hasModifiers
        }
        ... on GiftCardProductType {
          id
          name
          image
          description
          price
          subcategoryId
        }
      }
    }
  }
`;

async function fetchGraphQL(operationName: string, variables: Record<string, unknown>, query: string) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ operationName, variables, query })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GraphQL request failed (${res.status}): ${text}`);
  }
  const json: any = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const categoriesData = await fetchGraphQL(
    "fetchCategoryList",
    { storeId: STORE_ID, menuMode: MENU_MODE },
    FETCH_CATEGORY_LIST
  );

  const categories: Array<{ id: number; name: string; subcategories: Array<{ id: number; name: string }> }> =
    categoriesData?.categories ?? [];

  const results: Array<{
    categoryId: number;
    category: string;
    subcategories: Array<{ id: number; name: string }>;
    items: Array<{
      id: number;
      name: string;
      slug: string;
      description: string;
      price: number | null;
      image?: string | null;
      isAvailable: boolean;
      subcategoryIds: number[];
    }>;
  }> = [];

  for (const category of categories) {
    const data = await fetchGraphQL(
      "productList",
      {
        categoryId: category.id,
        orderTime: { type: "ASAP", timeSlot: null },
        timezone: TIMEZONE,
        menuMode: MENU_MODE
      },
      PRODUCT_LIST
    );

    const products = data?.products?.products ?? [];
    const availability = data?.products?.availability ?? {};

    const items = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      slug: slugify(product.name),
      description: product.description || "",
      price: typeof product.price === "number" ? product.price : null,
      image: product.image || null,
      isAvailable: product.availability?.isAvailable ?? availability?.isAvailable ?? true,
      subcategoryIds: Array.isArray(product.subcategoryId) ? product.subcategoryId : []
    }));

    results.push({
      categoryId: category.id,
      category: category.name,
      subcategories: category.subcategories,
      items
    });
  }

  const outputPath = path.resolve(process.cwd(), "revel-products.json");
  fs.writeFileSync(outputPath, JSON.stringify({ fetchedAt: new Date().toISOString(), storeId: STORE_ID, categories: results }, null, 2));
  console.log(`Saved ${results.reduce((acc, cat) => acc + cat.items.length, 0)} items across ${results.length} categories to ${outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
