-- Story engine: scripted comic scenes unlocked by chores, paced by a release calendar.
--
-- Two clocks drive the story:
--   * Global release frontier: a scene becomes "released" once
--     release_offset_days have passed since the series start_date. Nobody can
--     read past the released frontier, so the story cannot be binged.
--   * Per-member playback pointer (story_progress.unlocked_index): each chore a
--     member completes advances their pointer by one scene, capped at the
--     released frontier. Members can fall behind and catch up, but never run ahead.

CREATE TABLE IF NOT EXISTS story_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  total_scenes INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'complete')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS story_scenes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  series_id INTEGER NOT NULL,
  scene_order INTEGER NOT NULL,
  release_offset_days INTEGER NOT NULL DEFAULT 0 CHECK (release_offset_days >= 0),
  title TEXT NOT NULL,
  setting TEXT NOT NULL DEFAULT '',
  script TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (series_id, scene_order),
  FOREIGN KEY (series_id) REFERENCES story_series(id)
);

CREATE INDEX IF NOT EXISTS idx_story_scenes_series
  ON story_scenes(series_id, scene_order);

CREATE TABLE IF NOT EXISTS story_progress (
  member_id INTEGER NOT NULL,
  series_id INTEGER NOT NULL,
  unlocked_index INTEGER NOT NULL DEFAULT 1 CHECK (unlocked_index >= 0),
  last_unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, series_id),
  FOREIGN KEY (member_id) REFERENCES family_members(id),
  FOREIGN KEY (series_id) REFERENCES story_series(id)
);

-- Stub season: a short "Reef of Thrones" prologue to prove the engine.
INSERT OR IGNORE INTO story_series (id, slug, title, total_scenes, start_date, status)
VALUES (1, 'reef-of-thrones', 'Reef of Thrones', 5, date('now'), 'active');

INSERT OR IGNORE INTO story_scenes (series_id, scene_order, release_offset_days, title, setting, script) VALUES
 (1, 1, 0, 'The Reef Without a Throne', 'The Great Reef', '{"narration":"Long ago the Coral Throne sat empty, and every house of the reef wanted it.","beats":[{"speaker":"clownfish","name":"Pip","position":"left","expression":"content","line":"Someone must keep the reef warm and fair. That someone should be honest."},{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"Honest fish finish last, little clownfish. The throne goes to the bold."},{"speaker":"starfish","name":"Stella","position":"center","expression":"content","line":"When the water runs cold, honesty and boldness will both be tested."}]}'),
 (1, 2, 1, 'Goldscale Makes a Move', 'The Bright Shallows', '{"narration":"House Goldscale gathered its allies in the bright shallows.","beats":[{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"By the next tide, the reef will call me queen. Who will stand with me?"},{"speaker":"pufferfish","name":"Otto","position":"left","expression":"content","line":"I will stand near you. Mostly so I am not standing against you."},{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"Wise little puffer. Stay inflated. We have work to do."}]}'),
 (1, 3, 2, 'The Cold Current', 'The Outer Rocks', '{"narration":"At the edge of the reef, old Mr. Pinch felt the water turn strange.","beats":[{"speaker":"crab","name":"Mr. Pinch","position":"center","expression":"hungry","line":"The current beyond the rocks is cold. Colder than it has any right to be."},{"speaker":"clownfish","name":"Pip","position":"left","expression":"content","line":"The bugs live out there. Maybe they stirred something up."},{"speaker":"crab","name":"Mr. Pinch","position":"center","expression":"hungry","line":"The bugs are the least of what is coming. Mark my claw."}]}'),
 (1, 4, 3, 'An Egg No Fish Laid', 'The Quiet Grotto', '{"narration":"In a hidden grotto, Coral guarded a small grey egg that no fish had laid.","beats":[{"speaker":"seahorse","name":"Coral","position":"center","expression":"content","line":"It is warm to the touch, even now. As if it is waiting for something."},{"speaker":"starfish","name":"Stella","position":"left","expression":"content","line":"The prophecy speaks of an egg not laid by any fish, and the one who turns the tide."},{"speaker":"seahorse","name":"Coral","position":"center","expression":"happy","line":"Then I will keep it safe until the reef needs it most."}]}'),
 (1, 5, 5, 'Beyond the Reef', 'The Dark Water', '{"narration":"Far past the reef, in water no fish dared enter, something pale began to move.","beats":[{"speaker":"clam","name":"The Clam","position":"center","expression":"sad","line":"..."},{"speaker":"starfish","name":"Stella","position":"left","expression":"hungry","line":"It is waking. The cold, the squabbles, the egg. It all begins now."},{"speaker":"clownfish","name":"Pip","position":"right","expression":"content","line":"Then we had better stop fighting each other. While we still can."}]}');
