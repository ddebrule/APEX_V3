import os
from typing import Optional

import PyPDF2


class SetupParser:
    """Hybrid parsing engine for setup sheets.
    Supports PDF form extraction and AI Vision (future).
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.templates_dir = os.path.join(self.base_dir, "..", "Data", "Setup_Templates")

        # Brand-specific field mappings (PDF form field names -> our schema)
        self.brand_mappings = {
            "Tekno": self._get_tekno_mapping(),
            "Associated": self._get_associated_mapping(),
            "Mugen": self._get_mugen_mapping(),
            "Xray": self._get_xray_mapping()
        }

    def _get_tekno_mapping(self) -> dict[str, str]:
        """Field mapping for Tekno setup sheets."""
        return {
            "FDO": "DF",
            "CDO": "DC",
            "RDO": "DR",
            "FSO": "SO_F",
            "FSPRING": "SP_F",
            "FB": "SB_F",
            "FP": "P_F",
            "FT": "Toe_F",
            "FRH": "RH_F",
            "FC": "C_F",
            "FUTL": "ST_F",
            "RSO": "SO_R",
            "RSPRING": "SP_R",
            "RSB": "SB_R",
            "RP": "P_R",
            "RT": "Toe_R",
            "RRH": "RH_R",
            "RC": "C_R",
            "RUTL": "ST_R",
            "TBT": "Tread",
            "TC": "Compound",
            "DriveC": "Clutch",
            "DriveBBF": "Bell",
            "DriveBBR": "Spur",
            "EngineP": "Pipe"
        }

    def _get_associated_mapping(self) -> dict[str, str]:
        """Field mapping for Associated setup sheets (RC8B4/RC8T4). v1.7.0 - VERIFIED FROM ACTUAL PDF."""
        return {
            # Diffs (Actual field names from PDF)
            "Diff Fluid Front": "DF",
            "Diff Fluid Center": "DC",
            "Diff Fluid Rear": "DR",
            # Front Suspension
            "Front Fluid": "SO_F",
            "Front Spring": "SP_F",
            "Front Anti-Roll Bar Size": "SB_F",
            "Front Piston": "P_F",
            "Front Toe": "Toe_F",
            "Front Ride Height": "RH_F",
            # Front Camber (not a single field - calculated from shims)
            "Front Shock Tower": "ST_F",
            # Rear Suspension
            "Rear Fluid": "SO_R",
            "Rear Spring": "SP_R",
            "Rear Anti-Roll Bar Size": "SB_R",
            "Rear Piston": "P_R",
            # Rear Toe (not a single field for Associated)
            "Rear Ride Height": "RH_R",
            "Rear Camber": "C_R",
            "Rear Shock Tower": "ST_R",
            # Tires
            "Front Tires": "Tread",
            "Insert Type": "Compound",  # Associated uses inserts, not compounds
            # Power
            "Bell": "Bell",
            "Spur Gear": "Spur",
            "Muffler": "Pipe",
            "Clutch and Gearing Notes": "Clutch"  # Clutch is in notes field
        }

    def _get_mugen_mapping(self) -> dict[str, str]:
        """Field mapping for Mugen setup sheets (MBX8/MTX8). v1.7.0
        NOTE: Mugen PDFs have NO FILLABLE FIELDS - use Vision AI parsing only.
        This mapping is kept as a placeholder for potential future use.
        """
        return {
            # Mugen templates have no AcroForm fields - Vision AI required
            # Placeholder mapping for reference (not used in PDF parsing)
        }

    def _get_xray_mapping(self) -> dict[str, str]:
        """Field mapping for Xray setup sheets (XB8/XT8). v1.7.0 - VERIFIED FROM ACTUAL PDF
        NOTE: Xray uses NUMERIC field codes (001, 002, etc.) without descriptive names.
        Without a legend/manual mapping each code to a parameter, PDF parsing is not reliable.
        RECOMMENDATION: Use Vision AI parsing for Xray setup sheets.
        """
        return {
            # Xray PDFs use numeric codes (001-118) without descriptive names
            # Examples found: "FF", "FR", "RF", "RR", "HS", "anti-roll bar", "chassis", etc.
            # But most critical parameters (diff oils, shock oils) are just numbers
            # Vision AI parsing is recommended for Xray until a field code legend is obtained

            # Known descriptive fields (limited):
            "anti-roll bar": "SB_F",  # Appears to be generic anti-roll bar field
            "chassis": "ST_F",  # Chassis/shock tower reference
            # Numeric codes require manual legend - not implemented without documentation
        }

    def parse_pdf(self, pdf_path: str, brand: str) -> Optional[dict]:
        """Extract setup data from a fillable PDF with automatic Vision AI fallback.
        v1.7.0 - Enhanced with automatic fallback to Vision AI if:
        1. No fillable form fields exist (Mugen case)
        2. Field mapping is insufficient/empty (Xray case)
        3. Extracted data is insufficient (<5 parameters).

        Args:
            pdf_path: Path to the PDF file
            brand: Vehicle brand (for field mapping)

        Returns:
            Dict with extracted setup parameters, or None if both methods fail

        """
        try:
            reader = PyPDF2.PdfReader(pdf_path)

            # Try AcroForm extraction first
            if "/AcroForm" in reader.trailer["/Root"]:
                fields = reader.get_fields()

                if fields:
                    # Get brand-specific mapping
                    mapping = self.brand_mappings.get(brand, {})

                    # Extract and map values
                    setup_data = {}
                    for field_name, field_data in fields.items():
                        if field_name in mapping:
                            our_key = mapping[field_name]
                            value = field_data.get('/V', '')

                            # Type conversion
                            if our_key in ['DF', 'DC', 'DR', 'SO_F', 'SO_R', 'Bell', 'Spur']:
                                setup_data[our_key] = int(value) if value else 0
                            elif our_key in ['SB_F', 'SB_R', 'Toe_F', 'Toe_R', 'RH_F', 'RH_R', 'C_F', 'C_R', 'Venturi']:
                                setup_data[our_key] = float(value) if value else 0.0
                            else:
                                setup_data[our_key] = str(value)

                    # If we got enough data (5+ parameters), return it
                    if len(setup_data) >= 5:
                        return setup_data

            # FALLBACK: Convert PDF to image and use Vision AI
            # This handles: Mugen (no fields), Xray (numeric codes), or insufficient extraction
            print(f"AcroForm extraction insufficient for {brand}. Falling back to Vision AI...")
            return self._pdf_to_vision(pdf_path, brand)

        except Exception as e:
            print(f"PDF parsing error: {e}")
            return None

    def _pdf_to_vision(self, pdf_path: str, brand: str) -> Optional[dict]:
        """Convert PDF first page to image and parse with Vision AI.
        Internal method used as fallback from parse_pdf.
        """
        try:
            # Convert PDF first page to image using PyPDF2 + PIL
            import io

            reader = PyPDF2.PdfReader(pdf_path)
            if len(reader.pages) == 0:
                return None

            # Convert PDF to image using pdf2image library
            try:
                from pdf2image import convert_from_path
                images = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=200)
                if images:
                    # Convert PIL Image to bytes
                    img_byte_arr = io.BytesIO()
                    images[0].save(img_byte_arr, format='JPEG', quality=95)
                    img_byte_arr = img_byte_arr.getvalue()

                    # Use Vision AI parsing
                    return self.parse_with_vision(img_byte_arr, brand)
            except ImportError:
                print("pdf2image not installed. Cannot convert PDF to image for Vision AI fallback.")
                print("Install with: pip install pdf2image")
                return None

        except Exception as e:
            print(f"PDF to Vision fallback error: {e}")
            return None

    def parse_with_vision(self, image_bytes: bytes, brand: str) -> Optional[dict]:
        """Extract setup data from an image using AI Vision (Claude). v1.7.0."""
        import base64
        import json

        import anthropic

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return None

        client = anthropic.Anthropic(api_key=api_key)

        # Enhanced vision prompt with examples (v1.7.0)
        vision_prompt = f"""
