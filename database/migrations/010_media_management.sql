-- =====================================================
-- Migration 010: Media Management System (DJ Tools) v3
-- =====================================================

BEGIN;

-- =====================================================
-- 0. DROP EXISTING OBJECTS
-- =====================================================
DROP VIEW IF EXISTS playlist_covers CASCADE;
DROP VIEW IF EXISTS tracks_with_details CASCADE;

DROP TABLE IF EXISTS playlist_tracks CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
DROP TABLE IF EXISTS track_relations CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS albums CASCADE;
DROP TABLE IF EXISTS artists CASCADE;

DROP FUNCTION IF EXISTS update_media_timestamp() CASCADE;

-- =====================================================
-- 1. ARTISTS
-- =====================================================
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,

  image_url TEXT,
  genres TEXT[],
  popularity INTEGER,
  followers INTEGER,
  bio TEXT,

  spotify_url TEXT NOT NULL,
  external_urls JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_artists_spotify_id ON artists(spotify_id);
CREATE INDEX idx_artists_name ON artists(name);

-- =====================================================
-- 2. ALBUMS
-- =====================================================
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,

  album_type VARCHAR(50),
  release_date DATE,
  release_date_precision VARCHAR(10),
  total_tracks INTEGER,

  image_url TEXT,
  images JSONB,

  spotify_url TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_albums_spotify_id ON albums(spotify_id);

-- =====================================================
-- 3. TRACKS
-- =====================================================
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,

  artist_id UUID
    CONSTRAINT fk_tracks_artist
    REFERENCES artists(id) ON DELETE SET NULL,

  album_id UUID
    CONSTRAINT fk_tracks_album
    REFERENCES albums(id) ON DELETE SET NULL,

  duration_ms INTEGER NOT NULL,
  explicit BOOLEAN DEFAULT FALSE,
  popularity INTEGER,
  track_number INTEGER,
  disc_number INTEGER,

  bpm DECIMAL(6,2),
  musical_key INTEGER,
  musical_key_name VARCHAR(10),
  mode INTEGER,
  time_signature INTEGER,

  energy DECIMAL(4,3),
  danceability DECIMAL(4,3),
  valence DECIMAL(4,3),
  acousticness DECIMAL(4,3),
  instrumentalness DECIMAL(4,3),
  liveness DECIMAL(4,3),
  speechiness DECIMAL(4,3),
  loudness DECIMAL(6,3),

  preview_url TEXT,
  spotify_url TEXT NOT NULL,

  isrc VARCHAR(50),
  genres TEXT[],

  created_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracks_artist ON tracks(artist_id);
CREATE INDEX idx_tracks_album ON tracks(album_id);
CREATE INDEX idx_tracks_bpm ON tracks(bpm);
CREATE INDEX idx_tracks_key ON tracks(musical_key);
CREATE INDEX idx_tracks_name ON tracks(name);
CREATE INDEX idx_tracks_artist_album ON tracks(artist_id, album_id);

-- =====================================================
-- 4. TRACK RELATIONS (FIXED)
-- =====================================================
CREATE TABLE track_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  from_track_id UUID NOT NULL
    CONSTRAINT fk_track_relations_from_track
    REFERENCES tracks(id) ON DELETE CASCADE,

  to_track_id UUID NOT NULL
    CONSTRAINT fk_track_relations_to_track
    REFERENCES tracks(id) ON DELETE CASCADE,

  relation_type VARCHAR(50),
  notes TEXT,

  created_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (from_track_id <> to_track_id),

  UNIQUE(from_track_id, to_track_id)
);

-- indexes
CREATE INDEX idx_track_relations_from ON track_relations(from_track_id);
CREATE INDEX idx_track_relations_to ON track_relations(to_track_id);

-- ✅ Prevent reverse duplicates (A↔B)
CREATE UNIQUE INDEX idx_track_relations_no_reverse_duplicates
ON track_relations (
  LEAST(from_track_id, to_track_id),
  GREATEST(from_track_id, to_track_id)
);

-- =====================================================
-- 5. PLAYLISTS
-- =====================================================
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playlists_user ON playlists(created_by);

-- =====================================================
-- 6. PLAYLIST TRACKS
-- =====================================================
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,

  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(playlist_id, track_id),
  UNIQUE(playlist_id, position)
);

CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track ON playlist_tracks(track_id);

-- =====================================================
-- 7. VIEWS
-- =====================================================
CREATE VIEW tracks_with_details AS
SELECT 
  t.id,
  t.name AS track_name,
  t.bpm,
  t.musical_key_name,

  ar.name AS artist_name,
  al.name AS album_name,
  al.image_url

FROM tracks t
LEFT JOIN artists ar ON t.artist_id = ar.id
LEFT JOIN albums al ON t.album_id = al.id;

CREATE VIEW playlist_covers AS
SELECT 
  p.id,
  json_agg(al.image_url ORDER BY pt.position) AS cover_images
FROM playlists p
LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
LEFT JOIN tracks t ON pt.track_id = t.id
LEFT JOIN albums al ON t.album_id = al.id
GROUP BY p.id;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION update_media_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracks_timestamp
BEFORE UPDATE ON tracks
FOR EACH ROW EXECUTE FUNCTION update_media_timestamp();

CREATE TRIGGER update_playlists_timestamp
BEFORE UPDATE ON playlists
FOR EACH ROW EXECUTE FUNCTION update_media_timestamp();

-- =====================================================
-- DONE
-- =====================================================
COMMIT;