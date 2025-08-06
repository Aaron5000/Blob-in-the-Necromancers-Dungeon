# Roguelike Adventure

A browser-based roguelike game built with HTML5 Canvas and JavaScript. Explore procedurally generated dungeons, fight enemies, collect items, and level up your character across multiple dungeon levels!

## Features

### 🎮 Gameplay
- **Multi-level dungeon system**: Progress through increasingly difficult levels
- **Turn-based combat**: Strategic gameplay where every move counts
- **Procedural dungeon generation**: Each level features a unique dungeon layout
- **Multiple enemy types**: 10 different enemy types with scaling difficulty
- **Comprehensive item system**: 25 different items to collect and use
- **Level progression**: Gain XP and level up to become stronger
- **Persistent inventory**: Keep items between dungeon levels

### 🗺️ Dungeon Features
- **Room-based generation**: Dungeons are created with connected rooms and corridors
- **Scaling difficulty**: More rooms, enemies, and items per level
- **Door system**: Find doors to advance to the next level
- **Camera system**: View follows the player as they explore
- **Health bars**: Visual indicators for player and enemy health
- **Item rarity**: Common, Rare, Epic, and Legendary items

### 🎯 Controls
- **WASD or Arrow Keys**: Move your character
- **Space**: Wait/take a turn without moving
- **I**: Use an item from your inventory
- **R**: Restart the game
- **Click on inventory items**: Use them directly
- **Walk into doors**: Advance to the next dungeon level

### 🏆 Character Stats
- **Health**: Your current and maximum health points
- **Level**: Your character level (increases with XP)
- **Dungeon Level**: Current dungeon level you're exploring
- **XP**: Experience points gained from defeating enemies
- **Attack**: Damage you deal to enemies
- **Defense**: Reduces damage taken from enemies

### ⚔️ Combat System
- **Turn-based**: Each action (move, wait, combat) advances the turn
- **Damage calculation**: Attack - Defense = Damage dealt
- **Aggressive AI**: Enemies actively seek out and attack the player
- **Scaling enemies**: Enemy stats increase with dungeon level
- **XP rewards**: Different enemies give different XP amounts

### 🎒 Items (25 Total)
- **Health Potion**: Restores 50 health points
- **Iron Sword**: Increases attack by 5
- **Wooden Shield**: Increases defense by 3
- **Magic Scroll**: Increases both attack and defense
- **Magic Sword**: Increases attack by 8
- **Dragon Armor**: Increases defense by 8, max health by 30
- **Healing Scroll**: Fully restores health
- **Strength Potion**: Increases attack by 10
- **Defense Potion**: Increases defense by 8
- **Speed Potion**: Temporary speed boost
- **Fire Scroll**: Increases attack by 12
- **Ice Scroll**: Increases defense by 10
- **Lightning Scroll**: Increases attack by 15
- **Poison Dagger**: Increases attack by 6
- **Life Steal Sword**: Increases attack by 7, heals 20 HP
- **Teleport Scroll**: Teleports to random location
- **Invisibility Potion**: Temporary invisibility
- **Regeneration Potion**: Restores 100 HP
- **Berserker Potion**: Increases attack by 20, decreases defense by 5
- **Divine Shield**: Increases defense by 15, max health by 50
- **Vampire Blade**: Increases attack by 12, heals 30 HP
- **Frost Sword**: Increases attack by 10, defense by 5
- **Thunder Hammer**: Increases attack by 18
- **Shadow Cloak**: Increases defense by 12
- **Phoenix Feather**: Increases all stats significantly

### 🐉 Enemies (10 Types)
- **Goblin**: Weak but numerous (30+ HP, 8+ Attack, 2+ Defense, 10+ XP)
- **Orc**: Medium difficulty (50+ HP, 12+ Attack, 4+ Defense, 20+ XP)
- **Troll**: Strong enemy (80+ HP, 18+ Attack, 8+ Defense, 35+ XP)
- **Dragon**: Boss-level enemy (150+ HP, 25+ Attack, 15+ Defense, 100+ XP)
- **Skeleton**: Undead warrior (40+ HP, 10+ Attack, 3+ Defense, 15+ XP)
- **Zombie**: Slow but tough (60+ HP, 14+ Attack, 5+ Defense, 25+ XP)
- **Ghost**: Fast and dangerous (45+ HP, 16+ Attack, 2+ Defense, 30+ XP)
- **Demon**: Powerful fiend (120+ HP, 22+ Attack, 12+ Defense, 80+ XP)
- **Vampire**: Life-draining undead (90+ HP, 20+ Attack, 8+ Defense, 60+ XP)
- **Lich**: Ultimate undead boss (200+ HP, 30+ Attack, 20+ Defense, 150+ XP)

### 🚪 Level System
- **Progressive difficulty**: Each level has more rooms, enemies, and items
- **Door placement**: Doors appear in the last room of each level
- **Inventory persistence**: Keep all items when advancing levels
- **Scaling enemies**: Enemy stats increase with dungeon level
- **More loot**: Higher levels have more items to collect

## How to Play

1. **Start the game**: Open `index.html` in your web browser
2. **Explore the dungeon**: Use WASD or arrow keys to move around
3. **Fight enemies**: Move into enemies to initiate combat
4. **Collect items**: Walk over items to pick them up
5. **Use items**: Press 'I' or click on inventory items to use them
6. **Level up**: Defeat enemies to gain XP and level up
7. **Find doors**: Locate the door in the last room to advance
8. **Survive**: Don't let your health reach zero!

## Game Mechanics

### Leveling Up
- XP required = Current Level × 50
- Level up bonuses:
  - +20 Max Health
  - +3 Attack
  - +2 Defense
  - Full health restoration

### Item Rarity
- **Common (Yellow)**: 55% chance
- **Rare (Cyan)**: 30% chance  
- **Epic (Green)**: 10% chance
- **Legendary (Gold)**: 5% chance (with glowing animation)

### Enemy AI Improvements
- **Aggressive behavior**: Enemies actively seek out the player
- **Movement patterns**: Enemies move more frequently and intelligently
- **Scaling difficulty**: Enemy stats increase with dungeon level
- **Proximity detection**: Enemies within 8 tiles move toward player

### Dungeon Scaling
- **Rooms**: 5 + (Level × 1.5) + random(5) rooms per level
- **Enemies**: 1 + random(2 + Level) enemies per room
- **Items**: random(2 + Level) items per room
- **Enemy scaling**: All enemy stats increase with dungeon level

## Technical Details

- **Canvas-based rendering**: Smooth 60fps gameplay
- **Responsive design**: Works on desktop and mobile devices
- **Modern UI**: Dark theme with color-coded messages
- **No external dependencies**: Pure HTML, CSS, and JavaScript
- **Procedural generation**: Unique dungeons every time

## File Structure

```
roguelike-game/
├── index.html      # Main HTML file
├── styles.css      # CSS styling
├── game.js         # Game logic and rendering
└── README.md       # This file
```

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Future Enhancements

Potential features for future versions:
- Multiple dungeon themes
- Boss battles at level milestones
- Magic system and spells
- Equipment slots and armor
- Save/load functionality
- Sound effects and music
- Multiplayer support
- Achievement system

Enjoy your roguelike adventure! 🎮⚔️🐉🚪 