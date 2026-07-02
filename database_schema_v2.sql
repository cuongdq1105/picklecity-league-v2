CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  gender TEXT,
  level_group TEXT DEFAULT 'UNRANKED',
  level_score INTEGER DEFAULT 1000,
  ranking_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ACTIVE',
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  team_size INTEGER NOT NULL,
  random_partner INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  event_type_id INTEGER NOT NULL,
  fee INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 40,
  start_time TEXT,
  register_deadline TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  first_prize INTEGER DEFAULT 0,
  second_prize INTEGER DEFAULT 0,
  third_prize INTEGER DEFAULT 0,
  third_prize_count INTEGER DEFAULT 2,
  sponsor_note TEXT,
  FOREIGN KEY(event_type_id) REFERENCES event_types(id)
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tournament_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  payment_amount INTEGER DEFAULT 150000,
  payment_status TEXT DEFAULT 'PENDING',
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(tournament_id) REFERENCES tournaments(id),
  FOREIGN KEY(member_id) REFERENCES members(id)
);
