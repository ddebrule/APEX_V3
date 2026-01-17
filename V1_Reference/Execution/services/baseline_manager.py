"""A.P.E.X. Execution Layer - Baseline Manager
Manages Tekno NB48 2.2 and NT48 2.2 setups, experiments, and baseline promotions.
"""

import json
import logging
from datetime import datetime
from typing import Any, Literal, Optional, Union

from fastmcp import FastMCP
from pydantic import BaseModel, Field

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex.baseline_manager")

# Initialize FastMCP Server
mcp = FastMCP("APEX Baseline Manager")

# --- Data Models ---

class Sponsor(BaseModel):
    name: str = Field(..., description="Sponsor company name")
    website: Optional[str] = Field(None, description="Sponsor website or social link")

class RacerProfile(BaseModel):
    name: str = Field(..., description="Racer's full name")
    email: str = Field(..., description="Email for reports and history")
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    cars: list[str] = Field(default_factory=list, description="List of cars in the fleet")
    transponder: Optional[str] = Field(None, description="Primary transponder number")
    sponsors: list[Sponsor] = Field(default_factory=list)

class Shocks(BaseModel):
    oil_front: int = Field(..., description="Front shock oil viscosity (cst)")
    oil_rear: int = Field(..., description="Rear shock oil viscosity (cst)")
    piston_front: str = Field(..., description="Front piston configuration")
    piston_rear: str = Field(..., description="Rear piston configuration")
    spring_front: str = Field(..., description="Front spring color/length")
    spring_rear: str = Field(..., description="Rear spring color/length")
    sway_bar_front: float = Field(0.0, description="Front sway bar thickness (mm)")
    sway_bar_rear: float = Field(0.0, description="Rear sway bar thickness (mm)")

class Geometry(BaseModel):
    toe_front: float = Field(0.0, description="Front toe-in/out (degrees)")
    toe_rear: float = Field(0.0, description="Rear toe-in/out (degrees)")
    ride_height_front: float = Field(0.0, description="Front ride height (mm)")
    ride_height_rear: float = Field(0.0, description="Rear ride height (mm)")
    camber_front: float = Field(0.0, description="Front camber (degrees)")
    camber_rear: float = Field(0.0, description="Rear camber (degrees)")

class Tires(BaseModel):
    tread: str = Field(..., description="Tire tread pattern")
    compound: str = Field(..., description="Tire rubber compound")

class Diffs(BaseModel):
    front: int = Field(..., description="Front diff oil weight")
    center: int = Field(..., description="Center diff oil weight")
    rear: int = Field(..., description="Rear diff oil weight")

class Droop(BaseModel):
    front: float = Field(..., description="Front droop (mm above center)")
    rear: float = Field(..., description="Rear droop (mm below center)")

class Engine(BaseModel):
    venturi: float = Field(..., description="Engine venturi size (mm)")
    pipe: str = Field(..., description="Exhaust pipe and manifold combo")
    clutch: str = Field(..., description="Clutch setup (shoes/springs)")

class Gearing(BaseModel):
    bell: int = Field(..., description="Clutch bell tooth count")
    spur: int = Field(..., description="Spur gear tooth count")

# Enums/Literals
VehicleType = Literal["NB48_2.2", "NT48_2.2"]

class BaseVehicleSetup(BaseModel):
    """Base class for all vehicle setups."""

    id: str
    vehicle_type: VehicleType
    name: str
    version: int
    shocks: Shocks
    diffs: Diffs
    droop: Droop
    geometry: Geometry
    tires: Tires
    engine: Engine
    gearing: Gearing
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

class NB48_2_2(BaseVehicleSetup):
    """Tekno NB48 2.2 (Buggy) specific setup."""

    vehicle_type: Literal["NB48_2.2"] = "NB48_2.2"
    # Buggy Defaults
    shocks: Shocks = Field(default_factory=lambda: Shocks(
        oil_front=500, oil_rear=600,
        piston_front="1.2x4", piston_rear="1.7x4",
        spring_front="Yellow (78mm)", spring_rear="Yellow (73mm)",
        sway_bar_front=2.3, sway_bar_rear=2.5
    ))
    diffs: Diffs = Field(default_factory=lambda: Diffs(front=7000, center=5000, rear=5000))
    droop: Droop = Field(default_factory=lambda: Droop(front=120, rear=128))
    geometry: Geometry = Field(default_factory=lambda: Geometry(
        toe_front=-1.0, toe_rear=3.0,
        ride_height_front=27.0, ride_height_rear=28.0,
        camber_front=-2.0, camber_rear=-3.0
    ))
    tires: Tires = Field(default_factory=lambda: Tires(tread="Kosmos", compound="Green"))
    engine: Engine = Field(default_factory=lambda: Engine(venturi=7.0, pipe="REDS 2143", clutch="4-Shoe Medium"))
    gearing: Gearing = Field(default_factory=lambda: Gearing(bell=13, spur=48))

