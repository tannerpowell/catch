import { defineType, defineField } from "sanity";

/**
 * Validate a phone number allowing international formats and common separators.
 *
 * @param value - The phone number string to validate
 * @returns `true` if the phone number is valid; otherwise an error message describing the violation (invalid characters, too few digits, or too many digits)
 */
function validatePhoneNumber(value: string | undefined): boolean | string {
  if (!value || typeof value !== "string") {
    return "Phone number is required";
  }

  // Extract only digits from the phone number
  const digitsOnly = value.replace(/\D/g, "");

  // Check minimum length (10 digits is minimum for most country codes)
  if (digitsOnly.length < 10) {
    return "Phone number must contain at least 10 digits";
  }

  // Check maximum length (E.164 standard max is 15 digits)
  if (digitsOnly.length > 15) {
    return "Phone number exceeds maximum length (15 digits)";
  }

  // Validate that the original format only contains allowed characters
  if (!/^[\d\s\-\(\)\+]+$/.test(value)) {
    return "Phone number contains invalid characters. Use digits, spaces, hyphens, parentheses, or plus sign";
  }

  return true;
}

export default defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    // === ORDER IDENTIFICATION ===
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      description: "Human-readable order number (e.g., ORD-20250123-001)",
      readOnly: true
    }),
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: "⏳ Pending Payment", value: "pending" },
          { title: "✅ Confirmed", value: "confirmed" },
          { title: "👨‍🍳 Preparing", value: "preparing" },
          { title: "🔔 Ready for Pickup", value: "ready" },
          { title: "✅ Completed", value: "completed" },
          { title: "❌ Cancelled", value: "cancelled" }
        ]
      },
      initialValue: "pending",
      validation: (rule) => rule.required()
    }),

    // === LOCATION & ROUTING ===
    defineField({
      name: "location",
      title: "Location",
      type: "reference",
      to: [{ type: "location" }],
      description: "Which restaurant location this order is for",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "locationSnapshot",
      title: "Location Snapshot",
      type: "object",
      description: "Snapshot of location details at time of order",
      fields: [
        { name: "name", type: "string", title: "Name" },
        { name: "address", type: "string", title: "Address" },
        { name: "phone", type: "string", title: "Phone" }
      ]
    }),

    // === CUSTOMER INFORMATION ===
    defineField({
      name: "customer",
      title: "Customer",
      type: "object",
      fields: [
        defineField({
          name: "name",
          type: "string",
          title: "Name",
          validation: (rule) => rule.required()
        }),
        defineField({
          name: "email",
          type: "string",
          title: "Email",
          validation: (rule) => rule.required().email()
        }),
        defineField({
          name: "phone",
          type: "string",
          title: "Phone",
          description: "International phone number (e.g., +1-555-123-4567 or (555) 123-4567)",
          validation: (rule) => rule.required().custom((value: string | undefined) => {
            const result = validatePhoneNumber(value);
            // Sanity expects true or string error message, not false
            if (result === true) return true;
            if (typeof result === 'string') return result;
            return 'Invalid phone number';
          })
        }),
        defineField({
          name: "marketingOptIn",
          type: "boolean",
          title: "Marketing Opt-In"
        })
      ],
      validation: (rule) => rule.required()
    }),

    // === ORDER DETAILS ===
    defineField({
      name: "orderType",
      title: "Order Type",
      type: "string",
      options: {
        list: [
          { title: "Pickup", value: "pickup" },
          { title: "Delivery", value: "delivery" },
          { title: "Dine-In", value: "dine-in" }
        ]
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "items",
      title: "Order Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "menuItem",
              type: "reference",
              to: [{ type: "menuItem" }],
              title: "Menu Item"
            },
            {
              name: "menuItemSnapshot",
              type: "object",
              title: "Menu Item Snapshot",
              description: "Snapshot at time of order",
              fields: [
                { name: "name", type: "string" },
                { name: "description", type: "text" },
                { name: "basePrice", type: "number" }
              ]
            },
            {
              name: "quantity",
              type: "number",
              title: "Quantity",
              validation: (rule) => rule.required().integer().min(1)
            },
            {
              name: "price",
              type: "number",
              title: "Price Per Item",
              validation: (rule) => rule.required().min(0.01)
            },
            {
              name: "totalPrice",
              type: "number",
              title: "Total Price",
              validation: (rule) => rule.required().min(0.01).custom((value: unknown, context: any) => {
                const quantity = context.parent?.quantity;
                const price = context.parent?.price;
                const totalPrice = value as number;
                
                if (quantity !== undefined && price !== undefined && totalPrice !== undefined) {
                  const expected = quantity * price;
                  const tolerance = 0.01; // Allow for floating point rounding
                  if (Math.abs(totalPrice - expected) > tolerance) {
                    return `Total price ($${totalPrice}) must equal quantity ($${quantity}) × price per item ($${price}) = $${expected.toFixed(2)}`;
                  }
                }
                return true;
              })
            },
            {
              name: "modifiers",
              type: "array",
              title: "Modifiers",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "name", type: "string", title: "Modifier Name" },
                    { name: "option", type: "string", title: "Selected Option" },
                    { name: "priceDelta", type: "number", title: "Price Change" }
                  ]
                }
              ]
            },
            { name: "specialInstructions", type: "text", title: "Special Instructions" }
          ],
          preview: {
            select: {
              title: "menuItemSnapshot.name",
              quantity: "quantity",
              price: "totalPrice"
            },
            prepare({ title, quantity, price }) {
              return {
                title: `${quantity}x ${title}`,
                subtitle: `$${price?.toFixed(2)}`
              };
            }
          }
        }
      ],
      validation: (rule) => rule.required().min(1)
    }),

    // === PRICING ===
    defineField({
      name: "subtotal",
      title: "Subtotal",
      type: "number",
      description: "Sum of all items before tax/fees",
      validation: (rule) => rule.required().min(0)
    }),
    defineField({
      name: "tax",
      title: "Tax",
      type: "number",
      description: "Sales tax amount",
      validation: (rule) => rule.required().min(0)
    }),
    defineField({
      name: "taxRate",
      title: "Tax Rate",
      type: "number",
      description: "Tax rate used (snapshot)",
      validation: (rule) => rule.min(0).max(1).error("Tax rate must be between 0 and 1 (inclusive)")
    }),
    defineField({
      name: "tip",
      title: "Tip",
      type: "number",
      description: "Tip amount",
      initialValue: 0
    }),
    defineField({
      name: "deliveryFee",
      title: "Delivery Fee",
      type: "number",
      description: "Delivery fee (if applicable)",
      initialValue: 0
    }),
    defineField({
      name: "platformFee",
      title: "Platform Fee",
      type: "number",
      description: "Fee kept by platform (if using Stripe Connect application_fee)",
      initialValue: 0
    }),
    defineField({
      name: "total",
      title: "Total",
      type: "number",
      description: "Final total charged to customer",
      validation: (rule) => rule.required().min(0)
    }),
    defineField({
      name: "locationPayout",
      title: "Location Payout",
      type: "number",
      description: "Amount transferred to location (total - platformFee)",
      validation: (rule) => rule.required().error("Location payout is required").min(0).error("Location payout cannot be negative")
    }),

    // === STRIPE PAYMENT INFO ===
    defineField({
      name: "stripePaymentIntentId",
      title: "Stripe Payment Intent ID",
      type: "string",
      description: "Stripe PaymentIntent ID (pi_xxxxx)",
      readOnly: true
    }),
    defineField({
      name: "stripeAccountId",
      title: "Stripe Connected Account ID",
      type: "string",
      description: "Location's Stripe account that received payment",
      readOnly: true
    }),
    defineField({
      name: "stripeChargeId",
      title: "Stripe Charge ID",
      type: "string",
      description: "Stripe Charge ID (ch_xxxxx)",
      readOnly: true
    }),
    defineField({
      name: "paymentStatus",
      title: "Payment Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Processing", value: "processing" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
          { title: "Partially Refunded", value: "partially_refunded" }
        ]
      },
      initialValue: "pending",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "object",
      description: "Payment method details from Stripe",
      fields: [
        { name: "brand", type: "string", title: "Card Brand" },
        { name: "last4", type: "string", title: "Last 4 Digits" },
        { name: "type", type: "string", title: "Type" }
      ]
    }),
    defineField({
      name: "refundAmount",
      title: "Refund Amount",
      type: "number",
      description: "Total amount refunded",
      initialValue: 0
    }),
    defineField({
      name: "refundReason",
      title: "Refund Reason",
      type: "text",
      description: "Reason for refund"
    }),

    // === FULFILLMENT ===
    defineField({
      name: "scheduledFor",
      title: "Scheduled For",
      type: "datetime",
      description: "When customer wants order ready (null = ASAP)"
    }),
    defineField({
      name: "estimatedReadyTime",
      title: "Estimated Ready Time",
      type: "datetime",
      description: "When we estimate order will be ready"
    }),
    defineField({
      name: "deliveryAddress",
      title: "Delivery Address",
      type: "object",
      hidden: ({ document }) => document?.orderType !== "delivery",
      fields: [
        defineField({
          name: "street",
          type: "string",
          title: "Street",
          validation: (rule) => rule.custom((value, context: any) => {
            if (context.document?.orderType === "delivery" && !value) {
              return "Street address is required for delivery orders";
            }
            return true;
          })
        }),
        defineField({
          name: "unit",
          type: "string",
          title: "Unit/Apt"
        }),
        defineField({
          name: "city",
          type: "string",
          title: "City",
          validation: (rule) => rule.custom((value, context: any) => {
            if (context.document?.orderType === "delivery" && !value) {
              return "City is required for delivery orders";
            }
            return true;
          })
        }),
        defineField({
          name: "state",
          type: "string",
          title: "State",
          validation: (rule) => rule.custom((value, context: any) => {
            if (context.document?.orderType === "delivery" && !value) {
              return "State is required for delivery orders";
            }
            return true;
          })
        }),
        defineField({
          name: "zip",
          type: "string",
          title: "ZIP",
          validation: (rule) => rule.custom((value, context: any) => {
            if (context.document?.orderType === "delivery" && !value) {
              return "ZIP code is required for delivery orders";
            }
            return true;
          })
        }),
        defineField({
          name: "instructions",
          type: "text",
          title: "Delivery Instructions"
        })
      ]
    }),
    defineField({
      name: "specialInstructions",
      title: "Special Instructions",
      type: "text",
      description: "Customer notes for entire order"
    }),

    // === REVEL POS INTEGRATION ===
    defineField({
      name: "revelOrderId",
      title: "Revel Order ID",
      type: "string",
      description: "Order ID in Revel POS system",
      readOnly: true
    }),
    defineField({
      name: "revelSynced",
      title: "Synced to Revel",
      type: "boolean",
      description: "Has this order been sent to Revel POS?",
      initialValue: false
    }),
    defineField({
      name: "revelSyncedAt",
      title: "Revel Sync Time",
      type: "datetime",
      description: "When order was synced to Revel"
    }),
    defineField({
      name: "revelSyncError",
      title: "Revel Sync Error",
      type: "text",
      description: "Error message if Revel sync failed"
    }),

    // === TIMESTAMPS ===
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime"
    }),
    defineField({
      name: "confirmedAt",
      title: "Confirmed At",
      type: "datetime",
      description: "When payment was confirmed"
    }),
    defineField({
      name: "preparingAt",
      title: "Started Preparing At",
      type: "datetime"
    }),
    defineField({
      name: "readyAt",
      title: "Ready At",
      type: "datetime"
    }),
    defineField({
      name: "completedAt",
      title: "Completed At",
      type: "datetime"
    }),
    defineField({
      name: "cancelledAt",
      title: "Cancelled At",
      type: "datetime"
    }),

    // === INTERNAL NOTES ===
    defineField({
      name: "internalNotes",
      title: "Internal Notes",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "note", type: "text", title: "Note" },
            { name: "author", type: "string", title: "Author" },
            {
              name: "timestamp",
              type: "datetime",
              title: "Time",
              initialValue: () => new Date().toISOString()
            }
          ]
        }
      ]
    })
  ],

  preview: {
    select: {
      orderNumber: "orderNumber",
      customerName: "customer.name",
      total: "total",
      status: "status",
      locationName: "location.name"
    },
    prepare({ orderNumber, customerName, total, status, locationName }) {
      const statusEmoji: Record<string, string> = {
        pending: "⏳",
        confirmed: "✅",
        preparing: "👨‍🍳",
        ready: "🔔",
        completed: "✅",
        cancelled: "❌"
      };

      const emoji = statusEmoji[status] || "📝";

      return {
        title: `${orderNumber || "New Order"} - ${customerName || "Unknown"}`,
        subtitle: `${emoji} ${status} | $${total?.toFixed(2) || "0.00"} | ${locationName || "No location"}`
      };
    }
  },

  orderings: [
    {
      title: "Created Date, New",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }]
    },
    {
      title: "Order Number",
      name: "orderNumberAsc",
      by: [{ field: "orderNumber", direction: "asc" }]
    }
  ]
});