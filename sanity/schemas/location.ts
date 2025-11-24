import { defineField, defineType } from "sanity";

export default defineType({
  name: "location",
  title: "Location",
  type: "document",
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name" },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "storeId",
      type: "number",
      description: "External store ID (e.g., Revel store)",
      validation: (rule) => rule.required().integer().min(1)
    }),
    defineField({
      name: "heroImage",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({
        name: "alt",
        type: "string",
        title: "Alt text",
        validation: (rule) => rule.required()
      })],
      description: "Background image used on the menu page"
    }),
    defineField({
      name: "addressLine1",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({ name: "addressLine2", type: "string" }),
    defineField({
      name: "city",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "state",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "postalCode",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "phone",
      type: "string",
      validation: (rule) =>
        rule.required().min(10).regex(/^[\d\s\-\(\)\+]+$/, {
          name: "phone format",
          invert: false
        })
    }),
    defineField({
      name: "hours",
      type: "object",
      fields: [
        { name: "sunday", type: "string" },
        { name: "monday", type: "string" },
        { name: "tuesday", type: "string" },
        { name: "wednesday", type: "string" },
        { name: "thursday", type: "string" },
        { name: "friday", type: "string" },
        { name: "saturday", type: "string" }
      ]
    }),
    defineField({ name: "menuUrl", type: "url" }),
    defineField({ name: "directionsUrl", type: "url" }),

    // === EMAIL FOR NOTIFICATIONS ===
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      description: "Location manager email (used for Stripe notifications and order alerts)",
      validation: (rule) => rule.custom((email, context: any) => {
        const onlineOrderingEnabled = context.document?.onlineOrderingEnabled;

        // Email is required when online ordering is enabled
        if (onlineOrderingEnabled && !email) {
          return 'Email is required when online ordering is enabled';
        }

        // If email is provided, validate format
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
          }
        }

        return true;
      })
    }),

    // === STRIPE CONNECT FIELDS ===
    defineField({
      name: "stripeAccountId",
      title: "Stripe Connected Account ID",
      type: "string",
      description: "Stripe Connect account ID (e.g., acct_1234567890)",
      readOnly: true,
      validation: (rule) => rule.regex(/^acct_[a-zA-Z0-9]+$/).warning("Must be a valid Stripe account ID")
    }),
    defineField({
      name: "stripeOnboardingComplete",
      title: "Stripe Onboarding Complete",
      type: "boolean",
      description: "Has this location completed Stripe onboarding?",
      initialValue: false
    }),
    defineField({
      name: "stripeChargesEnabled",
      title: "Stripe Charges Enabled",
      type: "boolean",
      description: "Can this location accept payments?",
      readOnly: true,
      initialValue: false
    }),
    defineField({
      name: "stripePayoutsEnabled",
      title: "Stripe Payouts Enabled",
      type: "boolean",
      description: "Can this location receive payouts?",
      readOnly: true,
      initialValue: false
    }),
    defineField({
      name: "stripeOnboardingLink",
      title: "Stripe Onboarding Link",
      type: "url",
      description: "Link for location manager to complete onboarding (expires after 24hrs)",
      readOnly: true
    }),
    defineField({
      name: "stripeDashboardLink",
      title: "Stripe Express Dashboard Link",
      type: "url",
      description: "Link for location manager to view their Stripe dashboard",
      readOnly: true
    }),

    // === REVEL POS FIELDS ===
    defineField({
      name: "revelEstablishmentId",
      title: "Revel Establishment ID",
      type: "string",
      description: "Revel POS establishment ID for this location"
    }),

    // === ONLINE ORDERING SETTINGS ===
    defineField({
      name: "onlineOrderingEnabled",
      title: "Online Ordering Enabled",
      type: "boolean",
      description: "Enable/disable online ordering for this location",
      initialValue: false
    }),
    defineField({
      name: "acceptingOrders",
      title: "Currently Accepting Orders",
      type: "boolean",
      description: "Temporarily enable/disable orders (for busy times, etc)",
      initialValue: true
    }),
    defineField({
      name: "orderTypes",
      title: "Supported Order Types",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Delivery", value: "delivery" },
          { title: "Dine-In", value: "dine-in" }
        ]
      },
      initialValue: ["pickup"]
    }),
    defineField({
      name: "minimumOrderAmount",
      title: "Minimum Order Amount",
      type: "number",
      description: "Minimum order total (in dollars)",
      initialValue: 0,
      validation: (rule) => rule.min(0)
    }),
    defineField({
      name: "deliveryFee",
      title: "Delivery Fee",
      type: "number",
      description: "Flat delivery fee (in dollars)",
      initialValue: 0,
      validation: (rule) => rule.min(0)
    }),
    defineField({
      name: "taxRate",
      title: "Tax Rate",
      type: "number",
      description: "Sales tax rate as decimal (e.g., 0.0825 for 8.25%)",
      validation: (rule) => rule.min(0).max(1)
    })
  ],

  preview: {
    select: {
      title: "name",
      subtitle: "city",
      onlineEnabled: "onlineOrderingEnabled",
      stripeEnabled: "stripeChargesEnabled"
    },
    prepare({ title, subtitle, onlineEnabled, stripeEnabled }) {
      const indicators = [];
      if (onlineEnabled) indicators.push("🛒");
      if (stripeEnabled) indicators.push("💳");

      return {
        title,
        subtitle: [subtitle, indicators.join(" ")].filter(Boolean).join(" ")
      };
    }
  }
});
