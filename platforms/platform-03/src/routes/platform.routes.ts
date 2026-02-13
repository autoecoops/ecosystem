import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { checkBaselineDrift, registerNode, getInventory, getNode } from '../services/baseline.service';
import { registerAgent, updateHeartbeat, getAgents } from '../services/edge.agent';

const router = Router();

// POST /platform/nodes/register - Register a node with baseline
router.post('/nodes/register', (req: Request, res: Response): void => {
  const baseline = req.body;
  if (!baseline.nodeId || !baseline.hostname) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'nodeId and hostname are required' } });
    return;
  }
  
  // Validate required nested fields for drift checking
  if (!baseline.securityBaseline || typeof baseline.securityBaseline !== 'object') {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'securityBaseline object is required' } });
    return;
  }
  
  // Create validated object with defaults instead of mutating input
  const validatedBaseline = {
    ...baseline,
    services: baseline.services || [],
    packages: baseline.packages || [],
  };
  
  registerNode(validatedBaseline);
  res.status(201).json({ success: true, data: { nodeId: validatedBaseline.nodeId }, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

// GET /platform/nodes/inventory - Get hardware inventory
router.get('/nodes/inventory', (_req: Request, res: Response): void => {
  const inventory = getInventory();
  res.json({ success: true, data: inventory, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

// POST /platform/nodes/:nodeId/drift-check - Check baseline drift
router.post('/nodes/:nodeId/drift-check', (req: Request, res: Response): void => {
  const node = getNode(req.params.nodeId);
  if (!node) { res.status(404).json({ success: false, error: { code: 'NODE_NOT_FOUND', message: 'Node not found' } }); return; }
  const drifts = checkBaselineDrift(node);
  res.json({ success: true, data: { nodeId: req.params.nodeId, drifts, driftCount: drifts.length }, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

// POST /platform/agents/register - Register an edge agent
router.post('/agents/register', (req: Request, res: Response): void => {
  const agent = req.body;
  if (!agent.agentId || !agent.nodeId) {
    res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'agentId and nodeId are required' } });
    return;
  }
  
  // Validate status value
  const validStatuses = ['online', 'offline', 'degraded'] as const;
  const status = agent.status || 'online';
  if (!validStatuses.includes(status as typeof validStatuses[number])) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'status must be one of: online, offline, degraded' } });
    return;
  }
  
  // Create validated object with server-side defaults
  const validatedAgent = {
    ...agent,
    lastHeartbeat: agent.lastHeartbeat || new Date().toISOString(),
    status,
  };
  
  registerAgent(validatedAgent);
  res.status(201).json({ success: true, data: { agentId: validatedAgent.agentId }, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

// POST /platform/agents/:agentId/heartbeat - Agent heartbeat
router.post('/agents/:agentId/heartbeat', (req: Request, res: Response): void => {
  const updated = updateHeartbeat(req.params.agentId);
  if (!updated) { res.status(404).json({ success: false, error: { code: 'AGENT_NOT_FOUND', message: 'Agent not found' } }); return; }
  res.json({ success: true, data: { acknowledged: true }, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

// GET /platform/agents - List all edge agents
router.get('/agents', (_req: Request, res: Response): void => {
  const agents = getAgents();
  res.json({ success: true, data: { agents, total: agents.length }, meta: { requestId: uuidv4(), timestamp: new Date().toISOString() } });
});

export default router;
