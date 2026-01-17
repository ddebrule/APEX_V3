# Tech Standards: A.P.E.X. V3

## Hosting & Infrastructure
- **Frontend Hosting:** Vercel (Hobby Tier)
- **Database Backend:** Supabase (PostgreSQL 15+ with `pgvector`)
- **File Storage:** Supabase Storage (for setup sheets and photos)
- **Auth:** Supabase Auth (Magic Links / Social)

## Frontend
- **Framework:** React / Next.js (App Router)
- **Styling:** Vanilla CSS (Expert aesthetics)
- **Deployment:** Vercel Edge Network

## Multimedia Protocols
- **Image Handling:** Supabase Storage. Edge compression on-device before upload. High-contrast processing for setup sheet OCR.
- **PDF Parsing:** 
    - *Layer 1:* Strict AcroForm extraction (Python).
    - *Layer 2:* AI Vision (Claude 3.5 Sonnet) for "Verified" secondary parsing.
- **Voice Interface:** 
    - *Protocol:* **Precision Manual Trigger** (Big-button start/stop). No continuous listening.
    - *Environment:* Optimized for "Pit Table" acoustics (moderate background noise, not engine-stand levels).
    - *Processing:* OpenAI Whisper for precise data-dense transformation.

## Standard Protocols
- **Naming:** 
  - Backend/Services: `snake_case`
  - Frontend Components: `PascalCase`
- **Versioning:** SemVer (v2.0.0)
