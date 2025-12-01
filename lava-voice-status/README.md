# lava-voice-status

Public plugin for [lava.ts](https://github.com/ryxu-xo/lava.ts) to update Discord voice channel status and user activity based on playback events.

## Features
- Updates Discord voice channel status (via Discord API)
- Customizable status template (e.g., `Now playing: {title}`)
- Can clear status when playback ends
- TypeScript types included

## Usage
```js
const { LavaVoiceStatusPlugin } = require('lava-plugin-voice-status');
const plugin = new LavaVoiceStatusPlugin(botClient, { template: 'Now playing: {title}' });
manager.use({
  name: 'LavaVoiceStatus',
  onEvent(event, ...args) {
    if (event === 'trackStart') {
      const [player, track] = args;
      plugin.setVoiceStatus(player.voiceChannelId, track.info);
    }
    if (event === 'trackEnd') {
      const [player] = args;
      plugin.clearVoiceStatus(player.voiceChannelId);
    }
  }
});
```

## Options
- `template`: Status string, supports `{title}`, `{author}`, etc.
- `endpoint`: Discord API endpoint (default: `https://discord.com/api/v10/channels`)

## License
MIT

## Author
ryxu-xo
