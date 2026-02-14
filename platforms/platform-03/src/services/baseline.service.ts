import { logger } from './logger.service';

// ============================================================================
// Node Baseline Definition
// ============================================================================
export interface NodeBaseline {
  nodeId: string;
  hostname: string;
  os: { name: string; version: string; kernel: string };
  hardware: {
    cpuModel: string;
    cpuCores: number;
    memoryMB: number;
    diskGB: number;
    gpuModel?: string;
  };
  packages: Array<{ name: string; version: string }>;
  services: Array<{ name: string; enabled: boolean; running: boolean }>;
  securityBaseline: {
    firewallEnabled: boolean;
    selinuxMode: string;
    sshPasswordAuth: boolean;
    auditdEnabled: boolean;
    unattendedUpgrades: boolean;
  };
  lastCheckedAt: string;
}

export interface BaselineDrift {
  nodeId: string;
  driftType: 'package' | 'service' | 'security' | 'hardware';
  field: string;
  expected: string;
  actual: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
}

// ============================================================================
// Baseline Check
// ============================================================================
const EXPECTED_SECURITY_BASELINE = {
  firewallEnabled: true,
  selinuxMode: 'enforcing',
  sshPasswordAuth: false,
  auditdEnabled: true,
  unattendedUpgrades: true,
};

export function checkBaselineDrift(
  current: NodeBaseline,
  expected: Partial<NodeBaseline> = {},
): BaselineDrift[] {
  const drifts: BaselineDrift[] = [];

  // Security baseline checks
  const secExpected = { ...EXPECTED_SECURITY_BASELINE, ...expected.securityBaseline };
  const secCurrent = current.securityBaseline;

  if (secCurrent.firewallEnabled !== secExpected.firewallEnabled) {
    drifts.push({
      nodeId: current.nodeId, driftType: 'security', field: 'firewallEnabled',
      expected: String(secExpected.firewallEnabled), actual: String(secCurrent.firewallEnabled),
      severity: 'critical', detectedAt: new Date().toISOString(),
    });
  }

  if (secCurrent.sshPasswordAuth !== secExpected.sshPasswordAuth) {
    drifts.push({
      nodeId: current.nodeId, driftType: 'security', field: 'sshPasswordAuth',
      expected: String(secExpected.sshPasswordAuth), actual: String(secCurrent.sshPasswordAuth),
      severity: 'high', detectedAt: new Date().toISOString(),
    });
  }

  if (secCurrent.auditdEnabled !== secExpected.auditdEnabled) {
    drifts.push({
      nodeId: current.nodeId, driftType: 'security', field: 'auditdEnabled',
      expected: String(secExpected.auditdEnabled), actual: String(secCurrent.auditdEnabled),
      severity: 'high', detectedAt: new Date().toISOString(),
    });
  }

  // Service checks
  for (const svc of current.services) {
    if (svc.enabled && !svc.running) {
      drifts.push({
        nodeId: current.nodeId, driftType: 'service', field: `service:${svc.name}`,
        expected: 'running', actual: 'stopped',
        severity: 'medium', detectedAt: new Date().toISOString(),
      });
    }
  }

  if (drifts.length > 0) {
    logger.warn({ nodeId: current.nodeId, driftCount: drifts.length }, 'Baseline drift detected');
  }

  return drifts;
}

// ============================================================================
// Hardware Inventory
// ============================================================================
export interface HardwareInventory {
  nodes: NodeBaseline[];
  totalCPU: number;
  totalMemoryMB: number;
  totalDiskGB: number;
  gpuNodes: number;
  lastUpdatedAt: string;
}

const nodeRegistry = new Map<string, NodeBaseline>();

export function registerNode(baseline: NodeBaseline): void {
  nodeRegistry.set(baseline.nodeId, baseline);
  logger.info({ nodeId: baseline.nodeId, hostname: baseline.hostname }, 'Node registered');
}

export function getInventory(): HardwareInventory {
  const nodes = Array.from(nodeRegistry.values());
  return {
    nodes,
    totalCPU: nodes.reduce((sum, n) => sum + n.hardware.cpuCores, 0),
    totalMemoryMB: nodes.reduce((sum, n) => sum + n.hardware.memoryMB, 0),
    totalDiskGB: nodes.reduce((sum, n) => sum + n.hardware.diskGB, 0),
    gpuNodes: nodes.filter((n) => n.hardware.gpuModel).length,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function getNode(nodeId: string): NodeBaseline | undefined {
  return nodeRegistry.get(nodeId);
}
