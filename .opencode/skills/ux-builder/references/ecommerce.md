# E-Commerce UX Reference
## Baymard Institute, Checkout, Cart, Forms, Product Pages, Navigation & Search

Based on 200,000+ hours of research, 4,400+ test sessions, 771 verified guidelines.

---

## CONTENTS — Jump to Section

| Part | Topic | Key Terms |
|------|-------|-----------|
| **1** | Checkout & Cart: Critical Rules | guest checkout, 35.2% lift, 70.19% abandonment |
| **2** | Form Field Optimization | field count ≤8, Full Name, Address Line 2, coupon, CVV |
| **3** | Validation & Error Handling | inline validation, on blur, per-keystroke, ARIA |
| **4** | Input Masking & Mobile Keyboards | phone, dates, email autocap, password toggle |
| **5** | Input Control Types | radio buttons, dropdowns, quantity +/−, price filters |
| **6** | Cart Interaction | badge, add-to-cart overlay, Apply buttons, progress bar |
| **7** | Multi-Step Form Design | >7 fields → wizard, 11%→46% conversion lift |
| **8** | Product Detail Pages (PDP) | images, scale, human models, gallery thumbs, unit pricing |
| **9** | Product Listing Pages (PLP) | variations, sold-out, sorting, filter OR logic, View All |
| **10** | Navigation | no desktop hamburger, mega-menu delay, breadcrumbs |
| **11** | Search | autocomplete, typo-tolerance, abbreviation mapping, zero results |
| **12** | AI Auditing Accuracy | 95% specialized vs 20–75% generic |
| **13** | Enhanced Form Design | placeholder labels, required/optional, payment data retention, expiry format, shipping dates, phone/DOB |
| **14** | Mobile-Specific Form Principles | inputmode, autocomplete attributes, numeric normalization |
| **15** | Authentication & Security (NIST) | password managers, paste, show toggle, HTTPS, hashing |
| **16** | Advanced Interaction Patterns | tabindex, focus traps, heading hierarchy, aria-labels, third-party payment |
| **17** | Responsive Image & Visual Optimization | srcset, CLS prevention, high-DPI, aspect ratio, horizontal scroll |

→ **Binary pass/fail checklist for all rules above:** `checklist.md`
→ **All quantified failure rates and thresholds:** `metrics.md`

---

## PART 1: CHECKOUT & CART — CRITICAL RULES

### Account Creation
- **Guest checkout MUST be the primary, default, most prominent option**
- Finding: 84% of sites fail to delay account creation until post-purchase
- Finding: 47% of sites hide or de-emphasize guest checkout
- Forced account creation is a leading cause of cart abandonment
- **Rule: Delay account creation until AFTER the purchase is complete**
- Post-purchase account creation gives users a reason to complete the transaction
- Binary: Guest checkout is most prominent AND account creation delayed until post-purchase? Yes/No

### The 35.2% Conversion Lift
- Improving checkout UX can lead to a 35.2% increase in conversion rates
- **Critical note: This is an AGGREGATE of 32 different heuristics combined — no single change achieves this**
- Average cart abandonment rate: **70.19%**
- 18–26% of abandonment directly attributed to checkout being "too long or complex"

---

## PART 2: FORM FIELD OPTIMIZATION

### Field Count
- Average checkout: 11.3 to 12.8 fields
- Optimized checkout: **6 to 8 fields**
- Reduction potential: 20–60% of visible fields can be eliminated
- Rule: **>7 visible fields should trigger a multi-step wizard design**
- Binary: ≤8 visible fields in guest checkout? Yes/No

### Full Name Field
- **Use a single "Full Name" field — NOT split First/Last**
- Finding: 42% of users type full name into the "First Name" box when split
- Finding: Only 4% of users hesitate with a single "Full Name" field
- Finding: 89% of sites still incorrectly use split First/Last fields
- **Conflict**: Facebook Pixel and some marketing tools prefer split fields — requires custom data transformation
- Binary: Single "Full Name" field used? Yes/No

