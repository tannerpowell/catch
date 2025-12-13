# The Catch - Menu Audit Report

*Generated: December 12, 2025*

This document provides a comprehensive audit of menu data across all The Catch restaurant locations, identifying ordering systems, menu structures, naming conventions, and pricing variations.

---

## Executive Summary

- **Total Locations**: 15 (3 Oklahoma + 12 Texas)
- **Primary Ordering System**: Revel Systems (all locations have `{location}.revelup.online` subdomains)
- **Secondary Ordering**: OLO (Tyler & Longview only: `thecatchtx.olo.com`)
- **Third-Party Delivery**: UberEats (Garland confirmed active; Denton/Dallas appear inactive)
- **Key Finding**: Menus vary significantly by location in naming, categories, and pricing

---

## 1. Ordering Systems by Location

### All Locations - Revel Systems
Every location has a Revel subdomain configured:

| Location | Revel URL | Status |
|----------|-----------|--------|
| **OKLAHOMA** |||
| OKC-Memorial | `okc.revelup.online` | Active (hours-limited) |
| Midwest City | `midwest.revelup.online` | Active (hours-limited) |
| Moore | `moore.revelup.online` | Active (hours-limited) |
| **TEXAS** |||
| Arlington | `arlington.revelup.online` | Active (hours-limited) |
| Atascocita | `atascocita.revelup.online` | Active (hours-limited) |
| Burleson | `burleson.revelup.online` | Active (hours-limited) |
| Conroe | `conroe.revelup.online` | **Verified with menu** |
| Denton | `denton.revelup.online` | Active (hours-limited) |
| Garland | `garland.revelup.online` | Active (hours-limited) |
| Houston-Post Oak | `postoak.revelup.online` | Active (hours-limited) |
| Houston-Willowbrook | `willowbrook.revelup.online` | Active (hours-limited) |
| Longview | `longview.revelup.online` | Active (hours-limited) |
| Lubbock | `lubbock.revelup.online` | Active (hours-limited) |
| Tyler | `tyler.revelup.online` | Active (hours-limited) |
| Wichita Falls | `wichita.revelup.online` | Active (hours-limited) |

**Note**: Revel online ordering is only available during business hours (typically 10:30 AM - 10:00 PM).

### Tyler & Longview - OLO (Additional)
These two locations also have OLO ordering:
- Tyler: `https://thecatchtx.olo.com/menu/the-catch-tyler`
- Longview: `https://thecatchtx.olo.com/menu/the-catch-longview`

### Third-Party Delivery - UberEats
| Location | UberEats URL | Status |
|----------|--------------|--------|
| Garland | `ubereats.com/store/the-catch-garland/...` | Active |
| Denton | `ubereats.com/store/the-catch-denton/DIQK0cV_TIqLkUI6_fiq6g` | Active |
| Dallas | `ubereats.com/store/the-catch-dallas/uyEZoD1KUmyFHoJIP-MSWQ` | Active |

**Note**: DoorDash blocks automated scraping with captcha. Other locations may also have UberEats - these are the confirmed ones.

---

## 2. Category Structure Comparison

### Revel (Conroe) Categories
1. Starters
2. Baskets
3. Combos
4. Boiled Favorites
5. House Favorites
6. Po Boys, Taco's & Sandwiches
7. Sides
8. Salads
9. Kids Meals
10. A La Carte
11. Desserts
12. Drinks
13. Dips
14. Family Packs
15. Cajun Creation
16. Blazing Hen

### OLO (Tyler/Longview) Categories
1. Soups & Apps
2. Baskets
3. Salads
4. Combos
5. PoBoys (note different spelling)
6. Tacos
7. Favorites & Boiled Items
8. Sides & Add Ons
9. Kids & Family Meals
10. Desserts
11. Drinks

### UberEats (Denton/Dallas) Categories
Based on screenshots from both locations:
1. Featured Items
2. Starters
3. Combos
4. OFF Menu Creations
5. Baskets
6. Boiled Favorites
7. House Favorites
8. Po Boys, Tacos & Sandwiches
9. Sandwiches & More
10. Salads
11. Sides
12. Kids Menu
13. Family Packs
14. Drinks
15. A La Carte
16. Desserts
17. Condiments
18. Dips
19. Catering/Family
20. Cajun Menu (Dallas specific?)

### Website (thecatchseafood.com) Categories
1. Soups & Starters
2. Salads
3. Pasta
4. Po Boys & Tacos
5. House Favorites
6. Fried Combos
7. Baskets
8. Boiled Favorites
9. Sides
10. Desserts
11. Drinks
12. Kids Meals

---

## 3. Naming Convention Differences

