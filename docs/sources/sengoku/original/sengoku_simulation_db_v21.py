# SENGOKU SIMULATION DATABASE V2.1 - PRODUCTION-READY
# Final version with all expert improvements + professional logging

import json
import uuid
import tempfile
import os
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Union
import copy
from datetime import datetime

# Set up professional logging
logger = logging.getLogger('SengokuDB')
logger.setLevel(logging.INFO)

# Console handler with formatting
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# File handler for persistent logging
try:
    file_handler = logging.FileHandler('sengoku_simulation.log', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
except Exception:
    pass  # Fail silently if can't create log file

# Data structures using dataclasses for type safety and clarity

@dataclass
class BasicInfo:
    """Basic character information with validation"""
    name: str
    age: int
    clan: str
    stam: str
    position: str
    location: str = ""
    troops_commanded: int = 0

    def __post_init__(self):
        # Validate age is reasonable
        if self.age < 0 or self.age > 100:
            logger.warning(f"Unusual age for character {self.name}: {self.age}")
            self.age = max(0, min(100, self.age))

@dataclass
class Stats:
    """Character stats with automatic rank calculation and validation"""
    LEA: int = 0  # Leadership
    VAL: int = 0  # Valor 
    INT: int = 0  # Intelligence
    POL: int = 0  # Politics
    rank: str = "F"
    
    def __post_init__(self):
        # Clamp all stats to 0-100
        self.LEA = max(0, min(100, self.LEA))
        self.VAL = max(0, min(100, self.VAL))
        self.INT = max(0, min(100, self.INT))
        self.POL = max(0, min(100, self.POL))
        # Calculate rank
        self.rank = self._calculate_rank()
    
    def _calculate_rank(self) -> str:
        """Calculate rank based on average stats"""
        avg = (self.LEA + self.VAL + self.INT + self.POL) / 4
        if avg >= 80: return "S"
        elif avg >= 65: return "A"
        elif avg >= 50: return "B"
        elif avg >= 35: return "C"
        elif avg >= 20: return "D"
        elif avg >= 10: return "E"
        else: return "F"

@dataclass
class Personality:
    """Character personality traits"""
    core_traits: List[str] = field(default_factory=lambda: ["Determined"])
    motivations: List[str] = field(default_factory=lambda: ["Survival", "Honor"])
    fears: List[str] = field(default_factory=lambda: ["Failure", "Betrayal"])
    goals: List[str] = field(default_factory=lambda: ["Serve clan faithfully"])

@dataclass
class Status:
    """Current character status with validation"""
    health: int = 100
    mental_state: str = "Normal"
    morale: int = 75
    loyalty_to_clan: int = 85

    def __post_init__(self):
        # Clamp percentage values
        self.health = max(0, min(100, self.health))
        self.morale = max(0, min(100, self.morale))
        self.loyalty_to_clan = max(0, min(100, self.loyalty_to_clan))

@dataclass
class Relationship:
    """Bidirectional relationship between characters"""
    char1_id: str
    char2_id: str
    rel_type: str  # loyalty, rivalry, friendship, romantic, family
    strength: int  # -100 to +100
    notes: str = ""
    created: str = ""
    history: List[Dict] = field(default_factory=list)
    bidirectional: bool = True  # Whether to create reverse relationship
    
    def __post_init__(self):
        # Clamp strength to valid range
        self.strength = max(-100, min(100, self.strength))

@dataclass
class Event:
    """Event in the simulation with enhanced tracking"""
    id: int
    date: str
    event_type: str
    description: str
    location: str
    participants: List[str]
    consequences: Dict = field(default_factory=dict)
    logged_by: str = "System"
    importance: str = "normal"  # low, normal, high, critical

class SengokuSimulationDB_v21:
    """
    Production-ready Sengoku simulation database with:
    - Professional logging system
    - Bidirectional relationships  
    - UUID fallback for IDs
    - Enhanced type hints
    - Version tracking
    - Performance optimizations
    """
    
    VERSION = "2.1"
    
    def __init__(self, log_level: str = "INFO"):
        """Initialize the production-ready database"""
        self.characters: Dict[str, Dict] = {}
        self.relationships: Dict[str, Relationship] = {}
        self.events: List[Event] = []
        self.world_state = {
            "current_date": {"year": 1540, "season": "Lente", "month": 1, "day": 1},
            "weather": "Clear",
            "active_wars": [],
            "economic_status": "Stable",
            "version": self.VERSION
        }
        self.player_character: Optional[str] = None
        self._next_event_id = 1
        
        # Set logging level
        if log_level.upper() == "DEBUG":
            logger.setLevel(logging.DEBUG)
        elif log_level.upper() == "WARNING":
            logger.setLevel(logging.WARNING)
            
        logger.info(f"SengokuDB v{self.VERSION} initialized")
        
    def _generate_unique_character_id(self, name: str) -> str:
        """Generate unique character ID with collision handling + UUID fallback"""
        base_id = name.lower().replace(" ", "_").replace("-", "_").replace(".", "")
        
        # If no collision, return base_id
        if base_id not in self.characters:
            return base_id
            
        # Try suffix approach first
        suffix = 1
        while suffix <= 999:  # Reasonable limit
            candidate_id = f"{base_id}_{suffix}"
            if candidate_id not in self.characters:
                logger.debug(f"Character ID collision resolved: {base_id} -> {candidate_id}")
                return candidate_id
            suffix += 1
        
        # UUID fallback if too many collisions
        uuid_suffix = uuid.uuid4().hex[:6]
        fallback_id = f"{base_id}_{uuid_suffix}"
        logger.warning(f"Many ID collisions for {base_id}, using UUID: {fallback_id}")
        return fallback_id
    
    def create_character(self, name: str, age: int, clan: str, stam: str, 
                        position: str, stats_dict: Dict[str, int],
                        skills: Optional[Dict[str, int]] = None,
                        abilities: Optional[Dict[str, int]] = None,
                        personality_dict: Optional[Dict[str, List[str]]] = None) -> str:
        """
        Create character with enhanced validation and logging
        
        Returns:
            str: Unique character ID (empty string on failure)
        """
        try:
            # Input validation
            if not name or not isinstance(name, str):
                logger.error(f"Invalid name provided: {name}")
                return ""
                
            if not isinstance(age, int) or age < 0:
                logger.error(f"Invalid age for character {name}: {age}")
                return ""
            
            # Generate unique ID
            character_id = self._generate_unique_character_id(name)
            
            # Create dataclass instances with validation
            basic_info = BasicInfo(
                name=name, age=age, clan=clan, stam=stam, 
                position=position, location=f"{clan} Territory"
            )
            
            stats = Stats(
                LEA=stats_dict.get("LEA", 0),
                VAL=stats_dict.get("VAL", 0),
                INT=stats_dict.get("INT", 0),
                POL=stats_dict.get("POL", 0)
            )
            
            personality = Personality()
            if personality_dict:
                personality.core_traits = personality_dict.get("core_traits", personality.core_traits)
                personality.motivations = personality_dict.get("motivations", personality.motivations)
                personality.fears = personality_dict.get("fears", personality.fears)
                personality.goals = personality_dict.get("goals", personality.goals)
            
            status = Status()
            
            # Create character record
            character = {
                "basic_info": basic_info,
                "stats": stats,
                "skills": skills or {
                    "Sword Mastery": 0, "Spear Mastery": 0, "Archery Mastery": 0,
                    "Leadership Mastery": 0, "Mountain Warfare": 0
                },
                "abilities": abilities or {},
                "personality": personality,
                "status": status,
                "relationships": {},
                "history": {
                    "key_events": [],
                    "battles": [],
                    "stat_changes": [],
                    "player_interactions": []
                }
            }
            
            self.characters[character_id] = character
            logger.info(f"Character created: {name} (ID: {character_id}, Clan: {clan}, Rank: {stats.rank})")
            return character_id
            
        except Exception as e:
            logger.error(f"Failed to create character {name}: {e}")
            return ""
    
    def update_stats(self, character_id: str, stat_changes: Dict[str, int], reason: str) -> bool:
        """Update character stats with enhanced logging and validation"""
        if character_id not in self.characters:
            logger.error(f"Character {character_id} not found for stat update")
            return False
            
        try:
            char = self.characters[character_id]
            old_stats = copy.deepcopy(char["stats"])
            old_rank = char["stats"].rank
            
            # Apply changes with clamping
            changes_applied = {}
            for stat, change in stat_changes.items():
                if hasattr(char["stats"], stat) and stat != "rank":
                    current_value = getattr(char["stats"], stat)
                    new_value = max(0, min(100, current_value + change))
                    setattr(char["stats"], stat, new_value)
                    changes_applied[stat] = f"{current_value} -> {new_value} ({change:+d})"
            
            # Recalculate rank
            char["stats"].rank = char["stats"]._calculate_rank()
            
            # Log the change
            change_log = {
                "date": self._get_date_string(),
                "old_stats": old_stats,
                "new_stats": copy.deepcopy(char["stats"]),
                "changes": stat_changes,
                "reason": reason
            }
            char["history"]["stat_changes"].append(change_log)
            
            # Enhanced logging
            char_name = char["basic_info"].name
            if char["stats"].rank != old_rank:
                logger.info(f"{char_name} rank changed: {old_rank} -> {char['stats'].rank}")
            
            logger.debug(f"{char_name} stats updated: {changes_applied}, Reason: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating stats for {character_id}: {e}")
            return False
    
    def track_relationship(self, char1_id: str, char2_id: str, rel_type: str, 
                          strength: int, notes: str = "", bidirectional: bool = True) -> bool:
        """
        Track relationship with bidirectional option and enhanced logging
        
        Args:
            bidirectional: If True, creates reverse relationship automatically
        """
        if char1_id not in self.characters or char2_id not in self.characters:
            logger.error(f"One or both characters not found: {char1_id}, {char2_id}")
            return False
            
        try:
            rel_key = f"{char1_id}_{char2_id}"
            
            # Create primary relationship
            relationship = Relationship(
                char1_id=char1_id,
                char2_id=char2_id,
                rel_type=rel_type,
                strength=strength,  # Will be clamped in __post_init__
                notes=notes,
                created=self._get_date_string(),
                bidirectional=bidirectional
            )
            
            self.relationships[rel_key] = relationship
            
            # Update character records with clamped strength
            char1_name = self.characters[char1_id]["basic_info"].name
            char2_name = self.characters[char2_id]["basic_info"].name
            
            self.characters[char1_id]["relationships"][char2_id] = {
                "name": char2_name,
                "type": rel_type,
                "strength": relationship.strength  # Use clamped value
            }
            
            # Create bidirectional relationship if requested
            if bidirectional:
                reverse_rel_key = f"{char2_id}_{char1_id}"
                if reverse_rel_key not in self.relationships:
                    # Determine reverse relationship type
                    reverse_type = self._get_reverse_relationship_type(rel_type)
                    
                    reverse_relationship = Relationship(
                        char1_id=char2_id,
                        char2_id=char1_id,
                        rel_type=reverse_type,
                        strength=relationship.strength,
                        notes=f"Reverse of: {notes}",
                        created=self._get_date_string(),
                        bidirectional=False  # Prevent infinite recursion
                    )
                    
                    self.relationships[reverse_rel_key] = reverse_relationship
                    
                    self.characters[char2_id]["relationships"][char1_id] = {
                        "name": char1_name,
                        "type": reverse_type,
                        "strength": relationship.strength
                    }
            
            logger.info(f"Relationship tracked: {char1_name} -> {char2_name} ({rel_type}: {relationship.strength})")
            if bidirectional:
                logger.debug(f"Bidirectional relationship created")
            
            return True
            
        except Exception as e:
            logger.error(f"Error tracking relationship: {e}")
            return False
    
    def _get_reverse_relationship_type(self, rel_type: str) -> str:
        """Determine appropriate reverse relationship type"""
        reverse_mapping = {
            "loyalty": "commands",
            "commands": "loyalty",
            "subordinate": "superior",
            "superior": "subordinate",
            "rivalry": "rivalry",  # Symmetric
            "friendship": "friendship",  # Symmetric
            "romantic": "romantic",  # Symmetric
            "family": "family"  # Symmetric
        }
        return reverse_mapping.get(rel_type, rel_type)
    
    def log_event(self, event_type: str, description: str, participants: List[str],
                  location: str = "", consequences: Optional[Dict] = None, 
                  importance: str = "normal") -> int:
        """Log event with importance levels and enhanced tracking"""
        try:
            event = Event(
                id=self._next_event_id,
                date=self._get_date_string(),
                event_type=event_type,
                description=description,
                location=location or "Unknown",
                participants=participants,
                consequences=consequences or {},
                importance=importance
            )
            
            self.events.append(event)
            self._next_event_id += 1
            
            # Add to participant histories
            for participant_id in participants:
                if participant_id in self.characters:
                    self.characters[participant_id]["history"]["key_events"].append({
                        "event_id": event.id,
                        "description": description,
                        "date": event.date,
                        "role": "participant",
                        "importance": importance
                    })
            
            # Log based on importance
            if importance == "critical":
                logger.warning(f"CRITICAL EVENT: {description} (Participants: {len(participants)})")
            elif importance == "high":
                logger.info(f"IMPORTANT EVENT: {description}")
            else:
                logger.debug(f"Event logged: {description}")
            
            return event.id
            
        except Exception as e:
            logger.error(f"Error logging event: {e}")
            return 0
    
    def advance_time(self, days: int) -> bool:
        """Advance simulation time with optimized aging"""
        try:
            old_date = self._get_date_string()
            self.world_state["current_date"]["day"] += days
            
            years_passed = 0
            
            # Handle month/season progression
            while self.world_state["current_date"]["day"] > 30:
                self.world_state["current_date"]["day"] -= 30
                self.world_state["current_date"]["month"] += 1
                
                if self.world_state["current_date"]["month"] > 12:
                    self.world_state["current_date"]["month"] = 1
                    self.world_state["current_date"]["year"] += 1
                    years_passed += 1
            
            # Optimized aging - only if years passed
            if years_passed > 0:
                aged_count = 0
                for char in self.characters.values():
                    char["basic_info"].age += years_passed
                    aged_count += 1
                
                logger.info(f"Time advanced {years_passed} year(s), aged {aged_count} characters")
            
            new_date = self._get_date_string()
            logger.debug(f"Time advanced: {old_date} -> {new_date}")
            return True
            
        except Exception as e:
            logger.error(f"Error advancing time: {e}")
            return False
    
    def generate_character_sheet(self, character_id: str) -> str:
        """Generate character sheet with enhanced error handling"""
        if character_id not in self.characters:
            logger.error(f"Character sheet requested for non-existent character: {character_id}")
            return f"❌ Character '{character_id}' not found!"
        
        try:
            char = self.characters[character_id]
            info = char["basic_info"]
            stats = char["stats"]
            skills = char["skills"]
            abilities = char["abilities"]
            status = char["status"]
            personality = char["personality"]
            
            sheet = f"""
CHARACTER SHEET - {info.name} | {self._get_date_string()}
═══════════════════════════════════════════════════════════════
📊 STATS: LEA {stats.LEA} | VAL {stats.VAL} | INT {stats.INT} | POL {stats.POL} | RANK: {stats.rank}

⚔️ SKILLS (Vaardigheden):"""
            
            for skill, level in skills.items():
                mastery_desc = self._get_mastery_description(level)
                sheet += f"\n  • {skill}: {level}/100 ({mastery_desc})"
            
            if abilities:
                sheet += f"\n\n🌟 ABILITIES (Speciale Skills):"
                for ability, level in abilities.items():
                    sheet += f"\n  • {ability}: {level}/100"
            
            sheet += f"""

🏛️ POSITIE: {info.position} in {info.stam} of {info.clan}
📍 LOCATIE: {info.location}
👥 TROEPEN: {info.troops_commanded} under command

💪 STATUS:
  • Health: {status.health}/100
  • Mental State: {status.mental_state}
  • Morale: {status.morale}/100
  • Clan Loyalty: {status.loyalty_to_clan}/100

📚 PERSONALITY:
  • Traits: {', '.join(personality.core_traits)}
  • Motivations: {', '.join(personality.motivations)}
  • Current Goals: {', '.join(personality.goals)}
"""
            
            # Add relationships
            if char["relationships"]:
                sheet += f"\n🤝 RELATIONSHIPS:"
                for rel_id, rel_data in char["relationships"].items():
                    sheet += f"\n  • {rel_data['name']}: {rel_data['type']} ({rel_data['strength']}/100)"
            
            logger.debug(f"Character sheet generated for {info.name}")
            return sheet
            
        except Exception as e:
            logger.error(f"Error generating character sheet for {character_id}: {e}")
            return f"❌ Error generating character sheet: {e}"
    
    def _get_mastery_description(self, level: int) -> str:
        """Get mastery level description"""
        if level >= 81: return "Legendarisch"
        elif level >= 61: return "Meester"
        elif level >= 41: return "Expert"
        elif level >= 21: return "Gevorderd"
        else: return "Beginner"
    
    def _get_date_string(self) -> str:
        """Get current simulation date as formatted string"""
        ws = self.world_state["current_date"]
        return f"Jaar {ws['year']}, {ws['season']} - {ws['month']}e Maand, {ws['day']}e Dag"
    
    def save_to_file(self, filename: str) -> bool:
        """Production-grade atomic save with comprehensive logging"""
        try:
            logger.info(f"Starting save to {filename}")
            
            # Convert dataclasses to dictionaries for JSON serialization
            serializable_data = {
                "version": self.VERSION,
                "saved_at": datetime.now().isoformat(),
                "characters": {},
                "relationships": {},
                "events": [],
                "world_state": self.world_state,
                "player_character": self.player_character,
                "database_stats": {
                    "character_count": len(self.characters),
                    "relationship_count": len(self.relationships),
                    "event_count": len(self.events)
                }
            }
            
            # Convert characters
            for char_id, char_data in self.characters.items():
                serializable_char = {
                    "basic_info": char_data["basic_info"].__dict__,
                    "stats": char_data["stats"].__dict__,
                    "skills": char_data["skills"],
                    "abilities": char_data["abilities"],
                    "personality": char_data["personality"].__dict__,
                    "status": char_data["status"].__dict__,
                    "relationships": char_data["relationships"],
                    "history": char_data["history"]
                }
                serializable_data["characters"][char_id] = serializable_char
            
            # Convert relationships
            for rel_key, relationship in self.relationships.items():
                serializable_data["relationships"][rel_key] = relationship.__dict__
            
            # Convert events
            for event in self.events:
                serializable_data["events"].append(event.__dict__)
            
            # Atomic write using temporary file
            dir_name = os.path.dirname(filename) or "."
            fd, tmp_path = tempfile.mkstemp(dir=dir_name, suffix='.json')
            
            with os.fdopen(fd, 'w', encoding='utf-8') as f:
                json.dump(serializable_data, f, ensure_ascii=False, indent=2)
            
            # Atomically replace the target file
            os.replace(tmp_path, filename)
            
            logger.info(f"Save completed successfully: {len(self.characters)} characters, {len(self.relationships)} relationships, {len(self.events)} events")
            return True
            
        except Exception as e:
            logger.error(f"Save failed: {e}")
            return False
    
    def load_from_file(self, filename: str) -> bool:
        """Load database state with version checking and comprehensive logging"""
        try:
            logger.info(f"Loading from {filename}")
            
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Version compatibility check
            file_version = data.get("version", "Unknown")
            logger.info(f"Loading file version: {file_version}")
            
            # Reconstruct characters with dataclasses
            self.characters = {}
            for char_id, char_data in data.get("characters", {}).items():
                try:
                    # Reconstruct dataclass instances
                    basic_info = BasicInfo(**char_data["basic_info"])
                    stats = Stats(**char_data["stats"])
                    personality = Personality(**char_data["personality"])
                    status = Status(**char_data["status"])
                    
                    self.characters[char_id] = {
                        "basic_info": basic_info,
                        "stats": stats,
                        "skills": char_data["skills"],
                        "abilities": char_data["abilities"],
                        "personality": personality,
                        "status": status,
                        "relationships": char_data["relationships"],
                        "history": char_data["history"]
                    }
                except Exception as e:
                    logger.error(f"Failed to load character {char_id}: {e}")
                    continue
            
            # Reconstruct relationships
            self.relationships = {}
            for rel_key, rel_data in data.get("relationships", {}).items():
                try:
                    self.relationships[rel_key] = Relationship(**rel_data)
                except Exception as e:
                    logger.error(f"Failed to load relationship {rel_key}: {e}")
                    continue
            
            # Reconstruct events
            self.events = []
            for event_data in data.get("events", []):
                try:
                    self.events.append(Event(**event_data))
                except Exception as e:
                    logger.error(f"Failed to load event: {e}")
                    continue
            
            self.world_state = data.get("world_state", self.world_state)
            self.player_character = data.get("player_character", None)
            
            # Update next event ID
            if self.events:
                self._next_event_id = max(event.id for event in self.events) + 1
            
            logger.info(f"Load completed: {len(self.characters)} characters, {len(self.relationships)} relationships, {len(self.events)} events")
            return True
            
        except Exception as e:
            logger.error(f"Load failed: {e}")
            return False
    
    def get_database_status(self) -> str:
        """Get comprehensive database status"""
        try:
            return f"""
🏛️ SENGOKU DATABASE V{self.VERSION} STATUS:
═══════════════════════════════════════
📊 Characters: {len(self.characters)}
🤝 Relationships: {len(self.relationships)}
📅 Events Logged: {len(self.events)}
📍 Current Date: {self._get_date_string()}
🌤️ Weather: {self.world_state['weather']}
⚔️ Active Wars: {len(self.world_state['active_wars'])}
👤 Player Character: {self.player_character or 'Not set'}
🔧 Next Event ID: {self._next_event_id}
📁 Log Level: {logger.level}
💾 Version: {self.VERSION}
"""
        except Exception as e:
            logger.error(f"Error getting database status: {e}")
            return f"Error getting database status: {e}"

# USAGE EXAMPLE WITH PRODUCTION FEATURES:
"""
# Initialize production database with logging
db = SengokuSimulationDB_v21(log_level="INFO")

# Create characters (returns empty string on failure)
player_id = db.create_character(
    "Hayato Watanabe", 20, "Anegakoji", "Main House", "F-Rank Ashigaru Captain",
    {"LEA": 5, "VAL": 15, "INT": 10, "POL": 5}
)

if player_id:
    logger.info(f"Player character created: {player_id}")
    
    # Track bidirectional relationship
    success = db.track_relationship(
        player_id, "superior_id", "subordinate", 75, 
        "Training relationship", bidirectional=True
    )
    
    # All operations return success/failure and log appropriately
    if db.save_to_file("sengoku_production.json"):
        logger.info("Game saved successfully")
        
    # Enhanced character sheet
    sheet = db.generate_character_sheet(player_id)
    print(sheet)
else:
    logger.error("Failed to create player character")
"""