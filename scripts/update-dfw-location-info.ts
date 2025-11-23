/**
 * Update DFW location information with data from the-catch-data.json
 */
import { createClient } from "@sanity/client";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(".env.local") });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_WRITE_TOKEN!,
  apiVersion: "2024-08-01",
  useCdn: false,
});

async function main() {
  console.log("Updating DFW location information...\n");

  const dfwDataPath = path.resolve("data/the catch dfw/the-catch-data.json");
  const dfwData = JSON.parse(fs.readFileSync(dfwDataPath, "utf-8"));

  const locations = dfwData.locations || {};
  const orderProviders = dfwData.order_providers || {};

  const updates = [
    {
      _id: "loc-denton",
      updates: {
        phone: locations.denton?.phone_href?.replace("tel:", "") || "+1 940-435-0161",
        addressLine1: locations.denton?.address_lines?.[0] || "1725 W University Dr",
        city: locations.denton?.address_lines?.[1]?.split(",")?.[0] || "Denton",
        state: "TX",
        postalCode: locations.denton?.address_lines?.[1]?.match(/\d{5}/)?.[0] || "76201",
        uberEatsUrl: orderProviders.denton?.uber_eats || null,
        doordashUrl: orderProviders.denton?.doordash || null,
        menuUrl: orderProviders.denton?.in_store_online || null,
      },
    },
    {
      _id: "loc-garland",
      updates: {
        phone: locations.garland?.phone_href?.replace("tel:", "") || "+1 469-443-0033",
        addressLine1: locations.garland?.address_lines?.[0] || "5949 Broadway Blvd",
        city: locations.garland?.address_lines?.[1]?.split(",")?.[0] || "Garland",
        state: "TX",
        postalCode: locations.garland?.address_lines?.[1]?.match(/\d{5}/)?.[0] || "75043",
        uberEatsUrl: orderProviders.garland?.uber_eats || null,
        doordashUrl: orderProviders.garland?.doordash || null,
        menuUrl: orderProviders.garland?.in_store_online || null,
      },
    },
    {
      _id: "loc-coit-campbell",
      updates: {
        phone: locations.coit_campbell?.phone_href?.replace("tel:", "") || "+1 214-484-1941",
        addressLine1: locations.coit_campbell?.address_lines?.[0] || "7522 Campbell Rd #108",
        city: locations.coit_campbell?.address_lines?.[1]?.split(",")?.[0] || "Dallas",
        state: "TX",
        postalCode: locations.coit_campbell?.address_lines?.[1]?.match(/\d{5}/)?.[0] || "75248",
        uberEatsUrl: orderProviders.coit_campbell?.uber_eats || null,
        doordashUrl: orderProviders.coit_campbell?.doordash || null,
        menuUrl: orderProviders.coit_campbell?.in_store_online || null,
      },
    },
  ];

  for (const { _id, updates: locationUpdates } of updates) {
    console.log(`Updating ${_id}...`);
    await client.patch(_id).set(locationUpdates).commit();
  }

  console.log("\n✅ Successfully updated DFW location info!");

  // Verify
  const dfwLocations = await client.fetch(
    `*[_type == "location" && _id in ["loc-denton", "loc-garland", "loc-coit-campbell"]] {
      name, phone, addressLine1, city, state, postalCode, uberEatsUrl, doordashUrl, menuUrl
    }`
  );

  console.log("\nUpdated locations:");
  dfwLocations.forEach((loc: any) => {
    console.log(`\n${loc.name}:`);
    console.log(`  Address: ${loc.addressLine1}, ${loc.city}, ${loc.state} ${loc.postalCode}`);
    console.log(`  Phone: ${loc.phone}`);
    console.log(`  UberEats: ${loc.uberEatsUrl ? "✓" : "✗"}`);
    console.log(`  DoorDash: ${loc.doordashUrl ? "✓" : "✗"}`);
    console.log(`  Menu: ${loc.menuUrl ? "✓" : "✗"}`);
  });
}

main().catch(console.error);
