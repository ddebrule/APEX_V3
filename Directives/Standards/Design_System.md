# A.P.E.X. Design System
**Version:** 1.0
**Status:** [APPROVED]

## 1. Visual Philosophy
*   **Vibe:** "Bloomberg Terminal meets F1 Pit Wall". Professional, high-density, executive.
*   **Core Concept:** The "Dark Cockpit". Information pops against a deep, receding background.
*   **Structure:** Slightly rounded corners (6px) to balance professional industrial feel with modern UI accessibility.
*   **Signal-to-Noise:** High. Data is white/colored; Structure is dark/invisible. No decorative fluff.
*   **Responsiveness:** **Desktop/Tablet First.** The "Command Center" requires screen real estate. Mobile is a companion view, but the primary interface is a dense dashboard grid.

## 2. Color Palette
The palette mimics a high-contrast trading terminal or telemetry screen.

### Foundations (Backgrounds)
*   `--bg-app`: `#121212` (Deep Charcoal - NOT Pitch Black)
*   `--bg-card`: `#1E1E1E` (Lighter Charcoal - Elevation 1)
*   `--bg-input`: `#2C2C2C` (Input Fields)
*   `--bg-overlay`: `rgba(0, 0, 0, 0.8)` (Modals)

### Text & Content
*   `--text-primary`: `#FFFFFF` (Stark White - 100% Opacity)
*   `--text-secondary`: `#A0A0A0` (Dull Grey - 70% Opacity - Labels)
*   `--text-tertiary`: `#606060` (Disabled/Subtle)

### Functional Signals ("AGR Professional" Palette)
*   `--bg-app`: `#121212` (Matte Black)
*   `--bg-card`: `#1C1C1C` (Grey Card)
*   `--color-primary`: `#D32F2F` (Racing Red) - *Core Brand.*
*   `--color-secondary`: `#2979FF` (Racing Blue)
*   `--color-warning`: `#F59E0B` (Amber)
*   `--color-success`: `#4CBB17` (Kelly Green) - *Vibrant, classic racing status color.*

### Navigation Architecture
*   **Strategy:** Collapsible Sidebar (Drawer). 
*   **Benefit:** Maximizes horizontal space for dense dashboard grids while maintaining quick access to tabs via one-click expansion or "Mini" icon-view.
*   **Interaction:** Hamburger menu toggles between "Full" (250px) and "Mini" (64px) modes.

### Borders & Dividers
*   `--border-subtle`: `#333333`
*   `--border-focus`: `#D32F2F` (Racing Red)

## 3. Typography
**Font Family:** `Inter`, `Roboto`, or system-native Sans-Serif.

### Hierarchy
*   **HEADER (H1/H2):** UPPERCASE, BOLD, TRACKING-WIDE. (e.g., `MISSION CONTROL`)
*   **Subheader (H3/H4):** Uppercase, Regular, Colored (Signal). (e.g., `EVENT LOG`)
*   **Body:** Regular, clean, high readability.
*   **Data/Numbers:** **Monospaced/Tabular** (`Courier Prime`, `Fira Code`, or `font-feature-settings: 'tnum'`). This is CRITICAL for easy comparison of numbers.

### Sizing (Mobile Base)
*   `text-xs`: 12px (Labels)
*   `text-sm`: 14px (Body/Inputs)
*   `text-base`: 16px (Standard Data)
*   `text-lg`: 18px (Button Text)
*   `text-xl`: 24px (Key Performance Metrics)

## 4. Component Shell (The "Brick")

### The Data Card
Every discrete unit of information lives in a "Card".
*   **Background:** `--bg-card`
*   **Border:** 1px solid `--border-subtle`
*   **Radius:** 4px (Sharp, industrial look - not fully rounded)
*   **Padding:** Dense (8px or 12px). Small gaps.

### The Input Field
*   **Style:** Full width, heavy contrast.
*   **Background:** `--bg-input`
*   **Text:** White.
*   **Border:** Bottom-only or full-box subtle.

### The Button
*   **Primary:** Solid `--color-info` background, BLACK text (High Contrast).
*   **Secondary:** Outline `--border-subtle`, White text.
*   **Destructive:** Red outline or background.
*   **Touch:** Minimum height 44px.

## 5. Layout Patterns
*   **Mobile:** Single column stack. Bottom navigation bar (Thumb zone).
*   **Desktop:** Dashboard grid. Sidebar navigation.
*   **Tab System:** Segmented Controls (iOS style) rather than browser tabs.
