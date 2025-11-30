/**
 * AutoPlay - Intelligent track recommendations based on previous track
 * Fetches related tracks from YouTube, SoundCloud, or Spotify when queue ends
 */

import type { Player } from '../player/Player';
import type { Track } from '../types/lavalink';

export class AutoPlay {
  private playedIdentifiers: Set<string> = new Set();
  private maxHistorySize: number = 50;

  /**
   * Attempt to find and play a related track based on the previous track
   */
  public async execute(player: Player, previousTrack: Track): Promise<boolean> {
    if (!previousTrack) {
      player['eventEmitter'].emit('debug', '[AutoPlay] No previous track provided');
      return false;
    }

    // Check if node is connected
    if (!player.node.isConnected()) {
      player['eventEmitter'].emit('debug', '[AutoPlay] Node not connected, aborting');
      return false;
    }

    const sourceName = previousTrack.info.sourceName;
    const identifier = previousTrack.info.identifier || previousTrack.info.uri;

    // Add to played history
    if (identifier) {
      this.playedIdentifiers.add(identifier);
      if (this.playedIdentifiers.size > this.maxHistorySize) {
        const firstItem = this.playedIdentifiers.values().next().value;
        if (firstItem) {
          this.playedIdentifiers.delete(firstItem);
        }
      }
    }

    player['eventEmitter'].emit('debug', `[AutoPlay] Initiated for ${sourceName}: ${previousTrack.info.title}`);

    try {
      switch (sourceName) {
        case 'youtube':
          return await this.handleYouTube(player, previousTrack);
        case 'soundcloud':
          return await this.handleSoundCloud(player, previousTrack);
        case 'spotify':
          return await this.handleSpotify(player, previousTrack);
        default:
          return await this.handleYouTube(player, previousTrack); // Fallback to YouTube
      }
    } catch (error) {
      player['eventEmitter'].emit('debug', `[AutoPlay] Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * YouTube AutoPlay - Uses YouTube's RD (Radio/Recommendations) playlist
   */
  private async handleYouTube(player: Player, previousTrack: Track): Promise<boolean> {
    const identifier = previousTrack.info.identifier;
    if (!identifier) {
      player['eventEmitter'].emit('debug', '[AutoPlay] No identifier found for YouTube track');
      return false;
    }

    // YouTube's RD playlist URL for recommendations
    const rdUrl = `https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}`;
    player['eventEmitter'].emit('debug', `[AutoPlay] Searching YouTube RD: ${rdUrl}`);
    
    const result = await player.search(rdUrl, 'ytsearch');
    player['eventEmitter'].emit('debug', `[AutoPlay] Search result type: ${result.loadType}`);

    if (result.loadType === 'error' || result.loadType === 'empty') {
      player['eventEmitter'].emit('debug', `[AutoPlay] YouTube search failed: ${result.loadType}`);
      return false;
    }

    let tracks: Track[] = [];
    if (result.loadType === 'playlist') {
      tracks = result.data.tracks;
    } else if (result.loadType === 'search') {
      tracks = result.data;
    } else if (result.loadType === 'track') {
      tracks = [result.data];
    }

    player['eventEmitter'].emit('debug', `[AutoPlay] Found ${tracks.length} tracks`);

    // Filter out already played tracks
    let availableTracks = tracks.filter(track => {
      const trackId = track.info.identifier || track.info.uri;
      return trackId && !this.playedIdentifiers.has(trackId);
    });

    // If all tracks have been played, reset and use all tracks
    if (availableTracks.length === 0) {
      availableTracks = tracks;
      player['eventEmitter'].emit('debug', '[AutoPlay] All tracks played, resetting filter');
    }

    if (availableTracks.length === 0) {
      player['eventEmitter'].emit('debug', '[AutoPlay] No available tracks after filtering');
      return false;
    }

    // Pick a random track
    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    player.addTrack(randomTrack);
    await player.play();
    
    player['eventEmitter'].emit('debug', `[AutoPlay] Added YouTube track: ${randomTrack.info.title}`);
    return true;
  }

  /**
   * SoundCloud AutoPlay - Uses SoundCloud's related tracks
   */
  private async handleSoundCloud(player: Player, previousTrack: Track): Promise<boolean> {
    const uri = previousTrack.info.uri;
    if (!uri) return false;

    // Search for related SoundCloud tracks
    const query = `${previousTrack.info.title} ${previousTrack.info.author}`;
    const result = await player.search(query, 'scsearch');

    if (result.loadType === 'error' || result.loadType === 'empty') {
      return false;
    }

    let tracks: Track[] = [];
    if (result.loadType === 'search') {
      tracks = result.data;
    } else if (result.loadType === 'track') {
      tracks = [result.data];
    }

    // Filter out already played tracks
    let availableTracks = tracks.filter(track => {
      const trackId = track.info.identifier || track.info.uri;
      return trackId && !this.playedIdentifiers.has(trackId);
    });

    if (availableTracks.length === 0) {
      availableTracks = tracks;
    }

    if (availableTracks.length === 0) {
      return false;
    }

    const randomTrack = availableTracks[Math.floor(Math.random() * availableTracks.length)];
    player.addTrack(randomTrack);
    await player.play();
    
    player['eventEmitter'].emit('debug', `[AutoPlay] Added SoundCloud track: ${randomTrack.info.title}`);
    return true;
  }

  /**
   * Spotify AutoPlay - Converts to YouTube, gets recommendations, converts back
   */
  private async handleSpotify(player: Player, previousTrack: Track): Promise<boolean> {
    // Step 1: Search for the Spotify track on YouTube
    const ytQuery = `${previousTrack.info.title} ${previousTrack.info.author} official`;
    const ytResult = await player.search(ytQuery, 'ytsearch');

    if (ytResult.loadType === 'error' || ytResult.loadType === 'empty') {
      return false;
    }

    let ytTrack: Track | null = null;
    if (ytResult.loadType === 'search' && ytResult.data.length > 0) {
      ytTrack = ytResult.data[0];
    } else if (ytResult.loadType === 'track') {
      ytTrack = ytResult.data;
    }

    if (!ytTrack || !ytTrack.info.identifier) {
      return false;
    }

    // Step 2: Get YouTube recommendations using RD playlist
    const rdUrl = `https://www.youtube.com/watch?v=${ytTrack.info.identifier}&list=RD${ytTrack.info.identifier}`;
    const rdResult = await player.search(rdUrl, 'ytsearch');

    if (rdResult.loadType === 'error' || rdResult.loadType === 'empty') {
      return false;
    }

    let rdTracks: Track[] = [];
    if (rdResult.loadType === 'playlist') {
      rdTracks = rdResult.data.tracks;
    } else if (rdResult.loadType === 'search') {
      rdTracks = rdResult.data;
    }

    if (rdTracks.length === 0) {
      return false;
    }

    // Pick a random recommended track
    const recommendedTrack = rdTracks[Math.floor(Math.random() * rdTracks.length)];
    
    // Step 3: Parse and clean the track title
    let songTitle = recommendedTrack.info.title || '';
    let artist = recommendedTrack.info.author || '';

    // Parse "Artist - Title" format
    const dashMatch = songTitle.match(/^\s*(.+?)\s*-\s*(.+)\s*$/);
    if (dashMatch) {
      const parsedArtist = dashMatch[1].trim();
      const parsedTitle = dashMatch[2].trim();
      if (parsedArtist && parsedTitle && parsedArtist.toLowerCase() !== parsedTitle.toLowerCase()) {
        artist = parsedArtist;
        songTitle = parsedTitle;
      }
    }

    // Clean up title - remove noise
    songTitle = songTitle.replace(/\s*[\[(][^\])]+[\])]/g, '').trim();
    songTitle = songTitle.replace(/\b(official\s+music\s+video|official\s+video|official|music\s+video|lyrics?|audio|hd|mv|clip)\b/gi, '').trim();
    
