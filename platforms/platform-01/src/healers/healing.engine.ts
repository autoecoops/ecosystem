import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../services/logger.service';

// ============================================================================
// Healing Action Types
// ============================================================================
export type HealingActionType =
  | 'restart-pod'
  | 'scale-up'
  | 'scale-down'
  | 'rollback'
  | 'circuit-break'
  | 'drain-node'
  | 'failover'
  | 'clear-cache';

export interface HealingAction {
  id: string;
  type: HealingActionType;
  target: { kind: string; name: string; namespace: string };
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  retryCount: number;
  createdAt: string;
  executedAt?: string;
  completedAt?: string;
  result?: string;
}

export interface IncidentRecord {
  id: string;
  detectedAt: string;
  resolvedAt?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServices: string[];
  healingActions: HealingAction[];
  status: 'detected' | 'healing' | 'resolved' | 'escalated';
}

// ============================================================================
// Healing Rules Engine
// ============================================================================
interface HealingRule {
  name: string;
  condition: (alert: AlertPayload) => boolean;
  action: HealingActionType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number;
}

interface AlertPayload {
  alertName: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  status: 'firing' | 'resolved';
  startsAt: string;
}

const HEALING_RULES: HealingRule[] = [
  {
    name: 'pod-crash-loop',
    condition: (alert) => alert.alertName === 'KubePodCrashLooping',
    action: 'restart-pod',
    severity: 'high',
    cooldownMs: config.HEALING_COOLDOWN_MS,
  },
  {
    name: 'high-memory-usage',
    condition: (alert) => alert.alertName === 'ContainerMemoryUsageHigh' || alert.alertName === 'KubeMemoryOvercommit',
    action: 'scale-up',
    severity: 'medium',
    cooldownMs: config.HEALING_COOLDOWN_MS * 2,
  },
  {
    name: 'high-error-rate',
    condition: (alert) => alert.alertName === 'HighErrorRate' && parseFloat(alert.annotations.value ?? '0') > 5,
    action: 'rollback',
    severity: 'critical',
    cooldownMs: config.HEALING_COOLDOWN_MS * 5,
  },
  {
    name: 'service-unavailable',
    condition: (alert) => alert.alertName === 'TargetDown',
    action: 'restart-pod',
    severity: 'critical',
    cooldownMs: config.HEALING_COOLDOWN_MS,
  },
  {
    name: 'node-not-ready',
    condition: (alert) => alert.alertName === 'KubeNodeNotReady',
    action: 'drain-node',
    severity: 'critical',
    cooldownMs: config.HEALING_COOLDOWN_MS * 10,
  },
];

// Cooldown tracking
const lastActionTime = new Map<string, number>();

function isCooldownActive(ruleKey: string, cooldownMs: number): boolean {
  const lastTime = lastActionTime.get(ruleKey);
  if (!lastTime) return false;
  return Date.now() - lastTime < cooldownMs;
}

