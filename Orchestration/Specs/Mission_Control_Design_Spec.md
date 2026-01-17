# Design Spec: Tab 1 - Mission Control (V3)

## 1. Visual Intent
**"Bloomberg Terminal for RC Racing"**. The layout must feel high-density, authoritative, and data-rich.

## 2. Global Aesthetics (Directives Reference)
- **Background:** `Color: #0A0A0B` (Deep Matte Charcoal)
- **Surface:** `Color: #141416` (Card Background)
- **Typography:** 
    - Headers: `Inter`, Bold, UPPERCASE, Letter Spacing: `0.05em`.
    - Data: `JetBrains Mono` (Monospaced), Semi-bold.
- **Accents:** 
    - Signal Green: `#00E676` (Good/Improving)
    - Alert Red: `#FF5252` (Warning/Failing)
    - Action Blue: `#2979FF` (Interactive)

## 3. Layout Wireframe (Text-Based)

```text
+-----------------------------------------------------------------------+
|  [A.P.E.X. V3]       Mission Control       [Battery/Signal/Sync]      |
+-----------------------------------------------------------------------+
|                                                                       |
|  [ SECTION: EVENT IDENTITY ]                                          |
|  +-------------------------------------+ +--------------------------+ |
|  | Racer: [ SELECT RACER  v ]          | | Vehicle: [SELECT CAR v]  | |
|  | Event: [ SDRC Fall Brawl ]          | | Transponder: [ TX7784 ]  | |
|  +-------------------------------------+ +--------------------------+ |
|                                                                       |
|  [ SECTION: TRACK INTELLIGENCE ]                                      |
|  +------------------------------------------------------------------+ |
|  | Track: SDRC Raceway [MAP]                                        | |
|  | Traction: [HIGH] | Surface: [CLAY] | Condition: [GROOVED/MOIST]   | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  [ SECTION: INSTITUTIONAL MEMORY (Librarian Persona) ]               |
|  +------------------------------------------------------------------+ |
|  | >> ALERT: "Last session here (2025) you ran 21.2s avg pace."      | |
|  | >> STRATEGY: "Recommend Green Tread Tires for current temp (72F)" | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  [ SECTION: BASELINE INITIALIZATION ]                                 |
|  +-------------------------------------+ +--------------------------+ |
|  | Load: [ SHOP MASTER 2026 v ]        | | [ INIT RACING SESSION ]  | |
|  | Status: [ READY TO LOCK ]           | | [ PREP PDF CHECKLIST ]   | |
|  +-------------------------------------+ +--------------------------+ |
|                                                                       |
+-----------------------------------------------------------------------+
```

## 4. Interaction Components

### 4.1 "Glass" Cards
All sections should be wrapped in high-density cards with a `1px` border of `rgba(255,255,255,0.05)`.

### 4.2 Status Tickers
In **Track Intelligence**, use subtle "Ticker" style indicators for Traction and Temperature:
- `[ TEMP: 72°F | RISE: 2.1°/HR ]` (Monospaced, safety yellow).

### 4.3 Action Center (The "Lock")
The **INIT RACING SESSION** button should be a "Double-Confirm" interaction to prevent accidental session starts. A long press or slide-to-lock interaction is preferred for the tablet-first experience.

## 5. Copy & Narrative
- **Primary Header:** SESSION V1.0 INITIALIZATION
- **Sub-headers:** FLEET CONFIG, TRACK DATA, INTELLIGENCE HARVEST
- **Tone:** Professional, Concise, "Mission Ready".
