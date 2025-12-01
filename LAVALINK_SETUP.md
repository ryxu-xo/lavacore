# Lavalink Server Setup

## Option 1: Docker (Recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed

### Steps

1. **Start Lavalink server:**
```powershell
docker-compose up -d
```

2. **Check if it's running:**
```powershell
docker-compose ps
```

3. **View logs:**
```powershell
docker-compose logs -f lavalink
```

4. **Stop server:**
```powershell
docker-compose down
```

### Default Configuration
- **Host:** `localhost`
- **Port:** `2333`
- **Password:** `youshallnotpass`

---

## Option 2: Manual Setup

### Prerequisites
- [Java 17+](https://adoptium.net/) installed

### Steps

1. **Download Lavalink v4:**
```powershell
Invoke-WebRequest -Uri "https://github.com/lavalink-devs/Lavalink/releases/latest/download/Lavalink.jar" -OutFile "Lavalink.jar"
```

2. **Run Lavalink:**
```powershell
java -jar Lavalink.jar
```

It will use the `application.yml` configuration file in the same directory.

---

## Testing Connection

Run this PowerShell command to test:
```powershell
Invoke-WebRequest -Uri "http://localhost:2333/version" -Headers @{Authorization="youshallnotpass"}
```

You should see the Lavalink version info.

---

## Troubleshooting

### Port 2333 already in use
Change the port in both `docker-compose.yml` and `application.yml`, then update your bot config.

### YouTube not working
Lavalink v4 requires additional plugins for YouTube. Add to `application.yml`:
```yaml
lavalink:
  plugins:
    - dependency: "dev.lavalink.youtube:youtube-plugin:1.0.0"
      repository: "https://maven.lavalink.dev/releases"
```

### Connection refused
Make sure the Lavalink server is running and listening on the correct port.
