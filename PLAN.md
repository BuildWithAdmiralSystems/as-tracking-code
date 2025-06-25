# Webflow to PostHog Tracking Script: Development Plan

### **Project Goal**

To create a robust, lightweight **TypeScript** snippet (that can be compiled to JS, of course) that can be deployed via jsdelivr. This script will track user events on a Webflow website by interpreting `data-*` attributes on HTML elements and sending the data specifically to **PostHog**.

### **Core Architecture**

The core architecture is built around a central module that initializes upon page load. It will attach global event listeners for clicks and form submissions to efficiently capture events across the entire page. A `PostHog Adapter` will handle all interactions with the PostHog library.

```mermaid
graph TD
    subgraph "Initialization (TypeScript)"
        A[Load Script] --> B{DOMContentLoaded};
    end

    subgraph "Event Handlers"
        B --> C[PageviewEventHandler];
        B --> D[GlobalClickListener];
        B --> E[GlobalSubmitListener];
    end

    subgraph "Event Logic (PostHog)"
        C --> F[1. Parse Page Properties];
        F --> G[2. Store Pageview Data];
        G --> H[3. Fire posthog.capture()];

        D -- click on [data-event] --> I{Is it a CMS Item?};
        I -- Yes --> J[CMSClickHandler];
        I -- No --> K[StaticClickHandler];
        
        J --> L[1. Find Wrapper];
        L --> M[2. Collect Properties in Wrapper];
        M --> N[3. Fire posthog.capture()];

        K --> O[1. Collect Properties on Element];
        O --> N;

        E -- submit on [data-event] --> P[FormSubmitHandler];
        P --> Q[1. Collect Form Fields];
        Q --> R{Has Identify Traits?};
        R -- Yes --> S[2a. Fire posthog.identify()];
        Q --> T{Has Track Properties?};
        T -- Yes --> U[2b. Fire posthog.capture()];
    end

    subgraph "Core Utilities (TypeScript)"
        V[Property Parser]
        W[DOM Traverser]
        X[PostHog Adapter]
    end

    F --> V;
    M --> V;
    O --> V;
    Q --> V;
    J --> W;

    H --> X;
    N --> X;
    S --> X;
    U --> X;
```

---

### **Development Plan**

#### **Phase 1: TypeScript Setup and Core Utilities**

1.  **Project Scaffolding:**
    *   Initialize a new **TypeScript** project by creating a `package.json`.
    *   Set up a bundler like **Rollup** with a TypeScript plugin (e.g., `@rollup/plugin-typescript`) to compile the source code into a single, minified file (`dist/webflow-tracker.min.js`).
    *   Create a `tsconfig.json` file configured for targeting modern browsers.
    *   Organize all source code in a `src/` directory with `.ts` file extensions.

2.  **PostHog Adapter (`src/posthog-adapter.ts`):**
    *   This module will be the sole interface with the PostHog library.
    *   It will expose type-safe functions like `captureEvent(eventName: string, properties: object)` and `identifyUser(userProperties: object)`.
    *   `captureEvent` will call `window.posthog.capture()`.
    *   `identifyUser` will call `window.posthog.identify()` with the collected user traits.
    *   It will include checks to ensure `window.posthog` is available before making any calls.

3.  **Utility Functions (`src/utils.ts`):**
    *   **Property Parser:** A strongly-typed function to parse property values from attributes.
    *   **DOM Traverser:** A helper function to find the closest ancestor of an element that matches a specific selector.

#### **Phase 2: Event Handler Implementation in TypeScript**

1.  **Pageview Event Handler (`src/pageview.ts`):**
    *   Executes on `DOMContentLoaded`.
    *   Checks for `data-event` on the `<body>` tag.
    *   Scans the DOM for `data-pageview-property-name` to collect dynamic properties.
    *   Calls `posthogAdapter.captureEvent()` with the pageview data.
    *   Stores collected pageview properties for the `grabPageview` feature.

2.  **Click Event Handler (`src/clicks.ts`):**
    *   Uses a single `click` listener on the `document`.
    *   Differentiates between **Static Clicks** and **CMS Clicks**.
    *   Resolves `grabPageview` properties.
    *   Calls `posthogAdapter.captureEvent()`.

3.  **Form Submission Handler (`src/forms.ts`):**
    *   Uses a single `submit` listener on the `document`.
    *   Checks form fields for `data-track`, `data-identify`, or `data-both-identify-and-track`.
    *   Calls `posthogAdapter.captureEvent()` and/or `posthogAdapter.identifyUser()` accordingly.

#### **Phase 3: Finalization and Documentation**

1.  **Main Entry Point (`src/index.ts`):**
    *   Imports and initializes all the event handlers.

2.  **Build and Testing:**
    *   Finalize the build script to produce a minified, production-ready asset.
    *   Create an HTML test page with a mock PostHog object to validate that the correct functions are called with the correct data.