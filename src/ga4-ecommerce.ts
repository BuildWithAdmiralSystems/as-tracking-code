import { captureEcommerceEvent, resolveConversionSendTo } from './dispatcher';
import { findClosestAncestor } from './utils';
import { resolvePropertyValue } from './property-resolver';

const VALID_ECOMMERCE_EVENTS = new Set([
  'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info',
  'add_payment_info', 'purchase', 'refund', 'view_promotion',
  'select_promotion', 'add_to_wishlist',
]);

const GA4_ITEM_ATTR_PREFIX = 'data-ga4-item-';

function collectItemFieldsFromChildren(container: Element): Record<string, any> {
  const item: Record<string, any> = {};
  const allChildren = container.querySelectorAll('*');

  allChildren.forEach(child => {
    const attrs = child.attributes;
    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name.startsWith(GA4_ITEM_ATTR_PREFIX)) {
        const paramName = attrs[i].value || attrs[i].name.substring(GA4_ITEM_ATTR_PREFIX.length);
        const propValue = child.getAttribute('data-property-value');
        item[paramName] = propValue
          ? resolvePropertyValue(propValue, child)
          : (child as HTMLElement).innerText || child.innerHTML;
      }
    }
  });

  return item;
}

function collectItemsFromWrapper(wrapper: HTMLElement): Record<string, any>[] {
  const items: Record<string, any>[] = [];
  const itemWrappers = wrapper.querySelectorAll('[data-ga4-item-wrapper="true"]');

  if (itemWrappers.length > 0) {
    itemWrappers.forEach(itemWrapper => {
      const item = collectItemFieldsFromChildren(itemWrapper);
      if (Object.keys(item).length > 0) {
        items.push(item);
      }
    });
  } else {
    const singleItem = collectItemFieldsFromChildren(wrapper);
    if (Object.keys(singleItem).length > 0) {
      items.push(singleItem);
    }
  }

  return items;
}

export function handleEcommerceClick(
  element: HTMLElement,
  eventName: string,
  properties: Record<string, any>
): boolean {
  const ecommerceType = element.getAttribute('data-ga4-ecommerce');
  if (!ecommerceType) return false;

  if (!VALID_ECOMMERCE_EVENTS.has(ecommerceType)) {
    console.error(`GA4: "${ecommerceType}" is not a valid ecommerce event type`);
    return false;
  }

  const wrapper = findClosestAncestor(element, '[data-wrapper="true"]');
  const items = wrapper ? collectItemsFromWrapper(wrapper) : [];

  const conversionSendTo = resolveConversionSendTo(element.getAttribute('data-ga4-conversion'));
  captureEcommerceEvent(ecommerceType, properties, items, conversionSendTo);
  return true;
}
