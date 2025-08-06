class RoguelikeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 20;
        this.mapWidth = 40;
        this.mapHeight = 30;
        
        this.currentLevel = 1;
        this.player = {
            x: 1,
            y: 1,
            health: 100,
            maxHealth: 100,
            level: 1,
            xp: 0,
            attack: 15,
            defense: 5,
            inventory: [],
            activeEffects: {} // Track active item effects
        };
        
        this.enemies = [];
        this.items = [];
        this.doors = [];
        this.projectiles = []; // For ranged attacks
        this.messages = [];
        this.map = [];
        this.gameOver = false;
        this.victory = false;
        this.turn = 0;
        this.lastInventoryState = '';
        this.showingHomeScreen = true;
        
        // Stats tracking
        this.stats = {
            totalDamage: 0,
            enemiesKilled: 0,
            itemsFound: 0,
            levelsCompleted: 0,
            necromancerKills: 0
        };
        
        // Victory powers tracking
        this.hasSlimeTrail = true; // Start with slime trail
        this.hasLightningPower = false;
        this.slimeTrail = [];
        this.slimeTrailDuration = 3; // Start with 3 turn duration
        this.lightningCooldown = 0;
        
        this.setupEventListeners();
        this.setupAudio();
        this.showHomeScreen();
        this.addMessage("Welcome to the dungeon! Use WASD or arrow keys to move.", "info");
        this.addMessage("You are a blob on a path of vengeance to destroy the necromancer that created you. All treasures hoarded in the necromancer's dungeon can be absorbed with their magic properties enhancing your blob. Maybe if the necromancer is defeated enough times you can take the throne and remove his blight from the land.", "info");
    }
    
    showHomeScreen() {
        // Load and display home.jpg
        const homeImage = new Image();
        homeImage.onload = () => {
            // Clear canvas
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Calculate scaling to fit image in canvas
            const scaleX = this.canvas.width / homeImage.width;
            const scaleY = this.canvas.height / homeImage.height;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = homeImage.width * scale;
            const scaledHeight = homeImage.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = (this.canvas.height - scaledHeight) / 2;
            
            // Draw the home image
            this.ctx.drawImage(homeImage, x, y, scaledWidth, scaledHeight);
            
            // Add start game text
                           // No text overlay - just the image
        };
        homeImage.src = 'home.jpg';
        
        // Add event listener for starting the game
        const startGame = () => {
            console.log('Starting game...');
            this.showingHomeScreen = false;
            this.generateMap();
            this.render();
            document.removeEventListener('keydown', startGame);
        };
        document.addEventListener('keydown', startGame);
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            if (this.showingHomeScreen) {
                console.log('Home screen active, ignoring key:', e.key);
                return; // Don't handle game keys on home screen
            }
            
            switch(e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.movePlayer(0, -1);
                    break;
                case 's':
                case 'arrowdown':
                    this.movePlayer(0, 1);
                    break;
                case 'a':
                case 'arrowleft':
                    this.movePlayer(-1, 0);
                    break;
                case 'd':
                case 'arrowright':
                    this.movePlayer(1, 0);
                    break;
                case ' ':
                    this.wait();
                    break;
                case 'r':
                    this.restart();
                    break;
                case 'u':
                    this.useUlt();
                    break;
            }
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
        
        // Music toggle functionality
        this.musicEnabled = true;
        document.getElementById('musicToggle').addEventListener('click', () => {
            if (this.backgroundMusic) {
                if (this.musicEnabled) {
                    this.backgroundMusic.pause();
                    this.musicEnabled = false;
                    document.getElementById('musicToggle').textContent = 'Music: OFF';
                    document.getElementById('musicToggle').classList.add('off');
                } else {
                    this.backgroundMusic.play();
                    this.musicEnabled = true;
                    document.getElementById('musicToggle').textContent = 'Music: ON';
                    document.getElementById('musicToggle').classList.remove('off');
                }
            }
        });
        
        // Modal functionality
        const modal = document.getElementById('controlsModal');
        const controlsBtn = document.getElementById('controlsBtn');
        const closeBtn = document.querySelector('.close');
        
        controlsBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
    
    setupAudio() {
        this.backgroundMusic = document.getElementById('backgroundMusic');
        
        if (!this.backgroundMusic) {
            console.error('Background music element not found!');
            return;
        }
        
        console.log('Audio element found:', this.backgroundMusic);
        console.log('Audio readyState:', this.backgroundMusic.readyState);
        console.log('Audio src:', this.backgroundMusic.src);
        
        // Handle autoplay restrictions
        const playMusic = () => {
            if (this.backgroundMusic) {
                this.backgroundMusic.volume = 0.3; // Set volume to 30%
                
                // Check if audio is loaded
                if (this.backgroundMusic.readyState >= 2) {
                    this.backgroundMusic.play().then(() => {
                        console.log('Music started successfully!');
                    }).catch(error => {
                        console.log('Autoplay prevented:', error);
                        this.addClickToPlayButton();
                    });
                } else {
                    console.log('Audio not loaded yet, waiting...');
                    this.backgroundMusic.addEventListener('canplaythrough', () => {
                        this.backgroundMusic.play().then(() => {
                            console.log('Music started after loading!');
                        }).catch(error => {
                            console.log('Autoplay prevented after loading:', error);
                            this.addClickToPlayButton();
                        });
                    });
                }
            }
        };
        
        // Try to play on page load
        playMusic();
        
        // Also try to play on first user interaction
        document.addEventListener('click', () => {
            if (this.backgroundMusic && this.backgroundMusic.paused) {
                this.backgroundMusic.play().then(() => {
                    console.log('Music started on user interaction!');
                }).catch(error => {
                    console.log('Failed to play on user interaction:', error);
                });
            }
        }, { once: true });
        
        // Add error handling
        this.backgroundMusic.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Audio error details:', this.backgroundMusic.error);
        });
    }
    
    addClickToPlayButton() {
        // Removed giant click to play music button
        // Music will start on user interaction instead
    }
    
    generateMap() {
        // Initialize map with walls
        this.map = [];
        for (let y = 0; y < this.mapHeight; y++) {
            this.map[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = '#';
            }
        }
        
        // Special boss level at level 10
        if (this.currentLevel === 10) {
            this.generateBossLevel();
            return;
        }
        
        // Generate rooms - more rooms per level
        const numRooms = 5 + Math.floor(this.currentLevel * 1.5) + Math.floor(Math.random() * 5);
        const rooms = [];
        
        for (let i = 0; i < numRooms; i++) {
            const room = this.generateRoom();
            if (this.isValidRoom(room, rooms)) {
                this.carveRoom(room);
                rooms.push(room);
            }
        }
        
        // Connect rooms with corridors
        for (let i = 0; i < rooms.length - 1; i++) {
            this.connectRooms(rooms[i], rooms[i + 1]);
        }
        
        // Place player in first room
        const firstRoom = rooms[0];
        this.player.x = firstRoom.x + Math.floor(firstRoom.width / 2);
        this.player.y = firstRoom.y + Math.floor(firstRoom.height / 2);
        
        // Place doors in the last room
        const lastRoom = rooms[rooms.length - 1];
        this.doors = [{
            x: lastRoom.x + Math.floor(lastRoom.width / 2),
            y: lastRoom.y + Math.floor(lastRoom.height / 2)
        }];
        
        // Place enemies - more enemies per level
        this.enemies = [];
        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];
            const numEnemies = 1 + Math.floor(Math.random() * (2 + this.currentLevel));
            for (let j = 0; j < numEnemies; j++) {
                const enemy = this.createEnemy(
                    room.x + 1 + Math.floor(Math.random() * (room.width - 2)),
                    room.y + 1 + Math.floor(Math.random() * (room.height - 2))
                );
                this.enemies.push(enemy);
            }
        }
        
        // Place items - more items per level
        this.items = [];
        for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            const numItems = Math.floor(Math.random() * (2 + this.currentLevel));
            for (let j = 0; j < numItems; j++) {
                const item = this.createItem(
                    room.x + 1 + Math.floor(Math.random() * (room.width - 2)),
                    room.y + 1 + Math.floor(Math.random() * (room.height - 2))
                );
                this.items.push(item);
            }
        }
    }
    
    generateBossLevel() {
        // Create a large boss room
        const bossRoom = {
            x: 10,
            y: 10,
            width: 60,
            height: 40
        };
        
        // Carve the boss room
        for (let y = bossRoom.y; y < bossRoom.y + bossRoom.height; y++) {
            for (let x = bossRoom.x; x < bossRoom.x + bossRoom.width; x++) {
                if (y < this.mapHeight && x < this.mapWidth) {
                    this.map[y][x] = '.';
                }
            }
        }
        
        // Place player at entrance
        this.player.x = bossRoom.x + 5;
        this.player.y = bossRoom.y + 5;
        
        // Create the boss
        this.enemies = [];
        const boss = {
            x: Math.floor(bossRoom.x + bossRoom.width / 2),
            y: Math.floor(bossRoom.y + bossRoom.height / 2),
            type: 'necromancer',
            level: 10,
            health: 2000,
            maxHealth: 2000,
            attack: 80,
            defense: 40,
            xpValue: 1000,
            aggression: 0.9,
            direction: 'down',
            size: 2,
            canShoot: true,
            lastShot: 0,
            shotCooldown: 2,
            movementPattern: 'normal',
            isBoss: true,
            summonCooldown: 0,
            tauntCooldown: 0
        };
        this.enemies.push(boss);
        
        // Fill room with health potions
        this.items = [];
        for (let i = 0; i < 20; i++) {
            let x, y;
            do {
                x = bossRoom.x + Math.floor(Math.random() * (bossRoom.width - 10)) + 5;
                y = bossRoom.y + Math.floor(Math.random() * (bossRoom.height - 10)) + 5;
            } while (this.getItemAt(x, y) || this.getEnemyAt(x, y) || (x === this.player.x && y === this.player.y));
            
            this.items.push({
                x: x,
                y: y,
                type: 'health_potion',
                name: 'Health Potion',
                rarity: 'common'
            });
        }
        
        // No doors in boss level
        this.doors = [];
        
        this.addMessage("You enter the lair of the Necromancer! The final battle begins!", "warning");
        this.addMessage("The Necromancer: 'Foolish mortal! You dare challenge me? My skeletons will tear you apart!'", "combat");
    }
    
    generateRoom() {
        const width = 5 + Math.floor(Math.random() * 8);
        const height = 5 + Math.floor(Math.random() * 8);
        const x = 1 + Math.floor(Math.random() * (this.mapWidth - width - 2));
        const y = 1 + Math.floor(Math.random() * (this.mapHeight - height - 2));
        return { x, y, width, height };
    }
    
    isValidRoom(room, existingRooms) {
        for (const existing of existingRooms) {
            if (this.roomsOverlap(room, existing)) {
                return false;
            }
        }
        return true;
    }
    
    roomsOverlap(room1, room2) {
        return !(room1.x + room1.width < room2.x || 
                room2.x + room2.width < room1.x ||
                room1.y + room1.height < room2.y ||
                room2.y + room2.height < room1.y);
    }
    
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.height; y++) {
            for (let x = room.x; x < room.x + room.width; x++) {
                this.map[y][x] = '.';
            }
        }
    }
    
    connectRooms(room1, room2) {
        const x1 = room1.x + Math.floor(room1.width / 2);
        const y1 = room1.y + Math.floor(room1.height / 2);
        const x2 = room2.x + Math.floor(room2.width / 2);
        const y2 = room2.y + Math.floor(room2.height / 2);
        
        // Horizontal corridor
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            this.map[y1][x] = '.';
        }
        
        // Vertical corridor
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            this.map[y][x2] = '.';
        }
    }
    
    createEnemy(x, y) {
        let types;
        
        // Early levels (1-5) only have weak enemies
        if (this.currentLevel <= 5) {
            types = ['goblin', 'skeleton', 'zombie', 'slime'];
        } else {
            types = ['goblin', 'orc', 'troll', 'dragon', 'skeleton', 'zombie', 'ghost', 'demon', 'vampire', 'lich', 
                      'beholder', 'golem', 'hydra', 'kraken', 'mimic', 'phoenix', 'slime', 'specter', 'wraith', 'wyvern'];
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Calculate level scaling - monsters get much stronger each level
        // Early levels have reduced scaling
        const earlyLevelScaling = this.currentLevel <= 5 ? Math.pow(1.2, this.currentLevel - 1) : Math.pow(1.5, this.currentLevel - 1);
        const enemyLevel = Math.floor(Math.random() * 3) + 1; // Random level 1-3
        const levelMultiplier = Math.pow(1.3, enemyLevel - 1);
        
        const enemy = {
            x: x,
            y: y,
            type: type,
            level: enemyLevel,
            health: 0,
            maxHealth: 0,
            attack: 0,
            defense: 0,
            xpValue: 0,
            aggression: 0, // Higher values = more aggressive
            direction: 'down', // Default direction
            size: 1, // Default size (1 tile)
            canShoot: false, // Can shoot projectiles
            lastShot: 0, // Last shot turn
            shotCooldown: 0, // Shot cooldown
            movementPattern: 'normal' // Movement pattern
        };
        
        switch(type) {
            case 'goblin':
                enemy.health = enemy.maxHealth = Math.floor((30 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((8 + (this.currentLevel * 4)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((2 + this.currentLevel * 2) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((10 + (this.currentLevel * 10)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.4;
                break;
            case 'orc':
                enemy.health = enemy.maxHealth = Math.floor((50 + (this.currentLevel * 20)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((12 + (this.currentLevel * 6)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((4 + this.currentLevel * 3) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((20 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.5;
                break;
            case 'troll':
                enemy.health = enemy.maxHealth = Math.floor((80 + (this.currentLevel * 25)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((18 + (this.currentLevel * 8)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((8 + this.currentLevel * 4) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((35 + (this.currentLevel * 20)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.6;
                break;
            case 'dragon':
                enemy.health = enemy.maxHealth = Math.floor((150 + (this.currentLevel * 40)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((25 + (this.currentLevel * 10)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((15 + this.currentLevel * 5) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((100 + (this.currentLevel * 30)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.7;
                enemy.size = 2; // Large dragon
                break;
            case 'skeleton':
                enemy.health = enemy.maxHealth = Math.floor((40 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((10 + (this.currentLevel * 4)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((3 + this.currentLevel * 2) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((15 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.5;
                break;
            case 'zombie':
                enemy.health = enemy.maxHealth = Math.floor((60 + (this.currentLevel * 18)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((14 + (this.currentLevel * 5)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((5 + this.currentLevel * 3) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((25 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.6;
                break;
            case 'ghost':
                enemy.health = enemy.maxHealth = Math.floor((45 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((16 + (this.currentLevel * 5)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((2 + this.currentLevel * 2) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((30 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.7;
                enemy.movementPattern = 'teleport';
                break;
            case 'demon':
                enemy.health = enemy.maxHealth = Math.floor((120 + (this.currentLevel * 30)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((22 + (this.currentLevel * 8)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((12 + this.currentLevel * 4) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((80 + (this.currentLevel * 25)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.canShoot = true;
                enemy.shotCooldown = 5;
                break;
            case 'vampire':
                enemy.health = enemy.maxHealth = Math.floor((90 + (this.currentLevel * 25)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((20 + (this.currentLevel * 7)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((8 + this.currentLevel * 3) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((60 + (this.currentLevel * 20)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.7;
                enemy.movementPattern = 'fast';
                break;
            case 'lich':
                enemy.health = enemy.maxHealth = Math.floor((200 + (this.currentLevel * 50)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((30 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((20 + this.currentLevel * 6) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((150 + (this.currentLevel * 40)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.canShoot = true;
                enemy.shotCooldown = 3;
                enemy.size = 2;
                break;
            case 'beholder':
                enemy.health = enemy.maxHealth = Math.floor((180 + (this.currentLevel * 35)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((28 + (this.currentLevel * 10)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((18 + this.currentLevel * 5) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((120 + (this.currentLevel * 35)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.9;
                enemy.canShoot = true;
                enemy.shotCooldown = 2;
                enemy.size = 2;
                break;
            case 'golem':
                enemy.health = enemy.maxHealth = Math.floor((300 + (this.currentLevel * 60)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((35 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((25 + this.currentLevel * 8) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((200 + (this.currentLevel * 50)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.6;
                enemy.size = 2;
                enemy.movementPattern = 'slow';
                break;
            case 'hydra':
                enemy.health = enemy.maxHealth = Math.floor((400 + (this.currentLevel * 80)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((40 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((30 + this.currentLevel * 10) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((300 + (this.currentLevel * 70)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.7;
                enemy.size = 3;
                break;
            case 'kraken':
                enemy.health = enemy.maxHealth = Math.floor((500 + (this.currentLevel * 100)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((45 + (this.currentLevel * 18)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((35 + this.currentLevel * 12) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((400 + (this.currentLevel * 90)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.size = 3;
                enemy.canShoot = true;
                enemy.shotCooldown = 4;
                break;
            case 'mimic':
                enemy.health = enemy.maxHealth = Math.floor((80 + (this.currentLevel * 20)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((25 + (this.currentLevel * 8)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((15 + this.currentLevel * 5) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((50 + (this.currentLevel * 25)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.9;
                enemy.movementPattern = 'ambush';
                break;
            case 'phoenix':
                enemy.health = enemy.maxHealth = Math.floor((250 + (this.currentLevel * 45)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((35 + (this.currentLevel * 12)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((20 + this.currentLevel * 6) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((180 + (this.currentLevel * 45)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.size = 2;
                enemy.canShoot = true;
                enemy.shotCooldown = 3;
                break;
            case 'slime':
                enemy.health = enemy.maxHealth = Math.floor((60 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((12 + (this.currentLevel * 4)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((8 + this.currentLevel * 3) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((30 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.5;
                enemy.movementPattern = 'bounce';
                break;
            case 'specter':
                enemy.health = enemy.maxHealth = Math.floor((70 + (this.currentLevel * 18)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((18 + (this.currentLevel * 6)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((5 + this.currentLevel * 2) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((40 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.7;
                enemy.movementPattern = 'float';
                break;
            case 'wraith':
                enemy.health = enemy.maxHealth = Math.floor((90 + (this.currentLevel * 22)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((22 + (this.currentLevel * 7)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((8 + this.currentLevel * 3) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((60 + (this.currentLevel * 25)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.canShoot = true;
                enemy.shotCooldown = 6;
                enemy.movementPattern = 'teleport';
                break;
            case 'wyvern':
                enemy.health = enemy.maxHealth = Math.floor((200 + (this.currentLevel * 40)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((32 + (this.currentLevel * 10)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((18 + this.currentLevel * 5) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((150 + (this.currentLevel * 40)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.8;
                enemy.size = 2;
                enemy.canShoot = true;
                enemy.shotCooldown = 4;
                enemy.movementPattern = 'fly';
                break;
            case 'necromancer':
                enemy.health = enemy.maxHealth = Math.floor((300 + (this.currentLevel * 60)) * earlyLevelScaling * levelMultiplier);
                enemy.attack = Math.floor((40 + (this.currentLevel * 15)) * earlyLevelScaling * levelMultiplier);
                enemy.defense = Math.floor((25 + this.currentLevel * 8) * earlyLevelScaling * levelMultiplier);
                enemy.xpValue = Math.floor((500 + (this.currentLevel * 100)) * earlyLevelScaling * levelMultiplier);
                enemy.aggression = 0.9;
                enemy.size = 2;
                enemy.canShoot = true;
                enemy.shotCooldown = 3;
                enemy.movementPattern = 'normal';
                enemy.isBoss = true;
                enemy.summonCooldown = 0;
                enemy.tauntCooldown = 0;
                break;
        }
        
        return enemy;
    }
    
    createItem(x, y) {
        const types = [
            'health_potion', 'sword', 'shield', 'scroll', 'magic_sword', 'dragon_armor', 
            'healing_scroll', 'strength_potion', 'defense_potion', 'speed_potion',
            'fire_scroll', 'ice_scroll', 'lightning_scroll', 'poison_dagger', 'life_steal_sword',
            'teleport_scroll', 'invisibility_potion', 'regeneration_potion', 'berserker_potion', 'divine_shield',
            'vampire_blade', 'frost_sword', 'thunder_hammer', 'shadow_cloak', 'phoenix_feather',
            'fireball_spell', 'ice_spell', 'lightning_spell', 'poison_spell', 'death_spell',
            'wooden_bow', 'iron_bow', 'magic_bow', 'dragon_bow', 'legendary_bow',
            'iron_dagger', 'poison_dagger_thrown',
            // New powerful items
            'excalibur', 'storm_hammer', 'void_blade', 'thunder_staff', 'frost_staff', 'fire_staff',
            'dragon_scale_armor', 'phoenix_armor', 'void_armor', 'titan_armor', 'celestial_armor',
            'damage_ring', 'power_ring', 'giant_staff', 'mega_bow', 'death_blade',
            'miss_chance_armor', 'dodge_armor', 'evasion_armor', 'phantom_armor', 'shadow_armor',
            'view_ring', 'eagle_eye', 'telescope', 'crystal_ball', 'ult_scroll',
            // Ultra-powerful items
            'god_sword', 'chaos_blade', 'infinity_staff', 'cosmic_bow', 'void_hammer',
            'celestial_armor_plus', 'dragon_god_armor', 'phoenix_legend_armor', 'void_master_armor', 'titan_god_armor',
            'power_ring_plus', 'damage_ring_plus', 'giant_staff_plus', 'mega_bow_plus', 'death_blade_plus',
            'miss_chance_armor_plus', 'dodge_armor_plus', 'evasion_armor_plus', 'phantom_armor_plus', 'shadow_armor_plus'
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        
        return {
            x: x,
            y: y,
            type: type,
            name: this.getItemName(type),
            rarity: Math.random() < 0.05 ? 'legendary' : Math.random() < 0.1 ? 'epic' : Math.random() < 0.3 ? 'rare' : 'common'
        };
    }
    
    getItemName(type) {
        const names = {
            'health_potion': 'Health Potion',
            'sword': 'Iron Sword',
            'shield': 'Wooden Shield',
            'scroll': 'Magic Scroll',
            'magic_sword': 'Magic Sword',
            'dragon_armor': 'Dragon Armor',
            'healing_scroll': 'Healing Scroll',
            'strength_potion': 'Strength Potion',
            'defense_potion': 'Defense Potion',
            'speed_potion': 'Speed Potion',
            'fire_scroll': 'Fire Scroll',
            'ice_scroll': 'Ice Scroll',
            'lightning_scroll': 'Lightning Scroll',
            'poison_dagger': 'Poison Dagger',
            'life_steal_sword': 'Life Steal Sword',
            'teleport_scroll': 'Teleport Scroll',
            'invisibility_potion': 'Invisibility Potion',
            'regeneration_potion': 'Regeneration Potion',
            'berserker_potion': 'Berserker Potion',
            'divine_shield': 'Divine Shield',
            'vampire_blade': 'Vampire Blade',
            'frost_sword': 'Frost Sword',
            'thunder_hammer': 'Thunder Hammer',
            'shadow_cloak': 'Shadow Cloak',
            'phoenix_feather': 'Phoenix Feather',
            'fireball_spell': 'Fireball Spell',
            'ice_spell': 'Ice Spell',
            'lightning_spell': 'Lightning Spell',
            'poison_spell': 'Poison Spell',
            'death_spell': 'Death Spell',
            'wooden_bow': 'Wooden Bow',
            'iron_bow': 'Iron Bow',
            'magic_bow': 'Magic Bow',
            'dragon_bow': 'Dragon Bow',
            'legendary_bow': 'Legendary Bow',
            'iron_dagger': 'Iron Dagger',
            'poison_dagger_thrown': 'Poison Dagger (Thrown)',
            // New powerful items
            'excalibur': 'Excalibur',
            'storm_hammer': 'Storm Hammer',
            'void_blade': 'Void Blade',
            'thunder_staff': 'Thunder Staff',
            'frost_staff': 'Frost Staff',
            'fire_staff': 'Fire Staff',
            'dragon_scale_armor': 'Dragon Scale Armor',
            'phoenix_armor': 'Phoenix Armor',
            'void_armor': 'Void Armor',
            'titan_armor': 'Titan Armor',
            'celestial_armor': 'Celestial Armor',
            'damage_ring': 'Ring of Power',
            'power_ring': 'Ring of Might',
            'giant_staff': 'Giant Staff',
            'mega_bow': 'Mega Bow',
            'death_blade': 'Blade of Death',
            'miss_chance_armor': 'Evasion Armor',
            'dodge_armor': 'Dodge Armor',
            'evasion_armor': 'Evasion Armor',
            'phantom_armor': 'Phantom Armor',
            'shadow_armor': 'Shadow Armor',
            'view_ring': 'Ring of Vision',
            'eagle_eye': 'Eagle Eye',
            'telescope': 'Telescope',
            'crystal_ball': 'Crystal Ball',
            'ult_scroll': 'Ultimate Scroll',
            // Ultra-powerful items
            'god_sword': 'Sword of the Gods',
            'chaos_blade': 'Blade of Chaos',
            'infinity_staff': 'Staff of Infinity',
            'cosmic_bow': 'Cosmic Bow',
            'void_hammer': 'Hammer of the Void',
            'celestial_armor_plus': 'Celestial Armor+',
            'dragon_god_armor': 'Dragon God Armor',
            'phoenix_legend_armor': 'Phoenix Legend Armor',
            'void_master_armor': 'Void Master Armor',
            'titan_god_armor': 'Titan God Armor',
            'power_ring_plus': 'Ring of Power+',
            'damage_ring_plus': 'Ring of Might+',
            'giant_staff_plus': 'Giant Staff+',
            'mega_bow_plus': 'Mega Bow+',
            'death_blade_plus': 'Blade of Death+',
            'miss_chance_armor_plus': 'Evasion Armor+',
            'dodge_armor_plus': 'Dodge Armor+',
            'evasion_armor_plus': 'Evasion Armor+',
            'phantom_armor_plus': 'Phantom Armor+',
            'shadow_armor_plus': 'Shadow Armor+'
        };
        return names[type];
    }
    
    movePlayer(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        if (this.map[newY] && this.map[newY][newX] === '.') {
            // Check for doors
            const door = this.getDoorAt(newX, newY);
            if (door) {
                this.enterDoor();
                return;
            }
            
                    // Check for enemies
        const enemy = this.getEnemyAt(newX, newY);
        if (enemy) {
            this.combat(this.player, enemy);
            return;
        }
        
        // Check for slime trail damage
        if (this.hasSlimeTrail) {
            const slimeAtPosition = this.slimeTrail.find(slime => slime.x === newX && slime.y === newY);
            if (slimeAtPosition) {
                const slimeDamage = 100; // Massive damage
                this.addMessage(`Enemy stepped on your slime trail and took ${slimeDamage} damage!`, "success");
                // Find enemy at this position and damage them
                const enemyAtSlime = this.getEnemyAt(newX, newY);
                if (enemyAtSlime) {
                    enemyAtSlime.health -= slimeDamage;
                    if (enemyAtSlime.health <= 0) {
                        this.enemies = this.enemies.filter(e => e !== enemyAtSlime);
                        this.player.xp += enemyAtSlime.xpValue;
                        this.stats.enemiesKilled++;
                        this.addMessage(`Slime trail destroyed ${enemyAtSlime.type} level ${enemyAtSlime.level}!`, "success");
                    }
                }
            }
        }
            
            // Check for items
            const item = this.getItemAt(newX, newY);
            if (item) {
                console.log('Found item at', newX, newY, ':', item);
                this.pickupItem(item);
            }
            
            this.player.x = newX;
            this.player.y = newY;
            
            // Add slime trail if power is active
            if (this.hasSlimeTrail) {
                this.slimeTrail.push({ x: newX, y: newY, turn: this.turn });
                // Keep only recent slime based on duration
                this.slimeTrail = this.slimeTrail.filter(slime => this.turn - slime.turn <= this.slimeTrailDuration);
            }
            
            this.turn++;
            this.updateEnemies();
            this.updateProjectiles();
            this.updateLightningPower();
            this.render();
        }
    }
    
    enterDoor() {
        this.currentLevel++;
        this.stats.levelsCompleted++;
        this.addMessage(`Entering level ${this.currentLevel}!`, "success");
        this.generateMap();
        this.updateLightningPower();
        this.render();
    }
    
    getDoorAt(x, y) {
        return this.doors.find(door => door.x === x && door.y === y);
    }
    
    wait() {
        this.turn++;
        this.updateEnemies();
        this.updateProjectiles();
        this.updateLightningPower();
        this.render();
        this.addMessage("You wait...", "info");
    }
    
    getEnemyAt(x, y) {
        return this.enemies.find(enemy => enemy.x === x && enemy.y === y);
    }
    
    getItemAt(x, y) {
        return this.items.find(item => item.x === x && item.y === y);
    }
    
    combat(player, enemy) {
        // Player attacks with damage multiplier
        let playerDamage = Math.max(1, player.attack - enemy.defense);
        if (player.damageMultiplier) {
            playerDamage = Math.floor(playerDamage * player.damageMultiplier);
        }
        enemy.health -= playerDamage;
        this.stats.totalDamage += playerDamage;
        this.addMessage(`You hit the ${enemy.type} level ${enemy.level} for ${playerDamage} damage!`, "combat");
        
        if (enemy.health <= 0) {
            this.enemies = this.enemies.filter(e => e !== enemy);
            player.xp += enemy.xpValue;
            this.stats.enemiesKilled++;
            
            // Special victory for boss
            if (enemy.isBoss) {
                this.stats.necromancerKills++;
                this.addMessage(`You have defeated the Necromancer! Victory #${this.stats.necromancerKills}!`, "success");
                this.showVictoryScreen();
            } else {
                this.addMessage(`You defeated the ${enemy.type} level ${enemy.level}! Gained ${enemy.xpValue} XP.`, "success");
            }
            
            this.checkLevelUp();
        } else {
            // Enemy attacks with miss chance
            const enemyDamage = Math.max(1, enemy.attack - player.defense);
            
            // Check for miss chance
            if (player.missChance && Math.random() < player.missChance) {
                this.addMessage(`The ${enemy.type} level ${enemy.level} missed you!`, "success");
            } else {
                player.health -= enemyDamage;
                this.addMessage(`The ${enemy.type} level ${enemy.level} hits you for ${enemyDamage} damage!`, "combat");
                
                if (player.health <= 0) {
                    this.gameOver = true;
                    this.addMessage("You have been defeated! Press R to restart.", "error");
                }
            }
        }
        
        this.turn++;
        
        // Update ult cooldown
        if (this.player.ultCooldown > 0) {
            this.player.ultCooldown--;
        }
        
        this.updateEnemies();
        this.updateProjectiles();
        this.updateLightningPower();
        this.render();
    }
    
    checkLevelUp() {
        const xpNeeded = this.player.level * 50;
        if (this.player.xp >= xpNeeded) {
            this.player.level++;
            this.player.maxHealth += 20;
            this.player.health = this.player.maxHealth;
            this.player.attack += 3;
            this.player.defense += 2;
            this.addMessage(`Level up! You are now level ${this.player.level}!`, "success");
        }
    }
    
    updateEnemies() {
        for (const enemy of this.enemies) {
            // Handle boss special behavior
            if (enemy.isBoss) {
                this.updateBoss(enemy);
            }
            
            // Handle shooting enemies
            if (enemy.canShoot && this.turn - enemy.lastShot >= enemy.shotCooldown) {
                const distanceToPlayer = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
                if (distanceToPlayer <= 10) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = this.turn;
                }
            }
            
            // Movement based on pattern
            if (Math.random() < (0.4 + enemy.aggression)) {
                this.moveEnemy(enemy);
            }
        }
    }
    
    updateBoss(enemy) {
        // Boss taunts
        if (this.turn - enemy.tauntCooldown >= 10) {
            const taunts = [
                "The Necromancer: 'Your weapons are nothing against my dark magic!'",
                "The Necromancer: 'Rise, my minions! Destroy this fool!'",
                "The Necromancer: 'You think you can defeat me? How amusing!'",
                "The Necromancer: 'Your soul will join my army of the dead!'",
                "The Necromancer: 'Feel the power of the void!'"
            ];
            const taunt = taunts[Math.floor(Math.random() * taunts.length)];
            this.addMessage(taunt, "combat");
            enemy.tauntCooldown = this.turn;
        }
        
        // Boss summons skeletons
        if (this.turn - enemy.summonCooldown >= 3 && this.enemies.length < 12) {
            this.summonSkeleton(enemy);
            enemy.summonCooldown = this.turn;
        }
    }
    
    summonSkeleton(enemy) {
        // Find a position near the boss to summon skeleton
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];
        
        for (const dir of directions) {
            const x = enemy.x + dir.dx * 2;
            const y = enemy.y + dir.dy * 2;
            
            if (this.canMoveTo(enemy, x, y)) {
                const skeleton = {
                    x: x,
                    y: y,
                    type: 'skeleton',
                    level: 3,
                    health: 100,
                    maxHealth: 100,
                    attack: 25,
                    defense: 10,
                    xpValue: 50,
                    aggression: 0.7,
                    direction: 'down',
                    size: 1,
                    canShoot: false,
                    movementPattern: 'normal'
                };
                
                this.enemies.push(skeleton);
                this.addMessage("The Necromancer summons a skeleton!", "combat");
                break;
            }
        }
    }
    
    moveEnemy(enemy) {
        const distanceToPlayer = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
        
        switch(enemy.movementPattern) {
            case 'normal':
                this.moveEnemyNormal(enemy, distanceToPlayer);
                break;
            case 'fast':
                this.moveEnemyFast(enemy, distanceToPlayer);
                break;
            case 'slow':
                this.moveEnemySlow(enemy, distanceToPlayer);
                break;
            case 'teleport':
                this.moveEnemyTeleport(enemy, distanceToPlayer);
                break;
            case 'float':
                this.moveEnemyFloat(enemy, distanceToPlayer);
                break;
            case 'bounce':
                this.moveEnemyBounce(enemy, distanceToPlayer);
                break;
            case 'ambush':
                this.moveEnemyAmbush(enemy, distanceToPlayer);
                break;
            case 'fly':
                this.moveEnemyFly(enemy, distanceToPlayer);
                break;
        }
    }
    
    moveEnemyNormal(enemy, distanceToPlayer) {
        if (distanceToPlayer < 8 && Math.random() < enemy.aggression) {
            // Move towards player
            const moveX = enemy.x + (this.player.x > enemy.x ? 1 : this.player.x < enemy.x ? -1 : 0);
            const moveY = enemy.y + (this.player.y > enemy.y ? 1 : this.player.y < enemy.y ? -1 : 0);
            
            if (this.canMoveTo(enemy, moveX, moveY)) {
                enemy.x = moveX;
                enemy.y = moveY;
                enemy.direction = this.getDirection(enemy.x, enemy.y, moveX, moveY);
                return;
            }
        }
        
        // Random movement
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        const newX = enemy.x + dx;
        const newY = enemy.y + dy;
        
        if (this.canMoveTo(enemy, newX, newY)) {
            enemy.x = newX;
            enemy.y = newY;
            enemy.direction = this.getDirection(enemy.x, enemy.y, newX, newY);
            
            // Check for slime trail damage when enemy moves
            if (this.hasSlimeTrail) {
                const slimeAtPosition = this.slimeTrail.find(slime => slime.x === newX && slime.y === newY);
                if (slimeAtPosition) {
                    const slimeDamage = 100;
                    enemy.health -= slimeDamage;
                    this.addMessage(`${enemy.type} level ${enemy.level} stepped on slime trail and took ${slimeDamage} damage!`, "success");
                    
                    if (enemy.health <= 0) {
                        this.enemies = this.enemies.filter(e => e !== enemy);
                        this.player.xp += enemy.xpValue;
                        this.stats.enemiesKilled++;
                        this.addMessage(`Slime trail destroyed ${enemy.type} level ${enemy.level}!`, "success");
                        return;
                    }
                }
            }
        }
    }
    
    moveEnemyFast(enemy, distanceToPlayer) {
        // Fast movement - moves twice as often
        if (distanceToPlayer < 12 && Math.random() < enemy.aggression) {
            const moveX = enemy.x + (this.player.x > enemy.x ? 2 : this.player.x < enemy.x ? -2 : 0);
            const moveY = enemy.y + (this.player.y > enemy.y ? 2 : this.player.y < enemy.y ? -2 : 0);
            
            if (this.canMoveTo(enemy, moveX, moveY)) {
                enemy.x = moveX;
                enemy.y = moveY;
                enemy.direction = this.getDirection(enemy.x, enemy.y, moveX, moveY);
                return;
            }
        }
        
        this.moveEnemyNormal(enemy, distanceToPlayer);
    }
    
    moveEnemySlow(enemy, distanceToPlayer) {
        // Slow movement - moves less often
        if (Math.random() < 0.3) {
            this.moveEnemyNormal(enemy, distanceToPlayer);
        }
    }
    
    moveEnemyTeleport(enemy, distanceToPlayer) {
        if (distanceToPlayer > 6 && distanceToPlayer < 15 && Math.random() < 0.3) {
            // Teleport closer to player
            const teleportX = this.player.x + (Math.random() < 0.5 ? 2 : -2);
            const teleportY = this.player.y + (Math.random() < 0.5 ? 2 : -2);
            
            if (this.canMoveTo(enemy, teleportX, teleportY)) {
                enemy.x = teleportX;
                enemy.y = teleportY;
                enemy.direction = this.getDirection(enemy.x, enemy.y, teleportX, teleportY);
                return;
            }
        }
        
        this.moveEnemyNormal(enemy, distanceToPlayer);
    }
    
    moveEnemyFloat(enemy, distanceToPlayer) {
        // Float - can move through walls occasionally
        if (Math.random() < 0.1) {
            const dx = Math.floor(Math.random() * 3) - 1;
            const dy = Math.floor(Math.random() * 3) - 1;
            const newX = enemy.x + dx;
            const newY = enemy.y + dy;
            
            if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight &&
                !this.getEnemyAt(newX, newY) && !(newX === this.player.x && newY === this.player.y)) {
                enemy.x = newX;
                enemy.y = newY;
                enemy.direction = this.getDirection(enemy.x, enemy.y, newX, newY);
                return;
            }
        }
        
        this.moveEnemyNormal(enemy, distanceToPlayer);
    }
    
    moveEnemyBounce(enemy, distanceToPlayer) {
        // Bounce - moves in a bouncing pattern
        if (!enemy.bounceDirection) {
            enemy.bounceDirection = Math.floor(Math.random() * 4);
        }
        
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        
        const dir = directions[enemy.bounceDirection];
        const newX = enemy.x + dir.dx;
        const newY = enemy.y + dir.dy;
        
        if (!this.canMoveTo(enemy, newX, newY)) {
            enemy.bounceDirection = (enemy.bounceDirection + 2) % 4;
            return;
        }
        
        enemy.x = newX;
        enemy.y = newY;
        enemy.direction = this.getDirection(enemy.x, enemy.y, newX, newY);
    }
    
    moveEnemyAmbush(enemy, distanceToPlayer) {
        // Ambush - stays hidden until close, then attacks aggressively
        if (distanceToPlayer < 6) {
            // Aggressive attack
            const moveX = enemy.x + (this.player.x > enemy.x ? 1 : this.player.x < enemy.x ? -1 : 0);
            const moveY = enemy.y + (this.player.y > enemy.y ? 1 : this.player.y < enemy.y ? -1 : 0);
            
            if (this.canMoveTo(enemy, moveX, moveY)) {
                enemy.x = moveX;
                enemy.y = moveY;
                enemy.direction = this.getDirection(enemy.x, enemy.y, moveX, moveY);
            }
        } else {
            // Stay hidden
            if (Math.random() < 0.2) {
                this.moveEnemyNormal(enemy, distanceToPlayer);
            }
        }
    }
    
    moveEnemyFly(enemy, distanceToPlayer) {
        // Fly - can move diagonally and over obstacles
        if (distanceToPlayer < 10 && Math.random() < enemy.aggression) {
            const dx = this.player.x > enemy.x ? 1 : this.player.x < enemy.x ? -1 : 0;
            const dy = this.player.y > enemy.y ? 1 : this.player.y < enemy.y ? -1 : 0;
            
            if (this.canMoveTo(enemy, enemy.x + dx, enemy.y + dy)) {
                enemy.x += dx;
                enemy.y += dy;
                enemy.direction = this.getDirection(enemy.x, enemy.y, enemy.x + dx, enemy.y + dy);
            }
        } else {
            // Diagonal movement
            const dx = Math.floor(Math.random() * 3) - 1;
            const dy = Math.floor(Math.random() * 3) - 1;
            
            if (this.canMoveTo(enemy, enemy.x + dx, enemy.y + dy)) {
                enemy.x += dx;
                enemy.y += dy;
                enemy.direction = this.getDirection(enemy.x, enemy.y, enemy.x + dx, enemy.y + dy);
            }
        }
    }
    
    canMoveTo(enemy, x, y) {
        return x >= 0 && x < this.mapWidth && y >= 0 && y < this.mapHeight &&
               this.map[y] && this.map[y][x] === '.' &&
               !this.getEnemyAt(x, y) &&
               !(x === this.player.x && y === this.player.y);
    }
    
    isInSameRoom(x1, y1, x2, y2) {
        // Simple room detection: if both points are in a connected floor area
        // This is a basic implementation - could be enhanced with proper room detection
        const visited = new Set();
        const queue = [{x: x2, y: y2}];
        
        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Check if we found the target point
            if (current.x === x1 && current.y === y1) {
                return true;
            }
            
            // Add adjacent floor tiles to queue
            const directions = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
            for (const dir of directions) {
                const newX = current.x + dir.dx;
                const newY = current.y + dir.dy;
                
                if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight &&
                    this.map[newY] && this.map[newY][newX] === '.') {
                    queue.push({x: newX, y: newY});
                }
            }
        }
        
        return false;
    }
    
    enemyShoot(enemy) {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];
        
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const damage = Math.floor(enemy.attack * 0.5);
        const color = this.getEnemyProjectileColor(enemy.type);
        
        this.projectiles.push({
            x: enemy.x,
            y: enemy.y,
            dx: direction.dx * 0.3,
            dy: direction.dy * 0.3,
            startX: enemy.x,
            startY: enemy.y,
            damage: damage,
            color: color,
            name: `${enemy.type} attack`,
            isEnemy: true
        });
        
        this.addMessage(`${enemy.type} level ${enemy.level} shoots at you!`, "combat");
    }
    
    getEnemyProjectileColor(enemyType) {
        switch(enemyType) {
            case 'demon': return '#ff0000';
            case 'lich': return '#800080';
            case 'beholder': return '#ff00ff';
            case 'kraken': return '#000080';
            case 'phoenix': return '#ff4500';
            case 'wraith': return '#4b0082';
            case 'wyvern': return '#8b4513';
            default: return '#ff0000';
        }
    }
    
    getDirection(fromX, fromY, toX, toY) {
        const dx = toX - fromX;
        const dy = toY - fromY;
        
        if (dx > 0) return 'right';
        if (dx < 0) return 'left';
        if (dy > 0) return 'down';
        if (dy < 0) return 'up';
        return 'down'; // default direction
    }
    
    updateProjectiles() {
        // Update existing projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.x += projectile.dx;
            projectile.y += projectile.dy;
            
            if (projectile.isEnemy) {
                // Enemy projectile hitting player
                const distanceToPlayer = Math.abs(projectile.x - this.player.x) + Math.abs(projectile.y - this.player.y);
                if (distanceToPlayer < 1) {
                    const damage = projectile.damage;
                    this.player.health -= damage;
                    this.addMessage(`${projectile.name} hits you for ${damage} damage!`, "combat");
                    
                                if (this.player.health <= 0) {
                if (this.player.hasSuperStatus) {
                    // Super status prevents death once
                    this.player.hasSuperStatus = false;
                    this.player.health = this.player.maxHealth;
                    this.addMessage("SUPER STATUS SAVED YOU! You are revived with full health!", "success");
                } else {
                    this.gameOver = true;
                    this.addMessage("Thanks to the Necromancer's own powers backfiring against him, you may respawn.", "error");
                }
            }
                    
                    this.projectiles.splice(i, 1);
                    continue;
                }
            } else {
                            // Player projectile hitting enemy
            const hitEnemy = this.getEnemyAt(Math.round(projectile.x), Math.round(projectile.y));
            if (hitEnemy) {
                let damage = projectile.damage;
                // Apply damage multiplier
                if (this.player.damageMultiplier) {
                    damage = Math.floor(damage * this.player.damageMultiplier);
                }
                hitEnemy.health -= damage;
                this.stats.totalDamage += damage;
                this.addMessage(`${projectile.name} hits ${hitEnemy.type} level ${hitEnemy.level} for ${damage} damage!`, "combat");
                    
                    if (hitEnemy.health <= 0) {
                        this.enemies = this.enemies.filter(e => e !== hitEnemy);
                        this.player.xp += hitEnemy.xpValue;
                        this.stats.enemiesKilled++;
                        this.addMessage(`You defeated the ${hitEnemy.type} level ${hitEnemy.level}! Gained ${hitEnemy.xpValue} XP.`, "success");
                        this.checkLevelUp();
                    }
                    
                    this.projectiles.splice(i, 1);
                    continue;
                }
            }
            
            // Check if projectile hits a wall
            if (this.map[Math.round(projectile.y)] && this.map[Math.round(projectile.y)][Math.round(projectile.x)] === '#') {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Remove projectiles that have traveled too far
            if (Math.abs(projectile.x - projectile.startX) > 20 || Math.abs(projectile.y - projectile.startY) > 20) {
                this.projectiles.splice(i, 1);
            }
        }
        
        // Auto-fire projectiles based on player's inventory
        if (this.turn % 3 === 0) { // Fire every 3 turns
            this.autoFireProjectiles();
        }
    }
    
    autoFireProjectiles() {
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
            { dx: 1, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: -1 }
        ];
        
        // Check for spell items
        const spellItems = this.player.inventory.filter(item => 
            item.type.includes('spell') || item.type.includes('bow') || item.type.includes('dagger_thrown')
        );
        
        spellItems.forEach(item => {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const damage = this.getProjectileDamage(item.type);
            const color = this.getProjectileColor(item.type);
            
            this.projectiles.push({
                x: this.player.x,
                y: this.player.y,
                dx: direction.dx * 0.5,
                dy: direction.dy * 0.5,
                startX: this.player.x,
                startY: this.player.y,
                damage: damage,
                color: color,
                name: item.name
            });
        });
    }
    
    getProjectileDamage(itemType) {
        switch(itemType) {
            case 'fireball_spell': return 25;
            case 'ice_spell': return 20;
            case 'lightning_spell': return 30;
            case 'poison_spell': return 15;
            case 'death_spell': return 50;
            case 'wooden_bow': return 15;
            case 'iron_bow': return 20;
            case 'magic_bow': return 25;
            case 'dragon_bow': return 35;
            case 'legendary_bow': return 45;
            case 'iron_dagger': return 10;
            case 'poison_dagger_thrown': return 12;
            // New powerful items
            case 'excalibur': return 80;
            case 'storm_hammer': return 70;
            case 'void_blade': return 75;
            case 'thunder_staff': return 60;
            case 'frost_staff': return 55;
            case 'fire_staff': return 65;
            case 'giant_staff': return 90;
            case 'mega_bow': return 85;
            case 'death_blade': return 100;
            default: return 10;
        }
    }
    
    getProjectileColor(itemType) {
        switch(itemType) {
            case 'fireball_spell': return '#00ff00';
            case 'ice_spell': return '#32cd32';
            case 'lightning_spell': return '#90ee90';
            case 'poison_spell': return '#228b22';
            case 'death_spell': return '#006400';
            case 'wooden_bow': return '#98fb98';
            case 'iron_bow': return '#7cfc00';
            case 'magic_bow': return '#adff2f';
            case 'dragon_bow': return '#9acd32';
            case 'legendary_bow': return '#00fa9a';
            case 'iron_dagger': return '#00ff7f';
            case 'poison_dagger_thrown': return '#3cb371';
            default: return '#00ff00';
        }
    }
    
    pickupItem(item) {
        // Track item counts for stacking
        if (!this.player.itemCounts[item.type]) {
            this.player.itemCounts[item.type] = 0;
        }
        this.player.itemCounts[item.type]++;
        
        this.items = this.items.filter(i => i !== item);
        this.player.inventory.push(item);
        this.stats.itemsFound++;
        this.applyItemEffect(item);
        this.addMessage(`You picked up ${item.name}!`, "success");
    }
    
    useUlt() {
        if (this.player.ultCooldown > 0) {
            this.addMessage("Ultimate not ready yet!", "error");
            return;
        }
        
        // Destroy all visible enemies
        const visibleEnemies = this.enemies.filter(enemy => {
            const distanceFromPlayer = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            return distanceFromPlayer <= this.player.viewRange;
        });
        
        if (visibleEnemies.length === 0) {
            this.addMessage("No enemies in sight to destroy!", "error");
            return;
        }
        
        // Remove visible enemies and give XP
        let totalXP = 0;
        visibleEnemies.forEach(enemy => {
            totalXP += enemy.xpValue;
            this.stats.enemiesKilled++;
        });
        
        this.enemies = this.enemies.filter(enemy => {
            const distanceFromPlayer = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            return distanceFromPlayer > this.player.viewRange;
        });
        
        this.player.xp += totalXP;
        this.player.ultCooldown = 50; // 50 turn cooldown
        
        this.addMessage(`ULTIMATE! Destroyed ${visibleEnemies.length} enemies! Gained ${totalXP} XP!`, "success");
        this.checkLevelUp();
    }
    
    upgradeToSuperStatus(itemType) {
        // Remove 3 copies of the item
        this.player.itemCounts[itemType] -= 3;
        
        // Remove 3 items from inventory
        let removed = 0;
        this.player.inventory = this.player.inventory.filter(item => {
            if (item.type === itemType && removed < 3) {
                removed++;
                return false;
            }
            return true;
        });
        
        // Grant super status
        this.player.hasSuperStatus = true;
        this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 2.0;
        this.player.health = this.player.maxHealth;
        
        this.addMessage(`SUPER STATUS ACTIVATED! ${itemType} items combined into ultimate power!`, "success");
        this.addMessage("You are now invincible and deal double damage!", "success");
        this.updateInventory();
    }
    
    applyItemEffect(item) {
        // Apply item effects immediately and stack them
        switch(item.type) {
            case 'health_potion':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 100);
                this.addMessage("You feel refreshed!", "success");
                break;
            case 'sword':
                this.player.attack += 15;
                this.addMessage("Your attack power increased!", "success");
                break;
            case 'shield':
                this.player.defense += 10;
                this.addMessage("Your defense increased!", "success");
                break;
            case 'scroll':
                this.player.attack += 8;
                this.player.defense += 5;
                this.addMessage("You read the scroll and feel empowered!", "success");
                break;
            case 'magic_sword':
                this.player.attack += 20;
                this.addMessage("The magic sword enhances your attack!", "success");
                break;
            case 'dragon_armor':
                this.player.defense += 15;
                this.player.maxHealth += 50;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                this.addMessage("Dragon armor protects you!", "success");
                break;
            case 'healing_scroll':
                this.player.health = this.player.maxHealth;
                this.addMessage("You are fully healed!", "success");
                break;
            case 'strength_potion':
                this.player.attack += 25;
                this.addMessage("You feel much stronger!", "success");
                break;
            case 'defense_potion':
                this.player.defense += 20;
                this.addMessage("Your skin feels tougher!", "success");
                break;
            case 'speed_potion':
                this.addMessage("You feel faster!", "success");
                break;
            case 'fire_scroll':
                this.addMessage("Fire magic courses through you!", "success");
                this.player.attack += 30;
                break;
            case 'ice_scroll':
                this.addMessage("Ice magic protects you!", "success");
                this.player.defense += 25;
                break;
            case 'lightning_scroll':
                this.addMessage("Lightning enhances your speed!", "success");
                this.player.attack += 35;
                break;
            case 'poison_dagger':
                this.player.attack += 15;
                this.addMessage("The poison dagger is deadly!", "success");
                break;
            case 'life_steal_sword':
                this.player.attack += 20;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
                this.addMessage("The sword steals life from enemies!", "success");
                break;
            case 'teleport_scroll':
                this.addMessage("You teleport to a random location!", "success");
                let attempts = 0;
                while (attempts < 100) {
                    const x = Math.floor(Math.random() * this.mapWidth);
                    const y = Math.floor(Math.random() * this.mapHeight);
                    if (this.map[y] && this.map[y][x] === '.' && 
                        !this.getEnemyAt(x, y) && !this.getDoorAt(x, y)) {
                        this.player.x = x;
                        this.player.y = y;
                        break;
                    }
                    attempts++;
                }
                break;
            case 'invisibility_potion':
                this.addMessage("You become invisible!", "success");
                break;
            case 'regeneration_potion':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 200);
                this.addMessage("Your wounds heal rapidly!", "success");
                break;
            case 'berserker_potion':
                this.player.attack += 40;
                this.player.defense -= 10;
                this.addMessage("You enter a berserker rage!", "success");
                break;
            case 'divine_shield':
                this.player.defense += 30;
                this.player.maxHealth += 100;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 100);
                this.addMessage("Divine protection surrounds you!", "success");
                break;
            case 'vampire_blade':
                this.player.attack += 25;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 60);
                this.addMessage("The vampire blade drains life!", "success");
                break;
            case 'frost_sword':
                this.player.attack += 20;
                this.player.defense += 15;
                this.addMessage("The frost sword freezes your enemies!", "success");
                break;
            case 'thunder_hammer':
                this.player.attack += 35;
                this.addMessage("The thunder hammer is devastating!", "success");
                break;
            case 'shadow_cloak':
                this.player.defense += 25;
                this.addMessage("The shadow cloak conceals you!", "success");
                break;
            case 'phoenix_feather':
                this.player.maxHealth += 200;
                this.player.health = this.player.maxHealth;
                this.player.attack += 40;
                this.player.defense += 25;
                this.addMessage("The phoenix feather grants immortality!", "success");
                break;
            case 'fireball_spell':
            case 'ice_spell':
            case 'lightning_spell':
            case 'poison_spell':
            case 'death_spell':
            case 'wooden_bow':
            case 'iron_bow':
            case 'magic_bow':
            case 'dragon_bow':
            case 'legendary_bow':
            case 'iron_dagger':
            case 'poison_dagger_thrown':
                this.addMessage(`${item.name} is ready for ranged combat!`, "success");
                break;
            // New powerful items
            case 'excalibur':
                this.player.attack += 100;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.5;
                this.addMessage("Excalibur grants legendary power! Damage multiplied!", "success");
                break;
            case 'storm_hammer':
                this.player.attack += 80;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.3;
                this.addMessage("Storm Hammer channels lightning power!", "success");
                break;
            case 'void_blade':
                this.player.attack += 90;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.4;
                this.addMessage("Void Blade cuts through reality!", "success");
                break;
            case 'thunder_staff':
                this.player.attack += 60;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) * 1.1);
                this.addMessage("Thunder Staff amplifies your projectiles!", "success");
                break;
            case 'frost_staff':
                this.player.attack += 50;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) * 1.1);
                this.addMessage("Frost Staff creates massive ice projectiles!", "success");
                break;
            case 'fire_staff':
                this.player.attack += 70;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) * 1.1);
                this.addMessage("Fire Staff creates massive fireballs!", "success");
                break;
            case 'dragon_scale_armor':
                this.player.defense += 40;
                this.player.maxHealth += 200;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 200);
                this.player.hpMultiplier = (this.player.hpMultiplier || 1) * 1.15;
                this.addMessage("Dragon Scale Armor provides legendary protection!", "success");
                break;
            case 'phoenix_armor':
                this.player.defense += 35;
                this.player.maxHealth += 150;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 150);
                this.player.hpMultiplier = (this.player.hpMultiplier || 1) * 1.15;
                this.addMessage("Phoenix Armor grants fiery protection!", "success");
                break;
            case 'void_armor':
                this.player.defense += 45;
                this.player.maxHealth += 250;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 250);
                this.player.hpMultiplier = (this.player.hpMultiplier || 1) * 1.15;
                this.addMessage("Void Armor absorbs damage from the void!", "success");
                break;
            case 'titan_armor':
                this.player.defense += 50;
                this.player.maxHealth += 300;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 300);
                this.player.hpMultiplier = (this.player.hpMultiplier || 1) * 1.15;
                this.addMessage("Titan Armor makes you nearly invincible!", "success");
                break;
            case 'celestial_armor':
                this.player.defense += 60;
                this.player.maxHealth += 400;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 400);
                this.player.hpMultiplier = (this.player.hpMultiplier || 1) * 1.15;
                this.addMessage("Celestial Armor grants divine protection!", "success");
                break;
            case 'damage_ring':
                this.player.attack += 40;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.1;
                this.addMessage("Ring of Power increases your damage by 10%!", "success");
                break;
            case 'power_ring':
                this.player.attack += 50;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.15;
                this.addMessage("Ring of Might increases your damage by 15%!", "success");
                break;
            case 'giant_staff':
                this.player.attack += 60;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) * 1.2);
                this.addMessage("Giant Staff creates massive projectiles!", "success");
                break;
            case 'mega_bow':
                this.player.attack += 70;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) * 1.2);
                this.addMessage("Mega Bow fires giant arrows!", "success");
                break;
            case 'death_blade':
                this.player.attack += 120;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 2.0;
                this.addMessage("Blade of Death multiplies your damage!", "success");
                break;
            case 'view_ring':
                this.player.viewRange += 2;
                this.addMessage("Ring of Vision increases your view range!", "success");
                break;
            case 'eagle_eye':
                this.player.viewRange += 3;
                this.addMessage("Eagle Eye grants exceptional vision!", "success");
                break;
            case 'telescope':
                this.player.viewRange += 4;
                this.addMessage("Telescope reveals distant enemies!", "success");
                break;
            case 'crystal_ball':
                this.player.viewRange += 5;
                this.addMessage("Crystal Ball shows all secrets!", "success");
                break;
            case 'ult_scroll':
                this.player.ultCooldown = 0;
                this.addMessage("Ultimate Scroll ready! Press U to unleash destruction!", "success");
                break;
            case 'miss_chance_armor':
                this.player.defense += 30;
                this.player.maxHealth += 100;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 100);
                this.player.missChance = (this.player.missChance || 0) + 0.2;
                this.addMessage("Evasion Armor gives 20% chance to dodge attacks!", "success");
                break;
            case 'dodge_armor':
                this.player.defense += 25;
                this.player.maxHealth += 80;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 80);
                this.player.missChance = (this.player.missChance || 0) + 0.15;
                this.addMessage("Dodge Armor gives 15% chance to dodge attacks!", "success");
                break;
            case 'evasion_armor':
                this.player.defense += 35;
                this.player.maxHealth += 120;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 120);
                this.player.missChance = (this.player.missChance || 0) + 0.25;
                this.addMessage("Evasion Armor gives 25% chance to dodge attacks!", "success");
                break;
            case 'phantom_armor':
                this.player.defense += 40;
                this.player.maxHealth += 150;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 150);
                this.player.missChance = (this.player.missChance || 0) + 0.3;
                this.addMessage("Phantom Armor gives 30% chance to dodge attacks!", "success");
                break;
            case 'shadow_armor':
                this.player.defense += 45;
                this.player.maxHealth += 180;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 180);
                this.player.missChance = (this.player.missChance || 0) + 0.35;
                this.addMessage("Shadow Armor gives 35% chance to dodge attacks!", "success");
                break;
            // Ultra-powerful items
            case 'god_sword':
                this.player.attack += 100;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.5;
                this.addMessage("Sword of the Gods grants divine power!", "success");
                break;
            case 'chaos_blade':
                this.player.attack += 120;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.8;
                this.addMessage("Blade of Chaos channels pure destruction!", "success");
                break;
            case 'infinity_staff':
                this.player.attack += 80;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) + 2);
                this.addMessage("Staff of Infinity amplifies your magic!", "success");
                break;
            case 'cosmic_bow':
                this.player.attack += 90;
                this.player.viewRange = (this.player.viewRange || 8) + 4;
                this.addMessage("Cosmic Bow grants cosmic vision!", "success");
                break;
            case 'void_hammer':
                this.player.attack += 150;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 2.0;
                this.addMessage("Hammer of the Void crushes all resistance!", "success");
                break;
            case 'celestial_armor_plus':
                this.player.defense += 80;
                this.player.maxHealth += 300;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 300);
                this.player.missChance = (this.player.missChance || 0) + 0.4;
                this.addMessage("Celestial Armor+ grants divine protection!", "success");
                break;
            case 'dragon_god_armor':
                this.player.defense += 100;
                this.player.maxHealth += 400;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 400);
                this.player.missChance = (this.player.missChance || 0) + 0.45;
                this.addMessage("Dragon God Armor makes you invincible!", "success");
                break;
            case 'phoenix_legend_armor':
                this.player.defense += 90;
                this.player.maxHealth += 350;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 350);
                this.player.missChance = (this.player.missChance || 0) + 0.42;
                this.addMessage("Phoenix Legend Armor grants rebirth!", "success");
                break;
            case 'void_master_armor':
                this.player.defense += 110;
                this.player.maxHealth += 450;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 450);
                this.player.missChance = (this.player.missChance || 0) + 0.5;
                this.addMessage("Void Master Armor transcends reality!", "success");
                break;
            case 'titan_god_armor':
                this.player.defense += 120;
                this.player.maxHealth += 500;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 500);
                this.player.missChance = (this.player.missChance || 0) + 0.55;
                this.addMessage("Titan God Armor makes you a god!", "success");
                break;
            case 'power_ring_plus':
                this.player.attack += 60;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.3;
                this.addMessage("Ring of Power+ amplifies your strength!", "success");
                break;
            case 'damage_ring_plus':
                this.player.attack += 70;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.4;
                this.addMessage("Ring of Might+ grants supreme power!", "success");
                break;
            case 'giant_staff_plus':
                this.player.attack += 50;
                this.player.projectileSize = Math.min(this.player.maxProjectileSize, (this.player.projectileSize || 1) + 3);
                this.addMessage("Giant Staff+ creates massive projectiles!", "success");
                break;
            case 'mega_bow_plus':
                this.player.attack += 80;
                this.player.viewRange = (this.player.viewRange || 8) + 6;
                this.addMessage("Mega Bow+ grants ultimate vision!", "success");
                break;
            case 'death_blade_plus':
                this.player.attack += 130;
                this.player.damageMultiplier = (this.player.damageMultiplier || 1) * 1.9;
                this.addMessage("Blade of Death+ brings instant death!", "success");
                break;
            case 'miss_chance_armor_plus':
                this.player.defense += 60;
                this.player.maxHealth += 250;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 250);
                this.player.missChance = (this.player.missChance || 0) + 0.45;
                this.addMessage("Evasion Armor+ makes you untouchable!", "success");
                break;
            case 'dodge_armor_plus':
                this.player.defense += 70;
                this.player.maxHealth += 300;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 300);
                this.player.missChance = (this.player.missChance || 0) + 0.5;
                this.addMessage("Dodge Armor+ grants perfect evasion!", "success");
                break;
            case 'evasion_armor_plus':
                this.player.defense += 80;
                this.player.maxHealth += 350;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 350);
                this.player.missChance = (this.player.missChance || 0) + 0.55;
                this.addMessage("Evasion Armor+ transcends dodging!", "success");
                break;
            case 'phantom_armor_plus':
                this.player.defense += 90;
                this.player.maxHealth += 400;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 400);
                this.player.missChance = (this.player.missChance || 0) + 0.6;
                this.addMessage("Phantom Armor+ makes you intangible!", "success");
                break;
            case 'shadow_armor_plus':
                this.player.defense += 100;
                this.player.maxHealth += 450;
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 450);
                this.player.missChance = (this.player.missChance || 0) + 0.65;
                this.addMessage("Shadow Armor+ grants shadow form!", "success");
                break;
        }
    }
    
    addMessage(text, type = "info") {
        this.messages.unshift({ text, type, turn: this.turn });
        if (this.messages.length > 10) {
            this.messages.pop();
        }
        this.updateMessages();
    }
    
    updateMessages() {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.innerHTML = '';
        this.messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.type}`;
            div.textContent = msg.text;
            messagesDiv.appendChild(div);
        });
    }
    
    updateInventory() {
        // Only update if inventory has changed
        const inventoryDiv = document.getElementById('inventory');
        const currentInventory = JSON.stringify(this.player.inventory.map(item => ({ name: item.name, rarity: item.rarity })));
        
        if (this.lastInventoryState === currentInventory) {
            return; // No change, skip update
        }
        
        this.lastInventoryState = currentInventory;
        inventoryDiv.innerHTML = '';
        
        // Group items by type
        const itemCounts = {};
        this.player.inventory.forEach(item => {
            if (itemCounts[item.type]) {
                itemCounts[item.type].count++;
            } else {
                itemCounts[item.type] = { ...item, count: 1 };
            }
        });
        
        // Display grouped items
        Object.values(itemCounts).forEach(item => {
            const div = document.createElement('div');
            div.className = `inventory-item ${item.rarity}`;
            
            // Check if item has 3 copies for super status
            const itemCount = this.player.itemCounts[item.type] || 0;
            const canUpgrade = itemCount >= 3 && !this.player.hasSuperStatus;
            
            // Shorten item names for compact display
            const shortName = item.name.replace('Health Potion', 'HP Pot').replace('Strength Potion', 'Str Pot').replace('Defense Potion', 'Def Pot').replace('Speed Potion', 'Spd Pot').replace('Regeneration Potion', 'Regen Pot').replace('Invisibility Potion', 'Invis Pot').replace('Berserker Potion', 'Berserk Pot').replace('Iron Sword', 'Iron Swd').replace('Magic Sword', 'Magic Swd').replace('Life Steal Sword', 'Life Swd').replace('Vampire Blade', 'Vamp Blade').replace('Frost Sword', 'Frost Swd').replace('Thunder Hammer', 'Thunder Ham').replace('Shadow Cloak', 'Shadow Clk').replace('Phoenix Feather', 'Phoenix Fth').replace('Wooden Shield', 'Wood Shld').replace('Dragon Armor', 'Dragon Arm').replace('Divine Shield', 'Divine Shld').replace('Magic Scroll', 'Magic Scr').replace('Healing Scroll', 'Heal Scr').replace('Fire Scroll', 'Fire Scr').replace('Ice Scroll', 'Ice Scr').replace('Lightning Scroll', 'Light Scr').replace('Teleport Scroll', 'Tele Scr').replace('Fireball Spell', 'Fireball').replace('Ice Spell', 'Ice Spell').replace('Lightning Spell', 'Light Spell').replace('Poison Spell', 'Poison Sp').replace('Death Spell', 'Death Sp').replace('Wooden Bow', 'Wood Bow').replace('Iron Bow', 'Iron Bow').replace('Magic Bow', 'Magic Bow').replace('Dragon Bow', 'Dragon Bow').replace('Legendary Bow', 'Legend Bow').replace('Iron Dagger', 'Iron Dag').replace('Poison Dagger', 'Poison Dag').replace('Poison Dagger (Thrown)', 'Thrown Dag');
            
            if (canUpgrade) {
                div.textContent = `${shortName} (${item.count}) - CLICK TO UPGRADE!`;
                div.style.color = '#FFD700';
                div.style.fontWeight = 'bold';
            } else {
                div.textContent = `${shortName} (${item.count})`;
            }
            
            // Add click event for item details or super status upgrade
            div.addEventListener('click', () => {
                if (canUpgrade) {
                    this.upgradeToSuperStatus(item.type);
                } else {
                    this.showItemDetail(item);
                }
            });
            
            inventoryDiv.appendChild(div);
        });
    }
    
    updateStats() {
        document.getElementById('health').textContent = this.player.health;
        document.getElementById('max-health').textContent = this.player.maxHealth;
        document.getElementById('level').textContent = this.player.level;
        document.getElementById('dungeon-level').textContent = this.currentLevel;
        document.getElementById('xp').textContent = this.player.xp;
        
        // Update stats panel with multipliers
        const damageMultiplier = this.player.damageMultiplier ? ` (${Math.round(this.player.damageMultiplier * 100)}%)` : '';
        const hpMultiplier = this.player.hpMultiplier ? ` (${Math.round(this.player.hpMultiplier * 100)}%)` : '';
        const missChance = this.player.missChance ? ` (${Math.round(this.player.missChance * 100)}% dodge)` : '';
        const projectileSize = this.player.projectileSize ? ` (${Math.round(this.player.projectileSize * 100)}% size)` : '';
        const viewRange = this.player.viewRange ? ` (${this.player.viewRange} tiles)` : '';
        const ultCooldown = this.player.ultCooldown > 0 ? ` (${this.player.ultCooldown} turns)` : ' (Ready)';
        
        document.getElementById('stat-attack').textContent = this.player.attack + damageMultiplier;
        document.getElementById('stat-defense').textContent = this.player.defense + missChance;
        document.getElementById('stat-damage').textContent = this.stats.totalDamage;
        document.getElementById('stat-kills').textContent = this.stats.enemiesKilled;
        document.getElementById('stat-items').textContent = this.stats.itemsFound;
        document.getElementById('stat-levels').textContent = this.stats.levelsCompleted;
        
        // Update slime trail and lightning power stats
        const slimeTrailElement = document.getElementById('stat-slime-trail');
        const lightningElement = document.getElementById('stat-lightning');
        
        if (slimeTrailElement) {
            slimeTrailElement.textContent = this.hasSlimeTrail ? 'ACTIVE' : 'Inactive';
            slimeTrailElement.className = this.hasSlimeTrail ? 'stat-value rainbow-border' : 'stat-value';
        }
        
        if (lightningElement) {
            lightningElement.textContent = this.hasLightningPower ? 'ACTIVE' : 'Inactive';
            lightningElement.className = this.hasLightningPower ? 'stat-value rainbow-border' : 'stat-value';
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Show victory screen if victory
        if (this.victory) {
            this.showVictoryScreen();
            return;
        }
        
        // Show death screen if game over
        if (this.gameOver) {
            this.renderDeathScreen();
            return;
        }
        
        // Calculate camera offset to center on player
        const cameraX = Math.max(0, Math.min(this.player.x - 20, this.mapWidth - 40));
        const cameraY = Math.max(0, Math.min(this.player.y - 15, this.mapHeight - 30));
        
        // Render map with fog of war
        for (let y = 0; y < 30; y++) {
            for (let x = 0; x < 40; x++) {
                const mapX = x + cameraX;
                const mapY = y + cameraY;
                
                if (mapY < this.mapHeight && mapX < this.mapWidth) {
                    const tile = this.map[mapY][mapX];
                    const screenX = x * this.tileSize;
                    const screenY = y * this.tileSize;
                    
                    // Calculate distance from player (diamond shape)
                    const distanceFromPlayer = Math.abs(mapX - this.player.x) + Math.abs(mapY - this.player.y);
                    
                    // Tile is visible if within view range (diamond shape only)
                    const isVisible = distanceFromPlayer <= this.player.viewRange;
                    
                    if (tile === '#') {
                        if (isVisible) {
                            this.ctx.fillStyle = '#444';
                        } else {
                            this.ctx.fillStyle = '#111';
                        }
                        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    } else if (tile === '.') {
                        if (isVisible) {
                            this.ctx.fillStyle = '#222';
                        } else {
                            this.ctx.fillStyle = '#111';
                        }
                        this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                    }
                }
            }
        }
        
        // Render doors
        this.doors.forEach(door => {
            const screenX = (door.x - cameraX) * this.tileSize;
            const screenY = (door.y - cameraY) * this.tileSize;
            
            // Check if door is visible
            const distanceFromPlayer = Math.abs(door.x - this.player.x) + Math.abs(door.y - this.player.y);
            const isVisible = distanceFromPlayer <= this.player.viewRange;
            
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height && isVisible) {
                
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(screenX + 3, screenY + 3, this.tileSize - 6, this.tileSize - 6);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(screenX + 6, screenY + 6, this.tileSize - 12, this.tileSize - 12);
            }
        });
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            const screenX = (projectile.x - cameraX) * this.tileSize;
            const screenY = (projectile.y - cameraY) * this.tileSize;
            
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height) {
                
                this.ctx.fillStyle = projectile.color;
                
                // Apply projectile size multiplier
                const size = this.player.projectileSize || 1;
                const projectileSize = Math.max(2, Math.floor(4 * size));
                const offset = (this.tileSize - projectileSize) / 2;
                
                this.ctx.fillRect(screenX + offset, screenY + offset, projectileSize, projectileSize);
            }
        });
        
        // Render slime trail
        if (this.hasSlimeTrail) {
            this.slimeTrail.forEach(slime => {
                const screenX = (slime.x - cameraX) * this.tileSize;
                const screenY = (slime.y - cameraY) * this.tileSize;
                
                if (screenX >= 0 && screenX < this.canvas.width && 
                    screenY >= 0 && screenY < this.canvas.height) {
                    
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.fillRect(screenX + 1, screenY + 1, this.tileSize - 2, this.tileSize - 2);
                }
            });
        }
        
        // Render items
        this.items.forEach(item => {
            const screenX = (item.x - cameraX) * this.tileSize;
            const screenY = (item.y - cameraY) * this.tileSize;
            
            // Check if item is visible
            const distanceFromPlayer = Math.abs(item.x - this.player.x) + Math.abs(item.y - this.player.y);
            const isVisible = distanceFromPlayer <= this.player.viewRange;
            
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height && isVisible) {
                
                let color = '#ffff00'; // common
                if (item.rarity === 'legendary') color = '#ff00ff';
                else if (item.rarity === 'epic') color = '#00ff00';
                else if (item.rarity === 'rare') color = '#00ffff';
                
                this.ctx.fillStyle = color;
                this.ctx.fillRect(screenX + 5, screenY + 5, this.tileSize - 10, this.tileSize - 10);
            }
        });
        
        // Render enemies
        this.enemies.forEach(enemy => {
            const screenX = (enemy.x - cameraX) * this.tileSize;
            const screenY = (enemy.y - cameraY) * this.tileSize;
            
            // Check if enemy is visible
            const distanceFromPlayer = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            const isVisible = distanceFromPlayer <= this.player.viewRange;
            
            if (screenX >= 0 && screenX < this.canvas.width && 
                screenY >= 0 && screenY < this.canvas.height && isVisible) {
                
                // Draw monster based on size
                if (enemy.size === 1) {
                    this.drawMonsterIcon(enemy, screenX, screenY);
                } else if (enemy.size === 2) {
                    this.drawLargeMonsterIcon(enemy, screenX, screenY);
                } else if (enemy.size === 3) {
                    this.drawHugeMonsterIcon(enemy, screenX, screenY);
                }
                
                // Health bar
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#00ff00';
                this.ctx.fillRect(screenX, screenY - 5, (this.tileSize * enemy.size - 2) * healthPercent, 3);
                
                // Level indicator
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`L${enemy.level}`, screenX + 2, screenY - 8);
            }
        });
        
        // Render player as green slime blob
        const playerScreenX = (this.player.x - cameraX) * this.tileSize;
        const playerScreenY = (this.player.y - cameraY) * this.tileSize;
        
        // Draw slime blob shape
        this.ctx.fillStyle = '#00ff00';
        this.ctx.beginPath();
        this.ctx.ellipse(
            playerScreenX + this.tileSize / 2, 
            playerScreenY + this.tileSize / 2, 
            this.tileSize / 2 - 2, 
            this.tileSize / 2 - 1, 
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
        
        // Add slime details
        this.ctx.fillStyle = '#00cc00';
        this.ctx.beginPath();
        this.ctx.ellipse(
            playerScreenX + this.tileSize / 2 - 2, 
            playerScreenY + this.tileSize / 2 - 1, 
            this.tileSize / 4, 
            this.tileSize / 4, 
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.ellipse(
            playerScreenX + this.tileSize / 2 + 2, 
            playerScreenY + this.tileSize / 2 + 1, 
            this.tileSize / 6, 
            this.tileSize / 6, 
            0, 0, 2 * Math.PI
        );
        this.ctx.fill();
        
        // Player health bar
        const healthPercent = this.player.health / this.player.maxHealth;
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillRect(playerScreenX, playerScreenY - 5, (this.tileSize - 2) * healthPercent, 3);
        
        // Update UI
        this.updateStats();
        this.updateInventory();
        
        // Update status
        const statusElement = document.getElementById('status');
        let newStatusText;
        if (this.victory) {
            newStatusText = "Victory! Click to respawn with new power!";
        } else if (this.gameOver) {
            newStatusText = "Game Over - Press R to restart";
        } else {
            newStatusText = `Level: ${this.currentLevel} | Turn: ${this.turn} | Enemies: ${this.enemies.length} | Items: ${this.items.length} | Projectiles: ${this.projectiles.length}`;
        }
        
        if (statusElement.textContent !== newStatusText) {
            statusElement.textContent = newStatusText;
            statusElement.style.color = this.victory ? "#4CAF50" : this.gameOver ? "#ff6b6b" : "#87ceeb";
        }
    }
    
    restart() {
        // Store current inventory for respawn
        const currentInventory = [...this.player.inventory];
        const currentItemCounts = {...this.player.itemCounts};
        
        this.currentLevel = 1;
        this.player = {
            x: 1,
            y: 1,
            health: 1000,
            maxHealth: 1000,
            level: 1,
            xp: 0,
            attack: 15,
            defense: 5,
            inventory: [],
            activeEffects: {},
            damageMultiplier: 1,
            hpMultiplier: 1,
            projectileSize: 1,
            maxProjectileSize: 3,
            missChance: 0,
            viewRange: 8,
            ultCooldown: 0,
            itemCounts: {},
            hasSuperStatus: false
        };
        
        // Retain victory powers
        this.slimeTrail = [];
        this.lightningCooldown = 0;
        
        // Victory powers are preserved (hasSlimeTrail and hasLightningPower remain unchanged)
        
        // Retain half of the items from previous life
        if (currentInventory.length > 0) {
            const itemsToRetain = Math.ceil(currentInventory.length / 2);
            const shuffledInventory = [...currentInventory].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < itemsToRetain; i++) {
                const item = shuffledInventory[i];
                this.player.inventory.push(item);
                
                // Update item counts
                if (!this.player.itemCounts[item.type]) {
                    this.player.itemCounts[item.type] = 0;
                }
                this.player.itemCounts[item.type]++;
                
                // Reapply item effects
                this.applyItemEffect(item);
            }
            
            this.addMessage(`Respawned with ${itemsToRetain} items from your previous life!`, "success");
        }
        
        this.enemies = [];
        this.items = [];
        this.doors = [];
        this.projectiles = [];
        this.messages = [];
        this.gameOver = false;
        this.turn = 0;
        
        // Reset stats but preserve necromancer kills
        const necromancerKills = this.stats.necromancerKills;
        this.stats = {
            totalDamage: 0,
            enemiesKilled: 0,
            itemsFound: 0,
            levelsCompleted: 0,
            necromancerKills: necromancerKills
        };
        
        this.generateMap();
        this.addMessage("New game started! Good luck!", "info");
        this.render();
        
        // Update restart button
        const restartBtn = document.getElementById('restartBtn');
        restartBtn.textContent = 'Respawn';
        restartBtn.style.backgroundColor = '#4CAF50';
    }
    
    renderDeathScreen() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load and display slimeend.jpg
        const deathImage = new Image();
        deathImage.onload = () => {
            const scaleX = this.canvas.width / deathImage.width;
            const scaleY = this.canvas.height / deathImage.height;
            const scale = Math.min(scaleX, scaleY);
            const scaledWidth = deathImage.width * scale;
            const scaledHeight = deathImage.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = (this.canvas.height - scaledHeight) / 2;
            this.ctx.drawImage(deathImage, x, y, scaledWidth, scaledHeight);
        };
        deathImage.src = 'slimeend.jpg';
    }
    
    showVictoryScreen() {
        this.victory = true;
        
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Load and display kingblob.jpg
        const victoryImage = new Image();
        victoryImage.onload = () => {
            const scaleX = this.canvas.width / victoryImage.width;
            const scaleY = this.canvas.height / victoryImage.height;
            const scale = Math.min(scaleX, scaleY);
            const scaledWidth = victoryImage.width * scale;
            const scaledHeight = victoryImage.height * scale;
            const x = (this.canvas.width - scaledWidth) / 2;
            const y = (this.canvas.height - scaledHeight) / 2;
            this.ctx.drawImage(victoryImage, x, y, scaledWidth, scaledHeight);
            
            // Add respawn button
            this.ctx.fillStyle = '#4CAF50';
            this.ctx.fillRect(this.canvas.width / 2 - 150, this.canvas.height - 100, 300, 60);
            this.ctx.fillStyle = '#000';
            this.ctx.font = 'bold 24px "Courier New", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("RESPAWN WITH NEW POWER", this.canvas.width / 2, this.canvas.height - 65);
        };
        victoryImage.src = 'kingblob.jpg';
        
        // Add click listener for respawn button
        const handleVictoryClick = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (x >= this.canvas.width / 2 - 150 && x <= this.canvas.width / 2 + 150 &&
                y >= this.canvas.height - 100 && y <= this.canvas.height - 40) {
                this.respawnWithNewPower();
                document.removeEventListener('click', handleVictoryClick);
            }
        };
        document.addEventListener('click', handleVictoryClick);
    }
    
    respawnWithNewPower() {
        // Increase slime trail duration with each victory
        this.slimeTrailDuration = Math.min(10, 3 + this.stats.necromancerKills);
        this.addMessage(`Slime trail duration increased to ${this.slimeTrailDuration} turns!`, "success");
        
        // Grant new power based on necromancer kills
        if (this.stats.necromancerKills === 1 && !this.hasLightningPower) {
            this.hasLightningPower = true;
            this.addMessage("You gain the Lightning Power! Periodic lightning strikes kill nearby enemies!", "success");
        } else {
            this.addMessage("Your slime trail grows stronger with each victory!", "info");
        }
        
        // Reset victory flag and restart game with all items retained
        this.victory = false;
        this.restart();
    }
    
    updateLightningPower() {
        if (!this.hasLightningPower) return;
        
        this.lightningCooldown++;
        if (this.lightningCooldown >= 100) { // Every 100 turns (faster for testing)
            this.lightningCooldown = 0;
            this.castLightning();
        }
        
        // Debug: Show lightning cooldown every 20 turns
        if (this.lightningCooldown % 20 === 0 && this.lightningCooldown > 0) {
            this.addMessage(`Lightning power charging: ${this.lightningCooldown}/100`, "info");
        }
    }
    
    castLightning() {
        // Kill all enemies within 5 tiles of player
        const nearbyEnemies = this.enemies.filter(enemy => {
            const distance = Math.abs(enemy.x - this.player.x) + Math.abs(enemy.y - this.player.y);
            return distance <= 5;
        });
        
        if (nearbyEnemies.length > 0) {
            this.addMessage("⚡ LIGHTNING STRIKE! ⚡", "success");
            nearbyEnemies.forEach(enemy => {
                this.enemies = this.enemies.filter(e => e !== enemy);
                this.player.xp += enemy.xpValue;
                this.stats.enemiesKilled++;
                this.addMessage(`Lightning destroyed ${enemy.type} level ${enemy.level}!`, "success");
            });
        }
    }
    

    
    drawPixelArtDeathScene() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 - 50;
        const scale = 3; // Scale factor for the pixel art
        
        // Draw dark brown brick background
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(centerX - 100 * scale, centerY - 80 * scale, 200 * scale, 160 * scale);
        
        // Draw brick pattern
        this.ctx.fillStyle = '#654321';
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 10; x++) {
                this.ctx.fillRect(
                    centerX - 100 * scale + x * 20 * scale,
                    centerY - 80 * scale + y * 20 * scale,
                    18 * scale, 18 * scale
                );
            }
        }
        
        // Draw Grim Reaper (center)
        this.drawGrimReaper(centerX, centerY, scale);
        
        // Draw skeletons
        this.drawSkeleton(centerX - 60 * scale, centerY, scale, 'left'); // Leftmost skeleton
        this.drawSkeleton(centerX - 30 * scale, centerY, scale, 'scythe'); // Scythe skeleton
        this.drawSkeleton(centerX + 30 * scale, centerY, scale, 'mirror'); // Mirror skeleton
        this.drawSkeleton(centerX + 60 * scale, centerY, scale, 'right'); // Rightmost skeleton
    }
    
    drawGrimReaper(x, y, scale) {
        // Dark robe
        this.ctx.fillStyle = '#2F2F2F';
        this.ctx.fillRect(x - 8 * scale, y - 20 * scale, 16 * scale, 40 * scale);
        
        // Hood
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.fillRect(x - 10 * scale, y - 25 * scale, 20 * scale, 10 * scale);
        
        // Skull head
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 6 * scale, y - 20 * scale, 12 * scale, 8 * scale);
        
        // Eye sockets
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - 4 * scale, y - 18 * scale, 2 * scale, 2 * scale);
        this.ctx.fillRect(x + 2 * scale, y - 18 * scale, 2 * scale, 2 * scale);
        
        // Arms outstretched
        this.ctx.fillStyle = '#2F2F2F';
        this.ctx.fillRect(x - 15 * scale, y - 10 * scale, 6 * scale, 12 * scale); // Left arm
        this.ctx.fillRect(x + 9 * scale, y - 10 * scale, 6 * scale, 12 * scale); // Right arm
        
        // Skeletal hands
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 18 * scale, y - 12 * scale, 4 * scale, 4 * scale); // Left hand
        this.ctx.fillRect(x + 14 * scale, y - 12 * scale, 4 * scale, 4 * scale); // Right hand
    }
    
    drawSkeleton(x, y, scale, pose) {
        // Skeleton body (light beige)
        this.ctx.fillStyle = '#F5F5DC';
        this.ctx.fillRect(x - 4 * scale, y - 8 * scale, 8 * scale, 16 * scale);
        
        // Skull head
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x - 3 * scale, y - 12 * scale, 6 * scale, 6 * scale);
        
        // Eye sockets
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x - 2 * scale, y - 10 * scale, 1 * scale, 1 * scale);
        this.ctx.fillRect(x + 1 * scale, y - 10 * scale, 1 * scale, 1 * scale);
        
        // Arms based on pose
        this.ctx.fillStyle = '#F5F5DC';
        if (pose === 'left') {
            // Left skeleton - left arm raised
            this.ctx.fillRect(x - 8 * scale, y - 6 * scale, 4 * scale, 8 * scale); // Raised left arm
            this.ctx.fillRect(x + 4 * scale, y - 4 * scale, 4 * scale, 6 * scale); // Right arm
        } else if (pose === 'scythe') {
            // Scythe skeleton - holding scythe
            this.ctx.fillRect(x - 6 * scale, y - 6 * scale, 4 * scale, 6 * scale); // Left arm
            this.ctx.fillRect(x + 4 * scale, y - 8 * scale, 4 * scale, 8 * scale); // Right arm holding scythe
            
            // Draw scythe
            this.ctx.fillStyle = '#8B4513'; // Brown handle
            this.ctx.fillRect(x + 6 * scale, y - 6 * scale, 2 * scale, 12 * scale);
            this.ctx.fillStyle = '#87CEEB'; // Light blue blade
            this.ctx.fillRect(x + 8 * scale, y - 8 * scale, 6 * scale, 2 * scale);
        } else if (pose === 'mirror') {
            // Mirror skeleton - mimicking reaper pose
            this.ctx.fillRect(x - 8 * scale, y - 6 * scale, 4 * scale, 6 * scale); // Left arm
            this.ctx.fillRect(x + 4 * scale, y - 6 * scale, 4 * scale, 6 * scale); // Right arm
        } else if (pose === 'right') {
            // Right skeleton - right arm raised
            this.ctx.fillRect(x - 6 * scale, y - 4 * scale, 4 * scale, 6 * scale); // Left arm
            this.ctx.fillRect(x + 4 * scale, y - 6 * scale, 4 * scale, 8 * scale); // Raised right arm
        }
    }
    
    showItemDetail(item) {
        const statsPanel = document.getElementById('stats-panel');
        const itemDetail = document.getElementById('item-detail');
        const itemName = document.getElementById('item-detail-name');
        const itemContent = document.getElementById('item-detail-content');
        
        // Hide stats panel and show item detail
        statsPanel.style.display = 'none';
        itemDetail.style.display = 'flex';
        
        // Set item name
        itemName.textContent = item.name;
        
        // Clear previous content
        itemContent.innerHTML = '';
        
        // Get item stats and description
        const itemStats = this.getItemStats(item.type);
        const itemDescription = this.getItemDescription(item.type);
        
        // Add stats
        Object.entries(itemStats).forEach(([stat, value]) => {
            if (value !== 0) {
                const statDiv = document.createElement('div');
                statDiv.className = 'item-detail-stat';
                statDiv.innerHTML = `
                    <span class="item-detail-stat-label">${stat}:</span>
                    <span class="item-detail-stat-value">+${value}</span>
                `;
                itemContent.appendChild(statDiv);
            }
        });
        
        // Add description
        const descDiv = document.createElement('div');
        descDiv.className = 'item-detail-description';
        descDiv.textContent = itemDescription;
        itemContent.appendChild(descDiv);
        
        // Add close button functionality
        const closeBtn = document.getElementById('item-detail-close');
        closeBtn.onclick = () => {
            statsPanel.style.display = 'flex';
            itemDetail.style.display = 'none';
        };
    }
    
    getItemStats(itemType) {
        const stats = {
            'Attack': 0,
            'Defense': 0,
            'Health': 0,
            'Damage': 0
        };
        
        switch(itemType) {
            case 'health_potion':
                stats['Health'] = 100;
                break;
            case 'sword':
                stats['Attack'] = 15;
                break;
            case 'shield':
                stats['Defense'] = 10;
                break;
            case 'scroll':
                stats['Attack'] = 8;
                stats['Defense'] = 5;
                break;
            case 'magic_sword':
                stats['Attack'] = 20;
                break;
            case 'dragon_armor':
                stats['Defense'] = 15;
                stats['Health'] = 50;
                break;
            case 'healing_scroll':
                stats['Health'] = 100;
                break;
            case 'strength_potion':
                stats['Attack'] = 25;
                break;
            case 'defense_potion':
                stats['Defense'] = 20;
                break;
            case 'fire_scroll':
                stats['Attack'] = 30;
                break;
            case 'ice_scroll':
                stats['Defense'] = 25;
                break;
            case 'lightning_scroll':
                stats['Attack'] = 35;
                break;
            case 'poison_dagger':
                stats['Attack'] = 15;
                break;
            case 'life_steal_sword':
                stats['Attack'] = 20;
                stats['Health'] = 40;
                break;
            case 'teleport_scroll':
                break;
            case 'regeneration_potion':
                stats['Health'] = 200;
                break;
            case 'berserker_potion':
                stats['Attack'] = 40;
                stats['Defense'] = -10;
                break;
            case 'divine_shield':
                stats['Defense'] = 30;
                stats['Health'] = 100;
                break;
            case 'vampire_blade':
                stats['Attack'] = 25;
                stats['Health'] = 60;
                break;
            case 'frost_sword':
                stats['Attack'] = 20;
                stats['Defense'] = 15;
                break;
            case 'thunder_hammer':
                stats['Attack'] = 35;
                break;
            case 'shadow_cloak':
                stats['Defense'] = 25;
                break;
            case 'phoenix_feather':
                stats['Attack'] = 40;
                stats['Defense'] = 25;
                stats['Health'] = 200;
                break;
            case 'fireball_spell':
            case 'ice_spell':
            case 'lightning_spell':
            case 'poison_spell':
            case 'death_spell':
                stats['Damage'] = this.getProjectileDamage(itemType);
                break;
            case 'wooden_bow':
            case 'iron_bow':
            case 'magic_bow':
            case 'dragon_bow':
            case 'legendary_bow':
                stats['Damage'] = this.getProjectileDamage(itemType);
                break;
            case 'iron_dagger':
            case 'poison_dagger_thrown':
                stats['Damage'] = this.getProjectileDamage(itemType);
                break;
            // New powerful items
            case 'excalibur':
                stats['Attack'] = 50;
                stats['Damage'] = '150% Multiplier';
                break;
            case 'storm_hammer':
                stats['Attack'] = 40;
                stats['Damage'] = '130% Multiplier';
                break;
            case 'void_blade':
                stats['Attack'] = 45;
                stats['Damage'] = '140% Multiplier';
                break;
            case 'thunder_staff':
                stats['Attack'] = 30;
                stats['Damage'] = 60;
                stats['Size'] = '150% Projectiles';
                break;
            case 'frost_staff':
                stats['Attack'] = 25;
                stats['Damage'] = 55;
                stats['Size'] = '140% Projectiles';
                break;
            case 'fire_staff':
                stats['Attack'] = 35;
                stats['Damage'] = 65;
                stats['Size'] = '160% Projectiles';
                break;
            case 'dragon_scale_armor':
                stats['Defense'] = 40;
                stats['Health'] = 200;
                stats['HP'] = '115% Multiplier';
                break;
            case 'phoenix_armor':
                stats['Defense'] = 35;
                stats['Health'] = 150;
                stats['HP'] = '115% Multiplier';
                break;
            case 'void_armor':
                stats['Defense'] = 45;
                stats['Health'] = 250;
                stats['HP'] = '115% Multiplier';
                break;
            case 'titan_armor':
                stats['Defense'] = 50;
                stats['Health'] = 300;
                stats['HP'] = '115% Multiplier';
                break;
            case 'celestial_armor':
                stats['Defense'] = 60;
                stats['Health'] = 400;
                stats['HP'] = '115% Multiplier';
                break;
            case 'damage_ring':
                stats['Attack'] = 20;
                stats['Damage'] = '110% Multiplier';
                break;
            case 'power_ring':
                stats['Attack'] = 25;
                stats['Damage'] = '115% Multiplier';
                break;
            case 'giant_staff':
                stats['Attack'] = 30;
                stats['Damage'] = 90;
                stats['Size'] = '200% Projectiles';
                break;
            case 'mega_bow':
                stats['Attack'] = 35;
                stats['Damage'] = 85;
                stats['Size'] = '180% Projectiles';
                break;
            case 'death_blade':
                stats['Attack'] = 60;
                stats['Damage'] = '200% Multiplier';
                break;
            case 'miss_chance_armor':
                stats['Defense'] = 30;
                stats['Health'] = 100;
                stats['Dodge'] = '20% Miss Chance';
                break;
            case 'dodge_armor':
                stats['Defense'] = 25;
                stats['Health'] = 80;
                stats['Dodge'] = '15% Miss Chance';
                break;
            case 'evasion_armor':
                stats['Defense'] = 35;
                stats['Health'] = 120;
                stats['Dodge'] = '25% Miss Chance';
                break;
            case 'phantom_armor':
                stats['Defense'] = 40;
                stats['Health'] = 150;
                stats['Dodge'] = '30% Miss Chance';
                break;
            case 'shadow_armor':
                stats['Defense'] = 45;
                stats['Health'] = 180;
                stats['Dodge'] = '35% Miss Chance';
                break;
            case 'view_ring':
                stats['View Range'] = '+2 tiles';
                break;
            case 'eagle_eye':
                stats['View Range'] = '+3 tiles';
                break;
            case 'telescope':
                stats['View Range'] = '+4 tiles';
                break;
            case 'crystal_ball':
                stats['View Range'] = '+5 tiles';
                break;
            case 'ult_scroll':
                stats['Ultimate'] = 'Ready';
                break;
        }
        
        return stats;
    }
    
    getItemDescription(itemType) {
        const descriptions = {
            'health_potion': 'Restores 100 health points. Essential for survival in the dungeon.',
            'sword': 'A basic iron sword that increases your attack power by 15.',
            'shield': 'A wooden shield that provides 10 points of defense.',
            'scroll': 'A magical scroll that enhances both attack and defense.',
            'magic_sword': 'A sword imbued with magical energy, greatly increasing attack power.',
            'dragon_armor': 'Legendary armor made from dragon scales. Provides excellent protection.',
            'healing_scroll': 'A scroll that fully restores your health.',
            'strength_potion': 'A powerful potion that significantly increases your attack strength.',
            'defense_potion': 'A potion that toughens your skin, providing excellent defense.',
            'fire_scroll': 'A scroll that grants you the power of fire magic.',
            'ice_scroll': 'A scroll that grants you the power of ice magic for protection.',
            'lightning_scroll': 'A scroll that grants you the power of lightning magic.',
            'poison_dagger': 'A dagger coated with deadly poison.',
            'life_steal_sword': 'A cursed sword that drains life from your enemies.',
            'teleport_scroll': 'A scroll that allows you to teleport to a random location.',
            'regeneration_potion': 'A powerful potion that rapidly heals your wounds.',
            'berserker_potion': 'A dangerous potion that greatly increases attack but reduces defense.',
            'divine_shield': 'A shield blessed by the gods, providing divine protection.',
            'vampire_blade': 'A blade that drains life from enemies to heal you.',
            'frost_sword': 'A sword that freezes your enemies with each strike.',
            'thunder_hammer': 'A massive hammer that strikes with the power of thunder.',
            'shadow_cloak': 'A cloak that conceals you in shadows.',
            'phoenix_feather': 'A legendary item that grants immortality and great power.',
            'fireball_spell': 'A spell that launches fireballs at enemies automatically.',
            'ice_spell': 'A spell that launches ice projectiles at enemies.',
            'lightning_spell': 'A spell that launches lightning bolts at enemies.',
            'poison_spell': 'A spell that launches poison projectiles at enemies.',
            'death_spell': 'A powerful spell that launches deadly projectiles.',
            'wooden_bow': 'A basic bow that automatically fires arrows at enemies.',
            'iron_bow': 'A sturdy iron bow with improved damage.',
            'magic_bow': 'A bow imbued with magical energy.',
            'dragon_bow': 'A powerful bow made from dragon materials.',
            'legendary_bow': 'The most powerful bow in existence.',
            'iron_dagger': 'A thrown dagger that automatically targets enemies.',
            'poison_dagger_thrown': 'A poisoned dagger that automatically targets enemies.',
            // New powerful items
            'excalibur': 'The legendary sword of kings. Multiplies all damage by 150% and grants immense power.',
            'storm_hammer': 'A hammer that channels the power of storms. Multiplies damage by 130%.',
            'void_blade': 'A blade that cuts through reality itself. Multiplies damage by 140%.',
            'thunder_staff': 'A staff that amplifies projectiles by 150% and channels lightning magic.',
            'frost_staff': 'A staff that creates massive ice projectiles 140% larger than normal.',
            'fire_staff': 'A staff that creates massive fireballs 160% larger than normal.',
            'dragon_scale_armor': 'Legendary armor made from dragon scales. Increases HP by 115% and provides massive defense.',
            'phoenix_armor': 'Armor forged from phoenix feathers. Increases HP by 115% and grants fiery protection.',
            'void_armor': 'Armor that absorbs damage from the void. Increases HP by 115% and provides excellent defense.',
            'titan_armor': 'Armor that makes you nearly invincible. Increases HP by 115% and provides massive defense.',
            'celestial_armor': 'Divine armor blessed by the gods. Increases HP by 115% and provides legendary protection.',
            'damage_ring': 'A ring that increases all damage by 10%.',
            'power_ring': 'A ring that increases all damage by 15%.',
            'giant_staff': 'A staff that creates massive projectiles 200% larger than normal.',
            'mega_bow': 'A bow that fires giant arrows 180% larger than normal.',
            'death_blade': 'A blade that multiplies all damage by 200%. The ultimate weapon of destruction.',
            'miss_chance_armor': 'Armor that gives enemies a 20% chance to miss their attacks.',
            'dodge_armor': 'Armor that gives enemies a 15% chance to miss their attacks.',
            'evasion_armor': 'Armor that gives enemies a 25% chance to miss their attacks.',
            'phantom_armor': 'Armor that gives enemies a 30% chance to miss their attacks.',
            'shadow_armor': 'Armor that gives enemies a 35% chance to miss their attacks.',
            'view_ring': 'A ring that increases your view range by 2 tiles.',
            'eagle_eye': 'Grants exceptional vision, increasing view range by 3 tiles.',
            'telescope': 'A powerful telescope that reveals distant enemies, +4 view range.',
            'crystal_ball': 'A mystical crystal ball that shows all secrets, +5 view range.',
            'ult_scroll': 'A scroll that grants the power to destroy all visible enemies. Press U to use!'
        };
        
        return descriptions[itemType] || 'A mysterious item with unknown properties.';
    }
    
    drawMonsterIcon(enemy, x, y) {
        const size = this.tileSize - 4;
        const centerX = x + this.tileSize / 2;
        const centerY = y + this.tileSize / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Rotate based on direction
        switch(enemy.direction) {
            case 'up':
                this.ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                this.ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                this.ctx.rotate(Math.PI);
                break;
            case 'right':
                // No rotation needed
                break;
        }
        
        // Draw monster based on type
        switch(enemy.type) {
            case 'goblin':
                this.drawGoblin(x - centerX, y - centerY, size);
                break;
            case 'orc':
                this.drawOrc(x - centerX, y - centerY, size);
                break;
            case 'troll':
                this.drawTroll(x - centerX, y - centerY, size);
                break;
            case 'dragon':
                this.drawDragon(x - centerX, y - centerY, size);
                break;
            case 'skeleton':
                this.drawSkeleton(x - centerX, y - centerY, size);
                break;
            case 'zombie':
                this.drawZombie(x - centerX, y - centerY, size);
                break;
            case 'ghost':
                this.drawGhost(x - centerX, y - centerY, size);
                break;
            case 'demon':
                this.drawDemon(x - centerX, y - centerY, size);
                break;
            case 'vampire':
                this.drawVampire(x - centerX, y - centerY, size);
                break;
            case 'lich':
                this.drawLich(x - centerX, y - centerY, size);
                break;
            case 'beholder':
                this.drawBeholder(x - centerX, y - centerY, size);
                break;
            case 'golem':
                this.drawGolem(x - centerX, y - centerY, size);
                break;
            case 'hydra':
                this.drawHydra(x - centerX, y - centerY, size);
                break;
            case 'kraken':
                this.drawKraken(x - centerX, y - centerY, size);
                break;
            case 'mimic':
                this.drawMimic(x - centerX, y - centerY, size);
                break;
            case 'phoenix':
                this.drawPhoenix(x - centerX, y - centerY, size);
                break;
            case 'slime':
                this.drawSlime(x - centerX, y - centerY, size);
                break;
            case 'specter':
                this.drawSpecter(x - centerX, y - centerY, size);
                break;
            case 'wraith':
                this.drawWraith(x - centerX, y - centerY, size);
                break;
            case 'wyvern':
                this.drawWyvern(x - centerX, y - centerY, size);
                break;
            case 'necromancer':
                this.drawNecromancer(x - centerX, y - centerY, size);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawGoblin(x, y, size) {
        // Green goblin with pointy ears
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Pointy ears
        this.ctx.fillStyle = '#388E3C';
        this.ctx.fillRect(x + 4, y, 3, 4);
        this.ctx.fillRect(x + size - 7, y, 3, 4);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawOrc(x, y, size) {
        // Dark green orc with tusks
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Tusks
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 4, y + 4, 2, 3);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 3);
        
        // Red eyes
        this.ctx.fillStyle = '#F44336';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawTroll(x, y, size) {
        // Gray troll with big features
        this.ctx.fillStyle = '#757575';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Big nose
        this.ctx.fillStyle = '#424242';
        this.ctx.fillRect(x + 6, y + 4, 4, 3);
        
        // Small eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 5, y + 6, 1, 1);
        this.ctx.fillRect(x + size - 6, y + 6, 1, 1);
    }
    
    drawDragon(x, y, size) {
        // Red dragon with wings
        this.ctx.fillStyle = '#D32F2F';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Wings
        this.ctx.fillStyle = '#B71C1C';
        this.ctx.fillRect(x, y + 4, 2, 4);
        this.ctx.fillRect(x + size - 2, y + 4, 2, 4);
        
        // Horns
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 4, y, 2, 3);
        this.ctx.fillRect(x + size - 6, y, 2, 3);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawSkeleton(x, y, size) {
        // White skeleton
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Black eye sockets
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 5, y + 5, 2, 2);
        this.ctx.fillRect(x + size - 7, y + 5, 2, 2);
        
        // Mouth
        this.ctx.fillRect(x + 6, y + 8, 2, 1);
    }
    
    drawZombie(x, y, size) {
        // Green zombie with rotting flesh
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Darker patches
        this.ctx.fillStyle = '#689F38';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 2);
        
        // Dead eyes
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawGhost(x, y, size) {
        // Transparent ghost
        this.ctx.fillStyle = 'rgba(200, 200, 255, 0.7)';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // White eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
        
        // Wavy bottom
        this.ctx.fillStyle = 'rgba(200, 200, 255, 0.5)';
        this.ctx.fillRect(x + 2, y + size - 2, size - 4, 2);
    }
    
    drawDemon(x, y, size) {
        // Dark red demon with horns
        this.ctx.fillStyle = '#B71C1C';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Horns
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 3, y, 2, 3);
        this.ctx.fillRect(x + size - 5, y, 2, 3);
        
        // Fiery eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawVampire(x, y, size) {
        // Pale vampire with fangs
        this.ctx.fillStyle = '#F5F5F5';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Fangs
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 5, y + 4, 1, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 1, 2);
        
        // Red eyes
        this.ctx.fillStyle = '#D32F2F';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawLich(x, y, size) {
        // Dark purple lich with crown
        this.ctx.fillStyle = '#673AB7';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Crown
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 3, y, size - 6, 2);
        this.ctx.fillRect(x + 4, y - 1, 2, 2);
        this.ctx.fillRect(x + size - 6, y - 1, 2, 2);
        
        // Glowing eyes
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawLargeMonsterIcon(enemy, x, y) {
        const size = this.tileSize * 2 - 4;
        const centerX = x + this.tileSize;
        const centerY = y + this.tileSize;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Rotate based on direction
        switch(enemy.direction) {
            case 'up':
                this.ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                this.ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                this.ctx.rotate(Math.PI);
                break;
            case 'right':
                break;
        }
        
        // Draw large monster based on type
        switch(enemy.type) {
            case 'dragon':
                this.drawLargeDragon(x - centerX, y - centerY, size);
                break;
            case 'lich':
                this.drawLargeLich(x - centerX, y - centerY, size);
                break;
            case 'beholder':
                this.drawLargeBeholder(x - centerX, y - centerY, size);
                break;
            case 'golem':
                this.drawLargeGolem(x - centerX, y - centerY, size);
                break;
            case 'phoenix':
                this.drawLargePhoenix(x - centerX, y - centerY, size);
                break;
            case 'wyvern':
                this.drawLargeWyvern(x - centerX, y - centerY, size);
                break;
            case 'necromancer':
                this.drawLargeNecromancer(x - centerX, y - centerY, size);
                break;
        }
        
        this.ctx.restore();
    }
    
    drawHugeMonsterIcon(enemy, x, y) {
        const size = this.tileSize * 3 - 4;
        const centerX = x + this.tileSize * 1.5;
        const centerY = y + this.tileSize * 1.5;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Rotate based on direction
        switch(enemy.direction) {
            case 'up':
                this.ctx.rotate(-Math.PI / 2);
                break;
            case 'down':
                this.ctx.rotate(Math.PI / 2);
                break;
            case 'left':
                this.ctx.rotate(Math.PI);
                break;
            case 'right':
                break;
        }
        
        // Draw huge monster based on type
        switch(enemy.type) {
            case 'hydra':
                this.drawHugeHydra(x - centerX, y - centerY, size);
                break;
            case 'kraken':
                this.drawHugeKraken(x - centerX, y - centerY, size);
                break;
        }
        
        this.ctx.restore();
    }
    
    // New monster drawing methods
    drawBeholder(x, y, size) {
        // Purple beholder with many eyes
        this.ctx.fillStyle = '#9C27B0';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Multiple eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 2);
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
        this.ctx.fillRect(x + 4, y + 8, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 8, 2, 2);
    }
    
    drawGolem(x, y, size) {
        // Gray stone golem
        this.ctx.fillStyle = '#607D8B';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Stone texture
        this.ctx.fillStyle = '#455A64';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 2);
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 8, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 8, 2, 2);
    }
    
    drawHydra(x, y, size) {
        // Green hydra with multiple heads
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Multiple heads
        this.ctx.fillStyle = '#388E3C';
        this.ctx.fillRect(x + 4, y, 3, 4);
        this.ctx.fillRect(x + size - 7, y, 3, 4);
        this.ctx.fillRect(x + 6, y, 3, 4);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 5, y + 2, 1, 1);
        this.ctx.fillRect(x + size - 6, y + 2, 1, 1);
        this.ctx.fillRect(x + 7, y + 2, 1, 1);
    }
    
    drawKraken(x, y, size) {
        // Dark blue kraken with tentacles
        this.ctx.fillStyle = '#1976D2';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Tentacles
        this.ctx.fillStyle = '#0D47A1';
        this.ctx.fillRect(x, y + 4, 2, 3);
        this.ctx.fillRect(x + size - 2, y + 4, 2, 3);
        this.ctx.fillRect(x + 2, y + size - 2, 3, 2);
        this.ctx.fillRect(x + size - 5, y + size - 2, 3, 2);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
    }
    
    drawMimic(x, y, size) {
        // Brown mimic chest
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Chest details
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x + 4, y + 4, size - 8, 2);
        this.ctx.fillRect(x + 4, y + size - 6, size - 8, 2);
        
        // Lock
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        
        // Teeth
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 4, y + size - 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + size - 4, 2, 2);
    }
    
    drawPhoenix(x, y, size) {
        // Orange phoenix with fire
        this.ctx.fillStyle = '#FF9800';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Wings
        this.ctx.fillStyle = '#F57C00';
        this.ctx.fillRect(x, y + 4, 2, 4);
        this.ctx.fillRect(x + size - 2, y + 4, 2, 4);
        
        // Fire effect
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(x + 4, y, 2, 3);
        this.ctx.fillRect(x + size - 6, y, 2, 3);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
    }
    
    drawSlime(x, y, size) {
        // Green slime with bubbles
        this.ctx.fillStyle = '#8BC34A';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Bubbles
        this.ctx.fillStyle = '#689F38';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 2);
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        
        // Eye
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 6, y + 8, 2, 2);
    }
    
    drawSpecter(x, y, size) {
        // White specter with mist
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Mist trails
        this.ctx.fillStyle = 'rgba(200, 200, 255, 0.6)';
        this.ctx.fillRect(x, y + 4, 2, 3);
        this.ctx.fillRect(x + size - 2, y + 4, 2, 3);
        
        // Eyes
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawWraith(x, y, size) {
        // Dark purple wraith
        this.ctx.fillStyle = '#673AB7';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Darker details
        this.ctx.fillStyle = '#512DA8';
        this.ctx.fillRect(x + 4, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 6, y + 4, 2, 2);
        
        // Glowing eyes
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
    }
    
    drawWyvern(x, y, size) {
        // Brown wyvern with wings
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Wings
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x, y + 4, 2, 4);
        this.ctx.fillRect(x + size - 2, y + 4, 2, 4);
        
        // Horns
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 4, y, 2, 3);
        this.ctx.fillRect(x + size - 6, y, 2, 3);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
    }
    
    // Large monster drawing methods
    drawLargeDragon(x, y, size) {
        this.ctx.fillStyle = '#D32F2F';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Wings
        this.ctx.fillStyle = '#B71C1C';
        this.ctx.fillRect(x, y + 8, 4, 8);
        this.ctx.fillRect(x + size - 4, y + 8, 4, 8);
        
        // Horns
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 8, y, 4, 6);
        this.ctx.fillRect(x + size - 12, y, 4, 6);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 10, y + 10, 3, 3);
        this.ctx.fillRect(x + size - 13, y + 10, 3, 3);
    }
    
    drawLargeLich(x, y, size) {
        this.ctx.fillStyle = '#673AB7';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Crown
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 6, y, size - 12, 4);
        this.ctx.fillRect(x + 8, y - 2, 4, 4);
        this.ctx.fillRect(x + size - 12, y - 2, 4, 4);
        
        // Eyes
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.fillRect(x + 10, y + 10, 3, 3);
        this.ctx.fillRect(x + size - 13, y + 10, 3, 3);
    }
    
    drawLargeBeholder(x, y, size) {
        this.ctx.fillStyle = '#9C27B0';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Many eyes
        this.ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 6; i++) {
            this.ctx.fillRect(x + 8 + (i % 3) * 4, y + 8 + Math.floor(i / 3) * 4, 2, 2);
        }
    }
    
    drawLargeGolem(x, y, size) {
        this.ctx.fillStyle = '#607D8B';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Stone texture
        this.ctx.fillStyle = '#455A64';
        for (let i = 0; i < 4; i++) {
            this.ctx.fillRect(x + 8 + (i % 2) * 4, y + 8 + Math.floor(i / 2) * 4, 2, 2);
        }
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 10, y + 12, 3, 3);
        this.ctx.fillRect(x + size - 13, y + 12, 3, 3);
    }
    
    drawLargePhoenix(x, y, size) {
        this.ctx.fillStyle = '#FF9800';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Wings
        this.ctx.fillStyle = '#F57C00';
        this.ctx.fillRect(x, y + 8, 4, 8);
        this.ctx.fillRect(x + size - 4, y + 8, 4, 8);
        
        // Fire
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(x + 8, y, 4, 6);
        this.ctx.fillRect(x + size - 12, y, 4, 6);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 10, y + 10, 3, 3);
    }
    
    drawLargeWyvern(x, y, size) {
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Wings
        this.ctx.fillStyle = '#5D4037';
        this.ctx.fillRect(x, y + 8, 4, 8);
        this.ctx.fillRect(x + size - 4, y + 8, 4, 8);
        
        // Horns
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 8, y, 4, 6);
        this.ctx.fillRect(x + size - 12, y, 4, 6);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 10, y + 10, 3, 3);
    }
    
    drawLargeNecromancer(x, y, size) {
        // Dark purple necromancer with crown
        this.ctx.fillStyle = '#4A148C';
        this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);
        
        // Crown
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 8, y, size - 16, 6);
        this.ctx.fillRect(x + 10, y - 3, 4, 6);
        this.ctx.fillRect(x + size - 14, y - 3, 4, 6);
        
        // Eyes (glowing)
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.fillRect(x + 10, y + 10, 3, 3);
        this.ctx.fillRect(x + size - 13, y + 10, 3, 3);
        
        // Staff
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x + size - 4, y + 8, 3, size - 16);
        
        // Staff orb
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(x + size - 8, y + size - 8, 6, 6);
    }
    
    // Huge monster drawing methods
    drawHugeHydra(x, y, size) {
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        
        // Multiple heads
        this.ctx.fillStyle = '#388E3C';
        this.ctx.fillRect(x + 8, y, 6, 8);
        this.ctx.fillRect(x + size - 14, y, 6, 8);
        this.ctx.fillRect(x + 12, y, 6, 8);
        
        // Eyes
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 10, y + 4, 2, 2);
        this.ctx.fillRect(x + size - 12, y + 4, 2, 2);
        this.ctx.fillRect(x + 14, y + 4, 2, 2);
    }
    
    drawHugeKraken(x, y, size) {
        this.ctx.fillStyle = '#1976D2';
        this.ctx.fillRect(x + 6, y + 6, size - 12, size - 12);
        
        // Tentacles
        this.ctx.fillStyle = '#0D47A1';
        this.ctx.fillRect(x, y + 8, 4, 6);
        this.ctx.fillRect(x + size - 4, y + 8, 4, 6);
        this.ctx.fillRect(x + 4, y + size - 4, 6, 4);
        this.ctx.fillRect(x + size - 10, y + size - 4, 6, 4);
        
        // Eye
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 12, y + 12, 4, 4);
    }
    
    drawNecromancer(x, y, size) {
        // Dark purple necromancer with crown
        this.ctx.fillStyle = '#4A148C';
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        // Crown
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x + 4, y, size - 8, 3);
        this.ctx.fillRect(x + 6, y - 2, 3, 4);
        this.ctx.fillRect(x + size - 9, y - 2, 3, 4);
        
        // Eyes (glowing)
        this.ctx.fillStyle = '#00BCD4';
        this.ctx.fillRect(x + 6, y + 6, 2, 2);
        this.ctx.fillRect(x + size - 8, y + 6, 2, 2);
        
        // Staff
        this.ctx.fillStyle = '#8D6E63';
        this.ctx.fillRect(x + size - 2, y + 4, 2, size - 8);
        
        // Staff orb
        this.ctx.fillStyle = '#FF5722';
        this.ctx.fillRect(x + size - 4, y + size - 4, 4, 4);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new RoguelikeGame();
}); 