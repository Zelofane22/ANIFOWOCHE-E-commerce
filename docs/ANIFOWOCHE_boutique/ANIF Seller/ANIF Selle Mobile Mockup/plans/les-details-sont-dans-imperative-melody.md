# Plan — ANIFOWOCHE E-Commerce Mockup

## Context
The brief (in `src/imports/pasted_text/figma-make-prompt.md`) describes a complete, navigable high-fidelity mockup for **ANIFOWOCHE**, a fabric/clothing/accessories e-commerce site targeting mobile users in Cotonou, Bénin. The design spec mandates white background, yellow `#E6D315` accent, modern sans-serif, and 5 linked screens: Catalogue, Product Detail, Cart, Checkout, Order Confirmation.

---

## Aesthetic Stance
- **Stance:** Minimalist — generous whitespace, one hero accent, precise alignment
- **Font:** **Manrope** (Google Fonts) — geometric humanist sans, less overused than Inter, excellent mobile legibility. Weights 400/500/600/700.
- **Palette (from brief, non-negotiable):**
  - Background: `#FFFFFF`
  - Foreground: `#1A1A1A`
  - Primary (CTA/prices): `#E6D315`
  - Primary hover: `#B8A60F`
  - Accent light (badges, promo bg): `#FAF6C9`
  - Accent very pale (card bg, skeleton): `#FDFBE8`
  - Muted foreground: `#6B6B6B`
  - Border: `rgba(0,0,0,0.1)`
  - Radius: `10px` (medium, as specified)

---

## Files to Modify

### `src/styles/fonts.css`
Add Google Fonts import for Manrope (weights 400–700).

### `src/styles/theme.css`
Update token values only (preserve `@theme inline` block and `.dark` block):
- `--background: #FFFFFF`
- `--foreground: #1A1A1A`
- `--primary: #E6D315`
- `--primary-foreground: #1A1A1A`
- `--secondary: #FDFBE8`
- `--secondary-foreground: #1A1A1A`
- `--muted: #F5F5F5`
- `--muted-foreground: #6B6B6B`
- `--accent: #FAF6C9`
- `--accent-foreground: #1A1A1A`
- `--border: rgba(0,0,0,0.1)`
- `--radius: 0.625rem`
- Font variables to use Manrope

### `src/app/App.tsx`
Single file containing all screens and components (no react-router needed — navigation is managed via a `currentPage` React state string).

---

## Architecture

### Navigation
```ts
type Page = "catalogue" | "product" | "cart" | "checkout" | "confirmation"
const [currentPage, setCurrentPage] = useState<Page>("catalogue")
const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
```

### Components (all in App.tsx)

| Component | Description |
|-----------|-------------|
| `Navbar` | Sticky header: logo left, search icon + cart badge right. Menu burger on mobile. |
| `CategoryFilter` | Horizontal scrollable toggle buttons: Tissus / Vêtements / Accessoires |
| `ProductCard` | Square photo, category badge, name, price in FCFA format |
| `PromoBanner` | Yellow-light bg banner for promotions |
| `CataloguePage` | Search bar + CategoryFilter + ProductCard grid (1-col mobile, 3-4 desktop) |
| `ProductDetailPage` | Photo carousel with dots, size/qty selector, sticky CTA bottom |
| `CartPage` | Item list with steppers, subtotal, checkout CTA. Empty state with illustration. |
| `CheckoutPage` | Order summary, address form, delivery slot toggle, phone, payment cards |
| `ConfirmationPage` | Check icon, order number, SMS notice, back to home button |

### Sample Data
8 realistic products (fabrics + clothing + accessories) with Unsplash images:
- Pagne wax imprimé, Boubou brodé, Bazin riche, Robe bogolan, Foulard soie, Sac raphia, Sandales cuir, Pagnes unis en rouleaux
- Prices in FCFA (e.g. "15 000 F", "8 500 F")

---

## Responsive Breakpoints
- Mobile base: single column, compact padding
- `sm:` (640px+): 2-column product grid
- `lg:` (1024px+): 3-4 column grid, full horizontal nav visible in header

---

## Key Interaction Details
- Category filter: active toggle has `bg-[#E6D315]` text-black, inactive has `border border-black/20 bg-white`
- CTA buttons: `bg-[#E6D315] text-[#1A1A1A] hover:bg-[#B8A60F]` 
- Disabled CTA (no size selected): `bg-gray-200 text-gray-400 cursor-not-allowed`
- Input focus: `focus:border-[#E6D315] focus:ring-[#E6D315]/30`
- Payment cards: MTN (yellow brand), Moov (blue brand), Visa/MC — brand color on icon only, rest stays white/yellow

---

## Verification
1. All 5 screens must be reachable by clicking through the UI flow
2. Cart badge updates when items are added
3. Size selector gates the "Add to cart" CTA (disabled until selection)
4. Stepper in cart correctly increments/decrements quantity
5. "Payer X XOF" button on checkout shows the real total
6. Back-to-catalogue from confirmation resets to CataloguePage
