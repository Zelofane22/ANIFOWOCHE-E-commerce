# UX Foundations Reference
## Nielsen Norman Group (NN/g) 10 Usability Heuristics, Interaction Laws, ISO 9241-110, WCAG

---

## CONTENTS — Jump to Section

| Part | Topic | Key Terms |
|------|-------|-----------|
| **1** | Nielsen Norman 10 Usability Heuristics | visibility, user control, consistency, error prevention, recognition, flexibility |
| **2** | Interaction & Biomechanical Laws | Fitts, Miller (7±2), Jakob, Hick, Fogg, Endowed Progress, saccadic scanning |
| **3** | ISO 9241-110 Dialogue Principles | task suitability, self-descriptiveness, controllability, error tolerance |
| **4** | WCAG 2.1/2.2 POUR Principles | perceivable, operable, understandable, robust |
| **5** | WCAG 2.2 Specific Criteria (with numbers) | contrast 4.5:1, touch targets 44px, focus indicators, orientation, animation |
| **6** | Screen Reader & Semantic Markup | alt text ≤150 chars, ARIA, aria-describedby, semantic HTML |
| **7** | Mobile Viewport & Performance | sticky headers, responsive, load time thresholds, Core Web Vitals (LCP/INP/CLS) |
| **8** | Additional Documented Contradictions | SERP paradox, heuristic definition conflict, research discrepancies |

→ **E-commerce-specific rules:** `ecommerce.md`
→ **Binary audit checklist:** `checklist.md`
→ **All quantified thresholds and failure rates:** `metrics.md`

---

## PART 1: NIELSEN NORMAN 10 USABILITY HEURISTICS

These are the core qualitative framework for expert interface evaluation.

1. **Visibility of System Status** — Always keep users informed about what's going on through appropriate feedback within a reasonable time. Examples: progress bars, loading spinners, cart badges showing item count. Binary: Is there a progress indicator? Yes/No

2. **Match Between System and Real World** — Speak the user's language; use familiar words and concepts. Example: "Security Code" not "CVV/CID"; "Apt. #, Suite, Floor" not "Address Line 2". Binary: Are familiar user terms used? Yes/No

3. **User Control and Freedom** — Always provide a clearly marked "emergency exit." Examples: Undo/Redo, Cancel buttons, ability to go back. Binary: Is there a marked emergency exit? Yes/No

