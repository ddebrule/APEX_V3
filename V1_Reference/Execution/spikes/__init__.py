"""
Phase 6.5.0 Spike Testing Suite

Isolated experiments to validate architectural assumptions before Phase 6.5.1-6.5.3.

Spike Structure:
- spike_timer.py        → Test st.fragment UI latency (< 200ms goal)
- spike_vector_db.py    → Test pgvector availability on Railway
- spike_state_manager.py → Test debounced persistence & crash recovery

Gate: All spikes must PASS before proceeding to implementation phases.

See: README.md for detailed testing instructions
See: ../Implementation_Plans/phase_6_5_spike_results.md for results tracking
"""
