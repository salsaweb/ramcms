/**
 * Spotify API Integration Service
 * Fetches track, artist, and album metadata from Spotify
 * Uses public Spotify Web API (no OAuth required)
 */

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

interface SpotifyAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expiresAt: number;
}

let cachedToken: SpotifyAuthToken | null = null;

/**
 * Get Spotify access token using Client Credentials flow
 */
async function getSpotifyAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify auth failed: ${error}`);
  }

  const data = await response.json();
  
  cachedToken = {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // Refresh 1min early
  };

  return cachedToken.access_token;
}

/**
 * Parse Spotify URL to extract ID and type
 */
export function parseSpotifyUrl(url: string): { type: 'track' | 'artist' | 'album'; id: string } | null {
  // Handle different Spotify URL formats:
  // https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
  // https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp?si=xyz
  // spotify:track:3n3Ppam7vgaVa1iaRUc9Lp
  
  const urlPattern = /(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|artist|album)\/([a-zA-Z0-9]+)/;
  const uriPattern = /spotify:(track|artist|album):([a-zA-Z0-9]+)/;
  
  let match = url.match(urlPattern) || url.match(uriPattern);
  
  if (match) {
    return {
      type: match[1] as 'track' | 'artist' | 'album',
      id: match[2],
    };
  }
  
  return null;
}

/**
 * Fetch track data from Spotify
 */
export async function getSpotifyTrack(trackId: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}/tracks/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new Error('Spotify API rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch track: ${error}`);
  }

  return await response.json();
}

/**
 * Fetch audio features for a track (BPM, key, energy, etc.)
 */
export async function getSpotifyAudioFeatures(trackId: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}/audio-features/${trackId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new Error('Spotify API rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    return null; // Audio features not always available
  }

  return await response.json();
}

/**
 * Fetch artist data from Spotify
 */
export async function getSpotifyArtist(artistId: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new Error('Spotify API rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch artist: ${error}`);
  }

  return await response.json();
}

/**
 * Fetch album data from Spotify
 */
export async function getSpotifyAlbum(albumId: string) {
  const token = await getSpotifyAccessToken();
  
  const response = await fetch(`${SPOTIFY_API_BASE}/albums/${albumId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 429) {
    throw new Error('Spotify API rate limit exceeded. Please try again later.');
  }

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch album: ${error}`);
  }

  return await response.json();
}

/**
 * Convert Spotify key notation to human-readable format
 */
export function getMusicalKeyName(key: number, mode: number): string {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyName = keys[key] || 'Unknown';
  const modeName = mode === 1 ? '' : 'm'; // 1 = major, 0 = minor
  return keyName + modeName;
}

/**
 * Format duration from milliseconds to MM:SS
 */
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}