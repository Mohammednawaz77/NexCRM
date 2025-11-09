import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertLeadSchema, insertActivitySchema } from "@shared/schema";

interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
  };
}

const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

const requireRole = (...roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/users", requireRole("admin"), async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(({ password, ...user }) => user));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  const sanitizeUser = (user: any) => {
    if (!user) return user;
    const { password, ...sanitized } = user;
    return sanitized;
  };

  const sanitizeLead = (lead: any) => {
    return {
      ...lead,
      owner: sanitizeUser(lead.owner),
      activities: lead.activities?.map((activity: any) => ({
        ...activity,
        user: sanitizeUser(activity.user),
      })),
    };
  };

  app.get("/api/leads", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const leads = await storage.getAllLeads(req.user?.id, req.user?.role);
      res.json(leads.map(sanitizeLead));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  app.get("/api/leads/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const lead = await storage.getLeadById(id);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (req.user?.role === "sales_executive" && lead.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(sanitizeLead(lead));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const dataToValidate = { ...req.body };
      
      if (req.user?.role === "sales_executive") {
        dataToValidate.ownerId = req.user.id;
      }

      const validatedData = insertLeadSchema.parse(dataToValidate);

      const lead = await storage.createLead(validatedData);
      
      broadcastToClients({ type: "lead_created", data: sanitizeLead(lead) });
      
      res.status(201).json(lead);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertLeadSchema.partial().parse(req.body);

      const existingLead = await storage.getLeadById(id);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (req.user?.role === "sales_executive" && existingLead.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const lead = await storage.updateLead(id, validatedData);
      const updatedLead = await storage.getLeadById(id);
      
      broadcastToClients({ type: "lead_updated", data: updatedLead ? sanitizeLead(updatedLead) : lead });
      
      res.json(lead);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", requireRole("admin", "manager"), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const existingLead = await storage.getLeadById(id);
      if (!existingLead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      await storage.deleteLead(id);
      
      broadcastToClients({ type: "lead_deleted", data: { id } });
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  app.post("/api/activities", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const leadId = parseInt(req.body.leadId);
      const lead = await storage.getLeadById(leadId);
      
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      if (req.user?.role === "sales_executive" && lead.ownerId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You can only add activities to your own leads" });
      }

      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId: req.user?.id,
      });

      const activity = await storage.createActivity(validatedData);
      
      broadcastToClients({ type: "activity_created", data: { ...activity, user: sanitizeUser(req.user) } });
      
      res.status(201).json(activity);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create activity" });
    }
  });

  app.get("/api/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getStats(req.user?.id, req.user?.role);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics", requireRole("admin", "manager"), async (req: AuthenticatedRequest, res) => {
    try {
      const analytics = await storage.getAnalytics(req.user?.id, req.user?.role);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });

    ws.send(JSON.stringify({ type: 'connected', message: 'Connected to CRM WebSocket' }));
  });

  function broadcastToClients(data: any) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  return httpServer;
}
