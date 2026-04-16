/**
 * Tile Explorer - Game Logic
 */

class AudioManager {
    constructor() {
        this.enabled = localStorage.getItem('audioMuted') !== 'true';
        this.audioCtx = null;
        this.bgmAudio = null;
    }

    init() {
        if (this.audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.playBGM();
        } catch (e) {
            console.log("Web Audio API not supported", e);
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('audioMuted', !this.enabled);
        if (!this.enabled) {
            if (this.bgmAudio) this.bgmAudio.pause();
        } else {
            this.init();
            this.playBGM();
        }
        return this.enabled;
    }

    playTone(freq, type, duration) {
        if (!this.enabled || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    // Sistem Pintar: Akan memutar web-synth bawaan karena MP3 belum ditaruh oleh Anda.
    playClick() { this.playTone(600, 'sine', 0.1); }
    playPop() { this.playTone(800, 'triangle', 0.15); }
    playMatch() { 
        this.playTone(400, 'sine', 0.1); 
        setTimeout(() => this.playTone(600, 'sine', 0.1), 100);
        setTimeout(() => this.playTone(800, 'sine', 0.2), 200);
    }
    playWin() {
        this.playTone(300, 'square', 0.2); 
        setTimeout(() => this.playTone(500, 'square', 0.2), 200);
        setTimeout(() => this.playTone(700, 'square', 0.4), 400);
    }
    playLose() {
        this.playTone(300, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(200, 'sawtooth', 0.5), 300);
    }

    playBGM() {
        if (!this.enabled) return;
        
        if (!this.bgmAudio) {
            this.bgmAudio = new Audio('assets/audio/bgm.mp3');
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = 0.3;
        }
        
        // Catch dom exception jika file belum ada.
        this.bgmAudio.play().catch(e => {
            console.log("BGM belum diletakkan di assets/audio/bgm.mp3");
        });
    }
}

class TileExplorer {
    constructor() {
        this.audio = new AudioManager();
        this.boardEl = document.getElementById('game-board');
        this.trayEl = document.getElementById('tile-tray');
        this.scoreEl = document.getElementById('score-value');
        this.levelEl = document.getElementById('level-value');

        // DEBUG CONSOLE
        this.debugEl = document.createElement('div');
        this.debugEl.style.position = 'absolute';
        this.debugEl.style.top = '0';
        this.debugEl.style.right = '0';
        this.debugEl.style.backgroundColor = 'rgba(0,0,0,0.8)';
        this.debugEl.style.color = 'lime';
        this.debugEl.style.padding = '10px';
        this.debugEl.style.zIndex = '9999';
        this.debugEl.style.fontSize = '12px';
        this.debugEl.style.pointerEvents = 'none';
        this.debugEl.style.display = 'none';
        document.body.appendChild(this.debugEl);

        this.log("Game Constructed");

        this.level = 1;
        this.score = 0;
        this.tray = []; // Array of Tile objects
        this.maxTraySize = 7;
        this.tiles = []; // All tiles on board

        // Tile types (using images now)
        this.tileTypes = ['assets/images/1.png', 'assets/images/2.png', 'assets/images/3.png', 'assets/images/4.png', 'assets/images/5.png', 'assets/images/6.png', 'assets/images/7.png', 'assets/images/8.png'];

        this.preloadAssets();
        this.initUI();
    }

    log(msg) {
        this.debugEl.innerHTML += `> ${msg}<br>`;
        console.log(msg);
    }

    preloadAssets() {
        const assetsToLoad = [
            ...this.tileTypes,
            'assets/images/banner.png',
            'assets/images/SETTING.png',
            'assets/images/UNDO.png',
            'assets/images/HINT.png',
            'assets/images/SHUFFLE.png'
        ];

        let loadedCount = 0;
        const totalAssets = assetsToLoad.length;
        const loadingBarFill = document.getElementById('loading-bar-fill');
        const loadingText = document.getElementById('loading-text');
        const loadingScreen = document.getElementById('loading-screen');

        const assetLoaded = () => {
            loadedCount++;
            const percent = Math.floor((loadedCount / totalAssets) * 100);
            
            // Update UI
            if (loadingBarFill) loadingBarFill.style.width = percent + '%';
            if (loadingText) loadingText.textContent = `Loading Assets... ${percent}%`;

            if (loadedCount >= totalAssets) {
                // Sembunyikan layar loading sesudah stat progress nyentuh 100%
                setTimeout(() => {
                    if (loadingScreen) {
                        loadingScreen.style.opacity = '0';
                        setTimeout(() => loadingScreen.remove(), 500); // Pangkas memori DOM
                    }
                }, 400); 
            }
        };

        // Buat instance objek Gambar agar browser dipaksa men-download sekarang juga
        assetsToLoad.forEach(src => {
            const img = new Image();
            img.onload = assetLoaded;
            img.onerror = assetLoaded; // Tetap divalidasi progressnya jika misal gagal connect image satu biji, supaya gak stuck forever.
            img.src = src;
        });
    }

    initUI() {
        // ... (Existing implementation kept by context matching, but re-adding for safety if needed, 
        // wait, I only need to ADD listeners. simpler to just replace logic in startLevel or constructor?)
        // Let's replace initUI entirely to be safe and clean.

        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('home-screen').classList.add('hidden');
            document.getElementById('game-ui').classList.remove('hidden');
            document.getElementById('modal-overlay').classList.add('hidden');
            this.audio.init();
            this.audio.playClick();
            this.startLevel(1);
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.hideModals();
            this.startLevel(this.level);
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.hideModals();
            this.startLevel(this.level + 1);
        });

        // Settings Buttons
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.showModal('settings-modal');
        });

