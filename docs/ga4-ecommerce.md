# GA4 Ecommerce Events

This guide covers how to track GA4 ecommerce events (purchase, add to cart, view item, etc.) using HTML attributes in Webflow.

## Overview

GA4 ecommerce events require a specific structure with an `items[]` array containing product details. The tracker maps this to the existing CMS wrapper pattern — you tag elements with `data-ga4-*` attributes, and the tracker assembles the GA4-compliant payload automatically.

## Supported Ecommerce Events

| Event | GA4 Name | Typical Use |
|---|---|---|
| View item | `view_item` | User views a product detail page |
| View item list | `view_item_list` | User views a category/listing page |
| Select item | `select_item` | User clicks on a product in a list |
| Add to cart | `add_to_cart` | User adds a product to their cart |
| Remove from cart | `remove_from_cart` | User removes a product from cart |
| View cart | `view_cart` | User views their shopping cart |
| Begin checkout | `begin_checkout` | User starts checkout flow |
| Add shipping info | `add_shipping_info` | User enters shipping information |
| Add payment info | `add_payment_info` | User enters payment information |
| Purchase | `purchase` | User completes a purchase |
| Refund | `refund` | A refund is processed |
| View promotion | `view_promotion` | User views a promotional banner |
| Select promotion | `select_promotion` | User clicks on a promotion |
| Add to wishlist | `add_to_wishlist` | User adds a product to wishlist |

## Basic Setup

### Step 1: Add `data-ga4-ecommerce` to the Trigger Element

On the clickable element (button, link, card), add the `data-ga4-ecommerce` attribute with the GA4 event name as the value:

```html
<button
  data-event="Product Added"
  data-ga4-ecommerce="add_to_cart"
  data-cms="true"
>
  Add to Cart
</button>
```

- `data-event` — your internal event name (sent to PostHog as-is)
- `data-ga4-ecommerce` — the GA4 ecommerce event name (overrides the event name for GA4)
- `data-cms="true"` — tells the tracker to look for a `data-wrapper` parent

### Step 2: Add Event-Level Parameters

Event-level parameters like `currency`, `value`, and `transaction_id` go on the trigger element using `data-property-name{i}` / `data-property-value{i}`:

```html
<button
  data-event="Product Added"
  data-ga4-ecommerce="add_to_cart"
  data-cms="true"
  data-property-name1="currency:USD"
  data-property-name2="value:29.99"
>
  Add to Cart
</button>
```

### Step 3: Add Item Data in the Wrapper

Inside the `data-wrapper="true"` container, tag elements with `data-ga4-item-*` attributes to define item fields:

```html
<div data-wrapper="true">
  <span data-ga4-item-id="item_id">SKU_12345</span>
  <span data-ga4-item-name="item_name">Blue T-Shirt</span>
  <span
    data-ga4-item-price="price"
    data-property-value="innerHTML-parseFloat"
  >29.99</span>
  <span data-ga4-item-brand="item_brand">Acme Co</span>

  <button
    data-event="Product Added"
    data-ga4-ecommerce="add_to_cart"
    data-cms="true"
    data-property-name1="currency:USD"
    data-property-name2="value:29.99"
  >
    Add to Cart
  </button>
</div>
```

### How `data-ga4-item-*` Attributes Work

The attribute name follows the pattern `data-ga4-item-{anything}`, and the **value** of the attribute becomes the **GA4 item parameter name**:

```html
<!-- The attribute value "item_name" becomes the key in the items[] array -->
<span data-ga4-item-name="item_name">Blue T-Shirt</span>
```

The element's text content (or `data-property-value`-resolved value) becomes the parameter value.

## What Gets Sent to GA4

The above example produces this GA4 call:

```javascript
gtag('event', 'add_to_cart', {
  currency: 'USD',
  value: '29.99',
  items: [
    {
      item_id: 'SKU_12345',
      item_name: 'Blue T-Shirt',
      price: 29.99,
      item_brand: 'Acme Co',
    }
  ]
});
```