4. **Consistency and Standards** — Users prefer your site to work like all other sites they already know (Jakob's Law). Follow platform conventions and internal standards. Example: Cart icon in top right, search field looks like standard input. Binary: Are platform conventions followed? Yes/No

5. **Error Prevention** — Better than good error messages is design that prevents problems. Use constraints, sensible defaults, and confirmation before risky actions. Never use "Reset" buttons. Binary: Are error-prone conditions eliminated? Yes/No

6. **Recognition Rather Than Recall** — Make objects, actions, and options visible. Show recently viewed items, autocomplete suggestions. Binary: Are all relevant options visible? Yes/No

7. **Flexibility and Efficiency of Use** — Provide accelerators (keyboard shortcuts, gestures, "Select All") for expert users. Binary: Are accelerators provided? Yes/No

8. **Aesthetic and Minimalist Design** — Remove information which is irrelevant or rarely needed. Every extra unit of information competes with relevant units. Checkout pages must be free of promotional banners. Binary: Is irrelevant information removed? Yes/No

9. **Help Users Recognize, Diagnose, and Recover from Errors** — Error messages must be in plain language, precisely indicate the problem, and constructively suggest a solution. Example: "Include an @ symbol" not "Error 0x442". Binary: Are errors in plain language with solutions? Yes/No

10. **Help and Documentation** — Provide searchable, task-focused documentation when needed. Binary: Is documentation easy to search and task-focused? Yes/No

---

## PART 2: INTERACTION AND BIOMECHANICAL LAWS

### Fitts's Law
Formula: T = a + b log₂(1 + D/W) where T = time, D = distance, W = target width.
- Larger targets and shorter distances = faster acquisition
- Prime Pixel: Cursor's current location is the fastest target
- Magic Pixels: Screen corners and edges act as "infinite" targets
- Human finger pad ≈ 9mm wide → explains why 44px minimum is the standard
- Binary: Are targets appropriately sized for acquisition? Yes/No

### Miller's Law
- Average person can keep 7 ± 2 (5–9) items in working memory
- Unbroken 16-digit credit card strings violate this → auto-format to 4-4-4-4
- Group information into chunks of 5–9 items maximum
- Binary: Is information grouped into chunks of 5–9? Yes/No

### Jakob's Law
- Users spend most of their time on OTHER sites → follow industry standards
- Don't reinvent interaction patterns; match established conventions
- Binary: Does the interface follow established patterns? Yes/No

### Hick's Law
- Decision time increases logarithmically with number and complexity of choices
- Reduce the number of visible options; use progressive disclosure
- Hide advanced options behind expandable links
- Binary: Is choice complexity minimized? Yes/No

### BJ Fogg's Behavior Model
- Behavior = Motivation + Ability + Trigger (all three must align)
- More form fields → lower Ability → lower completion rates
- Binary: Are the three components optimized? Yes/No

### Endowed Progress Effect
- Users are more likely to complete tasks if they feel progress has already been made
- Progress bar starting at "Step 1: Done" upon landing increases completion
- Pre-filling form fields shows progress has been made
- Binary: Is initial progress demonstrated? Yes/No

### Commitment and Consistency Principle
- Users who answer easy questions first are more likely to complete invasive questions at the end
- Start with low-friction questions (name, email) before high-friction ones (billing, salary)
- Binary: Are easy questions asked first? Yes/No

### Saccadic Scanning (Eye-Tracking)
- Users scan multi-column forms in a Z-pattern, breaking vertical momentum
- Single-column forms are 15.4 seconds faster than multi-column
- Use single-column layouts for all forms
- Binary: Is a single-column layout used? Yes/No

---

## PART 3: ISO 9241-110 DIALOGUE PRINCIPLES

1. **Suitability for the Task** — The interface must support task completion. Binary: Does the interface enable task completion? Yes/No
2. **Self-Descriptiveness** — Functionality must be immediately comprehensible without guessing. Binary: Is functionality immediately clear? Yes/No
3. **Conformity with User Expectations** — Consistent with user's predictable behavior patterns and mental models. Binary: Does it match user mental models? Yes/No
4. **Suitability for Learning** — Guide users through learning phases; use progressive disclosure and contextual help. Binary: Is learning path clear? Yes/No
5. **Controllability** — User can control the speed and sequence of interaction; can skip, slow down, or navigate non-linearly. Binary: Does user control speed/sequence? Yes/No
6. **Error Tolerance** — Intended result achieved with minimal corrective action despite errors. Examples: auto-correct typos, allow undo, provide suggestions. Binary: Can errors be recovered easily? Yes/No
7. **Suitability for Individualization** — Interface can be adjusted to user's needs (font size, theme, language). Binary: Can users customize the interface? Yes/No

---

## PART 4: WCAG 2.1/2.2 ACCESSIBILITY PRINCIPLES (POUR)

### 1. Perceivable
- Text alternatives for non-text content
- Sufficient color contrast (see specific ratios below)
- Binary: Is all information perceivable? Yes/No

### 2. Operable
- Keyboard accessibility
- Sufficient touch target size (44×44 CSS px minimum)
- Clear focus indicators
- Binary: Are all elements operable? Yes/No

### 3. Understandable
- Clear language, consistent labels
- Error messages in plain language
- Binary: Is everything understandable? Yes/No

### 4. Robust
- Valid HTML/ARIA, proper semantic markup
- Interpretable by assistive technologies
- Binary: Is content robust? Yes/No

---

## PART 5: WCAG 2.2 SPECIFIC CRITERIA WITH THRESHOLDS

### Contrast Ratios (SC 1.4.3)
- Body text (Level AA): **4.5:1 minimum** — no rounding; 4.499:1 is a FAIL
- Body text (Level AAA): 7:1 minimum
- Large text (18pt+ or 14pt bold+) Level AA: **3:1 minimum**
- Large text (Level AAA): 4.5:1 minimum

### Non-Text Contrast (SC 1.4.11)
- Buttons, input borders, icons, focus rings: **3:1 minimum** against background
- Binary: UI elements have 3:1 contrast? Yes/No

### Touch Target Size (SC 2.5.5 / 2.5.8)
- WCAG Minimum (AA): **24 × 24 CSS pixels**
- WCAG Recommended (AAA): **44 × 44 CSS pixels**
- Platform standards: **48 × 48 dp** (Android), **44 × 44 pt** (iOS)
- Ergonomic standard: 1cm × 1cm (≈35–40 pixels)
- **Safe cross-platform recommendation: 48 × 48**
- Spacing: Minimum **8px dead space** between interactive elements
- High-impact populations: 18mm for motor impairments; 57px for ASD users; 10–15mm for blind users
- Binary: Targets ≥ 44 × 44 px? Yes/No

### Keyboard Accessibility (SC 2.1.1)
- All functionality reachable and triggerable via keyboard only
- Tab through entire site must be possible
- Binary: All features work via keyboard? Yes/No

### Focus Indicators (SC 2.4.7 / 2.4.11 / 2.4.12)
- Visible focus on all interactive elements
- Focus must NOT be obscured by other content
- SC 2.4.12 (new): Sticky headers must not cover focused items during keyboard navigation
- Focus indicators must maintain 3:1 contrast
- Binary: All elements have visible, unobscured focus indicators? Yes/No

### Error Identification (SC 3.3.1)
- Errors identified in text, programmatically associated with the input
- Use ARIA: `aria-invalid="true"` paired with `aria-describedby` pointing to error text
- Example: `<input aria-invalid="true" aria-describedby="error-1"> <div id="error-1">Email must contain @ symbol</div>`
- Binary: Errors identified and associated programmatically? Yes/No

### Orientation (SC 1.3.4)
- Applications must NOT lock to Portrait or Landscape only
- Some users have wheelchair-mounted devices requiring landscape
- Binary: Both orientations supported? Yes/No

### Animation / Motion Control (SC 2.3.3)
- Infinite looping background videos MUST have a physical pause button
- OR video must auto-stop after 5 seconds maximum
- Respect CSS `prefers-reduced-motion: reduce` media query
- Binary: Animations can be paused or auto-stop after 5 sec? Yes/No

---

## PART 6: SCREEN READER AND SEMANTIC MARKUP

### Alt Text Rules
- Hard cap: **150 characters maximum**
- Never use "image of" or "photo of" prefix (screen readers already announce "Graphic")
- Provide meaningful, descriptive alternative text
- Decorative images: use `alt=""`
- Binary: Alt text < 150 chars without "image of"? Yes/No

### ARIA Requirements
- Every `aria-invalid="true"` must be paired with `aria-describedby`
- `aria-describedby` must point to the error message element's ID
- Binary: Errors paired with aria-describedby? Yes/No

### Semantic Markup
- Use proper HTML: `<nav>`, `<main>`, `<article>`, `<section>`, `<header>`, `<footer>`
- All form inputs must be associated with `<label>` elements
- Binary: Semantic markup used throughout? Yes/No

---

## PART 7: MOBILE VIEWPORT AND PERFORMANCE

### Sticky Headers
- Desktop: Save ~22% of navigation time — use them
- Mobile: Destroy valuable viewport real estate
- Mobile rule: Use "partially persistent" sticky headers — hide on scroll-down, reappear on scroll-up
- Header must not exceed **20% of mobile viewport height** when sticky
- Binary: Sticky headers partially persistent, <20% of viewport on mobile? Yes/No

### Responsive Design
- Layout must adapt to all screen sizes
- Minimum readable font size: **16px** (no zooming required)
- Interface must remain usable at **1.6× pinch-to-zoom** without horizontal scrolling
- Binary: Design is fully responsive and zoom-friendly? Yes/No

### Page Load Time Thresholds
- 0.1 seconds: Perceived as "instant" — direct manipulation feedback must complete within 100ms
- 1.0 second: Perceived as "seamless" — no indicator needed
- >1.0 second: **REQUIRES a status indicator** (spinner or progress bar)
- >10 seconds: Show percent-complete progress indicator OR allow the user to interrupt/cancel
- 1s load: ~20% bounce rate
- 3s load: ~40% bounce rate; over 50% of mobile users abandon sites loading >3 seconds
- 5s load: ~60% bounce rate
- 10s load: >90% bounce rate
- 1s → 10s increase: 123% increase in bounce probability
- 2-second expectation baseline: 50% of users expect pages to load in <2 seconds
- 75% of mobile sites currently take >10 seconds to load (massive CRO opportunity)
- Revenue impact: Moving from 19s → 5s load time can DOUBLE mobile ad revenue

### Core Web Vitals (Google / web.dev)
Measure using **75th percentile of real-user field data** — never lab averages.

**Largest Contentful Paint (LCP)** — perceived load speed:
- ≤2500ms = "Good" | 2500–4000ms = "Needs Improvement" | >4000ms = "Poor"
- Binary: LCP at p75 ≤2500ms? Yes/No

**Interaction to Next Paint (INP)** — responsiveness:
- ≤200ms = "Good" | 200–500ms = "Needs Improvement" | >500ms = "Poor"
- INP violations (>200ms) correlate with ~15% increase in rage-clicks in retail flows
- 2-second delays correlate with up to 51% decrease in session length
- Binary: INP at p75 ≤200ms? Yes/No

**Cumulative Layout Shift (CLS)** — visual stability:
- ≤0.1 = "Good" | 0.1–0.25 = "Needs Improvement" | >0.25 = "Poor"
- Improving CLS directly linked to ad revenue increases (iCook case study: +10% ad revenue)
- Visual instability causes accidental clicks and form field errors
- Binary: CLS at p75 ≤0.1? Yes/No

**Start Render sweet spot**: 0.9s–1.5s (conversion peaks by device: desktop ~1.8s, tablet ~1.9s, mobile ~2.7s)

---

## PART 8: ADDITIONAL DOCUMENTED CONTRADICTIONS

### SERP Features Paradox
- Rich snippets **increase CTR** for listings that earn them
- Knowledge Graphs **can LOWER CTR** for the top organic result — they answer the query on the SERP, removing the click incentive
- Status: Both findings validated in different contexts

### Heuristic Definition Conflict
- Nielsen/Molich: 10 usability heuristics (high-level principles)
- Baymard: 207–771 heuristics (component-level requirements)
- NOT the same category — terminology conflict (both use "heuristics" for different scopes)

### Research Data Discrepancies
- Baymard guideline count: cited as 207, 650, 700+, or 771 — living, tiered, evolving database
- Baymard total research hours: cited as 200,000 or 150,000 — likely reflects different research phases
- Most CRO blog "rules" are industry standards or professional opinions, NOT controlled academic experiments
- Exception: Load time/bounce and inline validation findings have supporting empirical data
