var webflowTracker = (function (exports) {
    'use strict';

    let cachedConfig = null;
    const scriptElement = document.currentScript;
    function parseConfig() {
        const attr = (name) => scriptElement ? scriptElement.getAttribute(name) : null;
        const posthogEnabled = attr('data-posthog') === 'true';
        const ga4IdRaw = attr('data-ga4-id') || '';
        const ga4Ids = ga4IdRaw
            .split(',')
            .map(id => id.trim())
            .filter(id => id.length > 0);
        const ga4Lowercase = attr('data-ga4-lowercase') === 'true';
        const ga4UserIdField = attr('data-ga4-user-id-field') || 'email';
        const consentDefaultsRaw = attr('data-ga4-consent-defaults');
        const ga4ConsentDefaults = consentDefaultsRaw === 'denied' ? 'denied' : null;
        const googleAdsIdRaw = attr('data-google-ads-id');
        const googleAdsId = googleAdsIdRaw && googleAdsIdRaw.trim().length > 0
            ? googleAdsIdRaw.trim()
            : null;
        const devMode = scriptElement ? scriptElement.hasAttribute('dev-mode') : false;
        return {
            posthogEnabled,
            ga4Ids,
            ga4Lowercase,
            ga4UserIdField,
            ga4ConsentDefaults,
            googleAdsId,
            devMode,
        };
    }
    function getConfig() {
        if (!cachedConfig) {
            cachedConfig = parseConfig();
        }
        return cachedConfig;
    }

    const STORAGE_KEY = 'consentMode';
    const ALL_CONSENT_KEYS = [
        'functionality_storage',
        'analytics_storage',
        'ad_storage',
        'ad_user_data',
        'ad_personalization',
        'personalization_storage',
        'security_storage',
    ];
    const CHECKBOX_ID_MAP = {
        functionality_storage: 'as-consent-functionality',
        analytics_storage: 'as-consent-analytics',
        ad_storage: 'as-consent-ad-storage',
        ad_user_data: 'as-consent-ad-user-data',
        ad_personalization: 'as-consent-ad-personalization',
        personalization_storage: 'as-consent-personalization',
        security_storage: 'as-consent-security',
    };
    function allDenied() {
        return {
            functionality_storage: 'denied',
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            personalization_storage: 'denied',
            security_storage: 'denied',
        };
    }
    function allGranted() {
        return {
            functionality_storage: 'granted',
            analytics_storage: 'granted',
            ad_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted',
            personalization_storage: 'granted',
            security_storage: 'granted',
        };
    }
    function rejectAllState() {
        return {
            ...allDenied(),
            functionality_storage: 'granted',
        };
    }
    function ensureGtag() {
        if (typeof window.gtag !== 'function') {
            window.dataLayer = window.dataLayer || [];
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
        }
    }
    function readStoredConsent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return null;
            const parsed = JSON.parse(raw);
            const state = allDenied();
            for (const key of ALL_CONSENT_KEYS) {
                if (parsed[key] === 'granted') {
                    state[key] = 'granted';
                }
            }
            return state;
        }
        catch {
            return null;
        }
    }
    function saveConsent(state) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    function pushConsentUpdate(state) {
        ensureGtag();
        window.gtag('consent', 'update', { ...state });
    }
    let currentConsent = allDenied();
    function isAnalyticsGranted() {
        return currentConsent.analytics_storage === 'granted';
    }
    function isAdUserDataGranted() {
        return currentConsent.ad_user_data === 'granted';
    }
    function getConsentState() {
        return { ...currentConsent };
    }
    function updateConsent(state) {
        for (const key of ALL_CONSENT_KEYS) {
            if (state[key] === 'granted' || state[key] === 'denied') {
                currentConsent[key] = state[key];
            }
        }
        saveConsent(currentConsent);
        pushConsentUpdate(currentConsent);
    }
    function populateCheckboxes() {
        for (const key of ALL_CONSENT_KEYS) {
            const checkbox = document.getElementById(CHECKBOX_ID_MAP[key]);
            if (!checkbox)
                continue;
            const isGranted = currentConsent[key] === 'granted';
            checkbox.checked = isGranted;
            const customDiv = checkbox.previousElementSibling;
            if (customDiv) {
                customDiv.classList.toggle('w--redirected-checked', isGranted);
            }
        }
    }
    function readCheckboxStates() {
        const state = allDenied();
        for (const key of ALL_CONSENT_KEYS) {
            const checkbox = document.getElementById(CHECKBOX_ID_MAP[key]);
            if (checkbox && checkbox.checked) {
                state[key] = 'granted';
            }
        }
        state.functionality_storage = 'granted';
        return state;
    }
    function hideBanner() {
        const banner = document.getElementById('as-cookie-banner');
        if (banner)
            banner.style.display = 'none';
    }
    function showBanner() {
        const banner = document.getElementById('as-cookie-banner');
        if (banner)
            banner.style.display = 'block';
    }
    function hideOptions() {
        const options = document.getElementById('as-cookie-options');
        if (options)
            options.style.height = '0px';
    }
    function applyConsent(state) {
        currentConsent = state;
        saveConsent(state);
        pushConsentUpdate(state);
        hideBanner();
    }
    function wireBanner() {
        const banner = document.getElementById('as-cookie-banner');
        if (!banner)
            return;
        const acceptAll = document.getElementById('as-btn-accept-all');
        if (acceptAll) {
            acceptAll.addEventListener('click', () => applyConsent(allGranted()));
        }
        const rejectAll = document.getElementById('as-btn-reject-all');
        if (rejectAll) {
            rejectAll.addEventListener('click', () => applyConsent(rejectAllState()));
        }
        const acceptSome = document.getElementById('as-btn-accept-some');
        if (acceptSome) {
            acceptSome.addEventListener('click', () => applyConsent(readCheckboxStates()));
        }
        const cookieIcon = document.getElementById('as-cookie-icon');
        if (cookieIcon) {
            cookieIcon.addEventListener('click', () => {
                populateCheckboxes();
                hideOptions();
                showBanner();
            });
        }
    }
    function initializeConsent() {
        const config = getConfig();
        ensureGtag();
        if (config.ga4ConsentDefaults === 'denied') {
            window.gtag('consent', 'default', { ...allDenied() });
        }
        const stored = readStoredConsent();
        if (stored) {
            currentConsent = stored;
            pushConsentUpdate(stored);
        }
        else {
            currentConsent = allDenied();
        }
        const wireOnReady = () => {
            wireBanner();
            if (!stored) {
                showBanner();
            }
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', wireOnReady);
        }
        else {
            wireOnReady();
        }
    }

    function isPostHogAvailable() {
        return (window.posthog &&
            typeof window.posthog.capture === 'function' &&
            typeof window.posthog.identify === 'function');
    }
    function capturePostHogEvent(eventName, properties) {
        if (!isPostHogAvailable()) {
            console.error('PostHog is not available.');
            return;
        }
        window.posthog.capture(eventName, properties);
    }
    function identifyPostHogUser(userProperties) {
        if (!isPostHogAvailable()) {
            console.error('PostHog is not available.');
            return;
        }
        window.posthog.identify(userProperties);
    }

    const GA4_MAX_PARAMS = 25;
    const GA4_MAX_PARAM_NAME_LENGTH = 40;
    const GA4_MAX_PARAM_VALUE_LENGTH = 100;
    const GA4_MAX_EVENT_NAME_LENGTH = 40;
    const GA4_MAX_USER_PROPERTY_NAME_LENGTH = 24;
    const GA4_MAX_USER_PROPERTY_VALUE_LENGTH = 36;
    const GA4_MAX_USER_PROPERTIES = 25;
    const RESERVED_EVENT_NAMES = new Set([
        'ad_impression', 'app_remove', 'app_store_refund',
        'app_store_subscription_cancel', 'app_store_subscription_renew',
        'click', 'error', 'file_download', 'first_open', 'first_visit',
        'form_start', 'form_submit', 'in_app_purchase', 'page_view',
        'scroll', 'session_start', 'user_engagement', 'view_complete',
        'video_progress', 'video_start', 'view_search_results',
    ]);
    const RESERVED_PARAM_NAMES = new Set([
        'cid', 'customer_id', 'customerid', 'dclid', 'gclid',
        'session_id', 'sessionid', 'sfmc_id', 'sid', 'srsltid', 'uid',
        'user_id', 'userid',
    ]);
    const RESERVED_PARAM_PREFIXES = ['_', 'firebase_', 'ga_', 'google_', 'gtag.'];
    const RESERVED_EVENT_PREFIXES = ['query_id'];
    const GA4_RECOMMENDED_EVENT_PARAMS = {
        generate_lead: ['currency', 'value'],
        login: ['method'],
        sign_up: ['method'],
        search: ['search_term'],
        select_content: ['content_type', 'item_id'],
        share: ['method', 'content_type', 'item_id'],
    };
    const RESERVED_USER_PROPERTY_NAMES = new Set([
        'cid', 'customer_id', 'customerid', 'first_open_after_install',
        'first_open_time', 'first_visit_time',
        'google_allow_ad_personalization_signals', 'last_advertising_id_reset',
        'last_deep_link_referrer', 'last_gclid', 'lifetime_user_engagement',
        'non_personalized_ads', 'session_id', 'session_number', 'sessionid',
        'sfmc_id', 'sid', 'uid', 'user_id', 'userid',
    ]);
    function hasReservedPrefix(name) {
        return RESERVED_PARAM_PREFIXES.some(prefix => name.startsWith(prefix));
    }
    function hasReservedEventPrefix(name) {
        return RESERVED_EVENT_PREFIXES.some(prefix => name.startsWith(prefix));
    }
    function normalizeEventName(eventName) {
        const config = getConfig();
        let normalized = eventName.replace(/\s+/g, '_');
        if (config.ga4Lowercase) {
            normalized = normalized.toLowerCase();
        }
        return normalized;
    }
    function validateEventName(eventName) {
        if (eventName.length > GA4_MAX_EVENT_NAME_LENGTH) {
            return { valid: false, error: `GA4: Event name "${eventName}" exceeds ${GA4_MAX_EVENT_NAME_LENGTH} characters` };
        }
        if (!/^[a-zA-Z]/.test(eventName)) {
            return { valid: false, error: `GA4: Event name "${eventName}" must start with a letter` };
        }
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(eventName)) {
            return { valid: false, error: `GA4: Event name "${eventName}" contains invalid characters (only letters, numbers, underscores allowed)` };
        }
        if (RESERVED_EVENT_NAMES.has(eventName)) {
            return { valid: false, error: `GA4: Event name "${eventName}" is reserved by Google Analytics` };
        }
        if (hasReservedEventPrefix(eventName)) {
            return { valid: false, error: `GA4: Event name "${eventName}" uses a reserved prefix` };
        }
        return { valid: true };
    }
    function validateAndTruncateParams(properties) {
        const keys = Object.keys(properties);
        const result = {};
        let count = 0;
        for (const key of keys) {
            if (count >= GA4_MAX_PARAMS) {
                console.warn(`GA4: Dropping parameter "${key}" -- exceeds ${GA4_MAX_PARAMS} parameter limit`);
                continue;
            }
            if (key.length > GA4_MAX_PARAM_NAME_LENGTH) {
                console.warn(`GA4: Parameter name "${key}" exceeds ${GA4_MAX_PARAM_NAME_LENGTH} characters, skipping`);
                continue;
            }
            if (RESERVED_PARAM_NAMES.has(key)) {
                console.warn(`GA4: Parameter name "${key}" is reserved, skipping`);
                continue;
            }
            if (hasReservedPrefix(key)) {
                console.warn(`GA4: Parameter name "${key}" uses a reserved prefix, skipping`);
                continue;
            }
            let value = properties[key];
            if (typeof value === 'string' && value.length > GA4_MAX_PARAM_VALUE_LENGTH) {
                console.warn(`GA4: Parameter "${key}" value truncated to ${GA4_MAX_PARAM_VALUE_LENGTH} characters`);
                value = value.substring(0, GA4_MAX_PARAM_VALUE_LENGTH);
            }
            result[key] = value;
            count++;
        }
        return result;
    }
    function validateAndTruncateUserProperties(properties) {
        const keys = Object.keys(properties);
        const result = {};
        let count = 0;
        for (const key of keys) {
            if (count >= GA4_MAX_USER_PROPERTIES) {
                console.warn(`GA4: Dropping user property "${key}" -- exceeds ${GA4_MAX_USER_PROPERTIES} property limit`);
                continue;
            }
            if (key.length > GA4_MAX_USER_PROPERTY_NAME_LENGTH) {
                console.warn(`GA4: User property name "${key}" exceeds ${GA4_MAX_USER_PROPERTY_NAME_LENGTH} characters, skipping`);
                continue;
            }
            if (RESERVED_USER_PROPERTY_NAMES.has(key)) {
                console.warn(`GA4: User property name "${key}" is reserved, skipping`);
                continue;
            }
            if (hasReservedPrefix(key)) {
                console.warn(`GA4: User property name "${key}" uses a reserved prefix, skipping`);
                continue;
            }
            let value = properties[key];
            if (typeof value === 'string' && value.length > GA4_MAX_USER_PROPERTY_VALUE_LENGTH) {
                console.warn(`GA4: User property "${key}" value truncated to ${GA4_MAX_USER_PROPERTY_VALUE_LENGTH} characters`);
                value = value.substring(0, GA4_MAX_USER_PROPERTY_VALUE_LENGTH);
            }
            result[key] = value;
            count++;
        }
        return result;
    }
    function warnMissingRecommendedParams(eventName, properties) {
        const prescribed = GA4_RECOMMENDED_EVENT_PARAMS[eventName];
        if (!prescribed)
            return;
        const missing = prescribed.filter(p => !(p in properties) || properties[p] === undefined || properties[p] === null || properties[p] === '');
        if (missing.length > 0) {
            console.warn(`GA4: Recommended event "${eventName}" is missing prescribed parameters: ${missing.join(', ')}. See https://support.google.com/analytics/answer/9267735`);
        }
    }

    function isGtagAvailable() {
        return typeof window.gtag === 'function';
    }
    function captureGA4Event(eventName, properties) {
        if (!isGtagAvailable()) {
            console.error('GA4: window.gtag is not available.');
            return;
        }
        const normalized = normalizeEventName(eventName);
        const validation = validateEventName(normalized);
        if (!validation.valid) {
            console.error(validation.error);
            return;
        }
        const truncated = validateAndTruncateParams(properties);
        warnMissingRecommendedParams(normalized, truncated);
        window.gtag('event', normalized, truncated);
    }
    function captureGA4EcommerceEvent(ecommerceEventName, eventParams, items) {
        if (!isGtagAvailable()) {
            console.error('GA4: window.gtag is not available.');
            return;
        }
        const validation = validateEventName(ecommerceEventName);
        if (!validation.valid) {
            console.error(validation.error);
            return;
        }
        const truncated = validateAndTruncateParams(eventParams);
        window.gtag('event', ecommerceEventName, { ...truncated, items });
    }
    function captureGA4Conversion(sendTo, properties) {
        if (!isGtagAvailable()) {
            console.error('GA4: window.gtag is not available.');
            return;
        }
        const truncated = validateAndTruncateParams(properties);
        window.gtag('event', 'conversion', { send_to: sendTo, ...truncated });
    }
    function identifyGA4User(userProperties) {
        if (!isGtagAvailable()) {
            console.error('GA4: window.gtag is not available.');
            return;
        }
        const config = getConfig();
        const userIdField = config.ga4UserIdField;
        if (userProperties[userIdField]) {
            const userId = String(userProperties[userIdField]);
            window.gtag('set', { user_id: userId });
        }
        const propsWithoutId = {};
        for (const key of Object.keys(userProperties)) {
            if (key !== userIdField) {
                propsWithoutId[key] = userProperties[key];
            }
        }
        if (Object.keys(propsWithoutId).length > 0) {
            const truncated = validateAndTruncateUserProperties(propsWithoutId);
            window.gtag('set', { user_properties: truncated });
        }
    }

    function resolveConversionSendTo(raw) {
        if (!raw)
            return null;
        const trimmed = raw.trim();
        if (trimmed.length === 0)
            return null;
        // Already a full send_to (contains "/" or starts with AW-/DC-)
        if (trimmed.includes('/') || trimmed.startsWith('AW-') || trimmed.startsWith('DC-')) {
            return trimmed;
        }
        // Bare label — prepend configured Google Ads ID
        const config = getConfig();
        if (!config.googleAdsId) {
            console.warn(`Tracker: data-ga4-conversion="${trimmed}" is a bare label but no data-google-ads-id is configured on the script tag. Conversion skipped.`);
            return null;
        }
        return `${config.googleAdsId}/${trimmed}`;
    }
    function captureEvent(eventName, properties, conversionSendTo) {
        const config = getConfig();
        if (config.devMode) {
            console.log('[Tracker DEV] captureEvent', { eventName, properties, conversionSendTo });
            return;
        }
        if (!isAnalyticsGranted())
            return;
        if (config.posthogEnabled) {
            capturePostHogEvent(eventName, properties);
        }
        if (config.ga4Ids.length > 0) {
            captureGA4Event(eventName, properties);
        }
        if (conversionSendTo) {
            captureGA4Conversion(conversionSendTo, properties);
        }
    }
    function identifyUser(userProperties) {
        const config = getConfig();
        if (config.devMode) {
            console.log('[Tracker DEV] identifyUser', { userProperties });
            return;
        }
        if (!isAnalyticsGranted())
            return;
        if (config.posthogEnabled) {
            identifyPostHogUser(userProperties);
        }
        if (config.ga4Ids.length > 0 && isAdUserDataGranted()) {
            identifyGA4User(userProperties);
        }
    }
    function captureEcommerceEvent(ecommerceEventName, eventParams, items, conversionSendTo) {
        const config = getConfig();
        if (config.devMode) {
            console.log('[Tracker DEV] captureEcommerceEvent', {
                ecommerceEventName,
                eventParams,
                items,
                conversionSendTo,
            });
            return;
        }
        if (!isAnalyticsGranted())
            return;
        if (config.ga4Ids.length > 0) {
            captureGA4EcommerceEvent(ecommerceEventName, eventParams, items);
        }
        if (conversionSendTo) {
            captureGA4Conversion(conversionSendTo, eventParams);
        }
    }

    /**
     * Parses a property string and returns a structured object.
     * @param propertyString - The string to parse, e.g., "propertyName:propertyValue".
     * @returns An object with name and value.
     */
    const parseProperty = (propertyString) => {
        const parts = propertyString.split(':');
        const name = parts[0];
        const value = parts.length > 1 ? parts.slice(1).join(':') : 'innerHTML';
        return { name, value };
    };
    /**
     * Finds the closest ancestor of an element that matches a selector.
     * @param element - The starting element.
     * @param selector - The selector to match.
     * @returns The matching ancestor element or null if not found.
     */
    const findClosestAncestor = (element, selector) => {
        let current = element;
        while (current) {
            if (current.matches(selector)) {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    };

    function resolvePropertyValue(resolvedValue, element) {
        switch (resolvedValue) {
            case 'innerHTML':
                return element.innerHTML;
            case 'innerHTML-parseInt':
                return parseInt(element.innerHTML, 10);
            case 'innerHTML-parseFloat':
                return parseFloat(element.innerHTML);
            case 'innerText':
                return element.innerText;
            case 'innerText-parseInt':
                return parseInt(element.innerText, 10);
            case 'innerText-parseFloat':
                return parseFloat(element.innerText);
            case 'boolean:true':
                return true;
            case 'boolean:false':
                return false;
            case 'grabPagePath':
                return window.location.pathname;
            default:
                return resolvedValue;
        }
    }

    let pageviewProperties = {};
    const handlePageview = () => {
        const body = document.body;
        const eventName = body.getAttribute('data-event');
        if (eventName) {
            const propertyElements = document.querySelectorAll('[data-pageview-property-name]');
            propertyElements.forEach(element => {
                const propertyNameAttr = element.getAttribute('data-pageview-property-name');
                if (propertyNameAttr) {
                    const { name, value } = parseProperty(propertyNameAttr);
                    const valueAttr = element.getAttribute('data-pageview-property-value');
                    const resolvedValue = valueAttr || value;
                    pageviewProperties[name] = resolvePropertyValue(resolvedValue, element);
                }
            });
            const conversionSendTo = resolveConversionSendTo(body.getAttribute('data-ga4-conversion'));
            captureEvent(eventName, pageviewProperties, conversionSendTo);
        }
    };
    const initializePageviewListener = () => {
        document.addEventListener('DOMContentLoaded', handlePageview);
    };
    const getPageviewProperties = () => {
        return pageviewProperties;
    };

    const VALID_ECOMMERCE_EVENTS = new Set([
        'view_item', 'view_item_list', 'select_item', 'add_to_cart',
        'remove_from_cart', 'view_cart', 'begin_checkout', 'add_shipping_info',
        'add_payment_info', 'purchase', 'refund', 'view_promotion',
        'select_promotion', 'add_to_wishlist',
    ]);
    const GA4_ITEM_ATTR_PREFIX = 'data-ga4-item-';
    function collectItemFieldsFromChildren(container) {
        const item = {};
        const allChildren = container.querySelectorAll('*');
        allChildren.forEach(child => {
            const attrs = child.attributes;
            for (let i = 0; i < attrs.length; i++) {
                if (attrs[i].name.startsWith(GA4_ITEM_ATTR_PREFIX)) {
                    const paramName = attrs[i].value || attrs[i].name.substring(GA4_ITEM_ATTR_PREFIX.length);
                    const propValue = child.getAttribute('data-property-value');
                    item[paramName] = propValue
                        ? resolvePropertyValue(propValue, child)
                        : child.innerText || child.innerHTML;
                }
            }
        });
        return item;
    }
    function collectItemsFromWrapper(wrapper) {
        const items = [];
        const itemWrappers = wrapper.querySelectorAll('[data-ga4-item-wrapper="true"]');
        if (itemWrappers.length > 0) {
            itemWrappers.forEach(itemWrapper => {
                const item = collectItemFieldsFromChildren(itemWrapper);
                if (Object.keys(item).length > 0) {
                    items.push(item);
                }
            });
        }
        else {
            const singleItem = collectItemFieldsFromChildren(wrapper);
            if (Object.keys(singleItem).length > 0) {
                items.push(singleItem);
            }
        }
        return items;
    }
    function handleEcommerceClick(element, eventName, properties) {
        const ecommerceType = element.getAttribute('data-ga4-ecommerce');
        if (!ecommerceType)
            return false;
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

    const handleCmsClick = (element, eventName) => {
        const wrapper = findClosestAncestor(element, '[data-wrapper="true"]');
        if (!wrapper)
            return;
        const properties = {};
        const propertyElements = wrapper.querySelectorAll('[data-property-name]');
        propertyElements.forEach(propElement => {
            const propertyNameAttr = propElement.getAttribute('data-property-name');
            if (propertyNameAttr) {
                const { name, value } = parseProperty(propertyNameAttr);
                const valueAttr = propElement.getAttribute('data-property-value');
                const resolvedValue = valueAttr || value;
                properties[name] = resolvePropertyValue(resolvedValue, propElement);
            }
        });
        if (handleEcommerceClick(element, eventName, properties))
            return;
        const conversionSendTo = resolveConversionSendTo(element.getAttribute('data-ga4-conversion'));
        captureEvent(eventName, properties, conversionSendTo);
    };
    const handleStaticClick = (element, eventName) => {
        const properties = {};
        const pageviewProperties = getPageviewProperties();
        for (let i = 1; i <= 100; i++) {
            const nameAttr = element.getAttribute(`data-property-name${i}`);
            const valueAttr = element.getAttribute(`data-property-value${i}`);
            if (nameAttr) {
                const { name, value } = parseProperty(nameAttr);
                const resolvedValue = valueAttr || value;
                if (resolvedValue === 'grabPageview') {
                    if (pageviewProperties[name]) {
                        properties[name] = pageviewProperties[name];
                    }
                }
                else {
                    properties[name] = resolvePropertyValue(resolvedValue, element);
                }
            }
            else {
                break;
            }
        }
        if (handleEcommerceClick(element, eventName, properties))
            return;
        const conversionSendTo = resolveConversionSendTo(element.getAttribute('data-ga4-conversion'));
        captureEvent(eventName, properties, conversionSendTo);
    };
    const handleGlobalClick = (event) => {
        const target = event.target;
        const eventElement = findClosestAncestor(target, '[data-event]');
        if (eventElement) {
            const eventName = eventElement.getAttribute('data-event');
            if (eventName) {
                const isCms = eventElement.getAttribute('data-cms') === 'true';
                if (isCms) {
                    handleCmsClick(eventElement, eventName);
                }
                else {
                    handleStaticClick(eventElement, eventName);
                }
            }
        }
    };
    const initializeClickListener = () => {
        document.addEventListener('click', handleGlobalClick);
    };

    const handleFormSubmit = (event) => {
        const submitButton = event.submitter;
        if (!submitButton)
            return;
        const form = findClosestAncestor(submitButton, 'form');
        if (!form)
            return;
        const eventName = form.getAttribute('data-event');
        if (!eventName)
            return;
        event.preventDefault();
        const trackProperties = {};
        const identifyProperties = {};
        const formElements = form.elements;
        for (let i = 0; i < formElements.length; i++) {
            const element = formElements[i];
            if (element.name) {
                const track = element.getAttribute('data-track') === 'true';
                const identify = element.getAttribute('data-identify') === 'true';
                const both = element.getAttribute('data-both-identify-and-track') === 'true';
                const parseIntAttr = element.getAttribute('data-parse-int') === 'true';
                const parseFloatAttr = element.getAttribute('data-parse-float') === 'true';
                let value = element.value;
                if (parseIntAttr) {
                    value = parseInt(value, 10);
                }
                else if (parseFloatAttr) {
                    value = parseFloat(value);
                }
                if (track || both) {
                    trackProperties[element.name] = value;
                }
                if (identify || both) {
                    identifyProperties[element.name] = value;
                }
            }
        }
        const conversionSendTo = resolveConversionSendTo(form.getAttribute('data-ga4-conversion'));
        if (Object.keys(trackProperties).length > 0 || conversionSendTo) {
            captureEvent(eventName, trackProperties, conversionSendTo);
        }
        if (Object.keys(identifyProperties).length > 0) {
            identifyUser(identifyProperties);
        }
        // Allow a small delay for tracking to complete before submitting
        setTimeout(() => {
            form.submit();
        }, 300);
    };
    const initializeFormListener = () => {
        document.addEventListener('submit', handleFormSubmit);
    };

    const config = getConfig();
    initializeConsent();
    // Auto-configure Google Ads tag if data-google-ads-id is set.
    // ensureGtag() in initializeConsent has already guaranteed window.gtag exists.
    if (config.googleAdsId && typeof window.gtag === 'function') {
        window.gtag('config', config.googleAdsId);
    }
    initializePageviewListener();
    initializeClickListener();
    initializeFormListener();

    exports.getConsentState = getConsentState;
    exports.updateConsent = updateConsent;

    return exports;

})({});
