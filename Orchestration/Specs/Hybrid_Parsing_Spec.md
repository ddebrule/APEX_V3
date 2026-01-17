# Tech Spec: Hybrid Parsing Engine (V3)

## Overview
100% data fidelity for importing setup sheets from PDF templates or photos.

## Layer 1: AcroForm Extraction (Primary)
- **Tooling:** `pypdf` or `pdfminer.six`.
- **Logic:** Map Brand-specific PDF field names (e.g., `Front_Shock_Oil`) to the A.P.E.X. **26-Parameter Schema**.
- **Accuracy:** Should be 100% for digital files.

## Layer 2: AI Vision Fallback (Secondary)
- **Tooling:** Anthropic Claude 3.5 Sonnet / Gemini 1.5 Pro.
- **Logic:** 
  1. Image Pre-processing (Clean up shadows/skew).
  2. OCR + Visual Logic (e.g., "Find the box labeled 'Camber' and read the handwritten value").
- **Verification:** The system returns the parsed data in a "Verification Card" for the user to confirm before ingestion.

## Supported Brands (Phase 1)
- Tekno RC
- Team Associated
- Xray
- Mugen Seiki

## Directory Structure
- `Execution/backend/services/parsing/`
  - `brand_maps.json`: The Rosetta Stone mapping PDF IDs to A.P.E.X. IDs.
  - `pdf_parser.py`: Layer 1 execution.
  - `vision_parser.py`: Layer 2 execution.
