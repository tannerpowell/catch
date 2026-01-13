import groq from "groq";

export const qCategories = groq`*[_type=="menuCategory"]|order(position asc){ "slug": slug.current, title, position, description }`;

export const qLocations = groq`*[_type=="location"]{ _id, name, "slug": slug.current, region, addressLine1, addressLine2, city, state, postalCode, phone, hours, revelUrl, doordashUrl, uberEatsUrl, menuUrl, directionsUrl, "heroImage": heroImage.asset->url, "geo": geo }`;

export const qItems = groq`*[_type=="menuItem"]{
  _id,
  name,
  "slug": slug.current,
  description,
  "categorySlug": category->slug.current,
  "image": image.asset->url,
  badges,
  "basePrice": basePrice,
  availableEverywhere,
  allowSpecialInstructions,
  "overrides": coalesce(locationOverrides, [])[]{ "loc": location->slug.current, price, available },
  "modifierGroups": modifierGroups[]->{
    _id,
    name,
    "slug": slug.current,
    description,
    required,
    multiSelect,
    minSelections,
    maxSelections,
    displayOrder,
    options[]{ _key, name, price, isDefault, available, calories }
  } | order(displayOrder asc),
  "itemModifierOverrides": itemModifierOverrides[]{
    _key,
    "modifierGroupId": modifierGroup->_id,
    optionName,
    price,
    available
  }
}`;

export const qLocationBySlug = groq`*[_type=="location" && slug.current==$s][0]{ _id, name, "slug": slug.current, region, addressLine1, addressLine2, city, state, postalCode, phone, hours, menuUrl, directionsUrl, revelUrl, doordashUrl, uberEatsUrl, "heroImage": heroImage.asset->url, "geo": geo }`;