### Address Line 2
- **MUST be hidden by default**
- Trigger text must be specific: **"Add Apt. #, Suite, Floor"** (not "Address Line 2")
- Finding: 30% of users pause at Address Line 2 and question whether they need it — even if they don't
- Finding: 75% of sites show Address Line 2 by default (fail this guideline)
- Binary: Address Line 2 hidden behind specific link text? Yes/No

### Billing Address
- **Default to "Billing = Shipping" and hide redundant billing fields**
- Finding: 24% of sites force users to fill billing address even when same as shipping
- Binary: Defaults to "Billing = Shipping" with option to change? Yes/No

### Coupon Code Field
- **MUST be hidden by default behind a text link**
- Link text must read: **"Got a promo code?"**
- Finding: Displaying a prominent coupon field causes users to leave checkout to search external sites
- Finding: 35% of sites display the coupon field by default (triggers abandonment)
- Binary: Coupon field hidden behind "Got a promo code?" link? Yes/No

### Security Code (CVV/CVC)
- **MUST provide a visual thumbnail showing where the code is on the card**
- Finding: 38% of users pause at CVV fields without a visual hint
- Binary: Visual hint (thumbnail) provided for CVV field? Yes/No

### Credit Card Auto-Formatting
- **Input field MUST auto-format: 4-4-4-4 grouping** (or Amex variant 4-6-5)
- Finding: 15% of sites fail this guideline
- **Implement Luhn (Modulus 10) checksum validation in real-time**
- Benefit: Catches typos immediately before submission
- Binary: Auto-formatting applied? Luhn validation implemented? Yes/No

### Label Alignment
- **Top-aligned labels are processed 28% faster than left-aligned labels**
- Always use top-aligned labels
- Binary: Labels are top-aligned? Yes/No

---

## PART 3: VALIDATION & ERROR HANDLING

### Inline Validation — Critical Metrics
- **Trigger: "on blur" (when user leaves the field) — NOT while typing**
- Error removal: **Per-keystroke as user corrects input** (errors disappear immediately as user types)
- Finding: +22% task success rate
- Finding: -22% error rate
- Finding: -42% completion time
- Finding: +31% user satisfaction
- **Use green checkmarks** for successfully validated fields
- **Conflict**: Browser-native validation stops at first error; best practice is show all errors simultaneously
- Binary: Inline validation on blur with per-keystroke error removal? Yes/No

### Error Message Requirements
- Must be in plain language (no error codes)
- Must precisely indicate the problem
- Must constructively suggest a solution
- Must be displayed adjacent to the offending field
- Must be programmatically associated (ARIA: `aria-invalid="true"` + `aria-describedby`)
- Binary: Errors in plain language with solution suggestions and ARIA? Yes/No

---

## PART 4: INPUT MASKING & MOBILE KEYBOARDS

### Input Masking
- Apply auto-formatting for: phone numbers, dates, SSN, credit cards
- Finding: 89% of users ignore format examples (e.g., "MM/DD/YYYY" placeholder text)
- Finding: 64% of mobile sites fail to use input masking
- Auto-formatting is the ONLY effective solution — not placeholder examples
- Binary: Input masking applied to all formatted fields? Yes/No

