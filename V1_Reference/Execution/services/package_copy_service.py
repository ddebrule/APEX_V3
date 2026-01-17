"""Package Copy Service - Staging and application of setup packages.
Enables racers to preview package changes before applying to Digital Twin.
"""

from Execution.services.comparison_service import SETUP_PACKAGES


class PackageCopyService:
    """Service for staging and applying setup package changes.

    Workflow:
    1. stage_package() - Show what will change
    2. User edits values in staging modal
    3. apply_package() - Apply to actual_setup
    """

    def stage_package(self, package_name, reference_setup, current_setup):
        """Create staging dict showing proposed changes for a package.

        Args:
            package_name: str - Name of package (Suspension, Geometry, Diffs, Tires, Power)
            reference_setup: dict - The baseline setup to copy from
            current_setup: dict - The current actual_setup

        Returns:
            dict with structure:
            {
                'package_name': str,
                'changes': [
                    {
                        'param': str,
                        'current': value,
                        'proposed': value,
                        'will_change': bool,
                        'param_type': 'integer' | 'float' | 'text'
                    },
                    ...
                ],
                'total_params': int,
                'changes_count': int
            }

        """
        if package_name not in SETUP_PACKAGES:
            raise ValueError(f"Unknown package: {package_name}")

        package_info = SETUP_PACKAGES[package_name]

        staging = {
            'package_name': package_name,
            'package_info': package_info,
            'changes': [],
            'total_params': 0,
            'changes_count': 0
        }

        # Parameter type mapping for input field rendering
        integer_params = ['DF', 'DC', 'DR', 'SO_F', 'SO_R', 'ST_F', 'ST_R', 'Bell', 'Spur']
        float_params = ['SB_F', 'SB_R', 'P_F', 'P_R', 'Toe_F', 'Toe_R', 'RH_F', 'RH_R', 'C_F', 'C_R', 'Venturi']

        for param in package_info['params']:
            reference_val = reference_setup.get(param, '—')
            current_val = current_setup.get(param, '—')

            # Determine parameter type for input rendering
            if param in integer_params:
                param_type = 'integer'
            elif param in float_params:
                param_type = 'float'
            else:
                param_type = 'text'

            # Normalize values for comparison
            ref_normalized = str(reference_val) if reference_val != '—' else '—'
            curr_normalized = str(current_val) if current_val != '—' else '—'

            will_change = (ref_normalized != curr_normalized)

            change_entry = {
                'param': param,
                'current': current_val,
                'proposed': reference_val,
                'will_change': will_change,
                'param_type': param_type
            }

            staging['changes'].append(change_entry)
            staging['total_params'] += 1

            if will_change:
                staging['changes_count'] += 1

        return staging

    def apply_package(self, package_name, edited_values, current_setup):
        """Apply a staged package to the current setup.

        Args:
            package_name: str - Name of package
            edited_values: dict - Parameter values after user edits (key=param, value=new_value)
            current_setup: dict - Current actual_setup

        Returns:
            tuple: (updated_setup: dict, changes_applied: int)

        """
        if package_name not in SETUP_PACKAGES:
            raise ValueError(f"Unknown package: {package_name}")

        package_info = SETUP_PACKAGES[package_name]

        # Create updated setup
        updated_setup = current_setup.copy()
        changes_applied = 0

        # Apply each parameter in the package
        for param in package_info['params']:
            if param in edited_values:
                old_value = updated_setup.get(param, '—')
                new_value = edited_values[param]

                # Only count if value actually changed
                if str(old_value) != str(new_value):
                    updated_setup[param] = new_value
                    changes_applied += 1

        return updated_setup, changes_applied

    def preview_change(self, param_name, new_value, current_value):
        """Helper to show before/after for a single parameter change.

        Args:
            param_name: str - Parameter name
            new_value: any - Proposed value
            current_value: any - Current value

        Returns:
            dict with preview info

        """
        return {
            'param': param_name,
            'current': str(current_value) if current_value != '—' else '—',
            'proposed': str(new_value) if new_value != '—' else '—',
            'will_change': str(current_value) != str(new_value)
        }

    def get_package_change_summary(self, staging_dict):
        """Get human-readable summary of package changes.

        Args:
            staging_dict: dict - Result from stage_package()

        Returns:
            str - Summary text

        """
        total = staging_dict['total_params']
        changing = staging_dict['changes_count']
        package_name = staging_dict['package_name']

        if changing == 0:
            return f"✓ {package_name} is identical - no changes needed"
        elif changing == total:
            return f"⚠️ {package_name}: All {total} parameters will change"
        else:
            return f"📝 {package_name}: {changing} of {total} parameters will change"

    def validate_staging(self, staging_dict):
        """Validate that staging dict is well-formed.

        Args:
            staging_dict: dict - Result from stage_package()

        Returns:
            tuple: (is_valid: bool, error_msg: str or "")

        """
        # Check required keys
        required_keys = ['package_name', 'changes', 'total_params', 'changes_count']
        for key in required_keys:
            if key not in staging_dict:
                return False, f"Invalid staging: missing '{key}'"

        # Check changes structure
        if not isinstance(staging_dict['changes'], list):
            return False, "Invalid staging: 'changes' must be list"

        for change in staging_dict['changes']:
            required_change_keys = ['param', 'current', 'proposed', 'will_change', 'param_type']
            for key in required_change_keys:
                if key not in change:
                    return False, f"Invalid change entry: missing '{key}' for param {change.get('param', '?')}"

        return True, ""


# Singleton instance
package_copy_service = PackageCopyService()
