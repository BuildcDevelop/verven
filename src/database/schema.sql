-- ============================================================
-- DATABÁZOVÉ SCHÉMA PRO HERNÍ APLIKACI
-- ============================================================

-- Odstranění tabulek v případě, že už existují (pro development)
DROP TABLE IF EXISTS game_actions;
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS map_tiles;
DROP TABLE IF EXISTS provinces;
DROP TABLE IF EXISTS alliance_members;
DROP TABLE IF EXISTS alliances;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS game_settings;

-- ============================================================
-- TABULKA HERNÍCH NASTAVENÍ
-- ============================================================

CREATE TABLE game_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vložení základních nastavení
INSERT INTO game_settings (setting_key, setting_value, description) VALUES
('map_width', '30', 'Šířka herní mapy'),
('map_height', '30', 'Výška herní mapy'),
('max_players', '100', 'Maximální počet hráčů'),
('starting_veny', '1000', 'Počáteční množství herní měny'),
('spawn_zone_radius', '3', 'Poloměr spawn zón'),
('alliance_colors_enabled', 'true', 'Povolení aliančních barev');

-- ============================================================
-- TABULKA HRÁČŮ
-- ============================================================

CREATE TABLE players (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    alliance_id TEXT,
    color TEXT NOT NULL DEFAULT '#FF6B6B',
    veny INTEGER NOT NULL DEFAULT 1000,
    experience INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE SET NULL
);

-- Index pro rychlejší vyhledávání
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_alliance ON players(alliance_id);
CREATE INDEX idx_players_last_active ON players(last_active);

-- ============================================================
-- TABULKA ALIANCÍ
-- ============================================================

CREATE TABLE alliances (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL,
    leader_id TEXT NOT NULL,
    description TEXT,
    max_members INTEGER DEFAULT 50,
    is_open BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leader_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Index pro rychlejší vyhledávání
CREATE INDEX idx_alliances_leader ON alliances(leader_id);
CREATE INDEX idx_alliances_name ON alliances(name);

-- ============================================================
-- TABULKA ČLENŮ ALIANCÍ (pro lepší tracking)
-- ============================================================

CREATE TABLE alliance_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alliance_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    role TEXT DEFAULT 'member', -- member, officer, leader
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(alliance_id, player_id)
);

-- ============================================================
-- TABULKA DRŽAV
-- ============================================================

CREATE TABLE provinces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    alliance_id TEXT,
    color TEXT NOT NULL,
    center_x INTEGER NOT NULL,
    center_y INTEGER NOT NULL,
    population INTEGER NOT NULL DEFAULT 100,
    resources INTEGER NOT NULL DEFAULT 50,
    tax_rate REAL DEFAULT 0.1,
    happiness INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (alliance_id) REFERENCES alliances(id) ON DELETE SET NULL
);

-- Index pro rychlejší vyhledávání
CREATE INDEX idx_provinces_owner ON provinces(owner_id);
CREATE INDEX idx_provinces_alliance ON provinces(alliance_id);
CREATE INDEX idx_provinces_center ON provinces(center_x, center_y);

-- ============================================================
-- TABULKA POLÍČEK MAPY
-- ============================================================

CREATE TABLE map_tiles (
    id TEXT PRIMARY KEY,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    terrain_type TEXT NOT NULL CHECK (terrain_type IN ('plains', 'forest', 'mountain', 'water', 'desert', 'swamp')),
    owner_id TEXT,
    province_id TEXT,
    building_id TEXT,
    is_spawn_zone BOOLEAN DEFAULT false,
    movement_cost INTEGER DEFAULT 1,
    defensive_bonus INTEGER DEFAULT 0,
    resource_bonus INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE SET NULL,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL,
    FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
    UNIQUE(x, y)
);

-- Index pro rychlejší vyhledávání pozic
CREATE INDEX idx_map_tiles_position ON map_tiles(x, y);
CREATE INDEX idx_map_tiles_owner ON map_tiles(owner_id);
CREATE INDEX idx_map_tiles_province ON map_tiles(province_id);
CREATE INDEX idx_map_tiles_terrain ON map_tiles(terrain_type);
CREATE INDEX idx_map_tiles_spawn ON map_tiles(is_spawn_zone);

-- ============================================================
-- TABULKA BUDOV
-- ============================================================

CREATE TABLE buildings (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('town_hall', 'barracks', 'farm', 'mine', 'fortress', 'market')),
    name TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    owner_id TEXT NOT NULL,
    province_id TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    production_bonus INTEGER DEFAULT 0,
    construction_time INTEGER DEFAULT 0, -- sekundy do dokončení
    maintenance_cost INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

-- Index pro rychlejší vyhledávání
CREATE INDEX idx_buildings_position ON buildings(x, y);
CREATE INDEX idx_buildings_owner ON buildings(owner_id);
CREATE INDEX idx_buildings_province ON buildings(province_id);
CREATE INDEX idx_buildings_type ON buildings(type);

-- ============================================================
-- TABULKA JEDNOTEK
-- ============================================================

CREATE TABLE units (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('warrior', 'archer', 'cavalry', 'siege', 'scout')),
    name TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    owner_id TEXT NOT NULL,
    province_id TEXT NOT NULL,
    health INTEGER NOT NULL,
    max_health INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    movement INTEGER NOT NULL,
    max_movement INTEGER NOT NULL,
    experience INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    morale INTEGER DEFAULT 100,
    supply INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE CASCADE,
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