### Credit Card Formatting
- 4-4-4-4 grouping for Visa/MC; 4-6-5 for Amex
- Users must be able to verify the number easily (Miller's Law — no unbroken 16-digit strings)
- Binary: Credit card auto-formats? Yes/No

### Mobile Keyboard Specifics
- **Disable OS autocapitalization for email fields** on mobile
- Finding: Autocapitalization on email inputs creates significant friction and frustration
- **Password fields: disable masking on mobile by default** — show a visibility toggle eye icon
- Finding: Mobile autocorrect + fat-finger errors cause login failures with masked passwords
- Binary: Email autocap disabled; password has visibility toggle? Yes/No

---

## PART 5: INPUT CONTROL TYPES

### Radio Buttons vs. Dropdowns
- **For ≤5 options: Use radio buttons — they are 2.5 seconds faster than dropdowns**
- Dropdowns create additional interaction cost (open, then select)
- Binary: Radio buttons used for ≤5 options? Yes/No

### Quantity Selection
- **Provide +/- buttons AND direct keyboard text entry**
- Never use dropdowns for quantity selection alone
- Finding: 61% of sites fail this (dropdown only) — suboptimal
- Binary: +/- buttons with text input provided for quantity? Yes/No

### Price / Numeric Filters
- Bad: Predefined price brackets ($10–$20, $20–$30)
- Better: Slider or user-defined open input fields (any range)
- Binary: Price filters allow open input or slider? Yes/No

---

## PART 6: CART INTERACTION

### Cart Badge
- Show item count AND subtotal on the cart icon badge
- Binary: Cart badge shows item count and subtotal? Yes/No

### "Add to Cart" Confirmation
- Use a persistent overlay — NOT a transient/fading notification
- Finding: Transient overlays cause "race against time" anxiety
- Binary: Confirmation uses persistent overlay? Yes/No

### Apply / Update Buttons
- **Remove all "Apply" or "Update" buttons**
- Changes should persist automatically on blur or change event
- Finding: 22% of sites violate this (include unnecessary "Apply" buttons)
- Binary: Changes auto-persist without needing apply button? Yes/No

### Reset / Clear Form Buttons
- **NEVER use a "Reset" or "Clear Form" button**
- Danger: Accidental clicks cause complete data loss → abandonment
- If a reset-like function is absolutely needed: use a plain text link "Start Over" with confirmation dialog, physically separated from "Submit" by ≥200px
- Binary: No "Reset" button exists? Yes/No

### Progress Indicators
- Use linear, non-branching progress indicators
- Finding: Progress bars correlate with reduced abandonment; estimated 10–15% conversion lift
- **Maximum steps displayed: 3–4**
- If 5+ steps required: redesign into a multi-step wizard (not just a longer progress bar)
- **Conflict**: Too many steps CAN increase abandonment by showing how far users must go — keep it ≤4
- Binary: Progress indicator shows ≤4 steps? Yes/No

---

## PART 7: MULTI-STEP FORM DESIGN

### When to Use Multi-Step
- Forms with >7 visible fields MUST become multi-step wizards
- Case Study (Venture Harbour): Single-step → multi-step increased lead conversion from 11% to 46%
- Finding: Multi-step forms with low-friction starting questions can achieve 53% conversion rate

### Multi-Step Implementation
- Trigger: >7 visible fields
- Progress indicators: Show ≤4 steps maximum
- Validate each step before allowing progression
- Show progress retained between steps
- Begin with lowest-friction fields (Commitment & Consistency principle)

---

## PART 8: PRODUCT DETAIL PAGES (PDP)

### Horizontal Tabs vs. Vertical Sections
- **Use vertical sections or accordions — NOT horizontal tabs**
- Finding: 27% of users overlook information hidden in horizontal tabs
- Vertical sections reduce miss-rate to 8%
- Binary: Vertical sections used instead of horizontal tabs? Yes/No

### Product Images — Scale Reference
- Finding: **42% of users judge product size from images alone**
- Finding: **91% of sites fail to provide in-scale images**
- **Rule: Show product next to a human or known object for scale**
- Every apparel/jewelry/home-decor item must have a "human in frame" image
- Example: Shoe next to a hand; ring on a finger; furniture shown in a room
- Binary: In-scale images provided? Yes/No

### Human Models for Wearables
- Finding: 55% of sites fail to show wearables on models
- Mannequin or cut-out images without human reference reduce purchase confidence
- **Rule: Show apparel on human models to demonstrate drape and fit**
- Binary: Wearables shown on human models? Yes/No

### Image Gallery Navigation
- **Use thumbnail-based navigation — NOT dots**
- Finding: 50–80% of images are missed when thumbnails are truncated or dots are used
- Thumbnails provide "information scent"; dots do not
- Never truncate thumbnails in the gallery
- Binary: Gallery uses thumbnail-based nav (not dots)? Yes/No

### Image Count
- Visually-driven products (apparel, furniture, jewelry): **3 to 15 images**
- 1–2 images are NOT sufficient for evaluation
- Finding: 80% of sites provide too few images
- Binary: ≥3 images provided (target 5+ for visual products)? Yes/No

### Unit Pricing
- For bulk items: **Show unit price ($/ounce, $/unit, $/sq ft)**
- Finding: 74% of sites fail to show unit pricing
- Total price and unit price must use different font sizes (e.g., 18pt total, 12pt unit)
- Binary: Unit pricing displayed for bulk/multi-quantity items? Yes/No

---

## PART 9: PRODUCT LISTING PAGES (PLP)

### Color Variations
- **Combine all color variations into ONE list item with color swatches**
- Finding: 42% of sites flood PLP with duplicate items per color variant
- Example: One "Shirt" item with Blue/Red/Green swatches — not three separate listings
- Binary: Variations combined into one item with swatches? Yes/No

### Sold-Out Items
- **Show "Sold Out" or "Out of Stock" items alongside available ones — do NOT hide them**
- Case Study (Booking.com): Displaying sold-out items INCREASES overall bookings
- Mechanism: Sold-out items validate scarcity and justify urgency for available items
- Binary: Sold-out items shown alongside available ones? Yes/No

### Default Sorting
- **Never default to "Alphabetical" (A-Z) sorting**
- High-quality defaults: "Relevance" or "Best Sellers"
- Alphabetical = "Low Quality" default
- Binary: Default sort is Relevance or Best Sellers? Yes/No

### Filter Logic
- **Within a category, same-type attributes MUST use Boolean OR**
- Example: Selecting "Blue" AND "Black" should show Blue OR Black items
- Finding: 15% of sites use AND logic (wrong) — selecting "Black" replaces "Blue"
- Binary: Same-type filters use OR logic? Yes/No

### Category Navigation
- Finding: 42% of mobile sites lack "View All" at each category level
- **Every category level must have a "View All" link**
- Without it, users get trapped in narrow subcategories
- Binary: "View All" option at each category level? Yes/No

---

## PART 10: NAVIGATION

### Desktop Navigation
- **Never use hamburger menus on desktop — they are an anti-pattern**
- Finding: Desktop hamburger menus reduce engagement by ~500% compared to visible links
- Hamburger menus are only acceptable as "necessary evil" on mobile
- Binary: Desktop uses visible navigation (no hamburger)? Yes/No

### Mega-Menu Hover Behavior
- **Mega-menus must have a hover delay of 200–300ms**
- Purpose: Prevent "menu flickering" and accidental activation when mouse passes over
- Binary: Mega-menus have 200–300ms hover delay? Yes/No

### Current Location Indication
- Finding: **95% of mobile sites fail** to visually highlight the user's current location in navigation
- **Always show which section/page the user is currently viewing**
- Binary: Current location highlighted in navigation? Yes/No

### Breadcrumbs
- Essential for orientation in product hierarchies
- Users should always know where they are in the site hierarchy
- Binary: Breadcrumbs displayed for orientation? Yes/No

---

## PART 11: SEARCH

### Search Bar Placement
- Users expect search in upper-right or top-center
- Icon-only search is less effective than an open text field
- Binary: Search in upper-right or top-center, open field visible? Yes/No

### Autocomplete Requirements
- Suggestions must appear after **2–3 characters**
- Must be **typo-tolerant**
- Must support **abbreviation mapping**: "3pc" → "3-piece", "13 in" → "13 inch", "sq ft" → "square foot"
- Must return **category scopes** (e.g., "Nike" shows "in Shoes", "in Clothing")
- Maximum **5–8 suggestions per dropdown** — no internal scrollbars
- Finding: 77% of mobile sites fail to include category scope in suggestions
- Finding: 58% of mobile sites fail abbreviation/symbol searches
- Binary: Autocomplete is typo-tolerant, category-scoped, abbreviation-mapped? Yes/No

### Zero-Results State
- Never show a dead-end page with no suggestions
- Provide "Clear Search" or "Browse Categories" escape route
- Binary: Zero-results state provides actionable escape? Yes/No

### Redundant Data Entry
- Never request previously entered data multiple times in a single flow
- If user entered email on page 1, never ask again on page 2
- Binary: No redundant data entry occurs? Yes/No

### Specific vs. Generic Descriptions (Booking.com Research)
- "Breakfast included" = generic = lower conversion
- "Very good breakfast" = specific = significantly higher conversion
- Small specific details like "charging outlets by bed" or "toilet paper included" have outsized conversion impact
- **Rule: Always use specific, descriptive language — never generic statements**

---

## PART 12: AI AUDITING ACCURACY

- Baymard "UX-Ray" specialized AI: **95% accuracy** vs. human auditors
- Generic GPT-4 prompts: **20–75% accuracy** range
- This skill is designed to bridge that gap by embedding domain-specific knowledge

---

## PART 13: ENHANCED FORM DESIGN PRINCIPLES

### Placeholder-as-Label Anti-Pattern
- **NEVER use placeholder text as the only label** — labels must persist during and after entry
- Finding: Users relying on placeholders are **3× more likely to forget** field requirements if interrupted (notification, phone call)
- Finding: Placeholders provide zero memory support once focus leaves the field — instant "user amnesia"
- Finding: "Placeholder as label" causes higher error rates and more form submission failures
- Essential instructions (e.g., password requirements) MUST be visible outside/below the field, never in a placeholder
- Placeholders should be restricted to supplementary hints/examples only
- Binary: All fields have persistent, visible labels (not placeholder-only)? Yes/No

### Required vs. Optional Field Indication
- **EVERY field must explicitly indicate whether it is "Required" or "Optional"**
- Finding: **86% of sites fail** to indicate both required and optional fields
- Finding: Only 14% of sites correctly indicate both (6% on mobile)
- Clear distinction significantly reduces validation error rates
- Binary: All fields marked as Required or Optional? Yes/No

### Promo/Gift Code — Apply Button Exception
- Apply buttons are **expected and correct** specifically for promo codes and gift cards
- Must provide success confirmation (show code + updated total amount) when applied
- This is an exception to the general "remove Apply buttons" rule
- Binary: Promo/gift fields have Apply button with success confirmation? Yes/No

### Credit Card — Spaces and Format Tolerance
- Credit card fields MUST allow spaces AND auto-format them as the user types
- Finding: **80% of sites fail** to auto-format credit card spaces
- Finding: **23% of users** naturally type card numbers with spaces
- Failure to handle spacing increases entry error rates
- Binary: Credit card field allows and auto-formats spaces? Yes/No

### Expiration Date Format Matching
- Expiration date input MUST match the format shown on the physical card: **MM / YY**
- Finding: **72% of sites** do not match expiration format to the physical card
- Format mismatch leads to unnecessary user hesitation and errors
- Binary: Expiration date format matches physical card (MM/YY)? Yes/No

### Payment Data Retention on Errors
- Sensitive payment information (card #, CVV, expiry) MUST be retained if **other** (non-payment) fields trigger a validation error
- Finding: **34% of sites** clear credit card data on unrelated form errors
- Finding: Users forced to re-enter payment info are **45% more likely to abandon**
- Implementation: Validate nonsensitive fields client-side FIRST before payment submission (two-stage validation)
- Isolate sensitive fields on a dedicated payment step to prevent unrelated reloads from clearing them
- Binary: Payment data retained on unrelated field errors? Yes/No
- Binary: Nonsensitive fields validated before payment submission? Yes/No
- Binary: Sensitive fields isolated on a dedicated payment step? Yes/No

### Shipping Transparency — Specific Dates Required
- Delivery information MUST provide an estimated delivery **date or date range** — not just a speed label
- Bad: "Standard 3–5 Days" | Good: "Arrives by Friday, October 12"
- Finding: **41% of sites** fail to provide delivery date estimates
- Finding: Users are **20% less likely to abandon** when given specific delivery dates
- Generic speed labels force mental calculation, increasing abandonment
- Binary: Specific delivery dates shown (not just speed labels)? Yes/No

### Phone & DOB Field Justification
- Phone number requested without explanation: **15% of users abandon**
- Date of Birth requested without clear reason: **35% of users abandon**
- Every "Why do you need this?" users ask themselves increases drop-off
- Rule: Minimize intrusive fields; if required, explain the necessity inline
- Binary: Intrusive fields (phone, DOB) include visible justification? Yes/No

### Form Data Preservation on Error
- Form submissions returning errors MUST NOT clear previously entered user data
- Finding: Users forced to retype data are 45% more likely to abandon
- Binary: Form data preserved when validation errors occur? Yes/No

---

## PART 14: MOBILE-SPECIFIC FORM PRINCIPLES

### Numeric Input Mode
- Numeric fields MUST use `inputmode="numeric"` or `inputmode="tel"` to trigger the optimized mobile numeric keypad
- Applies to: Credit card, zip code, phone number, SSN fields
- Binary: Numeric fields use correct `inputmode` attribute? Yes/No

### Numeric Input Normalization
- Systems MUST accept common formatting variations for numeric inputs (spaces, hyphens, parentheses for phone numbers)
- Normalize server-side for storage; never reject user input due to format variation
- Finding: 89% of users enter numeric data in varied formats
- Binary: System accepts and normalizes numeric formatting variations? Yes/No

### Prefilled Data in Editable Fields
- Prefilled values (e.g., shipping address) MUST be placed in editable fields — not static text
- Purpose: User can easily verify and correct prefilled data
- Binary: Prefilled data shown in editable fields (not static text)? Yes/No

### Mobile Autofill Attributes
- ALL form fields MUST use appropriate `autocomplete` attributes
- Examples: `autocomplete="email"`, `autocomplete="cc-number"`, `autocomplete="cc-exp"`, `autocomplete="cc-csc"`
- Finding: Using correct attributes can reduce form completion time by **40–60%** for returning users
- Binary: `autocomplete` attributes on all appropriate fields? Yes/No

---

## PART 15: AUTHENTICATION & SECURITY (NIST SP 800-63B)

### Password Manager Support (Mandatory)
- Password fields MUST NOT disable/block password managers or browser autofill
- Finding: Password managers significantly increase strong password adoption
- Blocking them forces users toward weak, reused passwords
- Binary: Password managers and autofill not blocked? Yes/No

### Password Paste Tolerance (Mandatory)
- Password fields MUST permit copy-and-paste
- Critical for password managers to function
- Never use `onpaste` event handlers that prevent pasting
- Binary: Copy-paste allowed in password fields? Yes/No

### Show Password Toggle (Mandatory)
- Authentication flows MUST provide a "Show Password" toggle during entry
- Finding: Show password toggle **reduces login failure rates by ~12%**
- Allows users to identify wrong keyboard layout (Caps Lock, etc.)
- Binary: Show password toggle (eye icon) available on password field? Yes/No

### HTTPS for Authentication
- Password entry and submission MUST occur over HTTPS/TLS only
- No cleartext transmission of credentials
- Binary: Authentication over HTTPS only? Yes/No

### Password Storage Security
- Passwords MUST be salted (≥32-bit salt) and hashed using industry-standard scheme
- Acceptable: bcrypt, scrypt, PBKDF2 with SHA-256
- Never store plaintext or use weak hashing (MD5, SHA1)
- Binary: Passwords salted/hashed with approved algorithm? Yes/No

### Password Normalization
- Verifiers MAY trim leading/trailing whitespace from passwords (reduces lockouts from trivial spacing errors)
- Binary: Whitespace trimming implemented to reduce login failures? Yes/No

---

## PART 16: ADVANCED FORM INTERACTION PATTERNS

### Tab Index Integrity
- `tabindex` MUST NOT be set to values >0
- Positive tabindex values (e.g., `tabindex="1"`) **destroy natural document tab order**
- Only use `tabindex="0"` (make focusable) or `tabindex="-1"` (remove from tab order)
- Binary: No positive tabindex values used? Yes/No

### Focus Trap — Components
- Users MUST be able to move keyboard focus into and out of all components
- Applies to: menus, carousels, slideshows
- Exception: Modal focus traps ARE intentional — focus stays inside modal until closed
- When modal opens: focus moves to first interactive element
- When modal closes: focus returns to trigger element; Escape key closes modal
- Binary: All non-modal components allow keyboard escape? Yes/No

### Search Input Accessibility
- If search input has no visible label, it MUST have `aria-label="Search"` or `aria-labelledby`
- Finding: Missing labels make search **completely invisible to 100% of screen reader users**
- Icon-only search buttons MUST have an accessible name (aria-label)
- Binary: Search input properly labeled (visible or via aria)? Yes/No

### Heading Hierarchy
- Pages MUST use a proper heading structure (H1 → H2 → H3) — no skipped levels
- Finding: Broken heading hierarchy creates a "blind maze" for screen reader users who navigate by headings
- Finding: Functionally impossible to complete tasks for that user segment — **100% abandonment**
- Binary: Proper heading hierarchy used without level skips? Yes/No

### Icon-Only Buttons
- Any button or link that uses ONLY an icon (no visible text) MUST have an accessible name via `aria-label`
- Finding: Icon-only buttons without an accessible name are a "dead end" for 100% of screen reader users
- Binary: Icon-only interactive elements have accessible names? Yes/No

### Third-Party Payment Options
- Checkout MUST provide at least one third-party payment option (PayPal, Apple Pay, Google Pay, Amazon Pay)
- Finding: **8% of users abandon carts** specifically because their preferred payment method is unavailable
- Binary: At least one third-party payment option available? Yes/No

### Multiple Errors — Simultaneous Display
- When a form has multiple errors, ALL should be shown simultaneously (not just the first)
- Either in a summary at the top OR directly associated with each field
- Single-error-at-a-time display increases frustration and re-submission attempts
- Binary: Multiple errors shown simultaneously? Yes/No

---

## PART 17: RESPONSIVE IMAGE & VISUAL OPTIMIZATION

### Responsive Images (srcset)
- Images MUST use `srcset` to serve resolution-appropriate assets
- Avoids oversized images on mobile that spike LCP and data usage
- Example: `srcset="small.jpg 320w, medium.jpg 768w, large.jpg 1200w"`
- Binary: `srcset` used for responsive images? Yes/No

### Dynamic Content — Space Reservation (CLS Prevention)
- Ads, embeds, and iframes MUST have `width` and `height` attributes set, OR CSS `aspect-ratio` defined
- Purpose: Reserves layout space before content loads — prevents Cumulative Layout Shift
- Finding: Ads/embeds without reserved space cause layout shifts that increase misclicks and form errors
- Binary: Dynamic content has space reserved (width/height or aspect-ratio)? Yes/No

### High-DPI Asset Support
- Image assets SHOULD include `@2x` and `@3x` variants for Retina/high-DPI displays
- Finding: Assets not meeting high-DPI standards result in **~10% drop in perceived brand quality**
- Statistically linked to decreased conversion for luxury demographics
- Binary: High-DPI (`@2x`/`@3x`) assets provided? Yes/No

### Mobile Horizontal Scroll Prohibition
- Pages MUST NOT require horizontal scrolling to view primary content
- Finding: Horizontal scrolling is perceived as a "broken site"
- Finding: Bounce rate is **~70% higher** for sites requiring horizontal pan on mobile
- Binary: No horizontal scrolling required for content? Yes/No

### Aspect Ratio Integrity
- Images MUST be displayed at their intended aspect ratio — never stretched or squashed via CSS
- Finding: Aspect-ratio-distorted images are perceived as "low trust" / associated with scam sites
- Finding: ~5% drop in trust-based conversion metrics from image distortion
- Binary: Images maintain proper aspect ratio? Yes/No
