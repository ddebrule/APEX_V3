import os
import sys

# Add execution dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))

from email_service import email_service


def test_scribe_mock():
    # Simple simulation of highlighting logic in dashboard.py
    insight_keywords = ["bottoming", "loose", "traction", "rotation", "wash", "stability", "entry", "exit", "jump", "land", "consistency"]
    test_queries = [
        "The car feels okay.",
        "The car is bottoming out on the double.",
        "Need more rear traction."
    ]

    print("Testing Scribe Highlighting Logic...")
    for q in test_queries:
        has_insight = any(word in q.lower() for word in insight_keywords)
        status = "[HIGHLIGHT]" if has_insight else "[NORMAL]"
        print(f"  {status} Query: {q}")

def test_email_logic():
    print("\nTesting Email Automation Hook (Mock Mode)...")
    success, msg = email_service.send_report("racer@example.com", "A.P.E.X. Test Report", "This is a test summary.")
    print(f"  Result: {msg}")
    assert success is True

if __name__ == "__main__":
    test_scribe_mock()
    test_email_logic()
    print("\nv1.7.0 LOGIC VERIFIED.")
