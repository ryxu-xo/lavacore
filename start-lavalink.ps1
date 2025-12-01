# Test if Docker is available and start Lavalink

Write-Host "🔍 Checking Docker installation..." -ForegroundColor Cyan

try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
        
        Write-Host "`n🚀 Starting Lavalink server..." -ForegroundColor Cyan
        docker-compose up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Lavalink started successfully!" -ForegroundColor Green
            Write-Host "`n📋 Connection Details:" -ForegroundColor Yellow
            Write-Host "  Host: localhost" -ForegroundColor White
            Write-Host "  Port: 2333" -ForegroundColor White
            Write-Host "  Password: youshallnotpass" -ForegroundColor White
            
            Write-Host "`n⏳ Waiting 5 seconds for Lavalink to initialize..." -ForegroundColor Cyan
            Start-Sleep -Seconds 5
            
            Write-Host "`n🧪 Testing connection..." -ForegroundColor Cyan
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:2333/version" -Headers @{Authorization="youshallnotpass"} -ErrorAction Stop
                Write-Host "✅ Lavalink is responding!" -ForegroundColor Green
                Write-Host "   Version info: $($response.Content)" -ForegroundColor White
            } catch {
                Write-Host "⚠️  Lavalink not ready yet. Wait a moment and run your bot." -ForegroundColor Yellow
            }
            
            Write-Host "`n💡 To view logs: docker-compose logs -f lavalink" -ForegroundColor Cyan
            Write-Host "💡 To stop: docker-compose down" -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to start Lavalink with Docker Compose" -ForegroundColor Red
            Write-Host "   Make sure docker-compose.yml exists in current directory" -ForegroundColor Yellow
        }
    } else {
        throw "Docker not found"
    }
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "`n📦 Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host "`n   OR use a different public Lavalink server" -ForegroundColor Yellow
    Write-Host "`n🌐 Alternative: Try this stable public server in your example:" -ForegroundColor Yellow
    Write-Host "   host: 'lava-v4.ajieblogs.eu.org'" -ForegroundColor White
    Write-Host "   port: 80" -ForegroundColor White
    Write-Host "   password: 'https://dsc.gg/ajidevserver'" -ForegroundColor White
    Write-Host "   secure: false" -ForegroundColor White
}
