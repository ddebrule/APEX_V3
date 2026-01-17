# Product Spec: Tab 1 - Mission Control (Pre-Event Strategy)

## 1. The Goal
**"Where are we going and are we ready?"**
The Mission Control tab is the logical starting point for every race weekend. Its purpose is to transition the racer from "Shop Mode" (maintenance and building) to "Event Mode" (strategy and execution).

## 2. The User
**The Logical Racer:** Sitting at a desk or workbench, detail-oriented, planning logistics. They need absolute data integrity and a clear path forward.

## 3. Data Model
This tab primary interacts with the following entities:

### 3.1 Racer Profile
- **id** (UUID)
- **name** (String)
- **email** (Email)
- **sponsors** (String Array)
- **vehicles** (Vehicle Array)

### 3.2 Vehicle
- **id** (UUID)
- **brand** (Tekno, Associated, Xray, etc.)
- **model** (NB48 2.2, etc.)
- **transponder_id** (String)
- **baseline_id** (UUID - Reference to Shop Master setup)

### 3.3 Session (The Root Anchor)
- **id** (UUID)
- **event_name** (String)
- **type** (Practice, Qualifier, Main)
- **date** (DateTime)
- **track_id** (UUID - From Global Track Library)
- **track_context** (JSONB: Traction, Surface Type, Surface Condition)
- **actual_setup** (JSONB - The "Digital Twin")

## 4. Requirements

### 4.1 Event Initialization
- [ ] Select/Create Racer Profile.
- [ ] Select Vehicle from the fleet.
- [ ] Input Event Context: Name, Type, Date.
- [ ] Input Track Context: Select from Library or create new.

### 4.2 Historical Recon (Institutional Memory)
- [ ] AI-Driven summary of "Last Year/Last Time" at this track.
- [ ] Retrieval of the most successful setup used at this track/condition.

### 4.3 Baseline Load
- [ ] Load a "Shop Master" or "Pro Baseline" as the initial `actual_setup`.
- [ ] Visual verification of the loaded baseline before locking.

### 4.4 Race Prep Plan (PDG Generation)
- [ ] Proactive PDF generation including:
    - Strategic goals.
    - Mechanical checklist (shock rebuilds, etc.).
    - Parts to bring (Tires, Oils).

## 5. The Racer Journey (Logic Flow)
1. **Context Entry:** User enters "SDRC Raceway - Fall Brawl".
2. **Memory Pull:** Librarian Persona pulls the high-traction indoor clay profile from last year.
3. **Vehicle Prep:** User selects Tekno NB48 2.2.
4. **Baseline Suggestion:** AI Advisor recommends "Low Grip Baseline" because current temps are lower than last year.
5. **Lock-In:** User approves and "Inits" the session, creating the Digital Twin.
