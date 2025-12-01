/**
 * Example usage of Lava.ts with Discord.js
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { Manager, Events } from './src/index';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create Lavalink manager
const manager = new Manager({
  nodes: [
    {
      name: 'Main Node',
      host: 'localhost',
      port: 2333,
      password: 'youshallnotpass',
      secure: false,
      resumeKey: 'lava.ts-example',
      resumeTimeout: 60,
    },
    {
      name: 'Backup Node',
      host: 'backup.example.com',
      port: 2333,
      password: 'youshallnotpass',
      secure: true,
    },
  ],
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      guild.shard.send(payload);
    }
  },
  autoPlay: true,
  defaultSearchPlatform: 'ytsearch',
});

// Initialize manager when client is ready
client.once('ready', async () => {
  console.log(`Logged in as ${client.user!.tag}`);
  
  try {
    await manager.init(client.user!.id);
    console.log('Lavalink manager initialized');
  } catch (error) {
    console.error('Failed to initialize manager:', error);
  }
});

// Forward voice state updates to manager
client.on('raw', (packet) => {
  manager.updateVoiceState(packet);
});

// ==================== Manager Events ====================

manager.on(Events.NodeConnect, (node) => {
  console.log(`Node ${node.options.name} connected`);
});

manager.on(Events.NodeDisconnect, (node, code, reason) => {
  console.log(`Node ${node.options.name} disconnected: ${code} - ${reason}`);
});

manager.on(Events.NodeError, (node, error) => {
  console.error(`Node ${node.options.name} error:`, error);
});

manager.on(Events.NodeReconnect, (node, attempt) => {
  console.log(`Node ${node.options.name} reconnecting (attempt ${attempt})`);
});

manager.on(Events.TrackStart, (player, track) => {
  console.log(`Now playing: ${track.info.title} by ${track.info.author}`);
  
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && channel.isTextBased()) {
    channel.send(`🎵 Now playing: **${track.info.title}** by ${track.info.author}`);
  }
});

manager.on(Events.TrackEnd, (player, track, reason) => {
  console.log(`Track ended: ${track.info.title} (${reason})`);
});

manager.on(Events.TrackException, (player, track, exception) => {
  console.error(`Track exception: ${track.info.title}`, exception);
  
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && channel.isTextBased()) {
    channel.send(`❌ Error playing track: ${exception.message}`);
  }
});

manager.on(Events.TrackStuck, (player, track, thresholdMs) => {
  console.log(`Track stuck: ${track.info.title} (${thresholdMs}ms)`);
});

manager.on(Events.QueueEnd, (player) => {
  console.log(`Queue ended for guild ${player.guildId}`);
  
  const channel = client.channels.cache.get(player.textChannelId!);
  if (channel && channel.isTextBased()) {
    channel.send('✅ Queue finished playing');
  }
});

// ==================== Message Commands ====================

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  try {
    switch (command) {
      case 'play': {
        if (!message.member?.voice.channel) {
          return message.reply('You need to be in a voice channel!');
        }

        const query = args.join(' ');
        if (!query) {
          return message.reply('Please provide a search query or URL');
        }

        // Create or get player
        let player = manager.get(message.guildId!);
        if (!player) {
          player = manager.create({
            guildId: message.guildId!,
            voiceChannelId: message.member.voice.channel.id,
            textChannelId: message.channelId,
            selfDeafen: true,
            volume: 50,
          });
          await player.connect();
        }

        // Search for tracks
        const result = await player.search(query);

        if (result.loadType === 'empty') {
          return message.reply('No results found');
        }

        if (result.loadType === 'error') {
          return message.reply(`Error: ${result.data.message}`);
        }

        if (result.loadType === 'track') {
          // Single track
          if (player.track) {
            player.addTrack(result.data);
            message.reply(`Added to queue: **${result.data.info.title}**`);
          } else {
            await player.play(result.data);
            message.reply(`Now playing: **${result.data.info.title}**`);
          }
        } else if (result.loadType === 'playlist') {
          // Playlist
          player.addTracks(result.data.tracks);
          if (!player.track) {
            await player.play();
          }
          message.reply(
            `Added playlist: **${result.data.info.name}** (${result.data.tracks.length} tracks)`
          );
        } else if (result.loadType === 'search') {
          // Search results - play first result
          const track = result.data[0];
          if (player.track) {
            player.addTrack(track);
            message.reply(`Added to queue: **${track.info.title}**`);
          } else {
            await player.play(track);
            message.reply(`Now playing: **${track.info.title}**`);
          }
        }
        break;
      }

      case 'pause': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.pause();
        message.reply('⏸️ Paused');
        break;
      }

      case 'resume': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.resume();
        message.reply('▶️ Resumed');
        break;
      }

      case 'skip': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        const skipped = await player.skip();
        message.reply(skipped ? '⏭️ Skipped' : 'No more tracks in queue');
        break;
      }

      case 'stop': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.stop();
        message.reply('⏹️ Stopped');
        break;
      }

      case 'volume': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        const volume = parseInt(args[0]);
        if (isNaN(volume) || volume < 0 || volume > 100) {
          return message.reply('Volume must be between 0 and 100');
        }
        
        await player.setVolume(volume);
        message.reply(`🔊 Volume set to ${volume}%`);
        break;
      }

      case 'queue': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        if (!player.track && player.queue.length === 0) {
          return message.reply('Queue is empty');
        }

        const current = player.track ? `**Now Playing:**\n${player.track.info.title}\n\n` : '';
        const upcoming = player.queue.slice(0, 10).map((track, i) => 
          `${i + 1}. ${track.info.title}`
        ).join('\n');
        
        const more = player.queue.length > 10 ? `\n\n...and ${player.queue.length - 10} more` : '';
        
        message.reply(`${current}**Queue:**\n${upcoming || 'Empty'}${more}`);
        break;
      }

      case 'nowplaying':
      case 'np': {
        const player = manager.get(message.guildId!);
        if (!player || !player.track) return message.reply('Nothing is playing');
        
        const track = player.track;
        const progress = formatTime(player.position);
        const duration = formatTime(track.info.length);
        
        message.reply(
          `🎵 **Now Playing:**\n` +
          `${track.info.title}\n` +
          `by ${track.info.author}\n` +
          `${progress} / ${duration}`
        );
        break;
      }

      case 'bassboost': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        const level = args[0] as 'low' | 'medium' | 'high' | 'extreme' || 'medium';
        await player.filters().bassboost(level).apply();
        message.reply(`🔊 Bass boost set to ${level}`);
        break;
      }

      case 'nightcore': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.filters().nightcore().apply();
        message.reply('✨ Nightcore effect applied');
        break;
      }

      case 'vaporwave': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.filters().vaporwave().apply();
        message.reply('🌊 Vaporwave effect applied');
        break;
      }

      case '8d': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.filters().eightD().apply();
        message.reply('🎧 8D audio effect applied');
        break;
      }

      case 'clearfilters': {
        const player = manager.get(message.guildId!);
        if (!player) return message.reply('No player found');
        
        await player.clearFilters();
        message.reply('🔄 Filters cleared');
        break;
      }

      case 'leave': {
        const destroyed = await manager.destroyPlayer(message.guildId!);
        message.reply(destroyed ? '👋 Left voice channel' : 'Not in a voice channel');
        break;
      }

      case 'stats': {
        const stats = manager.getStats();
        message.reply(
          `**Lavalink Statistics:**\n` +
          `Nodes: ${stats.connectedNodes}/${stats.totalNodes}\n` +
          `Players: ${stats.totalPlayers}\n` +
          `Playing: ${stats.totalPlayingPlayers}\n` +
          `Average CPU: ${stats.averageCpuLoad.toFixed(2)}%\n` +
          `Memory: ${formatBytes(stats.totalMemoryUsed)} / ${formatBytes(stats.totalMemoryAllocated)}`
        );
        break;
      }
    }
  } catch (error) {
    console.error('Command error:', error);
    message.reply(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// ==================== Utility Functions ====================

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Login to Discord
client.login('YOUR_BOT_TOKEN');
