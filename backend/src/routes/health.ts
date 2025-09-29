const { Router } = require("express");
const health = Router();

// Explicitly import types for better clarity
const { Request, Response } = require("express");


health.get("/", (_req: typeof Request, res: typeof Response) => {
  res.json({ 
    ok: true, 
    service: "backend", 
    ts: new Date().toISOString() 
  });
});

module.exports = health;
