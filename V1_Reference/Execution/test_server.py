import os
import sys

# Add directory to path to allow import
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from mcp_server import _log_session_impl, _manage_baseline_impl, _tuning_advisor_impl


def test_log_session():
    print("Testing log_session...")
    result = _log_session_impl("Note: Testing the logger.", fleet_id="nb48")
    print(f"Result: {result}")
    assert "Logged" in result
    assert "fleet:buggy" in result

def test_manage_baseline():
    print("\nTesting manage_baseline...")
    # Get
    data = _manage_baseline_impl("get", "nt48")
    print(f"Get Result: {data}")
    assert "Tekno NT48" in data

    # Update
    update_res = _manage_baseline_impl("update_experiment", "nt48", key="shocks.oil_front", value="600 cst")
    print(f"Update Result: {update_res}")
    assert "updated" in update_res

    # Verify Update
    data_new = _manage_baseline_impl("get", "nt48")
    assert "600 cst" in data_new

def test_tuning_advisor():
    print("\nTesting tuning_advisor...")
    advice = _tuning_advisor_impl("Need more steering", "buggy")
    print(f"Advice Result: {advice}")
    assert "Core Setup Directives" in advice
    assert "Available Theory Resources" in advice

if __name__ == "__main__":
    try:
        test_log_session()
        test_manage_baseline()
        test_tuning_advisor()
        print("\nALL TESTS PASSED")
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
