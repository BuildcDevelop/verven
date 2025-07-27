// verven/admin-api-server.cjs - KOMPLETNÍ OPRAVENÁ VERZE
const http = require('http');
const url = require('url');

const PORT = 4001;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`📡 ${req.method} ${req.url}`);
  
  if (parsedUrl.pathname === '/api/admin/worlds' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify([
      {
        id: "1",
        name: "Test Svět",
        slug: "test-svet", 
        status: "active",
        currentPlayers: 0,
        maxPlayers: 500,
        mapSize: { width: 1000, height: 1000 },
        createdAt: new Date().toISOString(),
        settings: {
          speed: 1.0,
          unitSpeed: 1.0,
          maxPlayers: 500,
          barbarianSpawnChance: 100
        }
      }
    ]));
  } 
  else if (parsedUrl.pathname === '/api/admin/worlds' && req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const worldData = JSON.parse(body);
        console.log('🔨 Creating world:', worldData);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          message: `Svět "${worldData.name}" byl úspěšně vytvořen`,
          data: {
            worldId: "new-world-123",
            name: worldData.name,
            slug: worldData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            status: "active",
            currentPlayers: 0,
            maxPlayers: worldData.settings?.maxPlayers || 500,
            mapSize: worldData.mapSize || { width: 1000, height: 1000 },
            createdAt: new Date().toISOString(),
            settings: worldData.settings || {
              speed: 1.0,
              unitSpeed: 1.0,
              maxPlayers: 500,
              barbarianSpawnChance: 100
            },
            generationTime: 1000,
            tilesGenerated: (worldData.mapSize?.width || 1000) * (worldData.mapSize?.height || 1000)
          }
        }));
      } catch (error) {
        console.error('❌ Error parsing request:', error);
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON in request body' }));
      }
    });
  }
  else if (parsedUrl.pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'Verven Admin API running',
      port: PORT
    }));
  }
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Verven Admin API running on http://localhost:${PORT}`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/admin/worlds`);
});