PostHog receives the same event with the original name (`Product Added`) and the event-level properties (without the `items[]` array, since that's GA4-specific).

## Multiple Items

For events involving multiple products (e.g., `view_item_list`, `purchase`), use `data-ga4-item-wrapper="true"` to mark each item's container:

```html
<div data-wrapper="true">
  <!-- Item 1 -->
  <div data-ga4-item-wrapper="true">
    <span data-ga4-item-id="item_id">SKU_001</span>
    <span data-ga4-item-name="item_name">Red Shirt</span>
    <span data-ga4-item-price="price" data-property-value="innerHTML-parseFloat">19.99</span>
  </div>

  <!-- Item 2 -->
  <div data-ga4-item-wrapper="true">
    <span data-ga4-item-id="item_id">SKU_002</span>
    <span data-ga4-item-name="item_name">Blue Pants</span>
    <span data-ga4-item-price="price" data-property-value="innerHTML-parseFloat">49.99</span>
  </div>

  <button
    data-event="Products Viewed"
    data-ga4-ecommerce="view_item_list"
    data-cms="true"
    data-property-name1="item_list_name:Best Sellers"
  >
    View All
  </button>
</div>
```

This produces:

```javascript
gtag('event', 'view_item_list', {
  item_list_name: 'Best Sellers',
  items: [
    { item_id: 'SKU_001', item_name: 'Red Shirt', price: 19.99 },
    { item_id: 'SKU_002', item_name: 'Blue Pants', price: 49.99 },
  ]
});
```

If no `data-ga4-item-wrapper="true"` elements are found inside the wrapper, the tracker treats the entire wrapper as a single item container.

## Common GA4 Item Parameters

These are the standard GA4 item parameters you can use:

| Parameter | Description | Example |
|---|---|---|
| `item_id` | Product SKU or ID | `SKU_12345` |
| `item_name` | Product name | `Blue T-Shirt` |
| `price` | Unit price | `29.99` |
| `quantity` | Quantity | `1` |
| `item_brand` | Brand name | `Acme Co` |
| `item_category` | Primary category | `Apparel` |
| `item_category2` | Sub-category | `Shirts` |
| `item_variant` | Variant (size, color) | `Large / Blue` |
| `discount` | Discount amount | `5.00` |
| `coupon` | Coupon code | `SUMMER20` |
| `index` | Position in a list | `0` |
| `item_list_id` | List identifier | `best_sellers` |
| `item_list_name` | List display name | `Best Sellers` |

## Common Event-Level Parameters

| Parameter | Used With | Description |
|---|---|---|
| `currency` | All ecommerce events | ISO 4217 currency code (e.g., `USD`) |
| `value` | All ecommerce events | Total monetary value |
| `transaction_id` | `purchase`, `refund` | Unique transaction identifier |
| `coupon` | `purchase`, `begin_checkout` | Order-level coupon |
| `shipping` | `purchase`, `add_shipping_info` | Shipping cost |
| `tax` | `purchase` | Tax amount |
| `item_list_id` | `view_item_list`, `select_item` | List identifier |
| `item_list_name` | `view_item_list`, `select_item` | List display name |

## Using with CMS Collections

This pattern works naturally with Webflow CMS. In a CMS Collection List:

1. Set `data-wrapper="true"` on the **Collection Item** wrapper
2. Add `data-ga4-item-*` attributes to the CMS-bound text elements
3. Add the trigger button with `data-ga4-ecommerce` inside each collection item

Since Webflow CMS generates the same structure for each item, the attributes are applied once in the Designer and work across all collection items automatically.

## Purchase Event Example

A full purchase event with multiple items:

```html
<div data-wrapper="true">
  <div data-ga4-item-wrapper="true">
    <span data-ga4-item-id="item_id">SKU_001</span>
    <span data-ga4-item-name="item_name">Widget Pro</span>
    <span data-ga4-item-price="price" data-property-value="innerHTML-parseFloat">99.99</span>
    <span data-ga4-item-qty="quantity" data-property-value="innerHTML-parseInt">2</span>
  </div>

  <button
    data-event="Order Completed"
    data-ga4-ecommerce="purchase"
    data-cms="true"
    data-property-name1="transaction_id:TXN_98765"
    data-property-name2="currency:USD"
    data-property-name3="value:199.98"
    data-property-name4="shipping:5.00"
    data-property-name5="tax:16.00"
  >
    Confirm Purchase
  </button>
</div>
```

## Debugging

Use `dev-mode` on the script tag to see the assembled ecommerce payload in the console:

```
[Tracker DEV] captureEcommerceEvent {
  ecommerceEventName: "add_to_cart",
  eventParams: { currency: "USD", value: "29.99" },
  items: [{ item_id: "SKU_12345", item_name: "Blue T-Shirt", price: 29.99 }]
}
```