class NT48_2_2(BaseVehicleSetup):
    """Tekno NT48 2.2 (Truggy) specific setup."""

    vehicle_type: Literal["NT48_2.2"] = "NT48_2.2"
    # Truggy Defaults (Often Stiffer/Thicker than Buggy)
    shocks: Shocks = Field(default_factory=lambda: Shocks(
        oil_front=600, oil_rear=700,
        piston_front="1.3x8", piston_rear="1.3x8",
        spring_front="Pink (85mm)", spring_rear="Red (90mm)",
        sway_bar_front=2.5, sway_bar_rear=2.8
    ))
    diffs: Diffs = Field(default_factory=lambda: Diffs(front=10000, center=10000, rear=5000))
    droop: Droop = Field(default_factory=lambda: Droop(front=125, rear=135))
    geometry: Geometry = Field(default_factory=lambda: Geometry(
        toe_front=-1.0, toe_rear=3.0,
        ride_height_front=33.0, ride_height_rear=35.0,
        camber_front=-2.0, camber_rear=-3.0
    ))
    tires: Tires = Field(default_factory=lambda: Tires(tread="Relapse", compound="Green"))
    engine: Engine = Field(default_factory=lambda: Engine(venturi=8.0, pipe="REDS 2143", clutch="4-Shoe Heavy"))
    gearing: Gearing = Field(default_factory=lambda: Gearing(bell=13, spur=50))

class Experiment(BaseModel):
    """Logs a deviation from the baseline."""

    run_id: str
    parent_setup_id: str
    vehicle_type: VehicleType
    changes: dict[str, Any] # e.g., {"diffs.front": 10000}
    rating: int = Field(..., ge=1, le=5, description="Effectiveness rating (1-5)")
    notes: str = ""
    # Flag to indicate if this experiment addresses Truggy instability
    truggy_stability_priority: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())

# --- Persistence Layer (Mock/PostgreSQL Adapter) ---

class DataStore:
    def __init__(self):
        # In a real scenario, this would connect to PostgreSQL
        self.setups: dict[str, Union[NB48_2_2, NT48_2_2]] = {}
        self.experiments: dict[str, Experiment] = {}
        # Track active baseline per vehicle type
        self.active_baselines: dict[str, str] = {
            "NB48_2.2": None,
            "NT48_2.2": None
        }

        # Initialize default baselines
        self._init_defaults()

    def _init_defaults(self):
        # NB48 Default
        nb_default = NB48_2_2(
            id="NB48_baseline_v1",
            name="NB48 Factory Default",
            version=1
        )
        self.save_setup(nb_default)
        self.active_baselines["NB48_2.2"] = nb_default.id

        # NT48 Default
        nt_default = NT48_2_2(
            id="NT48_baseline_v1",
            name="NT48 Factory Default",
            version=1
        )
        self.save_setup(nt_default)
        self.active_baselines["NT48_2.2"] = nt_default.id

    def save_setup(self, setup: Union[NB48_2_2, NT48_2_2]):
        self.setups[setup.id] = setup
        logger.info(f"Saved setup: {setup.id} ({setup.vehicle_type})")

    def get_setup(self, setup_id: str) -> Optional[Union[NB48_2_2, NT48_2_2]]:
        return self.setups.get(setup_id)

    def save_experiment(self, experiment: Experiment):
        self.experiments[experiment.run_id] = experiment
        logger.info(f"Saved experiment: {experiment.run_id} (Rating: {experiment.rating})")

    def get_experiment(self, run_id: str) -> Optional[Experiment]:
        return self.experiments.get(run_id)

db = DataStore()

# --- MCP Tools ---

@mcp.tool()
def get_active_baseline(vehicle_type: str) -> str:
    """Returns the current active setup for a specific vehicle type."""
    if vehicle_type not in db.active_baselines:
        return f"Error: Unknown vehicle type {vehicle_type}. Valid: NB48_2.2, NT48_2.2"

    baseline_id = db.active_baselines.get(vehicle_type)
    if not baseline_id:
        return f"No active baseline set for {vehicle_type}."

    setup = db.get_setup(baseline_id)
    return setup.model_dump_json(indent=2)

