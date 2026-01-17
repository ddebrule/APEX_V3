"""Setup Comparison Service for Phase 4.2
Provides binary comparison (match/different) between setups.
No severity scoring - just shows what's different.
"""


import pandas as pd

# Package definitions aligned with racer workflow
SETUP_PACKAGES = {
    "Suspension": {
        "params": ["SO_F", "SO_R", "SP_F", "SP_R", "SB_F", "SB_R", "P_F", "P_R"],
        "description": "Shocks, springs, sway bars, pistons",
        "icon": "🔧"
    },
    "Geometry": {
        "params": ["Toe_F", "Toe_R", "C_F", "C_R", "RH_F", "RH_R", "ST_F", "ST_R"],
        "description": "Toe, camber, ride height, shock towers",
        "icon": "📐"
    },
    "Diffs": {
        "params": ["DF", "DC", "DR"],
        "description": "Differential fluid weights",
        "icon": "⚙️"
    },
    "Tires": {
        "params": ["Tread", "Compound"],
        "description": "Tire tread and compound",
        "icon": "🛞"
    },
    "Power": {
        "params": ["Venturi", "Pipe", "Clutch", "Bell", "Spur"],
        "description": "Engine tuning and gearing",
        "icon": "⚡"
    }
}


class ComparisonService:
    """Simple binary comparison service for RC car setups.
    No severity scoring - just match (green) or different (red).
    """

    def compare_setups(self, user_setup: dict, reference_setup: dict) -> dict:
        """Compare two setups parameter-by-parameter.

        Args:
            user_setup: Current setup (from actual_setup or shop master)
            reference_setup: Reference setup (from master library)

        Returns:
            Dict with:
                - params: Parameter-level comparison data
                - match_count: Number of matching parameters
                - total_params: Total parameters compared
                - match_percent: Percentage match

        """
        comparison = {
            "params": {},
            "packages": {}
        }

        total_params = 0
        match_count = 0

        # Compare by package for organized display
        for package_name, package_info in SETUP_PACKAGES.items():
            package_matches = 0
            package_total = len(package_info['params'])

            for param in package_info['params']:
                total_params += 1

                # Get values (handle missing params gracefully)
                user_val = self._normalize_value(user_setup.get(param, "—"))
                ref_val = self._normalize_value(reference_setup.get(param, "—"))

                # Binary comparison: match or different
                is_match = (user_val == ref_val)

                if is_match:
                    match_count += 1
                    package_matches += 1

                comparison["params"][param] = {
                    "user": user_val,
                    "reference": ref_val,
                    "status": "match" if is_match else "different"
                }

            # Package-level summary
            comparison["packages"][package_name] = {
                "match_count": package_matches,
                "total_params": package_total,
                "match_percent": round((package_matches / package_total) * 100) if package_total > 0 else 0
            }

        # Overall summary
        comparison["match_count"] = match_count
        comparison["total_params"] = total_params
        comparison["match_percent"] = round((match_count / total_params) * 100) if total_params > 0 else 0

        return comparison

    def _normalize_value(self, value) -> str:
        """Normalize parameter values for comparison.
        Handles different data types and missing values.
        """
        if value is None or value == "" or pd.isna(value):
            return "—"

        # Convert to string for comparison
        # Strip whitespace and standardize case for text values
        str_val = str(value).strip()

        return str_val

    def validate_comparison_compatibility(self, user_vehicle: dict, reference_vehicle: dict) -> tuple[bool, str]:
        """Validate that two setups are for the same Brand/Model.
        Binary check - no scoring, just compatible or not.

        Args:
            user_vehicle: Dict with 'brand' and 'model' keys
            reference_vehicle: Dict with 'brand' and 'model' keys

        Returns:
            Tuple of (is_compatible, error_message)

        """
        user_brand = user_vehicle.get('brand', '').strip()
        user_model = user_vehicle.get('model', '').strip()
        ref_brand = reference_vehicle.get('brand', '').strip()
        ref_model = reference_vehicle.get('model', '').strip()

        if not user_brand or not user_model:
            return (False, "⚠️ Current vehicle not specified. Start a session or manually select a vehicle.")

        if not ref_brand or not ref_model:
            return (False, "⚠️ Reference setup missing vehicle information.")

        # Strict matching: Brand AND Model must be identical
        if user_brand.lower() != ref_brand.lower() or user_model.lower() != ref_model.lower():
            return (False,
                    f"⚠️ Cannot compare different vehicles!\n"
                    f"Your vehicle: {user_brand} {user_model}\n"
                    f"Reference: {ref_brand} {ref_model}\n\n"
                    f"Setup geometry differs between models.")

        return (True, "")

    def get_package_info(self, package_name: str) -> dict:
        """Get information about a specific package."""
        return SETUP_PACKAGES.get(package_name, {})

    def get_all_packages(self) -> dict:
        """Get all package definitions."""
        return SETUP_PACKAGES

    def get_parameters_for_package(self, package_name: str) -> list[str]:
        """Get list of parameters in a package."""
        package = SETUP_PACKAGES.get(package_name, {})
        return package.get('params', [])


# Singleton instance
comparison_service = ComparisonService()
