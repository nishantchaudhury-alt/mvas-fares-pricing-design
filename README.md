# MVAS Fares & Pricing Design Prototype

An interactive front-end prototype for Margaritaville at Sea's Fares & Pricing administration experience. It demonstrates how teams can configure Faretypes, Farecodes, cancellation and deposit policies, Policy Eligibility templates, supplements, and selected booking-policy flows.

This repository is a design prototype, not a production application. It uses seeded mock data and browser-memory state; there is no backend, authentication, database, or durable persistence.

## Run the integrated prototype

No package installation or build step is required. From the repository root, start a local web server:

```bash
python3 -m http.server 8766
```

Then open:

[http://127.0.0.1:8766/Policies%20V3%20Revamped.html](http://127.0.0.1:8766/Policies%20V3%20Revamped.html)

Internet access is required unless the browser has already cached React 18, ReactDOM, Babel Standalone, and the Inter font from their CDNs. Stop the server with `Ctrl+C`.

## Product areas

### Faretypes

- Search, filter, inspect, create, edit, and delete Faretype templates.
- Configure Basics & Grouping, Policy Assignment, Channel Access, Partner Access, Marketing, Taxes & Privacy, and Supplements.
- Assign active cancellation and deposit policies in Step 2.
- Configure Standby, Upgrades, and Coupons alongside policy assignment.
- Review field-level changes and linked-Farecode impact before saving an edit.
- Inspect overview, linked Farecodes, and history from a consistent detail drawer.

### Farecodes

- Configure a ship-specific Farecode for one or more sailings from a parent Faretype.
- Inherit eligible policy, booking-permission, access, marketing, tax/privacy, and supplement defaults from a Faretype, then override them at Farecode level where supported.
- Assign cancellation and deposit policies and configure booking permissions in Step 2.
- Configure the cabin-category and guest-position pricing matrix separately.
- Review value changes and inheritance/override changes before saving an edit.
- Inspect overview and history from the shared record-detail header pattern.

### Policies

- Manage cancellation and deposit policy groups and their child policies.
- Configure policy-level stateroom coverage.
- Define cancellation bands with DTS windows, penalty types, and penalty values.
- Define deposit milestone lines with DTS windows, deposit types, amounts, and cancellation applicability.
- Control active/default assignment behavior and group-owned refundability.
- Inspect usage and history, with deletion guards for referenced policies.
- View penalty/deposit type guidance from the information control in the table header.

### Policy Eligibility

- Create reusable guest-eligibility templates containing residency, minimum age, advance-purchase, occupancy, and boarding-pass requirements.
- Policy Eligibility templates are intentionally independent of an individual Faretype or Farecode.
- The current prototype keeps separate in-memory Policy Eligibility catalogs inside the Faretype and Farecode modules; they are not yet a single shared persistent library.

### Supplements

- Search, filter, create, inspect, edit, and delete supplement definitions.
- Configure supplement type, base price, cabin applicability, status, and effective-date window.
- Inspect usage and history, with deletion protection when a supplement is referenced.

### Booking-policy examples

- Explore seeded booking and modification scenarios that consume the cancellation and deposit policy model.
- These supporting flows are illustrative and use mock records.

## Workflow maps

Faretype creation uses seven steps; Faretype editing adds an eighth Review Changes step:

1. Basics & Grouping
2. Policy Assignment
3. Channel Access
4. Partner Access
5. Marketing
6. Taxes & Privacy
7. Supplements
8. Review Changes (edit only)

Farecode creation uses eight steps; Farecode editing adds a ninth Review Changes step:

1. Ship & Sailings
2. Policy Assignment
3. Channel Access
4. Partner Access
5. Marketing
6. Taxes & Privacy
7. Supplements
8. Pricing
9. Review Changes (edit only)

## Repository structure

| File | Purpose |
| --- | --- |
| `Policies V3 Revamped.html` | Primary integrated entry point and shared top-level state. |
| `dc-shell.jsx` | Shared design tokens, UI primitives, validators, and legacy demo-shell utilities. |
| `ui-list.jsx` | Shared list, metadata, deletion, and record-detail header components. |
| `ft-faretype.jsx` | Faretype catalog, details, create/edit wizard, and its Policy Eligibility catalog. |
| `fc-farecode.jsx` | Farecode catalog, details, create/edit wizard, pricing, inheritance, and its Policy Eligibility catalog. |
| `pol-data.jsx` | Policy seed data, normalization, and compatibility helpers. |
| `pol-forms.jsx` | Shared policy and group form sections. |
| `pol-rows.jsx` | Cancellation-band and deposit-line tables, including type guidance. |
| `pol-drawer.jsx` | Policy/group creation and editing drawers. |
| `pol-detail.jsx` | Policy/group read-only details, usage, and history. |
| `pol-list.jsx` | Unified cancellation/deposit policy catalog and state transitions. |
| `pol-chrome.jsx` | MVAS sidebar and policy confirmation/notification surfaces. |
| `sp-supplements.jsx` | Supplements catalog and detail/create/edit experience. |
| `assets/mvas-logo.png` | MVAS logo used by the integrated sidebar. |
| `dc-booking.jsx`, `dc-farecode.jsx` | Supporting booking and policy-consumer demonstrations. |
| `dc-group-panel.jsx`, `dc-parent-panel.jsx` | Earlier policy configuration panels retained for reference/compatibility. |
| `Farecode Create-Edit Panel.html` | Standalone earlier Farecode prototype; use the integrated page for current work. |

## State and data behavior

- Faretypes, Farecodes, Farecode configurations, and policies share state in the integrated page.
- All state is client-side and resets when the page reloads.
- Dates, users, audit events, bookings, ships, sailings, and policy usage are seeded prototype data.
- Policy Eligibility and Supplements currently own module-local state.
- Activating, editing, or deleting a record changes only the current browser session.
- All bookings, Faretypes, Farecodes, Policies, and Supplements are wired routes. The remaining visible navigation destinations are placeholders.

## Development notes

- JSX is compiled in the browser by Babel Standalone; there is no bundler or package manifest.
- There is currently no automated test suite; use the manual smoke checks below after changes.
- Scripts share globals through `window`, so load order in `Policies V3 Revamped.html` matters.
- When changing a loaded `.jsx` file, increment its `?v=` query value in `Policies V3 Revamped.html` to avoid stale browser caches.
- Keep shared flat-list and record-detail chrome in `ui-list.jsx`; feature-local primitives remain isolated inside each module's IIFE to avoid global-name collisions.
- The interface follows the MVAS visual language: navy interaction controls, neutral white/cool-grey surfaces, compact operational typography, and restrained status color.

## Manual verification checklist

After a change, verify at minimum:

1. Policy group and policy rows open without a blank drawer.
2. Cancellation and deposit create/edit flows preserve schedules and stateroom coverage.
3. Faretype Step 2 saves policy assignment and booking permissions.
4. Farecode Step 2 correctly inherits, overrides, and restores Faretype values.
5. Farecode pricing can be viewed and edited without losing values.
6. Policy Eligibility shows guest-eligibility fields only and creates independent templates.
7. Supplements open, edit, and enforce their deletion guard.
8. Browser console contains no runtime errors.