-- Index pro rychlejší vyhledávání
CREATE INDEX idx_units_position ON units(x, y);
CREATE INDEX idx_units_owner ON units(owner_id);
CREATE INDEX idx_units_province ON units(province_id);
CREATE INDEX idx_units_type ON units(type);

-- ============================================================
-- TABULKA HERNÍCH AKCÍ (pro audit trail)
-- ============================================================

CREATE TABLE game_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    player_id TEXT NOT NULL,
    target_id TEXT, -- ID cíle akce (jednotka, budova, etc.)
    from_x INTEGER,
    from_y INTEGER,
    to_x INTEGER,
    to_y INTEGER,
    data TEXT, -- JSON data pro složitější akce
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- Index pro rychlejší vyhledávání akcí
CREATE INDEX idx_game_actions_player ON game_actions(player_id);
CREATE INDEX idx_game_actions_type ON game_actions(action_type);
CREATE INDEX idx_game_actions_timestamp ON game_actions(timestamp);
CREATE INDEX idx_game_actions_target ON game_actions(target_id);

-- ============================================================
-- TRIGGERY PRO AUTOMATICKÉ AKTUALIZACE ČASOVÝCH RAZÍTEK
-- ============================================================

-- Trigger pro players
CREATE TRIGGER update_players_timestamp 
    AFTER UPDATE ON players
BEGIN
    UPDATE players SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pro alliances
CREATE TRIGGER update_alliances_timestamp 
    AFTER UPDATE ON alliances
BEGIN
    UPDATE alliances SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pro provinces
CREATE TRIGGER update_provinces_timestamp 
    AFTER UPDATE ON provinces
BEGIN
    UPDATE provinces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pro buildings
CREATE TRIGGER update_buildings_timestamp 
    AFTER UPDATE ON buildings
BEGIN
    UPDATE buildings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pro units
CREATE TRIGGER update_units_timestamp 
    AFTER UPDATE ON units
BEGIN
    UPDATE units SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger pro map_tiles
CREATE TRIGGER update_map_tiles_timestamp 
    AFTER UPDATE ON map_tiles
BEGIN
    UPDATE map_tiles SET last_updated = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================
-- VIEWS PRO ČASTĚJI POUŽÍVANÉ DOTAZY
-- ============================================================

-- View pro kompletní informace o hráčích s aliancemi
CREATE VIEW player_details AS
SELECT 
    p.*,
    a.name as alliance_name,
    a.color as alliance_color,
    (SELECT COUNT(*) FROM provinces WHERE owner_id = p.id) as province_count,
    (SELECT COUNT(*) FROM units WHERE owner_id = p.id) as unit_count
FROM players p
LEFT JOIN alliances a ON p.alliance_id = a.id;

-- View pro přehled provincií s vlastníky
CREATE VIEW province_overview AS
SELECT 
    pr.*,
    p.name as owner_name,
    a.name as alliance_name,
    (SELECT COUNT(*) FROM map_tiles WHERE province_id = pr.id) as tile_count,
    (SELECT COUNT(*) FROM buildings WHERE province_id = pr.id) as building_count
FROM provinces pr
JOIN players p ON pr.owner_id = p.id
LEFT JOIN alliances a ON pr.alliance_id = a.id;

-- View pro statistiky aliancí
CREATE VIEW alliance_stats AS
SELECT 
    a.*,
    COUNT(p.id) as member_count,
    SUM(p.veny) as total_wealth,
    COUNT(DISTINCT pr.id) as province_count
FROM alliances a
LEFT JOIN players p ON a.id = p.alliance_id
LEFT JOIN provinces pr ON a.id = pr.alliance_id
GROUP BY a.id;

-- ============================================================
-- BEZPEČNOSTNÍ OMEZENÍ A PRAVIDLA
-- ============================================================

-- Pravidlo: Hráč nemůže být vůdcem aliance, které není členem
CREATE TRIGGER check_alliance_leader 
    BEFORE UPDATE ON alliances
BEGIN
    SELECT CASE
        WHEN (SELECT alliance_id FROM players WHERE id = NEW.leader_id) != NEW.id
        THEN RAISE(ABORT, 'Leader must be a member of the alliance')
    END;
END;

-- Pravidlo: Provincie musí mít platného vlastníka
CREATE TRIGGER check_province_owner 
    BEFORE INSERT ON provinces
BEGIN
    SELECT CASE
        WHEN (SELECT id FROM players WHERE id = NEW.owner_id) IS NULL
        THEN RAISE(ABORT, 'Province owner must be a valid player')
    END;
END;

-- ============================================================
-- UKÁZKOVÉ HERNÍ KONSTANTY (pro reference)
-- ============================================================

/*
TERRAIN TYPES:
- plains: rychlý pohyb, střední obrana
- forest: pomalý pohyb, vysoká obrana
- mountain: velmi pomalý pohyb, velmi vysoká obrana  
- water: nepřekonatelné pro pozemní jednotky
- desert: střední pohyb, nízká obrana
- swamp: velmi pomalý pohyb, střední obrana

BUILDING TYPES:
- town_hall: hlavní budova provincie
- barracks: výroba jednotek
- farm: produkce jídla
- mine: produkce surovin
- fortress: obrana
- market: obchod a ekonomika

UNIT TYPES:
- warrior: základní pěchota
- archer: střelci na dálku
- cavalry: rychlá jízda
- siege: obléhací stroje
- scout: průzkum
*/