### Category Naming Variations
| Concept | Revel | OLO | UberEats | Website |
|---------|-------|-----|----------|---------|
| Appetizers | Starters | Soups & Apps | Starters | Soups & Starters |
| Sandwiches | Po Boys, Taco's & Sandwiches | PoBoys / Tacos | Sandwiches & More | Po Boys & Tacos |
| Boiled Items | Boiled Favorites | Favorites & Boiled Items | Boiled Favorites | Boiled Favorites |
| Children's | Kids Meals | Kids & Family Meals | Kids Menu | Kids Meals |

### Notable Spelling/Format Differences
- **Po'Boy variations**: "Po Boys", "PoBoys", "Po'Boys", "Po-Boys"
- **Taco's vs Tacos**: Revel uses apostrophe ("Taco's"), others don't
- **Étouffée spelling**: Some systems use "Etouffee", others "Étouffée"

---

## 4. Sample Menu Items & Pricing (Conroe Revel)

### Starters
| Item | Price | Description |
|------|-------|-------------|
| Gumbo | $6.59 | Seafood Gumbo (Shrimp, Crawfish & Sausage) |
| Shrimp Etouffee | $6.59 | - |
| Bang Bang Shrimp | $9.99 | - |
| Fried Green Tomatoes | $8.99 | - |
| Loaded Fried Green Tomatoes | $10.99 | - |
| Fried Pickles | $7.99 | - |
| Gator App | $15.99 | - |
| Boudin Balls (6) | $7.99 | - |
| Swamp Fries/Tots | $8.99 | Catch Fries or Tots loaded with Monterrey Jack Cheese, Queso, Diced Tomato, Green... |
| Fried Green Beans | $7.99 | - |
| Fried Mushrooms | $7.99 | - |
| Boudin Egg Rolls (3) | $7.99 | - |

---

## 5. UberEats Garland - Observed Items

From screenshot analysis, the following items were visible:

### Starters
- Gumbo
- Fried Pickles
- Fried Jalapeños
- Fried Green Tomatoes
- Boudin Balls
- Bang Bang Shrimp
- Gator Bites
- And more...

### Baskets
- Catfish Basket
- Shrimp Basket
- Oyster Basket
- Fish & Shrimp Combo
- And more...

### Key Observation
UberEats uses simpler, shorter item names compared to OLO's more descriptive style.

---

## 6. OLO Tyler - Menu Structure (from screenshot)

### Observed Categories & Items

**Soups & Apps**
- Gumbo
- Crawfish Queso Fries
- Fried Green Tomatoes
- Fried Pickles
- Onion Rings

**Baskets**
- Catfish Basket
- Chicken Tenders Basket
- Crawfish Basket
- Fish Strips
- Whitefish Basket
- Jumbo Shrimp Basket
- REG Fried Gator Basket
- Oysters Basket
- Popcorn Shrimp Basket
- Whole Catfish Basket

**Salads**
- House Salad
- Grilled Shrimp Salad
- Blackened Chicken Salad
- Shrimp Remoulade Salad
- Grilled Fish Salad
- Fried Shrimp Salad
- Crispy Chicken Tender Salad

**Combos**
- Shrimp & Catfish
- Shrimp & Whitefish
- Shrimp & Oyster
- Catfish & Tenders
- Crawfish & Oysters
- Catch 22
- And many more combination options...

**PoBoys**
- Popcorn Shrimp PoBoy
- Oyster PoBoy
- Blackened Chicken PoBoy
- Shrimp PoBoy
- Whitefish PoBoy
- Chicken Tender PoBoy
- Catfish PoBoy
- Crawfish PoBoy
- Gator PoBoy

**Tacos**
- Gator Taco
- Shrimp Taco
- Popcorn Shrimp Taco
- Fish Taco
- Crawfish Taco
- Chicken Taco
- Grilled Veggie Taco

**Favorites & Boiled Items**
- Boiled Shrimp by LB
- Crab Legs by LB
- 1/2 LB Shrimp & Crab
- House Fave Grilled Catfish
- House Fave Grilled Whitefish
- House Fave Blacken Tenders
- House Fave Shrimp & Grits
- House Fave Grilled Shrimp
- And more...

**Sides & Add Ons**
- Cole Slaw
- Grits
- Fried Okra
- White Rice
- 1 Garlic Bread
- Potato Only
- Red Beans & Rice
- Corn & Potato
- Side Salad
- Sweet Pot Fries
- 6 Hush Puppies
- Side Queso
- Mushrooms
- 3 Whole Jalapeños
- 1 Catfish
- 1 Whitefish
- Shrimp
- 6 Fried Oysters
- Fried Crawfish
- LB Sausage

**Kids & Family Meals**
- Kids Tenders
- Kids Fish
- Kids Popcorn Shrimp
- Family Meal - 10 Fried Whitefish
- Family Meal - 24 Fried Jumbo Shrimp
- Family Meal - 16 Fried Chicken Tenders
- Family Meal - 16 Fried Catfish & 12 Fried
- Family Meal - 24 Fried Catfish Strips
- Family Meal - Fried Shrimp, Catfish &