        // Settings Menu Buttons
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.hideModals();
        });

        // Toggle Audio Button
        const audioBtn = document.getElementById('audio-toggle-btn');
        if (audioBtn) {
            audioBtn.textContent = 'Sound & Music: ' + (this.audio.enabled ? 'ON' : 'OFF');
            audioBtn.addEventListener('click', () => {
                const isEnabled = this.audio.toggle();
                audioBtn.textContent = 'Sound & Music: ' + (isEnabled ? 'ON' : 'OFF');
            });
        }

        document.getElementById('restart-settings-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.hideModals();
            this.startLevel(this.level);
        });

        document.getElementById('quit-btn').addEventListener('click', () => {
            this.audio.playClick();
            this.hideModals();
            document.getElementById('game-ui').classList.add('hidden');
            document.getElementById('home-screen').classList.remove('hidden');

            // Bersihkan sisa board dan skor jika kembali ke layar utama
            this.boardEl.innerHTML = '';
            this.trayEl.innerHTML = '';
            this.score = 0;
            this.scoreEl.textContent = this.score;
        });

        // Power-ups
        document.getElementById('btn-undo').addEventListener('click', () => { this.audio.playClick(); this.useUndo(); });
        document.getElementById('btn-shuffle').addEventListener('click', () => { this.audio.playClick(); this.useShuffle(); });
        document.getElementById('btn-hint').addEventListener('click', () => { this.audio.playClick(); this.useHint(); });

        this.initTutorial();

        // Default theme
        this.setTheme('beach');
    }

    initTutorial() {
        this.tutorialSteps = [
            { text: "Tap 3 matching tiles on the board to move them into the tray and clear them.", img: "assets/images/1.png" },
            { text: "Watch out! If the bottom tray is completely filled with 7 blocks without any matches, GAME OVER!", img: "assets/images/2.png" },
            { text: "Stuck? Tap the Undo, Hint, or Shuffle buttons at the bottom right to help out! Good luck!", img: "assets/images/SHUFFLE.png" }
        ];
        this.currentTutorialStep = 0;

        document.getElementById('tutorial-btn').addEventListener('click', () => {
            this.currentTutorialStep = 0;
            this.showTutorialStep();
        });

        document.getElementById('tutorial-next-btn').addEventListener('click', () => {
            this.currentTutorialStep++;
            if (this.currentTutorialStep >= this.tutorialSteps.length) {
                this.hideModals();
                localStorage.setItem('tutorialSeen', 'true');
            } else {
                this.showTutorialStep();
            }
        });

        // Tampilkan otomatis saat pertama main jika pemain belum pernah melihatnya
        if (!localStorage.getItem('tutorialSeen')) {
            setTimeout(() => {
                this.currentTutorialStep = 0;
                this.showTutorialStep();
            }, 300);
        }
    }

    showTutorialStep() {
        const step = this.tutorialSteps[this.currentTutorialStep];
        document.getElementById('tutorial-text').textContent = step.text;
        
        const iconEl = document.getElementById('tutorial-icon');
        iconEl.src = step.img;
        iconEl.style.display = 'inline-block';

        const dots = document.querySelectorAll('#tutorial-modal .dot');
        dots.forEach((dot, index) => {
            if (index === this.currentTutorialStep) {
                dot.classList.add('active');
                dot.style.background = '#FF8E53';
                dot.style.transform = 'scale(1.3)';
            } else {
                dot.classList.remove('active');
                dot.style.background = '#ccc';
                dot.style.transform = 'scale(1)';
            }
        });

        const btn = document.getElementById('tutorial-next-btn');
        if (this.currentTutorialStep === this.tutorialSteps.length - 1) {
            btn.textContent = "LET'S PLAY!";
        } else {
            btn.textContent = "NEXT";
        }

        this.showModal('tutorial-modal');
    }

    setTheme(themeName) {
        document.body.className = themeName; // Sets class to 'beach' or 'rainforest'
    }

    startLevel(level) {
        try {
            this.log(`Starting Level ${level}`);
            this.level = level;
            this.levelEl.textContent = this.level;
            this.tray = [];
            this.tiles = [];
            this.history = []; // For Undo
            this.boardEl.innerHTML = '';
            this.trayEl.innerHTML = '';
            this.score = 0;
            this.scoreEl.textContent = this.score;

            this.generateLevelData();

            this.renderBoard();
            this.renderTray();
            this.updateTileStates();
        } catch (e) {
            this.log("ERROR: " + e.message);
            console.error(e);
        }
    }

    generateLevelData() {
        const shapes = {
            'level_1': [
                // Sangat simpel, cuma bintang kecil di tengah (5 kartu + disesuaikan jadi 6)
                { r: 3, c: 3, z: 0 }, { r: 2, c: 3, z: 0 }, { r: 4, c: 3, z: 0 }, { r: 3, c: 2, z: 0 }, { r: 3, c: 4, z: 0 }
            ],
            'level_2': [
                // Persegi bolong dengan satu topi (9 kartu)
                { r: 2, c: 2, z: 0 }, { r: 2, c: 3, z: 0 }, { r: 2, c: 4, z: 0 },
                { r: 3, c: 2, z: 0 },                       { r: 3, c: 4, z: 0 },
                { r: 4, c: 2, z: 0 }, { r: 4, c: 3, z: 0 }, { r: 4, c: 4, z: 0 },
                { r: 3, c: 3, z: 1 }
            ],
            'level_3': [
                // X Shape lama
                { r: 0, c: 0, z: 0 }, { r: 0, c: 6, z: 0 },
                { r: 1, c: 1, z: 0 }, { r: 1, c: 5, z: 0 },
                { r: 2, c: 2, z: 0 }, { r: 2, c: 4, z: 0 },
                { r: 3, c: 3, z: 0 },
                { r: 4, c: 2, z: 0 }, { r: 4, c: 4, z: 0 },
                { r: 5, c: 1, z: 0 }, { r: 5, c: 5, z: 0 },
                { r: 6, c: 0, z: 0 }, { r: 6, c: 6, z: 0 },
                { r: 3, c: 3, z: 1 }, { r: 3, c: 3, z: 2 }, { r: 3, c: 3, z: 3 }
            ],
            'level_4': [
                // Frame lama
                { r: 0, c: 0, z: 0 }, { r: 0, c: 1, z: 0 }, { r: 0, c: 2, z: 0 }, { r: 0, c: 3, z: 0 }, { r: 0, c: 4, z: 0 },
                { r: 1, c: 0, z: 0 }, { r: 1, c: 4, z: 0 },
                { r: 2, c: 0, z: 0 }, { r: 2, c: 4, z: 0 },
                { r: 3, c: 0, z: 0 }, { r: 3, c: 4, z: 0 },
                { r: 4, c: 0, z: 0 }, { r: 4, c: 1, z: 0 }, { r: 4, c: 2, z: 0 }, { r: 4, c: 3, z: 0 }, { r: 4, c: 4, z: 0 },
                { r: 0, c: 0, z: 1 }, { r: 0, c: 4, z: 1 }, { r: 4, c: 0, z: 1 }, { r: 4, c: 4, z: 1 }
            ],
            'level_5': [
                // Heart shape lama (Paling kompleks, banyak tumpukan)
                { r: 1, c: 1, z: 0 }, { r: 1, c: 2, z: 0 }, { r: 1, c: 4, z: 0 }, { r: 1, c: 5, z: 0 },
                { r: 2, c: 0, z: 0 }, { r: 2, c: 1, z: 0 }, { r: 2, c: 2, z: 0 }, { r: 2, c: 3, z: 0 }, { r: 2, c: 4, z: 0 }, { r: 2, c: 5, z: 0 }, { r: 2, c: 6, z: 0 },
                { r: 3, c: 0, z: 0 }, { r: 3, c: 1, z: 0 }, { r: 3, c: 2, z: 0 }, { r: 3, c: 3, z: 0 }, { r: 3, c: 4, z: 0 }, { r: 3, c: 5, z: 0 }, { r: 3, c: 6, z: 0 },
                { r: 4, c: 1, z: 0 }, { r: 4, c: 2, z: 0 }, { r: 4, c: 3, z: 0 }, { r: 4, c: 4, z: 0 }, { r: 4, c: 5, z: 0 },
                { r: 5, c: 2, z: 0 }, { r: 5, c: 3, z: 0 }, { r: 5, c: 4, z: 0 },
                { r: 6, c: 3, z: 0 },
                { r: 2, c: 1, z: 1 }, { r: 2, c: 5, z: 1 },
                { r: 3, c: 2, z: 1 }, { r: 3, c: 3, z: 1 }, { r: 3, c: 4, z: 1 },
                { r: 4, c: 3, z: 1 }
            ]
        };

        // Pick shape incrementally based on level
        const progression = ['level_1', 'level_2', 'level_3', 'level_4', 'level_5'];
        const targetKey = progression[Math.min(this.level - 1, progression.length - 1)];
        let selectedShape = shapes[targetKey];

        // We need to multiply the shape to get enough tiles
        // 3 layers of the same shape, or just repeat the shape definition with offset Z
        // For simplicity, let's just clone the shape positions multiple times to ensure we have enough tiles
        // OR better: Just use the shape as "slots" and fill them 

        // Let's create a deep copy of positions
        let positions = JSON.parse(JSON.stringify(selectedShape));

        // Tambahkan kartu loose (pecahan sebar) secara bertahap berdasarkan Level!
        // Semakin beranjak naik level, kartu taburan samping akan makin tebal supaya seru.
        let shapeGridMap = new Set(positions.map(p => `${p.r},${p.c}`));
        
        let scatterChance = 0;
        if (this.level === 2) scatterChance = 0.2;
        if (this.level === 3) scatterChance = 0.5;
        if (this.level >= 4)  scatterChance = 0.8; // Level sangat tinggi = hampir penuh

        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if ((r + c) % 2 === 0 && !shapeGridMap.has(`${r},${c}`)) {
                    if (Math.random() < scatterChance) {
                        positions.push({ r: r, c: c, z: 0 });
                    }
                }
            }
        }

        // Auto-scale untuk tumpukan: Jika level sudah melebihi 5, tumpuk ulang bentuk layer z=0 nya makin ke atas!
        if (this.level > 5) {
            const extraLayer = positions.filter(p => p.z === 0).map(p => ({ ...p, z: p.z + 2 })); 
            positions = positions.concat(extraLayer);
        }

        // Pastikan jumlah ubin / tile genap bisa dibagi 3 per jenis (agar winnable)
        const remainder = positions.length % 3;
        if (remainder !== 0) {
            // Lengkapi sedikit demi 3 (daripada disunat)
            for(let i=0; i < (3 - remainder); i++) {
                 // Tambahkan random di z teratas bebas
                 positions.push({ r: 3, c: 3, z: 4 + i });
            }
        }

        const totalTiles = positions.length;

        // Assign types: Minimalisir jenis buah di Level awal demi kemudahan menyisir combo!
        const initialTypeCount = this.level === 1 ? 2 : 3;
        const numTypes = Math.min(initialTypeCount + Math.floor(this.level / 2), this.tileTypes.length);
        let deck = [];
        for (let i = 0; i < totalTiles / 3; i++) {
            const type = this.tileTypes[i % numTypes];
            deck.push(type, type, type);
        }
        deck.sort(() => Math.random() - 0.5);

        const gridW = 7;
        const gridH = 7;

        // Gunakan pengali dari tile-size agar bentuk tumpukan game konsisten di berbagai rasio layar
        const spacingX = 0.82; 
        const spacingY = 0.82; 

        this.tiles = positions.map((pos, index) => {
            // Posisi offset relatif terhadap pusat board (50%, 50%)
            const offsetX = (pos.c - (gridW - 1) / 2) * spacingX;
            const offsetY = (pos.r - (gridH - 1) / 2) * spacingY;

            return {
                id: index,
                type: deck[index],

                offsetX: offsetX,
                offsetY: offsetY, // Centered sempurna ke y-axis tengah layar

                z: pos.z,
                computedZ: pos.z * 1000 + pos.r * 10 + pos.c,
                active: true,
                el: null
            };
        });
        this.tiles.sort((a, b) => a.computedZ - b.computedZ);
    }

    renderBoard() {
        // DEBUG: Alert tile count
        // alert(`Rendering ${this.tiles.length} tiles`); 

        if (this.tiles.length === 0) {
            console.error("No tiles to render!");
            // Fallback generation if empty
            this.tiles = [
                { id: 0, type: '🍎', offsetX: -1, offsetY: 0, z: 0, computedZ: 0, active: true },
                { id: 1, type: '🍎', offsetX: 0, offsetY: 0, z: 0, computedZ: 1, active: true },
                { id: 2, type: '🍎', offsetX: 1, offsetY: 0, z: 0, computedZ: 2, active: true }
            ];
        }

        this.tiles.forEach(tile => {
            const el = document.createElement('div');
            el.classList.add('tile');
            el.innerHTML = `<img src="${tile.type}" class="tile-img" alt="fruit">`;
            el.style.left = `calc(50% + (var(--tile-size) * ${tile.offsetX}))`;
            el.style.top = `calc(50% + (var(--tile-size) * ${tile.offsetY}))`;
            el.style.zIndex = tile.computedZ;

            // Add subtle shadow based on height
            const shadow = (tile.z + 1) * 2;
            el.style.boxShadow = `${shadow}px ${shadow}px ${shadow * 2}px rgba(0,0,0,0.2)`;

            el.addEventListener('click', () => this.handleTileClick(tile));

            this.boardEl.appendChild(el);
            tile.el = el;
        });
    }

    updateTileStates() {
        // Cache rects for performance and accuracy
        this.tiles.forEach(t => {
            if (t.active && t.el) {
                t.rect = t.el.getBoundingClientRect();
            }
        });

        this.tiles.forEach(tile => {
            if (!tile.active) return;

            const blocked = this.isBlocked(tile);
            if (blocked) {
                tile.el.classList.add('disabled');
            } else {
                tile.el.classList.remove('disabled');
            }
        });
    }

    isBlocked(tile) {
        if (!tile.rect) return false;
        const r1 = tile.rect;
        
        // Buat batas hit-box (margin) dinamis sesuai ukuran rasio fisiknya, jangan pakai pixel statis 
        // yang bakal merusak deteksi tabrakan di layar handphone yang resolusinya mengecil.
        const margin = r1.width * 0.05; 

        return this.tiles.some(other => {
            if (!other.active || other === tile || !other.rect) return false;

            // Only tiles rendered in front can block this tile
            if (other.computedZ <= tile.computedZ) return false;

            const r2 = other.rect;

            // Fast bounding box overlap check
            return (r1.left + margin < r2.right - margin) &&
                (r1.right - margin > r2.left + margin) &&
                (r1.top + margin < r2.bottom - margin) &&
                (r1.bottom - margin > r2.top + margin);
        });
    }

    // POWER UPS
    useUndo() {
        if (this.history.length === 0) return;

        const lastMove = this.history.pop();
        // lastMove = { tileObj: ... }

        // Remove from tray
        const trayIndex = this.tray.indexOf(lastMove);
        if (trayIndex > -1) {
            this.tray.splice(trayIndex, 1);
        }

        // Add back to board
        lastMove.active = true;

        // We need to re-append the element to board
        // It's easiest to just re-render everything or just append this one
        // Let's re-append
        this.boardEl.appendChild(lastMove.el);
        this.renderTray();
        this.updateTileStates();

        // Reset animation classes if any
        lastMove.el.classList.remove('moving');
    }

    useShuffle() {
        // Only shuffle tiles existing on board
        const activeTiles = this.tiles.filter(t => t.active);

        // Get current types
        const types = activeTiles.map(t => t.type);

        // Shuffle types
        types.sort(() => Math.random() - 0.5);

        // Reassign
        activeTiles.forEach((t, i) => {
            t.type = types[i];
            if (t.el) {
                t.el.querySelector('img').src = t.type;
            }
        });
    }

    useHint() {
        // Find a matching pair in tray and board?
        // Or just find 3 matching available on board

        // Simple Hint: Find a tile on board that matches something in tray
        const availableTiles = this.tiles.filter(t => t.active && !this.isBlocked(t));

        let target = null;

        // Priority 1: Completes a set of 3
        // Check if tray has 2 of same kind
        const trayCounts = {};
        this.tray.forEach(t => trayCounts[t.type] = (trayCounts[t.type] || 0) + 1);

        for (const type in trayCounts) {
            if (trayCounts[type] === 2) {
                target = availableTiles.find(t => t.type === type);
                if (target) break;
            }
        }

        // Priority 2: Matches 1 in tray
        if (!target) {
            for (const type in trayCounts) {
                if (trayCounts[type] === 1) {
                    target = availableTiles.find(t => t.type === type);
                    if (target) break;
                }
            }
        }

        // Priority 3: Just any pair on board
        if (!target) {
            // Find pair in available
            // ... naive implementation
            target = availableTiles[0];
        }

        if (target) {
            target.el.classList.add('selected'); // We added CSS for this!
            setTimeout(() => target.el.classList.remove('selected'), 1000);
        }
    }

    handleTileClick(tile) {
        if (this.tray.length >= this.maxTraySize) return;
        if (!tile.active) return;
        if (this.isBlocked(tile)) return; // Double check

        this.audio.init(); 
        this.audio.playPop();
        this.moveTileToTray(tile);
    }

    moveTileToTray(tile) {
        // Save history
        this.history.push(tile);

        // Safety check
        if (this.tray.length >= this.maxTraySize) {
            console.warn("Attempted to move tile to full tray directly.");
            this.history.pop();
            return;
        }

        tile.active = false;

        // Visual Flying Animation
        const originalRect = tile.el.getBoundingClientRect();

        // Hide original immediately
        tile.el.remove();

        // Push actual data logic
        this.tray.push(tile);
        this.renderTray();

        // Find the newly rendered tile in the tray and hide it temporarily
        const traySlots = this.trayEl.querySelectorAll('.tile-slot');
        const targetSlot = traySlots[this.tray.length - 1];
        const targetTileInTray = targetSlot.querySelector('.in-tray');

        if (targetTileInTray) {
            targetTileInTray.style.opacity = '0'; // Hide real one until flying clone arrives

            // Create Flying Clone
            const clone = document.createElement('div');
            clone.className = 'tile';
            clone.style.position = 'fixed';
            clone.style.left = originalRect.left + 'px';
            clone.style.top = originalRect.top + 'px';
            clone.style.width = originalRect.width + 'px';
            clone.style.height = originalRect.height + 'px';
            clone.style.zIndex = '9999';
            clone.style.margin = '0'; // override CSS
            clone.style.transition = 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)';
            clone.innerHTML = `<img src="${tile.type}" class="tile-img" alt="fruit">`;

            document.body.appendChild(clone);

            // Force reflow
            clone.getBoundingClientRect();

            // Find target rect
            const targetRect = targetSlot.getBoundingClientRect();

            // Move clone
            clone.style.left = targetRect.left + 'px';
            clone.style.top = targetRect.top + 'px';
            clone.style.width = targetRect.width + 'px';
            clone.style.height = targetRect.height + 'px';
            clone.style.transform = 'translateY(-2px)';

            // Clean up
            setTimeout(() => {
                clone.remove();
                if (targetTileInTray) {
                    targetTileInTray.style.opacity = '1';
                }
            }, 250);
        }

        // Re-calculate blocked states for remaining tiles on board
        this.updateTileStates();

        this.checkMatches();
    }

    renderTray() {
        this.trayEl.innerHTML = '';

        // Draw empty slots based on maxTraySize
        for (let i = 0; i < this.maxTraySize; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = 'tile-slot';
            // We can attach the tile directly into the slot so it perfectly centers
            this.trayEl.appendChild(slotEl);
        }

        // Draw actually present tiles inside their corresponding slots
        const slots = this.trayEl.querySelectorAll('.tile-slot');
        this.tray.forEach((t, i) => {
            if (i < slots.length) {
                const el = document.createElement('div');
                el.className = 'tile in-tray';
                el.innerHTML = `<img src="${t.type}" class="tile-img" alt="fruit">`;
                slots[i].appendChild(el);
            }
        });
    }

    checkMatches() {
        // Check if there are 3 of the same type
        const counts = {};
        this.tray.forEach(t => {
            counts[t.type] = (counts[t.type] || 0) + 1;
        });

        let matchType = null;
        for (const type in counts) {
            if (counts[type] >= 3) {
                matchType = type;
                break;
            }
        }

        if (matchType) {
            const tilesToAnim = Array.from(this.trayEl.querySelectorAll('.in-tray')).filter(el => {
                const img = el.querySelector('img');
                const srcStr = img ? img.getAttribute('src') : '';
                return srcStr.includes(matchType);
            }).slice(0, 3); // Ambil tepat 3 buah

            if (tilesToAnim.length === 3) {
                const rect1 = tilesToAnim[0].getBoundingClientRect();
                const rect2 = tilesToAnim[1].getBoundingClientRect();
                const rect3 = tilesToAnim[2].getBoundingClientRect();

                // Hitung translasi agar tile pinggir bergeser ke tengah (menumpuk jadi 1 tumpukan piringan)
                const shift1X = rect2.left - rect1.left;
                const shift1Y = rect2.top - rect1.top;
                
                const shift3X = rect2.left - rect3.left;
                const shift3Y = rect2.top - rect3.top;

                // Terapkan variable CSS dinamis
                tilesToAnim[0].style.setProperty('--merge-x', `${shift1X}px`);
                tilesToAnim[0].style.setProperty('--merge-y', `${shift1Y}px`);
                
                tilesToAnim[1].style.setProperty('--merge-x', `0px`);
                tilesToAnim[1].style.setProperty('--merge-y', `0px`);

                tilesToAnim[2].style.setProperty('--merge-x', `${shift3X}px`);
                tilesToAnim[2].style.setProperty('--merge-y', `${shift3Y}px`);

                // Mulai mainkan animasi geser
                tilesToAnim.forEach(el => el.classList.add('merge-anim'));

                // Tembakkan partikel dan getaran tepat pas detik 30% dari animasi (0.15s) yaitu pas ketiganya menyatu!
                setTimeout(() => {
                    this.audio.playMatch();
                    this.createExplosion(rect2.left + rect2.width / 2, rect2.top + rect2.height / 2);
                    this.trayEl.classList.add('shake-anim');
                    
                    // Efek cahaya kilat
                    const glowEl = document.createElement('div');
                    glowEl.className = 'match-glow-fx';
                    glowEl.style.left = (rect2.left - this.trayEl.getBoundingClientRect().left + rect2.width / 2) + 'px';
                    glowEl.style.top = (rect2.top - this.trayEl.getBoundingClientRect().top + rect2.height / 2) + 'px';
                    this.trayEl.appendChild(glowEl);
                    setTimeout(() => { if (glowEl.parentNode) glowEl.remove(); }, 600);

                    const floater = document.createElement('div');
                    floater.className = 'floating-score';
                    floater.textContent = '+100';
                    this.trayEl.appendChild(floater);
                    setTimeout(() => { if (floater.parentNode) floater.remove(); }, 1000);
                }, 150);

                setTimeout(() => this.trayEl.classList.remove('shake-anim'), 550);
            }

            // Hapus tiles setelah animasi selesai (diperpanjang jadi 400ms biar animasinya utuh)
            setTimeout(() => {
                let removed = 0;
                this.tray = this.tray.filter(t => {
                    if (t.type === matchType && removed < 3) {
                        removed++;
                        return false;
                    }
                    return true;
                });

                this.score += 100;
                this.scoreEl.textContent = this.score;
                this.renderTray();
                this.checkWinCondition();
            }, 400); 
        } else {
            // If no match and tray full -> LOSE
            if (this.tray.length >= this.maxTraySize) {
                // Allow a small grace period or check if the LAST move caused a match (handled above)
                // If we are here, it means NO match was found.
                // But wait, the user might have just placed the 7th tile.
                // If that 7th tile didn't match, THEN it's game over.
                // We are in the 'else' block of match, so safe to call lose.
                this.checkLoseCondition();
            }
        }
    }

    checkWinCondition() {
        if (this.tiles.every(t => !t.active)) {
            this.audio.playWin();
            // Generate animated stars
            const starsContainer = document.getElementById('victory-stars');
            if (starsContainer) {
                starsContainer.innerHTML = ''; // clear previous
                for (let i = 0; i < 3; i++) {
                    const star = document.createElement('span');
                    star.className = 'star';
                    star.innerHTML = '★';
                    starsContainer.appendChild(star);

                    // Trigger reflow & add show class to initiate CSS animation
                    setTimeout(() => star.classList.add('show'), 150 * i);
                }
            }

            this.showModal('victory-modal');
        }
    }

    checkLoseCondition() {
        if (this.tray.length >= this.maxTraySize) {
            this.audio.playLose();
            this.showModal('game-over-modal');
        }
    }

    showModal(id) {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('hidden');
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    }

    hideModals() {
        document.getElementById('modal-overlay').classList.add('hidden');
    }

    createExplosion(x, y) {
        const particleCount = 15;
        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = x + 'px';
            p.style.top = y + 'px';
            
            // Tembakan acak memutar 360 derajat
            const angle = Math.random() * Math.PI * 2;
            const velocity = 50 + Math.random() * 80;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            
            p.style.setProperty('--tx', `${tx}px`);
            p.style.setProperty('--ty', `${ty}px`);
            
            // Warna warni confetti
            const colors = ['#FFD700', '#FF8E53', '#2ed573', '#ff4757', '#ffffff', '#74ebd5'];
            p.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            document.body.appendChild(p);
            
            setTimeout(() => {
                if (p.parentNode) p.remove();
            }, 800);
        }
    }
}

// Start Game
window.onload = () => {
    new TileExplorer();
};