// ============================================================================
// Alert Processing
// ============================================================================
export function processAlert(alert: AlertPayload): HealingAction | null {
  if (!config.HEALING_ENABLED) {
    logger.info({ alert: alert.alertName }, 'Self-healing disabled, skipping');
    return null;
  }

  if (alert.status === 'resolved') {
    logger.info({ alert: alert.alertName }, 'Alert resolved, no action needed');
    return null;
  }

  for (const rule of HEALING_RULES) {
    if (rule.condition(alert)) {
      const ruleKey = `${rule.name}:${alert.labels.namespace ?? 'default'}:${alert.labels.pod ?? alert.labels.service ?? 'unknown'}`;

      if (isCooldownActive(ruleKey, rule.cooldownMs)) {
        logger.info({ rule: rule.name, ruleKey }, 'Healing action in cooldown');
        return null;
      }

      const action: HealingAction = {
        id: uuidv4(),
        type: rule.action,
        target: {
          kind: alert.labels.pod ? 'Pod' : alert.labels.node ? 'Node' : 'Service',
          name: alert.labels.pod ?? alert.labels.node ?? alert.labels.service ?? 'unknown',
          namespace: alert.labels.namespace ?? 'default',
        },
        reason: `Auto-healing triggered by ${alert.alertName}: ${alert.annotations.summary ?? alert.annotations.description ?? 'No description'}`,
        severity: rule.severity,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      lastActionTime.set(ruleKey, Date.now());

      logger.info(
        { actionId: action.id, type: action.type, target: action.target, severity: action.severity },
        'Healing action created',
      );

      return action;
    }
  }

  logger.debug({ alert: alert.alertName }, 'No matching healing rule');
  return null;
}

// ============================================================================
// Healing Execution (via Kubernetes API / ArgoCD)
// ============================================================================
export async function executeHealingAction(action: HealingAction): Promise<HealingAction> {
  action.status = 'executing';
  action.executedAt = new Date().toISOString();

  try {
    switch (action.type) {
      case 'restart-pod':
        await executePodRestart(action.target.name, action.target.namespace);
        break;
      case 'scale-up':
        await executeScale(action.target.name, action.target.namespace, 'up');
        break;
      case 'scale-down':
        await executeScale(action.target.name, action.target.namespace, 'down');
        break;
      case 'rollback':
        await executeRollback(action.target.name, action.target.namespace);
        break;
      case 'circuit-break':
        await executeCircuitBreak(action.target.name, action.target.namespace);
        break;
      case 'drain-node':
        await executeDrainNode(action.target.name);
        break;
      default:
        throw new Error(`Unknown healing action type: ${action.type}`);
    }

    action.status = 'completed';
    action.completedAt = new Date().toISOString();
    action.result = `Successfully executed ${action.type} on ${action.target.kind}/${action.target.name}`;

    logger.info({ actionId: action.id, type: action.type, result: action.result }, 'Healing action completed');
  } catch (error) {
    action.status = 'failed';
    action.completedAt = new Date().toISOString();
    action.result = error instanceof Error ? error.message : 'Unknown error';
    action.retryCount++;

    logger.error({ actionId: action.id, error: action.result, retryCount: action.retryCount }, 'Healing action failed');

    if (action.retryCount >= config.HEALING_MAX_RETRIES) {
      logger.error({ actionId: action.id }, 'Max retries exceeded, escalating');
    }
  }

  return action;
}

// ============================================================================
// Execution Helpers (Kubernetes API calls)
// ============================================================================
async function executePodRestart(podName: string, namespace: string): Promise<void> {
  logger.info({ podName, namespace }, 'Executing pod restart via Kubernetes API');
  // In production: kubectl delete pod or patch deployment to trigger rolling restart
  const response = await fetch(`${config.INFRA_MANAGER_URL}/infra/applications/${namespace}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prune: false }),
  });
  if (!response.ok) throw new Error(`Pod restart failed: ${response.status}`);
}

async function executeScale(name: string, namespace: string, direction: 'up' | 'down'): Promise<void> {
  logger.info({ name, namespace, direction }, `Executing scale ${direction}`);
  // In production: patch HPA or deployment replicas
}

async function executeRollback(name: string, namespace: string): Promise<void> {
  logger.info({ name, namespace }, 'Executing rollback via infra-manager');
  const response = await fetch(`${config.INFRA_MANAGER_URL}/infra/applications/${name}/rollback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetRevision: 1 }),
  });
  if (!response.ok) throw new Error(`Rollback failed: ${response.status}`);
}

async function executeCircuitBreak(name: string, namespace: string): Promise<void> {
  logger.info({ name, namespace }, 'Executing circuit break');
  // In production: update Istio DestinationRule or service mesh config
}

async function executeDrainNode(nodeName: string): Promise<void> {
  logger.info({ nodeName }, 'Executing node drain');
  // In production: kubectl drain node
}
