# Port Configuration

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| **Backend API** | 8090 | http://localhost:8090 |
| **Frontend UI** | 8081 | http://localhost:8081 |
| **Target Service** (config) | 9095 | http://localhost:9095 |

## Starting Services

### Backend
```bash
cd nextest-platform
make run
# or
./test-service
```
Access: http://localhost:8090

### Frontend
```bash
cd NextTestPlatformUI
npm run dev
```
Access: http://localhost:8081

## Configuration Files

### Backend Port
File: `nextest-platform/config.toml`
```toml
[server]
host = "0.0.0.0"
port = 8090
```

### Frontend Port
File: `NextTestPlatformUI/vite.config.ts`
```typescript
server: {
  port: 8081,
  host: '0.0.0.0',
}
```

### Target Service Port
File: `nextest-platform/config.toml`
```toml
[test]
target_host = "http://127.0.0.1:9095"
```

## Changing Ports

### Change Backend Port
1. Edit `nextest-platform/config.toml`
2. Update `[server].port` value
3. Restart service

### Change Frontend Port
1. Edit `NextTestPlatformUI/vite.config.ts`
2. Update `server.port` value
3. Restart dev server

## Common Issues

### Port Already in Use

**Check what's using the port:**
```bash
# macOS/Linux
lsof -i :8090
lsof -i :8081

# Kill process
kill -9 <PID>
```

### Frontend Can't Connect to Backend

Ensure backend is running on port 8090:
```bash
curl http://localhost:8090/api/health
```

Expected response:
```json
{"status":"ok"}
```
