from playwright.sync_api import sync_playwright
import csv

START_URL = "https://conroe.revelup.online/store/5"  # Post Oak store root


def scrape_post_oak(output_csv="post_oak_menu.csv"):
	with sync_playwright() as p:
		browser = p.chromium.launch(headless=True)  # set headless=False to watch it
		context = browser.new_context()
		page = context.new_page()

		try:
			print(f"Navigating to {START_URL}")
			page.goto(START_URL, wait_until="networkidle", timeout=30000)

			# ---- STEP 1: make sure we're on the Post Oak store page ----
			# If this URL already lands you on the store menu, this may be enough.
			# Otherwise, you could add a click here to pick the S. Post Oak store.

			# ---- STEP 2: collect all category buttons (STARTERS, BASKETS, etc.) ----
			# This selector is intentionally generic. You'll likely need to tweak it
			# in devtools (use page.locator("text=STARTERS") etc. to confirm).
			category_buttons = page.locator("button")
		category_count = category_buttons.count()
		print(f"Found {category_count} buttons; filtering to menu categories...")

		# Names we care about, based on what we saw:
		TARGET_CATEGORIES = [
			"STARTERS",
			"BASKETS",
			"BOILED FAVORITES",
			"PO BOYS, TACO'S & SANDWICHES",
			"COMBOS",
			"HOUSE FAVORITES",
			"SIDES",
			"SALADS",
			"DESSERTS",
			"KIDS MEALS",
			"DRINKS",
			"A LA CARTE",
			"Dips",
			"Family Packs",
			"Cajun Creation",
			"Blazing Hen",
		]

		# Normalize label for matching
		def normalize(text: str) -> str:
			return " ".join(text.split()).strip().upper()

		target_norm = {normalize(t): t for t in TARGET_CATEGORIES}

		category_locators = []

		for i in range(category_count):
			btn = category_buttons.nth(i)
			label = btn.inner_text().strip()
			norm = normalize(label)
			if norm in target_norm:
				category_locators.append((target_norm[norm], btn))

		print(f"Matched {len(category_locators)} category buttons.")

		all_items = []

		for cat_name, btn in category_locators:
			print(f"\n=== Scraping category: {cat_name} ===")
			btn.click()
			# Give the page a moment to update content
			page.wait_for_timeout(1500)

			# ---- STEP 3: locate menu items for this category ----
			# The exact markup isn’t visible from here, so this is a *template*.
			# You'll want to:
			#   1. Open devtools in your real browser
			#   2. Inspect a single item (name/desc/price)
			#   3. Replace the selectors below with the actual ones (class names / tags)

			# If that doesn't match anything, fall back to a more generic approach
			if page.locator("css=[data-testid='menu-item'], div.menu-item, li.menu-item").count() == 0:
				# Fallback idea: look for blocks that contain a $ price.
				# This is very heuristic; better to replace with real selectors once you inspect the DOM.
				print("⚠️ No item cards matched with the default selector; "
					  "you’ll likely need to inspect the DOM and adjust selectors.")
				# You can comment out the rest of the loop here if nothing matches.
				continue

			item_cards = page.locator("css=[data-testid='menu-item'], div.menu-item, li.menu-item")
			item_count = item_cards.count()
			print(f"Found ~{item_count} items in {cat_name}")

		for i in range(item_count):
			card = item_cards.nth(i)

			# Again: adjust these based on the DOM structure you see
			# Check if name element exists before accessing text
			name_loc = card.locator("css=.item-name, .name, h3, h2")
			name = ""
			if name_loc.count() > 0:
				name = name_loc.first.inner_text().strip()

			# description might be optional
			desc = ""
			desc_loc = card.locator("css=.item-description, .description, p")
			if desc_loc.count() > 0:
				desc = desc_loc.first.inner_text().strip()

			# Check if price element exists before accessing text
			price_loc = card.locator("css=.price, .item-price, span:has-text('$')")
			price_text = ""
			if price_loc.count() > 0:
				price_text = price_loc.first.inner_text().strip()

			# Only add item if we found at least a name
			if name:
				all_items.append(
					{
						"category": cat_name,
						"name": name,
						"description": desc,
						"price": price_text,
					}
				)

			# ---- STEP 4: write CSV ----
			if not all_items:
				print("No items collected. You probably need to tweak the selectors.")
			else:
				fieldnames = ["category", "name", "description", "price"]
				with open(output_csv, "w", newline="", encoding="utf-8") as f:
					writer = csv.DictWriter(f, fieldnames=fieldnames)
					writer.writeheader()
					writer.writerows(all_items)
				print(f"\n✅ Wrote {len(all_items)} items to {output_csv}")

		except TimeoutError as e:
			print(f"❌ Navigation timeout while accessing {START_URL}: {str(e)}")
			print("The page took too long to load. Check the URL or network connectivity.")
		except Exception as e:
			print(f"❌ Error scraping {START_URL}: {type(e).__name__}: {str(e)}")
		finally:
			# Ensure resources are always cleaned up
			try:
				page.close()
			except:
				pass
			try:
				context.close()
			except:
				pass
			browser.close()


if __name__ == "__main__":
	scrape_post_oak()
