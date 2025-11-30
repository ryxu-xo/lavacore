# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-12-01

### Added

#### Core Features
- Complete Lavalink v4 support with full REST API and WebSocket protocol implementation
- TypeScript-first design with comprehensive type definitions
- Singleton `NodeManager` with intelligent load balancing based on penalty system
- Factory pattern for `Player` creation through `Manager`
- Builder pattern for fluent filter configuration via `FilterBuilder`
- Event-driven architecture with typed `EventEmitter`

#### Node Management
- Automatic reconnection with exponential backoff and jitter
- Session resumption support
- Health monitoring with heartbeat tracking
- Configurable reconnection attempts and delays
- Real-time node statistics tracking
- Penalty-based load balancing algorithm
- Pluggable custom penalty calculator
- Node health checks

#### Player Features
- Full playback control (play, pause, resume, stop, seek)
- Volume management (0-100 range with Lavalink conversion)
- Queue management (add, remove, shuffle, move, clear)
- Track history tracking (previous tracks)
- Search integration with multiple platforms
- Auto-play next track in queue
- Position tracking with real-time updates
- Voice state management

#### Filter System
- Complete v4 filter support:
  - Volume, Equalizer (15 bands)
  - Karaoke, Timescale
  - Tremolo, Vibrato
  - Rotation (8D audio)
  - Distortion, Channel Mix
  - Low Pass
- Fluent/chainable filter API
- Pre-built filter presets:
  - Bass, Treble, Soft, Flat
  - Electronic, Rock, Classical, Pop
- Effect presets:
  - Nightcore, Vaporwave
  - 8D Audio, Bass Boost (4 levels)
  - Soft audio
- Filter state management (get, set, merge, clear)

#### Voice Management
- `VoiceForwarder` for Discord voice state handling
- Automatic VOICE_SERVER_UPDATE processing
- Automatic VOICE_STATE_UPDATE processing
- Complete voice state aggregation
- Player movement detection
- Voice connection tracking

#### Developer Experience
- Full TypeScript autocomplete support
- Comprehensive JSDoc documentation
- Type-safe event handlers
- Descriptive error messages
- Debug event emission
- Extensive examples

#### Utilities
- `HttpClient` for REST API calls with fetch
- `ExponentialBackoff` utility with jitter
- Async sleep helper
- Retry logic with backoff

#### Documentation
- Complete README with quick start guide
- API reference documentation
- Advanced usage patterns guide
- Installation and setup guide
- Contributing guidelines
- Discord.js integration example
- Multiple use case examples

#### Configuration
- TypeScript configuration (strict mode)
- ESLint configuration with TypeScript rules
- Package.json with proper dependencies
- Git ignore patterns
- MIT License

### Technical Details

#### Design Patterns
- **Singleton**: NodeManager for centralized node management
- **Factory**: Player creation through Manager
- **Builder**: FilterBuilder for chainable API
- **Event-Driven**: Comprehensive event system

#### Lavalink v4 Compliance
- Update Player REST endpoint (`/v4/sessions/{sessionId}/players/{guildId}`)
- WebSocket path (`/v4/websocket`)
- Required headers (Authorization, User-Id, Client-Name, Resume-Key)
- All v4 filters supported
- Complete load result types (track, playlist, search, empty, error)
- Track encoding/decoding
- Session management with resumption

#### Load Balancing Algorithm
- Player count penalty
- Playing player count penalty (higher weight)
- CPU load penalty (normalized by core count)
- Memory usage penalty (threshold-based)
- Frame stats penalty (deficit and nulled frames)
- Pluggable for custom strategies

#### Fault Tolerance
- Exponential backoff: base delay × 2^attempt
- Random jitter to prevent thundering herd
- Configurable maximum attempts
- Automatic backoff reset on success
- Connection timeout handling
- Heartbeat monitoring (30s timeout)
- Graceful degradation

### Performance
- Efficient WebSocket connection handling
- Minimal REST API calls
- Position tracking optimization
- Connection pooling across nodes
- Lazy evaluation where appropriate

### Dependencies
- `ws` ^8.14.2 - WebSocket client
- TypeScript ^5.3.2 - Type system
- @types/node ^20.10.0 - Node.js types
- @types/ws ^8.5.9 - WebSocket types

### Peer Dependencies
- discord.js ^14.x (optional)

## [0.1.0] - Initial Development

### Added
- Initial project structure
- Basic TypeScript setup
- Core interfaces and types

---

## Version Guidelines

### Major Version (X.0.0)
- Breaking API changes
- Major architectural changes
- Lavalink protocol version changes

### Minor Version (0.X.0)
- New features (backward compatible)
- New filter types
- New convenience methods
- Performance improvements

### Patch Version (0.0.X)
- Bug fixes
- Documentation updates
- Minor improvements
- Dependency updates

[Unreleased]: https://github.com/yourusername/lava.ts/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/lava.ts/releases/tag/v1.0.0
[0.1.0]: https://github.com/yourusername/lava.ts/releases/tag/v0.1.0
