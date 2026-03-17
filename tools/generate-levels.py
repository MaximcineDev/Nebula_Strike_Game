#!/usr/bin/env python3
"""
Nebula Strike Level Data Generator
Creates 9 progressively challenging levels
"""

import os
import json


class LevelGenerator:
    def __init__(self, output_dir="shared-assets/raw/data/levels"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_level(self, level_id):
        """Generate single level configuration"""
        
        # Progressive difficulty
        base_spawn = 1500  # ms between asteroids
        base_speed = 2.0
        
        # Calculate difficulty based on level
        spawn_rate = max(400, base_spawn - (level_id - 1) * 120)
        speed_mult = base_speed + (level_id - 1) * 0.3
        
        # Power-ups become rarer at higher levels
        powerup_freq = max(0.1, 0.4 - (level_id - 1) * 0.03)
        
        # Asteroid type distribution changes
        if level_id <= 3:
            small_pct, med_pct, large_pct = 30, 60, 10
        elif level_id <= 6:
            small_pct, med_pct, large_pct = 40, 45, 15
        else:
            small_pct, med_pct, large_pct = 50, 35, 15
        
        # Level names
        names = [
            "Training Grounds",
            "Asteroid Field Alpha",
            "The Narrow Pass",
            "Nebula Edge",
            "Debris Storm",
            "The Gauntlet",
            "Deep Space",
            "Void Sector",
            "Nebula Core"
        ]
        
        level_data = {
            "id": level_id,
            "name": names[level_id - 1] if level_id <= len(names) else f"Level {level_id}",
            "description": self.get_description(level_id),
            
            # Gameplay parameters
            "asteroidSpawnRate": int(spawn_rate),
            "asteroidSpeedMultiplier": round(speed_mult, 2),
            "asteroidTypes": {
                "small": small_pct,
                "medium": med_pct,
                "large": large_pct
            },
            
            # Power-ups
            "powerUpFrequency": round(powerup_freq, 2),
            "powerUpTypes": ["coin", "shield", "laser", "health"],
            "powerUpWeights": [50, 20, 20, 10],
            
            # Visual/audio
            "backgroundTexture": "nebula-background",
            "backgroundScrollSpeed": 0.5 + (level_id * 0.1),
            "musicTrack": "background-music",
            "musicTempo": 1.0 + (level_id - 1) * 0.05,
            
            # Scoring
            "scoreMultiplier": 1.0 + (level_id - 1) * 0.2,
            "coinValue": 10 + (level_id - 1) * 2,
            
            # Progression
            "unlockCost": 0 if level_id <= 3 else (level_id - 3) * 500,
            "requiredScore": (level_id - 1) * 5000,
            
            # Special events
            "events": self.get_events(level_id),
            
            # Boss settings (level 9)
            "hasBoss": level_id == 9,
            "bossData": self.get_boss_data(level_id) if level_id == 9 else None
        }
        
        return level_data
    
    def get_description(self, level_id):
        descriptions = {
            1: "Learn the basics. Simple asteroids, plenty of power-ups.",
            2: "Things heat up. Faster asteroids appear.",
            3: "The first challenge. Watch out for large asteroids!",
            4: "Enter the nebula. Visibility reduced, speed increased.",
            5: "Dense debris field. Quick reflexes required.",
            6: "The gauntlet. All asteroid types at maximum frequency.",
            7: "Deep space patrol. Longest level yet.",
            8: "Void sector. Minimal power-ups, maximum danger.",
            9: "The core awaits. Face the asteroid mothership!"
        }
        return descriptions.get(level_id, f"Level {level_id} - Survive!")
    
    def get_events(self, level_id):
        """Generate special events for level"""
        events = []
        
        if level_id >= 3:
            events.append({
                "type": "asteroid_wave",
                "time": 30,  # seconds
                "duration": 10,
                "intensity": 2.0
            })
        
        if level_id >= 5:
            events.append({
                "type": "powerup_rain",
                "time": 45,
                "duration": 5
            })
        
        if level_id >= 7:
            events.append({
                "type": "speed_surge",
                "time": 60,
                "duration": 15,
                "speedMult": 1.5
            })
        
        return events
    
    def get_boss_data(self, level_id):
        """Generate boss configuration for final level"""
        return {
            "name": "Asteroid Mothership",
            "health": 50,
            "phases": [
                {"health": 100, "pattern": "spawn_minions", "rate": 2.0},
                {"health": 66, "pattern": "laser_barrage", "rate": 1.5},
                {"health": 33, "pattern": "desperate", "rate": 1.0}
            ],
            "rewards": {
                "coins": 5000,
                "unlock": "premium_ship"
            }
        }
    
    def save_level(self, level_data):
        """Save level to JSON file"""
        filename = f"level{level_data['id']}.json"
        path = os.path.join(self.output_dir, filename)
        
        with open(path, 'w') as f:
            json.dump(level_data, f, indent=2)
        
        print(f"✅ Level {level_data['id']}: {level_data['name']}")
        return path
    
    def generate_all(self):
        """Generate all 9 levels"""
        print("📊 Generating Level Data...\n")
        
        all_levels = []
        
        for i in range(1, 10):
            level = self.generate_level(i)
            self.save_level(level)
            all_levels.append(level)
        
        # Also save combined file for easy loading
        combined_path = os.path.join(self.output_dir, "all_levels.json")
        with open(combined_path, 'w') as f:
            json.dump({"levels": all_levels}, f, indent=2)
        
        print(f"\n✅ All levels saved to: {self.output_dir}")
        print(f"📁 Combined file: all_levels.json")


if __name__ == "__main__":
    gen = LevelGenerator()
    gen.generate_all()