@mcp.tool()
def set_active_baseline(vehicle_type: str, setup_id: str) -> str:
    """Sets the specific setup ID as the active baseline regarding the vehicle type."""
    setup = db.get_setup(setup_id)
    if not setup:
        return f"Error: Setup ID '{setup_id}' not found."

    if setup.vehicle_type != vehicle_type:
        return f"Error: Mismatch. Setup {setup_id} is for {setup.vehicle_type}, but requested {vehicle_type}."

    db.active_baselines[vehicle_type] = setup_id
    return f"Active baseline for {vehicle_type} set to: {setup_id}"

@mcp.tool()
def log_experiment(vehicle_type: str, run_id: str, changes_json: str, rating: int, notes: str = "") -> str:
    """Logs an experiment run.

    Args:
        vehicle_type: "NB48_2.2" or "NT48_2.2"
        run_id: Unique identifier.
        changes_json: JSON string of changes.
        rating: 1-5 rating.

    """
    if vehicle_type not in ["NB48_2.2", "NT48_2.2"]:
         return f"Error: Invalid vehicle type {vehicle_type}. Must be 'NB48_2.2' or 'NT48_2.2'."

    baseline_id = db.active_baselines.get(vehicle_type)
    if not baseline_id:
        return f"Error: No active baseline for {vehicle_type}."

    try:
        changes = json.loads(changes_json)
    except json.JSONDecodeError:
        return "Error: Invalid JSON for 'changes'."

    # Truggy Specific Logic: Landing Instability Check
    truggy_priority = False
    status_msg = ""

    if vehicle_type == "NT48_2.2":
        # Check if experiment involves rear shocks or addresses instability
        if "shocks.oil_rear" in changes or "shocks.spring_rear" in changes or "instab" in notes.lower():
            truggy_priority = True
            status_msg += "\n[A.P.E.X. ALERT] Truggy Layout Detected: Prioritizing Rear Shock Softening for Landing Stability."
            # Logic: If rating is low and we haven't softened rear, suggest it?
            # For now, we just tag the experiment.

    experiment = Experiment(
        run_id=run_id,
        parent_setup_id=baseline_id,
        vehicle_type=vehicle_type, # type: ignore
        changes=changes,
        rating=rating,
        notes=notes,
        truggy_stability_priority=truggy_priority
    )
    db.save_experiment(experiment)
    return f"Experiment {run_id} logged for {vehicle_type}. Rating: {rating}.{status_msg}"

@mcp.tool()
def promote_to_baseline(run_id: str, new_name: str) -> str:
    """Promotes a successful experiment (Rating >= 4) to be the new Baseline.
    Respects vehicle type isolation.
    """
    experiment = db.get_experiment(run_id)
    if not experiment:
        return f"Error: Experiment {run_id} not found."

    if experiment.rating < 4:
        return f"Refused: Experiment rating {experiment.rating} is too low for promotion (min 4)."

    parent_setup = db.get_setup(experiment.parent_setup_id)
    if not parent_setup:
        return "Error: Parent baseline not found."

    # Ensure type consistency
    if parent_setup.vehicle_type != experiment.vehicle_type:
        return "CRITICAL ERROR: Experiment vehicle type mismatch with Parent Setup."

    # Create new setup object based on parent + changes
    new_setup_dict = parent_setup.model_dump()
    new_setup_dict["version"] += 1
    new_setup_dict["name"] = new_name
    new_setup_dict["id"] = f"{experiment.vehicle_type}_v{new_setup_dict['version']}_{datetime.now().strftime('%Y%m%d')}"
    new_setup_dict["timestamp"] = datetime.now().isoformat()

    # Apply changes
    for key, value in experiment.changes.items():
        parts = key.split('.')
        target = new_setup_dict
        for part in parts[:-1]:
            target = target.setdefault(part, {})
        target[parts[-1]] = value

    # Instantiate correct class
    if experiment.vehicle_type == "NB48_2.2":
        new_setup = NB48_2_2(**new_setup_dict)
    elif experiment.vehicle_type == "NT48_2.2":
        new_setup = NT48_2_2(**new_setup_dict)
    else:
        return "Error: Unknown vehicle type."

    # Save and Promote
    db.save_setup(new_setup)
    db.active_baselines[experiment.vehicle_type] = new_setup.id

    return f"SUCCESS: Promoted {run_id} to Active Baseline {new_setup.id} for {new_setup.vehicle_type}."

if __name__ == "__main__":
    mcp.run()
