import type { Location, MenuCategory, MenuItem } from "@/lib/types";

export const demoCategories: MenuCategory[] = [
  { slug: "starters", title: "Starters", description: "Begin with something crispy and shareable." },
  { slug: "baskets", title: "Seafood Baskets", description: "House favorites served with fries and hushpuppies." }
];

export const demoLocations: Location[] = [
  {
    _id: "demo-humble",
    name: "The Catch – Humble",
    slug: "humble",
    addressLine1: "19325 Timber Forest Dr",
    city: "Humble",
    state: "TX",
    postalCode: "77346",
    phone: "(281) 812-4010",
    hours: {
      monday: "11am – 9pm",
      tuesday: "11am – 9pm",
      wednesday: "11am – 9pm",
      thursday: "11am – 9pm",
      friday: "11am – 10pm",
      saturday: "11am – 10pm",
      sunday: "11am – 8pm"
    },
    menuUrl: "https://thecatchusa.com/menu",
    directionsUrl: "https://maps.apple.com/?q=The%20Catch%20Humble",
    heroImage: "/images/Location-Humble.jpg"
  },
  {
    _id: "demo-willowbrook",
    name: "The Catch – Willowbrook",
    slug: "willowbrook",
    addressLine1: "17615 Tomball Pkwy",
    city: "Houston",
    state: "TX",
    postalCode: "77064",
    phone: "(346) 867-5282",
    hours: {
      monday: "11am – 9pm",
      tuesday: "11am – 9pm",
      wednesday: "11am – 9pm",
      thursday: "11am – 9pm",
      friday: "11am – 10pm",
      saturday: "11am – 10pm",
      sunday: "11am – 8pm"
    },
    menuUrl: "https://thecatchusa.com/menu",
    directionsUrl: "https://maps.apple.com/?q=The%20Catch%20Willowbrook",
    heroImage: "/images/Location-Willowbrook.jpg"
  }
];

export const demoItems: MenuItem[] = [
  {
    id: "demo-cajun-fondue",
    name: "Cajun Shrimp Fondue",
    slug: "cajun-shrimp-fondue",
    categorySlug: "starters",
    description: "Creamy Monterey Jack fondue with blackened shrimp and toasted baguette slices.",
    price: 12.5,
    badges: ["Cajun"],
    image: "/placeholder.jpg"
  },
  {
    id: "demo-fried-green-tomatoes",
    name: "Fried Green Tomatoes",
    slug: "fried-green-tomatoes",
    categorySlug: "starters",
    description: "Cornmeal-dusted tomatoes with remoulade sauce.",
    price: 9,
    badges: ["Fried", "Vegetarian"],
    image: "/placeholder.jpg"
  },
  {
    id: "demo-catfish-basket",
    name: "Southern Catfish Basket",
    slug: "southern-catfish-basket",
    categorySlug: "baskets",
    description: "Cornmeal fried catfish served with seasoned fries, hushpuppies, and jalapeño ranch.",
    price: 15,
    badges: ["Fried"],
    image: "/placeholder.jpg"
  },
  {
    id: "demo-grilled-salmon",
    name: "Blackened Salmon Plate",
    slug: "blackened-salmon-plate",
    categorySlug: "baskets",
    description: "Cast-iron blackened salmon with dirty rice and seasonal vegetables.",
    price: 19.5,
    badges: ["Grilled", "Cajun"],
    image: "/placeholder.jpg"
  }
];