You are analyzing an RC car setup sheet for {brand}. Extract all visible setup parameters.

CRITICAL PARAMETERS TO FIND:
- Diff Oils: Front (DF), Center (DC), Rear (DR) - usually in CST (e.g., 5000, 7000, 3000)
- Shock Oil: Front (SO_F), Rear (SO_R) - usually in CST (e.g., 450, 500)
- Springs: Front (SP_F), Rear (SP_R) - color codes (e.g., "Silver") or spring rates
- Sway Bars: Front (SB_F), Rear (SB_R) - wire diameter or stiffness (e.g., 1.2mm, "Medium")
- Pistons: Front (P_F), Rear (P_R) - hole configuration (e.g., "2x1.3")
- Toe: Front (Toe_F), Rear (Toe_R) - degrees (e.g., 2.0, -1.0)
- Ride Height: Front (RH_F), Rear (RH_R) - mm (e.g., 30, 32)
- Camber: Front (C_F), Rear (C_R) - degrees (e.g., -1.5, -2.0)
- Shock Towers: Front (ST_F), Rear (ST_R) - position or type
- Tire Tread and Compound (e.g., "Bar Codes", "Blue Groove")
- Gearing: Clutch, Bell (teeth), Spur (teeth)
- Power: Pipe, Venturi

Return ONLY a valid JSON object with keys from this list:
DF, DC, DR, SO_F, SP_F, SB_F, P_F, Toe_F, RH_F, C_F, ST_F, SO_R, SP_R, SB_R, P_R, Toe_R, RH_R, C_R, ST_R, Tread, Compound, Clutch, Bell, Spur, Pipe, Venturi

EXAMPLE OUTPUT:
{{"DF": 5000, "DC": 7000, "DR": 3000, "SO_F": 450, "SO_R": 500, "SP_F": "Silver", "SP_R": "Gold", "Tread": "Bar Codes", "Compound": "Blue"}}

If a parameter is not visible or unclear, omit it from the JSON. Only include parameters you can clearly read.
"""

        try:
            image_base64 = base64.b64encode(image_bytes).decode("utf-8")
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",  # v1.7.0 - Latest vision model
                max_tokens=1000,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_base64}},
                        {"type": "text", "text": vision_prompt}
                    ]
                }]
            )

            # Extract JSON from response
            res_text = response.content[0].text
            import re
            json_match = re.search(r'\{.*\}', res_text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return None
        except Exception as e:
            print(f"Vision parsing error: {e}")
            return None

    def save_custom_template(self, uploaded_file, brand: str, model: str):
        """Save a user-uploaded template to the templates directory.

        Args:
            uploaded_file: Streamlit uploaded file object
            brand: Vehicle brand
            model: Vehicle model

        """
        filename = f"{brand}_{model}_Setup_Template.pdf"
        save_path = os.path.join(self.templates_dir, filename)

        with open(save_path, "wb") as f:
            f.write(uploaded_file.getbuffer())

        return save_path

# Singleton instance
setup_parser = SetupParser()
