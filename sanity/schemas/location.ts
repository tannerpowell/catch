import { defineField, defineType } from "sanity";
import { MapPin, Clock, CreditCard, ShoppingCart, Settings, Image, Link } from "lucide-react";

export default defineType({
  name: "location",
  title: "Location",
  type: "document",
  groups: [
    { name: "core", title: "Core", icon: MapPin, default: true },
    { name: "hours", title: "Hours", icon: Clock },
    { name: "media", title: "Media", icon: Image },
    { name: "ordering", title: "Online Ordering", icon: ShoppingCart },
    { name: "payments", title: "Payments", icon: CreditCard },
    { name: "integrations", title: "Integrations", icon: Settings },
    { name: "links", title: "Links", icon: Link },
  ],
  fieldsets: [
    { name: "identity", title: "Identity", options: { columns: 2 } },
    { name: "address", title: "Address" },
    { name: "addressGrid", options: { columns: 3 } },
    { name: "contact", title: "Contact", options: { columns: 2 } },
    { name: "orderSettings", title: "Order Settings", options: { columns: 2 } },
    { name: "orderFees", title: "Fees & Minimums", options: { columns: 3 } },
    { name: "stripeStatus", title: "Status", options: { columns: 3 } },
    { name: "stripeLinks", title: "Links", options: { columns: 2 } },
  ],
  fields: [
    // ============ CORE GROUP ============
    defineField({
      name: "name",
      type: "string",
      group: "core",
      fieldset: "identity",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      group: "core",
      fieldset: "identity",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "region",
      title: "Region",
      type: "string",
      group: "core",
      fieldset: "identity",
      options: {
        list: [
          { title: "DFW (Dallas-Fort Worth)", value: "dfw" },
          { title: "Houston", value: "houston" },
          { title: "Oklahoma", value: "oklahoma" },
          { title: "East Texas", value: "east-tx" },
          { title: "West Texas", value: "west-tx" },
        ],
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "storeId",
      title: "Store ID",
      type: "number",
      description: "External store ID (e.g., Revel store)",
      group: "core",
      fieldset: "identity",
      validation: (rule) => rule.required().integer().min(1)
    }),

    // Address fields
    defineField({
      name: "addressLine1",
      title: "Street Address",
      type: "string",
      group: "core",
      fieldset: "address",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "addressLine2",
      title: "Suite / Unit",
      type: "string",
      group: "core",
      fieldset: "address",
    }),
    defineField({
      name: "city",
      type: "string",
      group: "core",
      fieldset: "addressGrid",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "state",
      type: "string",
      group: "core",
      fieldset: "addressGrid",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "postalCode",
      title: "ZIP",
      type: "string",
      group: "core",
      fieldset: "addressGrid",
      validation: (rule) => rule.required()
    }),

    // Contact
    defineField({
      name: "phone",
      type: "string",
      group: "core",
      fieldset: "contact",
      validation: (rule) =>
        rule.required().min(10).regex(/^[\d\s\-\(\)\+]+$/, {
          name: "phone format",
          invert: false
        })
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      description: "For order alerts and Stripe notifications",
      group: "core",
      fieldset: "contact",
      validation: (rule) => rule.custom((email, context) => {
        const parent = context.parent as { onlineOrderingEnabled?: boolean } | undefined;
        const onlineOrderingEnabled = parent?.onlineOrderingEnabled;
        if (onlineOrderingEnabled && !email) {
          return 'Required when online ordering is enabled';
        }
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return 'Invalid email format';
          }
        }
        return true;
      })
    }),

    // ============ HOURS GROUP ============
    defineField({
      name: "hours",
      title: "Business Hours",
      type: "object",
      group: "hours",
      options: { columns: 2 },
      fields: [
        { name: "monday", type: "string", title: "Mon" },
        { name: "tuesday", type: "string", title: "Tue" },
        { name: "wednesday", type: "string", title: "Wed" },
        { name: "thursday", type: "string", title: "Thu" },
        { name: "friday", type: "string", title: "Fri" },
        { name: "saturday", type: "string", title: "Sat" },
        { name: "sunday", type: "string", title: "Sun" },
      ]
    }),

    // ============ MEDIA GROUP ============
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      group: "media",
      options: { hotspot: true },
      fields: [defineField({
        name: "alt",
        type: "string",
        title: "Alt text",
        validation: (rule) => rule.required()
      })],
      description: "Background image for the menu page"
    }),

    // ============ ONLINE ORDERING GROUP ============
    defineField({
      name: "onlineOrderingEnabled",
      title: "Online Ordering Enabled",
      type: "boolean",
      description: "Master switch for online ordering",
      group: "ordering",
      fieldset: "orderSettings",
      initialValue: false
    }),
    defineField({
      name: "acceptingOrders",
      title: "Currently Accepting Orders",
      type: "boolean",
      description: "Temporary toggle (busy times, etc)",
      group: "ordering",
      fieldset: "orderSettings",
      initialValue: true
    }),
    defineField({
      name: "orderTypes",
      title: "Order Types",
      type: "array",
      of: [{ type: "string" }],
      group: "ordering",
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Delivery", value: "delivery" },
          { title: "Dine-In", value: "dine-in" }
        ],
        layout: "grid"
      },
      initialValue: ["pickup"]
    }),
    defineField({
      name: "minimumOrderAmount",
      title: "Minimum Order",
      type: "number",
      description: "In dollars",
      group: "ordering",
      fieldset: "orderFees",
      initialValue: 0,
      validation: (rule) => rule.min(0)
    }),
    defineField({
      name: "deliveryFee",
      title: "Delivery Fee",
      type: "number",
      description: "Flat fee in dollars",
      group: "ordering",
      fieldset: "orderFees",
      initialValue: 0,
      validation: (rule) => rule.min(0)
    }),
    defineField({
      name: "taxRate",
      title: "Tax Rate",
      type: "number",
      description: "e.g., 0.0825 = 8.25%",
      group: "ordering",
      fieldset: "orderFees",
      validation: (rule) => rule.min(0).max(1)
    }),

    // ============ PAYMENTS GROUP (Stripe) ============
    defineField({
      name: "stripeAccountId",
      title: "Account ID",
      type: "string",
      description: "acct_xxxxx",
      group: "payments",
      readOnly: true,
      validation: (rule) => rule.regex(/^acct_[a-zA-Z0-9]+$/).warning("Must be a valid Stripe account ID")
    }),
    defineField({
      name: "stripeOnboardingComplete",
      title: "Onboarding Complete",
      type: "boolean",
      group: "payments",
      fieldset: "stripeStatus",
      initialValue: false
    }),
    defineField({
      name: "stripeChargesEnabled",
      title: "Charges Enabled",
      type: "boolean",
      group: "payments",
      fieldset: "stripeStatus",
      readOnly: true,
      initialValue: false
    }),
    defineField({
      name: "stripePayoutsEnabled",
      title: "Payouts Enabled",
      type: "boolean",
      group: "payments",
      fieldset: "stripeStatus",
      readOnly: true,
      initialValue: false
    }),
    defineField({
      name: "stripeOnboardingLink",
      title: "Onboarding Link",
      type: "url",
      description: "Expires after 24hrs",
      group: "payments",
      fieldset: "stripeLinks",
      readOnly: true
    }),
    defineField({
      name: "stripeDashboardLink",
      title: "Dashboard Link",
      type: "url",
      group: "payments",
      fieldset: "stripeLinks",
      readOnly: true
    }),

    // ============ INTEGRATIONS GROUP ============
    defineField({
      name: "revelEstablishmentId",
      title: "Revel Establishment ID",
      type: "string",
      description: "Revel POS establishment ID",
      group: "integrations"
    }),

    // ============ LINKS GROUP ============
    defineField({
      name: "menuUrl",
      title: "Menu URL",
      type: "url",
      group: "links"
    }),
    defineField({
      name: "directionsUrl",
      title: "Directions URL",
      type: "url",
      group: "links"
    }),
  ],

  preview: {
    select: {
      title: "name",
      city: "city",
      region: "region",
      onlineEnabled: "onlineOrderingEnabled",
      stripeEnabled: "stripeChargesEnabled"
    },
    prepare({ title, city, region, onlineEnabled, stripeEnabled }) {
      const indicators = [];
      if (onlineEnabled) indicators.push("🛒");
      if (stripeEnabled) indicators.push("💳");
      const indicatorStr = indicators.length ? ` ${indicators.join("")}` : "";

      return {
        title,
        subtitle: `${city} · ${region?.toUpperCase() || "—"}${indicatorStr}`
      };
    }
  }
});
