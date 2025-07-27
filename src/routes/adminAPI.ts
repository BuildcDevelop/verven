// verven/src/routes/adminAPI.ts - NOVÝ SOUBOR
import { Router } from 'express';

const router = Router();

// Zatím mock data - později připojíme Convex
router.get('/worlds', async (req, res) => {
  try {
    console.log('🌍 Admin Panel žádá světy');
    
    // Mock data pro test
    const mockWorlds = [
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
    ];
    
    res.json(mockWorlds);
  } catch (error: any) {
    console.error('❌ Chyba:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/worlds', async (req, res) => {
  try {
    console.log('🔨 Admin Panel vytváří svět:', req.body);
    
    // Mock response
    res.json({
      success: true,
      worldId: "new-world-123",
      message: "Svět vytvořen (mock)"
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;