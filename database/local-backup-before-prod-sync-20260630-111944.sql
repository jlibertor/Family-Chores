PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial_schema.sql','2026-05-19 05:29:47');
INSERT INTO "d1_migrations" VALUES(2,'0002_convenience_and_status.sql','2026-05-19 05:52:28');
INSERT INTO "d1_migrations" VALUES(3,'0003_notes_and_exports.sql','2026-05-19 05:56:18');
INSERT INTO "d1_migrations" VALUES(4,'0004_assignment_model.sql','2026-05-19 06:30:09');
INSERT INTO "d1_migrations" VALUES(5,'0005_member_nicknames.sql','2026-06-03 00:36:34');
INSERT INTO "d1_migrations" VALUES(6,'0006_member_avatars.sql','2026-06-03 00:36:34');
INSERT INTO "d1_migrations" VALUES(7,'0007_weekday_weekend_frequencies.sql','2026-06-03 00:36:35');
INSERT INTO "d1_migrations" VALUES(8,'0008_earned_bugs.sql','2026-06-03 00:36:35');
INSERT INTO "d1_migrations" VALUES(9,'0009_earned_bug_removals.sql','2026-06-03 00:36:35');
INSERT INTO "d1_migrations" VALUES(10,'0010_aquarium.sql','2026-06-03 01:01:03');
INSERT INTO "d1_migrations" VALUES(11,'0011_aquarium_phase_2.sql','2026-06-03 01:40:53');
INSERT INTO "d1_migrations" VALUES(12,'0012_chore_feeds_aquarium.sql','2026-06-04 16:12:43');
INSERT INTO "d1_migrations" VALUES(13,'0013_aquarium_daily_food_consumption.sql','2026-06-18 03:08:48');
INSERT INTO "d1_migrations" VALUES(14,'0014_recency_mood.sql','2026-06-18 03:08:48');
INSERT INTO "d1_migrations" VALUES(15,'0015_aquarium_panic.sql','2026-06-18 03:08:48');
INSERT INTO "d1_migrations" VALUES(16,'0015_new_chores.sql','2026-06-18 03:08:48');
INSERT INTO "d1_migrations" VALUES(17,'0016_fish_sms_notifications.sql','2026-06-18 03:08:48');
INSERT INTO "d1_migrations" VALUES(18,'0017_aquarium_panic_expires_at.sql','2026-06-18 03:08:49');
INSERT INTO "d1_migrations" VALUES(19,'0018_fish_sms_diagnostics.sql','2026-06-18 03:08:49');
INSERT INTO "d1_migrations" VALUES(20,'0019_member_fish_sms_preferences.sql','2026-06-18 03:08:49');
INSERT INTO "d1_migrations" VALUES(21,'0020_three_day_fish_eggs.sql','2026-06-26 19:09:39');
INSERT INTO "d1_migrations" VALUES(22,'0021_test_mode_setting.sql','2026-06-26 19:09:39');
INSERT INTO "d1_migrations" VALUES(23,'0022_individual_hunger_accountability.sql','2026-06-26 19:09:39');
INSERT INTO "d1_migrations" VALUES(24,'0023_fish_reward_thank_you_notifications.sql','2026-06-26 19:09:40');
INSERT INTO "d1_migrations" VALUES(25,'0024_aquarium_everything_good.sql','2026-06-26 19:09:40');
INSERT INTO "d1_migrations" VALUES(26,'0025_story_engine.sql','2026-06-30 07:40:22');
INSERT INTO "d1_migrations" VALUES(27,'0026_taken_season.sql','2026-06-30 07:40:22');
CREATE TABLE family_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  member_type TEXT NOT NULL CHECK (member_type IN ('adult', 'child')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, nickname TEXT, avatar_id TEXT, phone_number TEXT, receives_fish_texts INTEGER NOT NULL DEFAULT 0 CHECK (receives_fish_texts IN (0, 1)), fish_text_start_time TEXT NOT NULL DEFAULT '09:00', fish_text_stop_time TEXT NOT NULL DEFAULT '23:00');
INSERT INTO "family_members" VALUES(1,'Dad','adult',1,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(2,'Mom','adult',2,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(3,'Child 1','child',3,0,'2026-05-19 05:29:47','2026-05-19 06:21:26',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(4,'Child 2','child',4,0,'2026-05-19 05:29:47','2026-05-19 06:21:28',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(5,'Child 3','child',5,0,'2026-05-19 05:29:47','2026-05-19 06:13:59',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(6,'Child 4','child',6,0,'2026-05-19 05:29:47','2026-05-19 06:21:30',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(7,'Dad','adult',10,1,'2026-05-19 06:13:06','2026-05-19 06:13:06',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(8,'Mom','child',10,1,'2026-05-19 06:13:11','2026-05-19 06:13:11',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(9,'Amelia','child',10,1,'2026-05-19 06:13:16','2026-05-19 06:13:16',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(10,'Max','child',10,1,'2026-05-19 06:13:19','2026-05-19 06:13:19',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(11,'Gianna','child',10,1,'2026-05-19 06:13:23','2026-05-19 06:13:23',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(12,'Quinn','child',10,1,'2026-05-19 06:13:26','2026-05-19 06:13:26',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(13,'Smoke Test Member','child',99,0,'2026-05-19 06:16:49','2026-05-19 06:16:50',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(14,'Smoke Test Member','child',99,0,'2026-05-19 06:19:59','2026-05-19 06:19:59',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(15,'Smoke Test Member','child',99,0,'2026-05-19 06:21:45','2026-05-19 06:21:45',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(16,'Smoke Test Member','child',99,0,'2026-05-19 06:22:58','2026-05-19 06:22:58',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(17,'Smoke Test Member','child',99,0,'2026-05-19 06:24:41','2026-05-19 06:24:41',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(18,'Delete Test Member 1779171892814','child',999,0,'2026-05-19 06:24:52','2026-05-19 06:24:52',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(19,'Smoke Test Member','child',99,0,'2026-05-19 06:30:16','2026-05-19 06:30:16',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(20,'Smoke Test Member','child',99,0,'2026-05-19 06:31:39','2026-05-19 06:31:39',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(21,'Smoke Test Member','child',99,0,'2026-05-19 06:32:49','2026-05-19 06:32:49',NULL,NULL,NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(22,'Smoke Test Member','child',99,0,'2026-06-04 16:09:34','2026-06-04 16:09:34','Smoke Test Nickname That Is Longer Than Twenty','frog-wizard',NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(23,'Smoke Test Blank Nickname','child',100,0,'2026-06-04 16:09:34','2026-06-04 16:09:34',NULL,'black-cat',NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(24,'Smoke Test Member','child',99,0,'2026-06-04 16:12:49','2026-06-04 16:12:49','Smoke Test Nickname That Is Longer Than Twenty','frog-wizard',NULL,0,'09:00','23:00');
INSERT INTO "family_members" VALUES(25,'Smoke Test Blank Nickname','child',100,0,'2026-06-04 16:12:49','2026-06-04 16:12:50',NULL,'black-cat',NULL,0,'09:00','23:00');
CREATE TABLE device_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token_hash TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('member', 'kiosk', 'admin')),
  member_id INTEGER,
  device_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (member_id) REFERENCES family_members(id)
);
INSERT INTO "device_sessions" VALUES(1,NULL,'kiosk',NULL,'Kitchen Tablet','2026-05-19 05:30:15','2026-05-19 05:30:15');
INSERT INTO "device_sessions" VALUES(2,NULL,'kiosk',NULL,'Kitchen Tablet','2026-05-19 05:30:51','2026-05-19 05:30:51');
INSERT INTO "device_sessions" VALUES(3,NULL,'member',6,'Child 4 Device','2026-05-19 05:36:13','2026-05-19 05:36:13');
INSERT INTO "device_sessions" VALUES(4,NULL,'kiosk',NULL,'Child 4 Device','2026-05-19 05:43:04','2026-05-19 05:43:04');
INSERT INTO "device_sessions" VALUES(5,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 05:49:26','2026-05-19 05:49:26');
INSERT INTO "device_sessions" VALUES(6,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 05:52:58','2026-05-19 05:52:58');
INSERT INTO "device_sessions" VALUES(7,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 05:56:42','2026-05-19 05:56:42');
INSERT INTO "device_sessions" VALUES(8,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 05:59:42','2026-05-19 05:59:42');
INSERT INTO "device_sessions" VALUES(9,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:09:44','2026-05-19 06:09:44');
INSERT INTO "device_sessions" VALUES(10,NULL,'member',3,'Child 1 Device','2026-05-19 06:15:10','2026-05-19 06:15:10');
INSERT INTO "device_sessions" VALUES(11,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:16:50','2026-05-19 06:16:50');
INSERT INTO "device_sessions" VALUES(12,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:20:00','2026-05-19 06:20:00');
INSERT INTO "device_sessions" VALUES(13,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:21:45','2026-05-19 06:21:45');
INSERT INTO "device_sessions" VALUES(14,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:22:58','2026-05-19 06:22:58');
INSERT INTO "device_sessions" VALUES(15,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:24:41','2026-05-19 06:24:41');
INSERT INTO "device_sessions" VALUES(16,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:30:16','2026-05-19 06:30:16');
INSERT INTO "device_sessions" VALUES(17,NULL,'kiosk',NULL,'Assignment Test Kiosk','2026-05-19 06:31:07','2026-05-19 06:31:07');
INSERT INTO "device_sessions" VALUES(18,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:31:39','2026-05-19 06:31:39');
INSERT INTO "device_sessions" VALUES(19,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-05-19 06:32:49','2026-05-19 06:32:49');
INSERT INTO "device_sessions" VALUES(20,NULL,'kiosk',NULL,'Child 1 Device','2026-05-19 16:07:35','2026-05-19 16:07:35');
INSERT INTO "device_sessions" VALUES(21,NULL,'kiosk',NULL,'Child 1 Device','2026-05-19 16:07:40','2026-05-19 16:07:40');
INSERT INTO "device_sessions" VALUES(22,NULL,'kiosk',NULL,'Codex smoke test','2026-06-03 01:02:02','2026-06-03 01:02:02');
INSERT INTO "device_sessions" VALUES(23,NULL,'kiosk',NULL,'Codex milestone smoke test','2026-06-03 01:02:20','2026-06-03 01:02:20');
INSERT INTO "device_sessions" VALUES(24,NULL,'kiosk',NULL,'Codex milestone smoke test','2026-06-03 01:02:20','2026-06-03 01:02:20');
INSERT INTO "device_sessions" VALUES(25,NULL,'kiosk',NULL,'Codex milestone smoke test','2026-06-03 01:02:20','2026-06-03 01:02:20');
INSERT INTO "device_sessions" VALUES(26,NULL,'kiosk',NULL,'Codex milestone smoke test','2026-06-03 01:02:20','2026-06-03 01:02:20');
INSERT INTO "device_sessions" VALUES(27,NULL,'kiosk',NULL,'Codex egg smoke test','2026-06-03 01:41:33','2026-06-03 01:41:33');
INSERT INTO "device_sessions" VALUES(28,NULL,'kiosk',NULL,NULL,'2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "device_sessions" VALUES(29,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "device_sessions" VALUES(30,NULL,'kiosk',NULL,NULL,'2026-06-04 16:12:49','2026-06-04 16:12:49');
INSERT INTO "device_sessions" VALUES(31,NULL,'kiosk',NULL,NULL,'2026-06-04 16:12:49','2026-06-04 16:12:49');
INSERT INTO "device_sessions" VALUES(32,NULL,'kiosk',NULL,'Smoke Test Kiosk','2026-06-04 16:12:50','2026-06-04 16:12:50');
INSERT INTO "device_sessions" VALUES(33,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-18 03:09:03','2026-06-18 03:09:03');
INSERT INTO "device_sessions" VALUES(34,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-28 03:26:18','2026-06-28 03:26:18');
INSERT INTO "device_sessions" VALUES(35,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-28 03:26:30','2026-06-28 03:26:30');
INSERT INTO "device_sessions" VALUES(36,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-28 03:26:31','2026-06-28 03:26:31');
INSERT INTO "device_sessions" VALUES(37,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-28 03:26:32','2026-06-28 03:26:32');
INSERT INTO "device_sessions" VALUES(38,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-28 03:26:34','2026-06-28 03:26:34');
INSERT INTO "device_sessions" VALUES(39,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-29 21:35:23','2026-06-29 21:35:23');
INSERT INTO "device_sessions" VALUES(40,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-30 07:25:54','2026-06-30 07:25:54');
INSERT INTO "device_sessions" VALUES(41,NULL,'member',1,'Dad Device','2026-06-30 07:25:59','2026-06-30 07:25:59');
INSERT INTO "device_sessions" VALUES(42,NULL,'kiosk',NULL,'Kitchen Tablet','2026-06-30 07:29:30','2026-06-30 07:29:30');
CREATE TABLE household_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_type TEXT NOT NULL DEFAULT 'note' CHECK (note_type IN ('note', 'shopping', 'reminder')),
  text TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "household_notes" VALUES(1,'note','Smoke test note',1,'2026-05-19 05:56:42','2026-05-19 05:56:42');
INSERT INTO "household_notes" VALUES(2,'note','Smoke test note',1,'2026-05-19 05:59:42','2026-05-19 05:59:42');
INSERT INTO "household_notes" VALUES(3,'note','Smoke test note',1,'2026-05-19 06:09:44','2026-05-19 06:09:44');
INSERT INTO "household_notes" VALUES(4,'note','Smoke test note',1,'2026-05-19 06:16:50','2026-05-19 06:16:50');
INSERT INTO "household_notes" VALUES(5,'note','Smoke test note',1,'2026-05-19 06:19:59','2026-05-19 06:19:59');
INSERT INTO "household_notes" VALUES(6,'note','Smoke test note',1,'2026-05-19 06:21:45','2026-05-19 06:21:45');
INSERT INTO "household_notes" VALUES(7,'note','Smoke test note',1,'2026-05-19 06:22:58','2026-05-19 06:22:58');
INSERT INTO "household_notes" VALUES(8,'note','Smoke test note',1,'2026-05-19 06:24:41','2026-05-19 06:24:41');
INSERT INTO "household_notes" VALUES(9,'note','Smoke test note',1,'2026-05-19 06:30:16','2026-05-19 06:30:16');
INSERT INTO "household_notes" VALUES(10,'note','Smoke test note',1,'2026-05-19 06:31:39','2026-05-19 06:31:39');
INSERT INTO "household_notes" VALUES(11,'note','Smoke test note',1,'2026-05-19 06:32:49','2026-05-19 06:32:49');
INSERT INTO "household_notes" VALUES(12,'note','Smoke test note',1,'2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "household_notes" VALUES(13,'note','Smoke test note',1,'2026-06-04 16:12:50','2026-06-04 16:12:50');
CREATE TABLE chores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  frequency_type TEXT NOT NULL DEFAULT 'as_needed'
    CHECK (frequency_type IN ('daily', 'weekdays', 'weekends', 'weekly', 'monthly', 'as_needed')),
  assigned_member_id INTEGER,
  alert_if_overdue INTEGER NOT NULL DEFAULT 0 CHECK (alert_if_overdue IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  needs_reminder INTEGER NOT NULL DEFAULT 0 CHECK (needs_reminder IN (0, 1)),
  assignment_mode TEXT NOT NULL DEFAULT 'household_anyone'
    CHECK (assignment_mode IN ('household_anyone', 'assigned_individual', 'per_person')), feeds_aquarium INTEGER NOT NULL DEFAULT 1 CHECK (feeds_aquarium IN (0, 1)),
  FOREIGN KEY (assigned_member_id) REFERENCES family_members(id)
);
INSERT INTO "chores" VALUES(1,'Wash Dishes','Wash dishes after meals.','daily',NULL,1,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',1,'household_anyone',1);
INSERT INTO "chores" VALUES(2,'Unload Dishwasher','Put clean dishes away.','daily',NULL,1,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(3,'Take Out Trash','Empty kitchen trash and replace the bag.','weekly',NULL,1,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',1,'household_anyone',1);
INSERT INTO "chores" VALUES(4,'Feed Pets','Feed household pets.','daily',NULL,1,1,'2026-05-19 05:29:47','2026-05-19 05:39:05',1,'household_anyone',1);
INSERT INTO "chores" VALUES(5,'Clean Bedroom','Put away clothes and clear the floor.','weekly',NULL,0,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(6,'Vacuum Living Room','Vacuum the main living room floor.','weekly',NULL,0,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(7,'Wipe Kitchen Counters','Wipe down counters after meals.','daily',NULL,1,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(8,'Laundry','Move laundry forward and fold clean clothes.','as_needed',NULL,0,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(9,'Clean Bathroom','Wipe sink, mirror, and toilet.','weekly',NULL,0,1,'2026-05-19 05:29:47','2026-05-19 05:29:47',0,'household_anyone',1);
INSERT INTO "chores" VALUES(10,'Pick Up Toys','Return toys and games to their homes.','daily',NULL,0,0,'2026-05-19 05:29:47','2026-05-19 16:08:12',0,'household_anyone',1);
INSERT INTO "chores" VALUES(11,'Delete Test Chore 1779171892814','Temporary delete verification chore.','as_needed',NULL,0,0,'2026-05-19 06:24:52','2026-05-19 06:24:53',0,'household_anyone',1);
INSERT INTO "chores" VALUES(12,'Per Person Test 1779172267475','Temporary per-person assignment verification.','daily',NULL,1,0,'2026-05-19 06:31:07','2026-05-19 06:31:07',0,'per_person',1);
INSERT INTO "chores" VALUES(13,'Assigned Test 1779172278854','Temporary assigned chore verification.','daily',1,1,0,'2026-05-19 06:31:18','2026-05-19 06:31:18',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(14,'Smoke Test Assigned Chore','Temporary smoke test chore','daily',1,1,0,'2026-05-19 06:31:39','2026-05-19 06:31:39',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(15,'Smoke Test Assigned Chore','Temporary smoke test chore','daily',1,1,0,'2026-05-19 06:32:49','2026-05-19 06:32:49',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(16,'Smoke Test Assigned Chore','Temporary smoke test chore','weekdays',1,1,0,'2026-06-04 16:09:34','2026-06-04 16:09:34',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(17,'Smoke Test Nickname Chore','Temporary smoke test nickname chore','weekends',NULL,1,0,'2026-06-04 16:09:34','2026-06-04 16:09:34',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(18,'Smoke Test Blank Nickname Chore','Temporary smoke test blank nickname chore','daily',NULL,1,0,'2026-06-04 16:09:34','2026-06-04 16:09:34',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(19,'Smoke Test Assigned Chore','Temporary smoke test chore','weekdays',1,1,0,'2026-06-04 16:12:49','2026-06-04 16:12:49',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(20,'Smoke Test Nickname Chore','Temporary smoke test nickname chore','weekends',NULL,1,0,'2026-06-04 16:12:49','2026-06-04 16:12:49',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(21,'Smoke Test No Fish Food Chore','Temporary smoke test chore that should not feed fish','as_needed',NULL,0,0,'2026-06-04 16:12:49','2026-06-04 16:12:49',0,'assigned_individual',0);
INSERT INTO "chores" VALUES(22,'Smoke Test Blank Nickname Chore','Temporary smoke test blank nickname chore','daily',NULL,1,0,'2026-06-04 16:12:49','2026-06-04 16:12:50',0,'assigned_individual',1);
INSERT INTO "chores" VALUES(23,'Wash the pets',NULL,'weekly',NULL,0,1,'2026-06-18 03:08:48','2026-06-18 03:08:48',0,'household_anyone',1);
INSERT INTO "chores" VALUES(24,'Take the dog for a walk',NULL,'daily',NULL,0,1,'2026-06-18 03:08:48','2026-06-18 03:08:48',0,'household_anyone',1);
CREATE TABLE IF NOT EXISTS "chore_assignments" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  family_member_id INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (family_member_id) REFERENCES family_members(id),
  UNIQUE (chore_id, family_member_id)
);
INSERT INTO "chore_assignments" VALUES(1,12,1,1,'2026-05-19 06:31:07','2026-05-19 06:31:07');
INSERT INTO "chore_assignments" VALUES(2,12,2,1,'2026-05-19 06:31:07','2026-05-19 06:31:07');
INSERT INTO "chore_assignments" VALUES(3,13,1,1,'2026-05-19 06:31:18','2026-05-19 06:31:18');
INSERT INTO "chore_assignments" VALUES(4,14,1,1,'2026-05-19 06:31:39','2026-05-19 06:31:39');
INSERT INTO "chore_assignments" VALUES(5,15,1,1,'2026-05-19 06:32:49','2026-05-19 06:32:49');
INSERT INTO "chore_assignments" VALUES(6,16,1,1,'2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "chore_assignments" VALUES(7,17,22,0,'2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "chore_assignments" VALUES(8,18,23,0,'2026-06-04 16:09:34','2026-06-04 16:09:34');
INSERT INTO "chore_assignments" VALUES(9,19,1,1,'2026-06-04 16:12:49','2026-06-04 16:12:49');
INSERT INTO "chore_assignments" VALUES(10,20,24,0,'2026-06-04 16:12:49','2026-06-04 16:12:49');
INSERT INTO "chore_assignments" VALUES(11,21,24,0,'2026-06-04 16:12:49','2026-06-04 16:12:49');
INSERT INTO "chore_assignments" VALUES(12,22,25,0,'2026-06-04 16:12:49','2026-06-04 16:12:50');
CREATE TABLE IF NOT EXISTS "chore_completions" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chore_id INTEGER NOT NULL,
  completed_by_member_id INTEGER NOT NULL,
  device_session_id INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  notes TEXT,
  points INTEGER NOT NULL DEFAULT 1,
  responsible_member_id INTEGER REFERENCES family_members(id),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (completed_by_member_id) REFERENCES family_members(id),
  FOREIGN KEY (device_session_id) REFERENCES device_sessions(id)
);
INSERT INTO "chore_completions" VALUES(1,1,3,1,'2026-05-19 05:30:15',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(2,4,4,2,'2026-05-19 05:30:56',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(3,2,6,3,'2026-05-19 05:37:29',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(4,7,1,4,'2026-05-19 05:43:04',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(5,4,1,5,'2026-05-19 05:49:26',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(6,4,1,6,'2026-05-19 05:52:58','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(7,4,1,7,'2026-05-19 05:56:42','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(8,4,1,8,'2026-05-19 05:59:42','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(9,4,1,9,'2026-05-19 06:09:45','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(10,4,1,11,'2026-05-19 06:16:50','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(11,4,1,12,'2026-05-19 06:20:00','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(12,4,1,13,'2026-05-19 06:21:45','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(13,4,1,14,'2026-05-19 06:22:58','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(14,4,1,15,'2026-05-19 06:24:41','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(15,4,1,16,'2026-05-19 06:30:16','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(16,12,1,17,'2026-05-19 06:31:07','assignment model test',1,1);
INSERT INTO "chore_completions" VALUES(17,4,1,18,'2026-05-19 06:31:39','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(18,4,1,19,'2026-05-19 06:32:49','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(19,4,12,20,'2026-05-19 16:07:35',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(20,9,2,21,'2026-05-19 16:07:40',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(21,1,12,22,'2026-06-03 01:02:02',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(22,1,12,23,'2026-06-03 01:02:20',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(23,1,12,24,'2026-06-03 01:02:20',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(24,1,12,25,'2026-06-03 01:02:20',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(25,1,12,26,'2026-06-03 01:02:20',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(26,1,12,27,'2026-06-03 01:41:33',NULL,1,NULL);
INSERT INTO "chore_completions" VALUES(27,17,22,28,'2026-06-04 16:09:34','Smoke test nickname completion',1,22);
INSERT INTO "chore_completions" VALUES(28,4,1,29,'2026-06-04 16:09:34','Smoke test completion',1,NULL);
INSERT INTO "chore_completions" VALUES(29,20,24,30,'2026-06-04 16:12:49','Smoke test nickname completion',1,24);
INSERT INTO "chore_completions" VALUES(30,21,24,31,'2026-06-04 16:12:49','Smoke test no fish food completion',1,24);
INSERT INTO "chore_completions" VALUES(31,4,1,32,'2026-06-04 16:12:50','Smoke test completion',1,NULL);
CREATE TABLE earned_bugs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_member_id INTEGER NOT NULL,
  bug_id TEXT NOT NULL,
  chore_id INTEGER NOT NULL,
  completion_id INTEGER NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL, removed_at TEXT, removed_reason TEXT,
  FOREIGN KEY (family_member_id) REFERENCES family_members(id),
  FOREIGN KEY (chore_id) REFERENCES chores(id),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id)
);
INSERT INTO "earned_bugs" VALUES(1,12,'squiggle-shell-bug',1,21,'2026-06-03 01:02:02','2026-06-06 01:02:02',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(2,12,'gold-speckle-bug',1,22,'2026-06-03 01:02:20','2026-06-06 01:02:20',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(3,12,'yellow-triangle-bug',1,23,'2026-06-03 01:02:20','2026-06-06 01:02:20',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(4,12,'blue-noodle-bug',1,24,'2026-06-03 01:02:20','2026-06-06 01:02:20',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(5,12,'tiny-wing-bug',1,25,'2026-06-03 01:02:20','2026-06-06 01:02:20',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(6,12,'red-wheel-bug',1,26,'2026-06-03 01:41:33','2026-06-06 01:41:33',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(7,22,'pink-doodle-bug',17,27,'2026-06-04 16:09:34','2026-06-07 16:09:34',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(8,1,'squiggle-shell-bug',4,28,'2026-06-04 16:09:34','2026-06-07 16:09:34','2026-06-04 16:09:34','overclicked');
INSERT INTO "earned_bugs" VALUES(9,24,'blue-orb-bug',20,29,'2026-06-04 16:12:49','2026-06-07 16:12:49',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(10,24,'spotted-heart-bug',21,30,'2026-06-04 16:12:49','2026-06-07 16:12:49',NULL,NULL);
INSERT INTO "earned_bugs" VALUES(11,1,'starfish-bug',4,31,'2026-06-04 16:12:50','2026-06-07 16:12:50','2026-06-04 16:12:50','overclicked');
CREATE TABLE aquarium_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  food_reserve INTEGER NOT NULL DEFAULT 14 CHECK (food_reserve >= 0),
  max_food_reserve INTEGER NOT NULL DEFAULT 30 CHECK (max_food_reserve > 0),
  daily_food_consumption INTEGER NOT NULL DEFAULT 2 CHECK (daily_food_consumption >= 0),
  last_consumed_on TEXT NOT NULL DEFAULT (date('now')),
  total_chore_completions INTEGER NOT NULL DEFAULT 0 CHECK (total_chore_completions >= 0),
  creature_unlock_interval INTEGER NOT NULL DEFAULT 25 CHECK (creature_unlock_interval > 0),
  growth_days INTEGER NOT NULL DEFAULT 7 CHECK (growth_days >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
, starting_food_reserve INTEGER NOT NULL DEFAULT 14 CHECK (starting_food_reserve >= 0), egg_incubation_minutes INTEGER NOT NULL DEFAULT 60 CHECK (egg_incubation_minutes >= 0), last_fed_at TEXT, panic_mode INTEGER NOT NULL DEFAULT 0 CHECK (panic_mode IN (0, 1)), panic_chores_needed INTEGER NOT NULL DEFAULT 0 CHECK (panic_chores_needed >= 0), panic_expires_at TEXT, everything_good_until TEXT);
INSERT INTO "aquarium_state" VALUES(1,0,30,2,'2026-06-30',28,25,7,'2026-06-03 01:01:03','2026-06-30 07:25:54',19,4320,'2026-06-04 16:12:49',0,0,NULL,NULL);
CREATE TABLE aquarium_creatures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id TEXT NOT NULL,
  growth_stage TEXT NOT NULL DEFAULT 'baby' CHECK (growth_stage IN ('baby', 'adult')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "aquarium_creatures" VALUES(1,'clownfish','baby','2026-06-03 01:01:03','2026-06-03 01:01:03');
INSERT INTO "aquarium_creatures" VALUES(2,'seahorse','baby','2026-06-03 01:02:20','2026-06-03 01:02:20');
INSERT INTO "aquarium_creatures" VALUES(3,'starfish','baby','2026-06-03 02:42:11','2026-06-03 02:42:11');
CREATE TABLE aquarium_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL CHECK (event_type IN ('fed', 'hatched')),
  message TEXT NOT NULL,
  member_name TEXT,
  completion_id INTEGER,
  creature_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id),
  FOREIGN KEY (creature_id) REFERENCES aquarium_creatures(id)
);
INSERT INTO "aquarium_events" VALUES(1,'fed','Quinn fed the aquarium!','Quinn',21,NULL,'2026-06-03 01:02:02');
INSERT INTO "aquarium_events" VALUES(2,'fed','Quinn fed the aquarium!','Quinn',22,NULL,'2026-06-03 01:02:20');
INSERT INTO "aquarium_events" VALUES(3,'fed','Quinn fed the aquarium!','Quinn',23,NULL,'2026-06-03 01:02:20');
INSERT INTO "aquarium_events" VALUES(4,'fed','Quinn fed the aquarium!','Quinn',24,NULL,'2026-06-03 01:02:20');
INSERT INTO "aquarium_events" VALUES(5,'fed','Quinn fed the aquarium!','Quinn',25,NULL,'2026-06-03 01:02:20');
INSERT INTO "aquarium_events" VALUES(6,'hatched','A new aquarium friend hatched!','Quinn',25,2,'2026-06-03 01:02:20');
INSERT INTO "aquarium_events" VALUES(7,'fed','Quinn fed the aquarium!','Quinn',26,NULL,'2026-06-03 01:41:33');
INSERT INTO "aquarium_events" VALUES(8,'hatched','A baby starfish joined the aquarium!',NULL,NULL,3,'2026-06-03 02:42:11');
INSERT INTO "aquarium_events" VALUES(9,'fed','Smoke Test Nickname That Is Longer Than Twenty fed the aquarium!','Smoke Test Nickname That Is Longer Than Twenty',27,NULL,'2026-06-04 16:09:34');
INSERT INTO "aquarium_events" VALUES(10,'fed','Smoke Test Nickname That Is Longer Than Twenty fed the aquarium!','Smoke Test Nickname That Is Longer Than Twenty',29,NULL,'2026-06-04 16:12:49');
CREATE TABLE aquarium_eggs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  species_id TEXT NOT NULL,
  laid_at TEXT NOT NULL DEFAULT (datetime('now')),
  hatch_after TEXT NOT NULL,
  hatched_at TEXT,
  creature_id INTEGER,
  completion_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (creature_id) REFERENCES aquarium_creatures(id),
  FOREIGN KEY (completion_id) REFERENCES chore_completions(id)
);
INSERT INTO "aquarium_eggs" VALUES(1,'starfish','2026-06-03 01:41:33','2026-06-03 02:41:33','2026-06-03 02:42:11',3,26,'2026-06-03 01:41:33','2026-06-03 02:42:11');
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "app_settings" VALUES('test_mode','1','2026-06-26 19:09:39');
CREATE TABLE IF NOT EXISTS "fish_notification_history" (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_type TEXT NOT NULL
    CHECK (notification_type IN ('hunger', 'new_fish', 'fish_birthday', 'fish_growth', 'tank_success', 'test', 'fish_reward_thank_you')),
  mood TEXT,
  hunger_score INTEGER NOT NULL DEFAULT 0 CHECK (hunger_score >= 0),
  message_body TEXT,
  recipient_phone_number TEXT,
  provider_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
  reason TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  provider_status TEXT,
  provider_status_code INTEGER,
  provider_error_code TEXT,
  provider_error_message TEXT,
  diagnostic_context TEXT,
  recipient_member_id INTEGER REFERENCES family_members(id),
  chore_date TEXT,
  completed_chores_today INTEGER,
  fish_mood_at_send_time TEXT,
  chore_points INTEGER,
  fish_mood_modifier INTEGER,
  final_reward_score INTEGER
);
INSERT INTO "fish_notification_history" VALUES(1,'test','emergency_hunger',0,'local visual test','+15555550123','local-test','sent','local_visual_test',NULL,'2026-06-18 03:16:45',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
CREATE TABLE story_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  total_scenes INTEGER NOT NULL DEFAULT 0,
  start_date TEXT NOT NULL DEFAULT (date('now')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'draft', 'complete')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO "story_series" VALUES(1,'reef-of-thrones','Reef of Thrones',5,'2026-06-30','draft','2026-06-30 07:40:22','2026-06-30 07:40:22');
INSERT INTO "story_series" VALUES(2,'taken','Taken',24,'2026-06-30','active','2026-06-30 07:40:22','2026-06-30 07:40:22');
CREATE TABLE story_scenes (
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
INSERT INTO "story_scenes" VALUES(1,1,1,0,'The Reef Without a Throne','The Great Reef','{"narration":"Long ago the Coral Throne sat empty, and every house of the reef wanted it.","beats":[{"speaker":"clownfish","name":"Pip","position":"left","expression":"content","line":"Someone must keep the reef warm and fair. That someone should be honest."},{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"Honest fish finish last, little clownfish. The throne goes to the bold."},{"speaker":"starfish","name":"Stella","position":"center","expression":"content","line":"When the water runs cold, honesty and boldness will both be tested."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(2,1,2,1,'Goldscale Makes a Move','The Bright Shallows','{"narration":"House Goldscale gathered its allies in the bright shallows.","beats":[{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"By the next tide, the reef will call me queen. Who will stand with me?"},{"speaker":"pufferfish","name":"Otto","position":"left","expression":"content","line":"I will stand near you. Mostly so I am not standing against you."},{"speaker":"angelfish","name":"Bianca","position":"right","expression":"happy","line":"Wise little puffer. Stay inflated. We have work to do."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(3,1,3,2,'The Cold Current','The Outer Rocks','{"narration":"At the edge of the reef, old Mr. Pinch felt the water turn strange.","beats":[{"speaker":"crab","name":"Mr. Pinch","position":"center","expression":"hungry","line":"The current beyond the rocks is cold. Colder than it has any right to be."},{"speaker":"clownfish","name":"Pip","position":"left","expression":"content","line":"The bugs live out there. Maybe they stirred something up."},{"speaker":"crab","name":"Mr. Pinch","position":"center","expression":"hungry","line":"The bugs are the least of what is coming. Mark my claw."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(4,1,4,3,'An Egg No Fish Laid','The Quiet Grotto','{"narration":"In a hidden grotto, Coral guarded a small grey egg that no fish had laid.","beats":[{"speaker":"seahorse","name":"Coral","position":"center","expression":"content","line":"It is warm to the touch, even now. As if it is waiting for something."},{"speaker":"starfish","name":"Stella","position":"left","expression":"content","line":"The prophecy speaks of an egg not laid by any fish, and the one who turns the tide."},{"speaker":"seahorse","name":"Coral","position":"center","expression":"happy","line":"Then I will keep it safe until the reef needs it most."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(5,1,5,5,'Beyond the Reef','The Dark Water','{"narration":"Far past the reef, in water no fish dared enter, something pale began to move.","beats":[{"speaker":"clam","name":"The Clam","position":"center","expression":"sad","line":"..."},{"speaker":"starfish","name":"Stella","position":"left","expression":"hungry","line":"It is waking. The cold, the squabbles, the egg. It all begins now."},{"speaker":"clownfish","name":"Pip","position":"right","expression":"content","line":"Then we had better stop fighting each other. While we still can."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(6,2,1,0,'The Bored Tank','The Tank','{"prop": "The fish are bored. Again.", "narration": "Another slow day in the tank. The cast is restless and itching for a story.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "content", "line": "Stay where I can see you, kid. The world out there has teeth."}, {"speaker": "seahorse", "name": "Coral", "position": "right", "expression": "happy", "line": "Dad, I am not a baby anymore. I want to SEE things."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(7,2,2,1,'A Plan Hatches','The Tank','{"prop": "A tiny suitcase has appeared by the castle.", "narration": "Bianca arrives with big ideas.", "beats": [{"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "happy", "line": "Coral! Come abroad with me. The big city. Lights. Adventure."}, {"speaker": "seahorse", "name": "Coral", "position": "center", "expression": "happy", "line": "Yes. A thousand times yes. I just have to ask my dad."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(8,2,3,2,'One Rule','The Tank','{"prop": "The toy phone glints in the gravel.", "narration": "Pinch agrees, but he has a condition.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "hungry", "line": "Fine. But you call me the second you land. Every time. No exceptions."}, {"speaker": "seahorse", "name": "Coral", "position": "right", "expression": "happy", "line": "I promise, Dad. I love you."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(9,2,4,3,'In Transit','In Transit','{"prop": "A toy airplane drifts across the tank.", "narration": "The journey begins.", "beats": [{"speaker": "seahorse", "name": "Coral", "position": "center", "expression": "happy", "line": "We are really doing this, Bianca!"}, {"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "happy", "line": "Told you. Best trip of our lives."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(10,2,5,4,'The Bright City','The Bright City','{"prop": "A tiny Eiffel Tower now stands in the tank. Nobody knows why.", "narration": "They arrive somewhere dazzling.", "beats": [{"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "happy", "line": "Look at this place! I could stay forever."}, {"speaker": "seahorse", "name": "Coral", "position": "left", "expression": "content", "line": "Let me call my dad first, like I promised."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(11,2,6,5,'Watched','The Bright City','{"prop": "The light dims at the edge of the reef.", "narration": "Something is watching them.", "beats": [{"speaker": "stranger", "name": "A Stranger", "position": "right", "expression": "hungry", "line": "Two travelers. Alone. Perfect."}, {"speaker": "seahorse", "name": "Coral", "position": "left", "expression": "peckish", "line": "Bianca... I think that fish is following us."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(12,2,7,6,'Bad Feeling','The Apartment','{"prop": "A cracked porthole prop appears.", "narration": "Bianca waves off the worry.", "beats": [{"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "happy", "line": "You worry too much. Help me unpack."}, {"speaker": "seahorse", "name": "Coral", "position": "left", "expression": "peckish", "line": "I have a really bad feeling about this."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(13,2,8,8,'The Taking','The Apartment','{"prop": "Shadows pour in from every crack.", "narration": "The gang strikes.", "beats": [{"speaker": "stranger", "name": "The Gang", "position": "center", "expression": "hungry", "line": "Grab the bright one first."}, {"speaker": "angelfish", "name": "Bianca", "position": "left", "expression": "very_hungry", "line": "Coral! Hide! Call your dad, NOW!"}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(14,2,9,10,'The Call','The Apartment','{"prop": "The phone, ringing in the dark.", "narration": "Coral hides and dials.", "beats": [{"speaker": "seahorse", "name": "Coral", "position": "left", "expression": "very_hungry", "line": "Dad! They took Bianca! I can hear them coming!"}, {"speaker": "crab", "name": "Mr. Pinch", "position": "right", "expression": "hungry", "line": "Listen to me. Stay calm. Tell me everything you see."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(15,2,10,12,'A Specific Set of Skills','The Apartment','{"prop": "A single beam of light falls on the phone.", "narration": "Pinch speaks to whoever is listening.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "hungry", "line": "I do not know who you are. But I have a very specific set of skills."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "very_hungry", "line": "Skills that make me a nightmare for fish like you. Let her go."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(16,2,11,14,'Too Late','The Apartment','{"prop": "A swirl of bubbles where she stood.", "narration": "The line goes quiet.", "beats": [{"speaker": "stranger", "name": "The Gang", "position": "right", "expression": "hungry", "line": "Good luck, old crab. You will never find us."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "very_hungry", "line": "I will find you. And I will get her back."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(17,2,12,16,'The Hunt Begins','The Tank','{"prop": "The water goes cold and grey.", "narration": "Pinch is alone, and resolved.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "center", "expression": "sad", "line": "Hold on, kid. I am coming for you."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(18,2,13,18,'Crossing Over','In Transit','{"prop": "The toy plane again, pointed the other way.", "narration": "Pinch travels to the city.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "center", "expression": "hungry", "line": "Every single hour matters now. Move."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(19,2,14,20,'An Old Friend','Otto''s Hideout','{"prop": "A tattered map unrolls across the gravel.", "narration": "Pinch finds his old contact.", "beats": [{"speaker": "pufferfish", "name": "Otto", "position": "right", "expression": "content", "line": "Pinch! I heard. Whatever you need, it is yours."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "hungry", "line": "I need names. Who runs the trade in this city?"}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(20,2,15,22,'Reading the Tide','Otto''s Hideout','{"prop": "A glowing clue shimmers in the sand.", "narration": "Stella studies the trail.", "beats": [{"speaker": "starfish", "name": "Stella", "position": "center", "expression": "content", "line": "The current carried them east. Follow the cold water."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "content", "line": "Then east I go."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(21,2,16,24,'Into the Den','The Den','{"prop": "Stacked crates loom in the murky water.", "narration": "Pinch slips inside the gang''s den.", "beats": [{"speaker": "stranger", "name": "The Gang", "position": "right", "expression": "hungry", "line": "You are not supposed to be back here."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "content", "line": "Wrong. I am exactly where I am supposed to be."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(22,2,17,26,'A Name','The Den','{"prop": "A sudden cloud of sand erupts.", "narration": "He gets what he came for.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "very_hungry", "line": "The buyer. Give me a name, and you swim away."}, {"speaker": "stranger", "name": "The Gang", "position": "right", "expression": "sad", "line": "...The Clam. They sold her to the Clam."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(23,2,18,28,'The Chase','The Chase','{"prop": "Motion streaks blur the whole reef.", "narration": "A chase through the rocks.", "beats": [{"speaker": "crab", "name": "Mr. Pinch", "position": "center", "expression": "hungry", "line": "Nobody outruns a crab on his own reef."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(24,2,19,30,'Empty Crate','The Empty Room','{"prop": "An open, empty crate sits in the gloom.", "narration": "He finds Bianca, but not Coral.", "beats": [{"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "sad", "line": "Pinch? You came... but they already took Coral to him."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "hungry", "line": "Then I am not finished. Where?"}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(25,2,20,32,'The Trail Ends','The Kingpin''s Hall','{"prop": "An ornate throne-shell rises from the dark.", "narration": "The trail leads to the buyer.", "beats": [{"speaker": "starfish", "name": "Stella", "position": "left", "expression": "content", "line": "Beyond that arch. He never leaves his throne."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "right", "expression": "very_hungry", "line": "Good. Then he will be easy to find."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(26,2,21,34,'The Kingpin','The Kingpin''s Hall','{"prop": "The Clam sits, vast and silent.", "narration": "The confrontation.", "beats": [{"speaker": "clam", "name": "The Clam", "position": "center", "expression": "sad", "line": "You are brave, crab. Brave, and very far from home."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "very_hungry", "line": "Give me my daughter. This is your only warning."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(27,2,22,36,'The Rescue','The Kingpin''s Hall','{"prop": "The whole tank shudders.", "narration": "Pinch makes his move.", "beats": [{"speaker": "seahorse", "name": "Coral", "position": "right", "expression": "very_hungry", "line": "DAD!"}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "hungry", "line": "I have got you. Close your eyes. We are leaving."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(28,2,23,38,'Reunited','The Tank','{"prop": "Warm light floods back into the reef.", "narration": "Father and daughter, together again.", "beats": [{"speaker": "seahorse", "name": "Coral", "position": "right", "expression": "happy", "line": "You found me. You actually found me."}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "content", "line": "I will always find you. Always."}]}','2026-06-30 07:40:22');
INSERT INTO "story_scenes" VALUES(29,2,24,40,'Curtain Call','The Tank','{"prop": "The props fade away, one by one.", "narration": "The play is over. The tank is just a tank again.", "beats": [{"speaker": "angelfish", "name": "Bianca", "position": "right", "expression": "happy", "line": "That was incredible. What do we perform next?"}, {"speaker": "crab", "name": "Mr. Pinch", "position": "left", "expression": "content", "line": "Give me five minutes of peace. Five."}, {"speaker": "starfish", "name": "Stella", "position": "center", "expression": "happy", "line": "The audience is already bored. Places, everyone."}]}','2026-06-30 07:40:22');
CREATE TABLE story_progress (
  member_id INTEGER NOT NULL,
  series_id INTEGER NOT NULL,
  unlocked_index INTEGER NOT NULL DEFAULT 1 CHECK (unlocked_index >= 0),
  last_unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_id, series_id),
  FOREIGN KEY (member_id) REFERENCES family_members(id),
  FOREIGN KEY (series_id) REFERENCES story_series(id)
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('family_members',25);
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',27);
INSERT INTO "sqlite_sequence" VALUES('device_sessions',42);
INSERT INTO "sqlite_sequence" VALUES('household_notes',13);
INSERT INTO "sqlite_sequence" VALUES('chores',24);
INSERT INTO "sqlite_sequence" VALUES('chore_assignments',12);
INSERT INTO "sqlite_sequence" VALUES('chore_completions',31);
INSERT INTO "sqlite_sequence" VALUES('aquarium_creatures',3);
INSERT INTO "sqlite_sequence" VALUES('earned_bugs',11);
INSERT INTO "sqlite_sequence" VALUES('aquarium_events',10);
INSERT INTO "sqlite_sequence" VALUES('aquarium_eggs',1);
INSERT INTO "sqlite_sequence" VALUES('fish_notification_history',1);
INSERT INTO "sqlite_sequence" VALUES('story_series',2);
INSERT INTO "sqlite_sequence" VALUES('story_scenes',29);
CREATE INDEX idx_family_members_active_sort
  ON family_members(active, sort_order, display_name);
CREATE INDEX idx_household_notes_active_type
  ON household_notes(active, note_type, updated_at DESC);
CREATE INDEX idx_chores_active
  ON chores(active, frequency_type);
CREATE INDEX idx_chores_reminders
  ON chores(active, needs_reminder, alert_if_overdue);
CREATE INDEX idx_chore_assignments_chore
  ON chore_assignments(chore_id, active);
CREATE INDEX idx_chore_assignments_member
  ON chore_assignments(family_member_id, active);
CREATE INDEX idx_chore_completions_completed_at
  ON chore_completions(completed_at DESC);
CREATE INDEX idx_chore_completions_chore
  ON chore_completions(chore_id, completed_at DESC);
CREATE INDEX idx_chore_completions_member
  ON chore_completions(completed_by_member_id, completed_at DESC);
CREATE INDEX idx_chore_completions_responsible
  ON chore_completions(chore_id, responsible_member_id, completed_at DESC);
CREATE INDEX idx_earned_bugs_member_active
  ON earned_bugs(family_member_id, expires_at DESC, earned_at DESC);
CREATE INDEX idx_earned_bugs_completion
  ON earned_bugs(completion_id);
CREATE INDEX idx_earned_bugs_removed
  ON earned_bugs(removed_at, removed_reason);
CREATE INDEX idx_aquarium_events_created
  ON aquarium_events(created_at DESC, id DESC);
CREATE INDEX idx_aquarium_eggs_pending
  ON aquarium_eggs(hatched_at, hatch_after);
CREATE INDEX idx_fish_notification_history_type_created
  ON fish_notification_history(notification_type, mood, status, created_at DESC, id DESC);
CREATE INDEX idx_fish_notification_history_created
  ON fish_notification_history(created_at DESC, id DESC);
CREATE INDEX idx_fish_notification_history_member_daily
  ON fish_notification_history(notification_type, reason, recipient_member_id, status, created_at DESC, id DESC);
CREATE UNIQUE INDEX idx_fish_reward_thank_you_once_per_child_day
  ON fish_notification_history(notification_type, recipient_member_id, chore_date)
  WHERE notification_type = 'fish_reward_thank_you'
    AND status = 'sent'
    AND recipient_member_id IS NOT NULL
    AND chore_date IS NOT NULL;
CREATE INDEX idx_story_scenes_series
  ON story_scenes(series_id, scene_order);