**Desserts**
- Banana Pudding
- Key Lime Pie

**Drinks**
- Medium Drink
- Large Drink
- Water

---

## 7. Key Findings & Recommendations

### Current State Issues

1. **No Single Source of Truth**: Menu data exists in multiple systems (Revel, OLO, UberEats, website) with no synchronization

2. **Naming Inconsistencies**: Same items have different names across platforms
   - Makes inventory/reporting difficult
   - Confuses customers who use multiple platforms

3. **Category Structure Varies**: Each platform organizes items differently
   - OLO has 11 categories
   - Revel has 16 categories
   - UberEats has 14 categories

4. **Sanity Shows All Items Everywhere**: Current Sanity database shows 234 items at ALL 16 locations because no `available: false` flags are set

5. **Pricing Likely Varies**: Different prices on different platforms (common for delivery markup)

### Recommended Next Steps

1. **Create Master Item List**: Export all items from each system into a spreadsheet
   - Consolidate duplicates
   - Standardize naming conventions
   - Assign canonical category

2. **Define Standard Categories**: Agree on one set of categories for all platforms
   - Recommended: Use website categories as base (most customer-facing)

3. **Map Location Availability**: For each item, determine which locations actually serve it
   - Use Revel as source of truth (POS system)
   - Set `available: false` in Sanity for items not at each location

4. **Establish Pricing Tiers**:
   - Base price (in-store/website)
   - Delivery platform markup (typically 15-30%)

5. **Build Sync Pipeline**: Eventually connect Sanity to:
   - Revel (for POS accuracy)
   - OLO (for Tyler/Longview)
   - UberEats/DoorDash APIs
   - Website
   - TV displays

---

## 8. Data Sources Collected

| Source | Location | File | Contents |
|--------|----------|------|----------|
| Revel | Conroe | `/tmp/revel-conroe.pdf` | Full menu with prices |
| OLO | Tyler | `/tmp/olo-tyler2.png` | Full menu screenshot |
| OLO | Longview | `/tmp/olo-longview.png` | Full menu screenshot |
| UberEats | Garland | `/tmp/ubereats-garland.png` | Full menu with prices |
| UberEats | Denton | `/tmp/ubereats-denton2.png` | Full menu with prices |
| UberEats | Dallas | `/tmp/ubereats-dallas2.png` | Full menu with prices |
| Website | All | `/tmp/thecatch-menu.png` | Static menu image |
| Locations | All | `/tmp/thecatch-locations.png` | All 15 locations |

### UberEats Store URLs (Confirmed)
- **Garland**: https://www.ubereats.com/store/the-catch-garland/bM15aXmOTQCnCJaS_FNaVA
- **Denton**: https://www.ubereats.com/store/the-catch-denton/DIQK0cV_TIqLkUI6_fiq6g
- **Dallas**: https://www.ubereats.com/store/the-catch-dallas/uyEZoD1KUmyFHoJIP-MSWQ

---

## Appendix: Location Details

### Oklahoma (3)
1. **OKC-Memorial** - 2127 West Memorial Rd, Oklahoma City, OK 73134 - (405) 849-4300
2. **Midwest City** - 2320 South Air Depot Blvd, Midwest City, OK 73110 - (405) 931-9826
3. **Moore** - 1301 South I-35 Service Rd, Moore, OK 73160 - (405) 735-5559

### Texas (12)
1. **Arlington** - 5809 West I-20, Arlington, TX 76017 - (817) 765-2226
2. **Atascocita** - 6730 Atascocita Rd STE 115, Atascocita, TX 77346 - (281) 973-9825
3. **Burleson** - 1505 SW Wilshire Blvd STE 610, Burleson, TX 76028 - (817) 447-4302
4. **Conroe** - 2121 West Davis St, Conroe, TX 77304 - (936) 521-1618
5. **Denton** - 1725 West University Dr, Denton, TX 76201 - (940) 703-6955
6. **Garland** - 5949 Broadway Blvd, Garland, TX 75043 - (972) 240-8800
7. **Houston-Post Oak** - 10105 S Post Oak Rd, Houston, TX 77096 - (713) 300-4860
8. **Houston-Willowbrook** - 7608-B FM 1960 W, Houston, TX 77070 - (281) 661-1760
9. **Longview** - 3312 North 4th St, Longview, TX 75605 - (903) 600-3115
10. **Lubbock** - 5111 82nd St, Lubbock, TX 79424 - (806) 701-2900
11. **Tyler** - 1714 South Beckham Ave, Tyler, TX 75701 - (903) 500-7514
12. **Wichita Falls** - 4004 Kemp Blvd, Wichita Falls, TX 76308 - (940) 228-7864