    if (songTitle.includes('|') || songTitle.includes(':')) {
      songTitle = songTitle.split(/\||:/)[0].trim();
    }
    
    songTitle = songTitle.replace(/\s{2,}/g, ' ');

    // Step 4: Search for the track on YouTube (since Spotify requires plugin)
    const finalQuery = `${songTitle} ${artist}`.trim();
    const finalResult = await player.search(finalQuery, 'ytsearch');

    if (finalResult.loadType === 'error' || finalResult.loadType === 'empty') {
      return false;
    }

    let finalTracks: Track[] = [];
    if (finalResult.loadType === 'search') {
      finalTracks = finalResult.data;
    } else if (finalResult.loadType === 'track') {
      finalTracks = [finalResult.data];
    }

    // Filter valid tracks (duration >= 60s, not played before)
    let validTracks = finalTracks.filter(track => {
      const duration = track.info.length || 0;
      const trackId = track.info.identifier || track.info.uri;
      return duration >= 60000 && trackId && !this.playedIdentifiers.has(trackId);
    });

    if (validTracks.length === 0) {
      validTracks = finalTracks.filter(track => {
        const duration = track.info.length || 0;
        return duration >= 60000;
      });
    }

    if (validTracks.length === 0) {
      return false;
    }

    const track = validTracks[0]; // Use the most relevant result
    player.addTrack(track);
    await player.play();
    
    player['eventEmitter'].emit('debug', `[AutoPlay] Added recommended track: ${track.info.title}`);
    return true;
  }

  /**
   * Clear played history
   */
  public clearHistory(): void {
    this.playedIdentifiers.clear();
  }

  /**
   * Get played history size
   */
  public getHistorySize(): number {
    return this.playedIdentifiers.size;
  }
}
