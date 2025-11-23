#!/usr/bin/env python3
"""
Scrape menu data (name, description, price, image URL, availability) from multiple
RevelUp stores using Playwright. Starts by visiting each store page to establish
session state, then calls the same GraphQL endpoints the site uses to fetch the
full menu for every category. Outputs one JSON (and optional CSV) file per store,
with an option to download item images.

Usage examples:
  python3 scripts/scrape_revel_playwright.py --store store-5-post-oak
  python3 scripts/scrape_revel_playwright.py --download-images --csv
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List
from urllib.parse import urlparse

from playwright.sync_api import Playwright, sync_playwright

# Targets provided by the user (priority: store/5 Post Oak)
STORES: List[Dict[str, Any]] = [
    {
        "name": "Store 1",
        "slug": "store-1",
        "store_id": 1,
        "url": "https://conroe.revelup.online/store/1/category/28/subcategory/496",
        "timezone": "US/Central",
    },
    {
        "name": "Store 105",
        "slug": "store-105",
        "store_id": 105,
        "url": "https://conroe.revelup.online/store/105/category/1045/subcategory/1047",
        "timezone": "US/Central",
    },
    {
        "name": "Post Oak",
        "slug": "store-5-post-oak",
        "store_id": 5,
        "url": "https://conroe.revelup.online/store/5/category/336/subcategory/481",
        "timezone": "US/Central",
    },
    {
        "name": "Store 2",
        "slug": "store-2",
        "store_id": 2,
        "url": "https://conroe.revelup.online/store/2/category/74/subcategory/483",
        "timezone": "US/Central",
    },
    {
        "name": "Store 4",
        "slug": "store-4",
        "store_id": 4,
        "url": "https://conroe.revelup.online/store/4",
        "timezone": "US/Central",
    },
    {
        "name": "Store 72",
        "slug": "store-72",
        "store_id": 72,
        "url": "https://conroe.revelup.online/store/72/category/913/subcategory/915",
        "timezone": "US/Central",
    },
    {
        "name": "Store 110",
        "slug": "store-110",
        "store_id": 110,
        "url": "https://conroe.revelup.online/store/110/category/2746/subcategory/2747",
        "timezone": "US/Central",
    },
]

MENU_MODE = "ONLINE_ORDERING"
DEFAULT_TIMEZONE = "US/Central"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

FETCH_CATEGORY_LIST = """
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
"""

PRODUCT_LIST = """
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
"""


def slugify(text: str) -> str:
    """Simplified slugifier for filenames and IDs."""
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return re.sub(r"-+", "-", cleaned)


def build_graphql_endpoint(store_url: str) -> str:
    parsed = urlparse(store_url)
    host = (parsed.hostname or "").split(".")[0] or "conroe"
    return f"https://{host}.mw.revelup.online/graphql"


def build_headers(store_url: str) -> Dict[str, str]:
    parsed = urlparse(store_url)
    origin = f"{parsed.scheme}://{parsed.hostname}" if parsed.hostname else "https://conroe.revelup.online"
    return {
        "accept": "*/*",
        "content-type": "application/json",
        "referer": origin + "/",
        "x-oo-xt-loaded-modules": '["loyalty","config","applepay","giftcard","branding","frontend","paymentmethods","common"]',
        "user-agent": USER_AGENT,
    }


def fetch_graphql(api, endpoint: str, headers: Dict[str, str], operation: str, variables: Dict[str, Any], query: str) -> Dict[str, Any]:
    payload = {"operationName": operation, "variables": variables, "query": query}
    response = api.post(endpoint, data=json.dumps(payload), headers=headers, timeout=60 * 1000)
    if response.status != 200:
        raise RuntimeError(f"GraphQL {operation} failed ({response.status}): {response.text()}")
    body = response.json()
    if body.get("errors"):
        raise RuntimeError(f"GraphQL {operation} errors: {json.dumps(body['errors'])}")
    return body.get("data", {})


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_csv(csv_path: Path, categories: List[Dict[str, Any]]) -> None:
    import csv

    fieldnames = ["category", "name", "description", "price", "image", "isAvailable", "subcategoryIds"]
    ensure_dir(csv_path.parent)
    with csv_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for category in categories:
            for item in category.get("items", []):
                writer.writerow(
                    {
                        "category": category["category"],
                        "name": item["name"],
                        "description": item["description"],
                        "price": item["price"],
                        "image": item.get("image") or "",
                        "isAvailable": item["isAvailable"],
                        "subcategoryIds": ";".join(str(x) for x in item.get("subcategoryIds", [])),
                    }
                )


def download_images(api, items: List[Dict[str, Any]], target_dir: Path) -> None:
    ensure_dir(target_dir)
    for item in items:
        image_url = item.get("image")
        if not image_url:
            continue
        ext = Path(urlparse(image_url).path).suffix or ".jpg"
        filename = f"{slugify(item['name'])}{ext}"
        dest = target_dir / filename
        if dest.exists():
            continue
        try:
            res = api.get(image_url, timeout=60 * 1000)
            if res.status != 200:
                print(f"  ! Skipping {image_url} (status {res.status})")
                continue
            dest.write_bytes(res.body())
        except Exception as err:  # pragma: no cover - best-effort
            print(f"  ! Failed to download {image_url}: {err}")


def scrape_store(playwright: Playwright, store: Dict[str, Any], out_dir: Path, download_media: bool, headless: bool) -> None:
    store_slug = store.get("slug") or f"store-{store['store_id']}"
    store_dir = out_dir / store_slug
    ensure_dir(store_dir)

    endpoint = build_graphql_endpoint(store["url"])
    headers = build_headers(store["url"])

    browser = playwright.chromium.launch(headless=headless, args=["--disable-blink-features=AutomationControlled"])
    context = browser.new_context(user_agent=USER_AGENT, viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.add_init_script("Object.defineProperty(navigator, 'webdriver', { get: () => undefined });")

    print(f"→ Visiting {store['name']} ({store['url']})")
    page.goto(store["url"], wait_until="networkidle")
    page.wait_for_timeout(2000)

    # Reuse any cookies the page picked up for API calls.
    storage_state_path = store_dir / "state.json"
    context.storage_state(path=storage_state_path)
    api = playwright.request.new_context(
        user_agent=USER_AGENT,
        extra_http_headers=headers,
        storage_state=str(storage_state_path),
    )

    try:
        categories_data = fetch_graphql(
            api,
            endpoint,
            headers,
            "fetchCategoryList",
            {"storeId": int(store["store_id"]), "menuMode": MENU_MODE},
            FETCH_CATEGORY_LIST,
        )
    except Exception as err:
        browser.close()
        api.dispose()
        raise RuntimeError(f"Failed to fetch categories for {store['name']}: {err}") from err

    categories = categories_data.get("categories", [])
    results: List[Dict[str, Any]] = []

    for category in categories:
        cat_id = category["id"]
        try:
            products_data = fetch_graphql(
                api,
                endpoint,
                headers,
                "productList",
                {
                    "categoryId": cat_id,
                    "orderTime": {"type": "ASAP", "timeSlot": None},
                    "timezone": store.get("timezone", DEFAULT_TIMEZONE),
                    "menuMode": MENU_MODE,
                },
                PRODUCT_LIST,
            )
        except Exception as err:
            print(f"  ! Failed to fetch category {cat_id} ({category['name']}): {err}")
            continue

        availability = (products_data.get("products") or {}).get("availability", {})
        products = (products_data.get("products") or {}).get("products", []) or []

        items = []
        for product in products:
            sub_id = product.get("subcategoryId")
            subcategory_ids = sub_id if isinstance(sub_id, list) else ([sub_id] if sub_id is not None else [])
            items.append(
                {
                    "id": product.get("id"),
                    "name": product.get("name") or "",
                    "slug": slugify(product.get("name") or ""),
                    "description": product.get("description") or "",
                    "price": product.get("price") if isinstance(product.get("price"), (int, float)) else None,
                    "image": product.get("image") or None,
                    "isAvailable": (product.get("availability") or {}).get("isAvailable", availability.get("isAvailable", True)),
                    "subcategoryIds": subcategory_ids,
                }
            )

        results.append(
            {
                "categoryId": cat_id,
                "category": category.get("name") or "",
                "subcategories": category.get("subcategories") or [],
                "items": items,
            }
        )

        print(f"  ✓ {category.get('name')} -> {len(items)} items")

    payload = {
        "fetchedAt": datetime.now(timezone.utc).isoformat(),
        "storeId": store["store_id"],
        "store": store["name"],
        "url": store["url"],
        "categories": results,
    }

    json_path = store_dir / f"{store_slug}.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"  → Saved JSON to {json_path}")

    if download_media:
        flat_items = [item for cat in results for item in cat.get("items", [])]
        download_images(api, flat_items, store_dir / "images")

    browser.close()
    api.dispose()


def main(argv: List[str]) -> None:
    parser = argparse.ArgumentParser(description="Scrape RevelUp menus for multiple stores.")
    parser.add_argument("--store", action="append", help="Slug or store_id to run (default: all).")
    parser.add_argument(
        "--exclude",
        action="append",
        help="Slug or store_id to skip (useful when you already scraped one, e.g. --exclude store-5-post-oak).",
    )
    parser.add_argument("--outdir", default="data/revel", help="Output directory (default: data/revel).")
    parser.add_argument("--csv", action="store_true", help="Also write CSV alongside JSON.")
    parser.add_argument("--download-images", action="store_true", help="Download item images into <outdir>/<store>/images.")
    parser.add_argument("--headed", action="store_true", help="Run browser headed (default: headless).")
    args = parser.parse_args(argv)

    requested = set(str(s).lower() for s in (args.store or []))
    excluded = set(str(s).lower() for s in (args.exclude or []))
    out_dir = Path(args.outdir)

    targets = []
    for store in STORES:
        key = {store["slug"].lower(), str(store["store_id"])}
        if requested and not (requested & key):
            continue
        if excluded & key:
            continue
        targets.append(store)

    if not targets:
        print("No stores matched the selection. Use --store with a slug or store_id.")
        sys.exit(1)

    with sync_playwright() as playwright:
        for store in targets:
            try:
                scrape_store(playwright, store, out_dir, args.download_images, headless=not args.headed)
            except Exception as err:
                print(f"✗ {store['name']} failed: {err}")
                continue

    if args.csv:
        for store in targets:
            store_slug = store.get("slug") or f"store-{store['store_id']}"
            json_path = Path(args.outdir) / store_slug / f"{store_slug}.json"
            if not json_path.exists():
                continue
            data = json.loads(json_path.read_text(encoding="utf-8"))
            csv_path = json_path.with_suffix(".csv")
            write_csv(csv_path, data.get("categories", []))
            print(f"  → CSV saved to {csv_path}")


if __name__ == "__main__":
    main(sys.argv[1:])
