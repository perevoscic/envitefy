import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory store for demo (since user declined Firebase)
  const threads: any[] = [];
  const events: any[] = [];

  // API Routes
  app.get("/api/creation/threads", (req, res) => {
    res.json(threads.slice(0, 20));
  });

  app.post("/api/creation/threads", (req, res) => {
    const newThread = {
      id: Math.random().toString(36).substring(7),
      title: "New Celebration",
      createdAt: new Date().toISOString(),
      messages: []
    };
    threads.unshift(newThread);
    res.json(newThread);
  });

  app.delete("/api/creation/threads/:id", (req, res) => {
    const index = threads.findIndex(t => t.id === req.params.id);
    if (index !== -1) threads.splice(index, 1);
    res.sendStatus(204);
  });

  app.post("/api/creation/intake", (req, res) => {
    // This would typically handle backend-specific logic
    // But since Gemini calls must be frontend, this mostly persists state
    const { threadId, draft } = req.body;
    // Simulate persistence
    res.json({ status: "success", draft });
  });

  app.post("/api/concierge/generate", (req, res) => {
    const { draft } = req.body;
    const newEvent = {
        id: Math.random().toString(36).substring(7),
        ...draft,
        status: "generated",
        assets: [
            { type: "flyer", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop" }
        ],
        rsvps: [
          { id: "1", name: "Sarah Miller", email: "sarah@example.com", status: "attending", timestamp: new Date().toISOString() },
          { id: "2", name: "James Wilson", email: "james@example.com", status: "attending", timestamp: new Date().toISOString() },
          { id: "3", name: "Emma Thompson", email: "emma@example.com", status: "not_attending", timestamp: new Date().toISOString() },
          { id: "4", name: "David Chen", email: "david@example.com", status: "maybe", timestamp: new Date().toISOString() },
        ],
        createdAt: new Date().toISOString()
    };
    events.push(newEvent);
    res.json(newEvent);
  });

  app.post("/api/events/:id/rsvp", (req, res) => {
    const event = events.find(e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    
    const rsvp = {
      id: Math.random().toString(36).substring(7),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    if (!event.rsvps) event.rsvps = [];
    event.rsvps.push(rsvp);
    res.json(rsvp);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
