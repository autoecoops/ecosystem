import { config } from '../config';
import { logger } from './logger.service';

// ============================================================================
// Edge Agent Management
// ============================================================================
export interface EdgeAgent {
  agentId: string;
  nodeId: string;
  hostname: string;
  version: string;
  status: 'online' | 'offline' | 'degraded';
  lastHeartbeat: string;
  capabilities: string[];
  metadata: Record<string, unknown>;
}

const agentRegistry = new Map<string, EdgeAgent>();
let heartbeatInterval: NodeJS.Timeout | null = null;

export function registerAgent(agent: EdgeAgent): void {
  // Ensure lastHeartbeat is set to now if not provided or invalid
  if (!agent.lastHeartbeat || isNaN(new Date(agent.lastHeartbeat).getTime())) {
    agent.lastHeartbeat = new Date().toISOString();
  }
  // Set initial status if not provided
  if (!agent.status) {
    agent.status = 'online';
  }
  agentRegistry.set(agent.agentId, agent);
  logger.info({ agentId: agent.agentId, hostname: agent.hostname }, 'Edge agent registered');
}

export function updateHeartbeat(agentId: string): boolean {
  const agent = agentRegistry.get(agentId);
  if (!agent) return false;

  agent.lastHeartbeat = new Date().toISOString();
  agent.status = 'online';
  return true;
}

export function getAgents(): EdgeAgent[] {
  return Array.from(agentRegistry.values());
}

export function getAgent(agentId: string): EdgeAgent | undefined {
  return agentRegistry.get(agentId);
}

// ============================================================================
// Heartbeat Monitor
// ============================================================================
function checkAgentHealth(): void {
  const now = Date.now();
  const timeoutMs = config.EDGE_AGENT_TIMEOUT_MS;

  for (const [agentId, agent] of agentRegistry) {
    const lastBeat = new Date(agent.lastHeartbeat).getTime();
    
    // Treat invalid/missing timestamp as immediately offline
    if (isNaN(lastBeat)) {
      agent.status = 'offline';
      logger.warn({ agentId, hostname: agent.hostname }, 'Edge agent has invalid lastHeartbeat, marking offline');
      continue;
    }

    const elapsed = now - lastBeat;

    if (elapsed > timeoutMs && agent.status !== 'offline') {
      agent.status = 'offline';
      logger.warn({ agentId, hostname: agent.hostname, elapsedMs: elapsed }, 'Edge agent went offline');
    } else if (elapsed > timeoutMs / 2 && agent.status === 'online') {
      agent.status = 'degraded';
      logger.info({ agentId, hostname: agent.hostname }, 'Edge agent degraded');
    }
  }
}

export function startHeartbeatMonitor(): void {
  heartbeatInterval = setInterval(checkAgentHealth, config.EDGE_HEARTBEAT_INTERVAL_MS);
  logger.info({ intervalMs: config.EDGE_HEARTBEAT_INTERVAL_MS }, 'Edge heartbeat monitor started');
}

export function stopHeartbeatMonitor(): void {
  if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
}

// ============================================================================
// Intent State (desired state from infra-manager)
// ============================================================================
export interface IntentState {
  nodeId: string;
  desiredBaseline: string;
  desiredVersion: string;
  desiredServices: Array<{ name: string; enabled: boolean }>;
  lastUpdatedAt: string;
}

export async function fetchIntentState(nodeId: string): Promise<IntentState | null> {
  try {
    const response = await fetch(
      `${config.INFRA_MANAGER_URL}/infra/applications/node-${nodeId}`,
      { headers: { 'Content-Type': 'application/json' } },
    );

    if (!response.ok) return null;

    const data = await response.json() as { data: Record<string, unknown> };
    return {
      nodeId,
      desiredBaseline: (data.data.revision as string) ?? 'latest',
      desiredVersion: '1.0.0',
      desiredServices: [],
      lastUpdatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({ error, nodeId }, 'Failed to fetch intent state');
    return null;
  }
}
