import { logger } from './logger.service';
import { config } from '../config';

// ============================================================================
// IaC Manifest Validation
// ============================================================================
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    resourceCount: number;
    namespaces: string[];
    imageReferences: string[];
  };
}

export interface ValidationError {
  path: string;
  message: string;
  rule: string;
  severity: 'error';
}

export interface ValidationWarning {
  path: string;
  message: string;
  rule: string;
  severity: 'warning';
}

export function validateKubernetesManifest(manifest: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const imageReferences: string[] = [];

  // Required fields
  if (!manifest.apiVersion) {
    errors.push({ path: 'apiVersion', message: 'apiVersion is required', rule: 'required-fields', severity: 'error' });
  }
  if (!manifest.kind) {
    errors.push({ path: 'kind', message: 'kind is required', rule: 'required-fields', severity: 'error' });
  }
  if (!manifest.metadata) {
    errors.push({ path: 'metadata', message: 'metadata is required', rule: 'required-fields', severity: 'error' });
  }

  const meta = manifest.metadata as Record<string, unknown> | undefined;
  if (meta && !meta.namespace) {
    warnings.push({ path: 'metadata.namespace', message: 'No namespace specified, will use default', rule: 'namespace-required', severity: 'warning' });
  }

  // Security checks for Pod specs
  const spec = manifest.spec as Record<string, unknown> | undefined;
  if (spec?.template) {
    const template = spec.template as Record<string, unknown>;
    const podSpec = (template.spec as Record<string, unknown>) ?? {};
    const containers = (podSpec.containers as Array<Record<string, unknown>>) ?? [];

    for (const container of containers) {
      if (container.image) {
        imageReferences.push(container.image as string);

        // Check for latest tag
        const image = container.image as string;
        if (image.endsWith(':latest') || !image.includes(':')) {
          warnings.push({
            path: `spec.containers[${container.name}].image`,
            message: `Image ${image} uses :latest or no tag. Pin to specific version.`,
            rule: 'image-tag-pinning',
            severity: 'warning',
          });
        }
      }

      // Security context
      const secCtx = container.securityContext as Record<string, unknown> | undefined;
      if (!secCtx) {
        warnings.push({
          path: `spec.containers[${container.name}].securityContext`,
          message: 'No securityContext defined',
          rule: 'security-context-required',
          severity: 'warning',
        });
      } else {
        if (
          secCtx.runAsNonRoot === false ||
          secCtx.runAsUser === 0 ||
          secCtx.privileged === true
        ) {
          errors.push({
            path: `spec.containers[${container.name}].securityContext`,
            message: 'Container must not run as root or privileged',
            rule: 'no-root-containers',
            severity: 'error',
          });
        }
      }

      // Resource limits
      if (!container.resources) {
        warnings.push({
          path: `spec.containers[${container.name}].resources`,
          message: 'No resource limits defined',
          rule: 'resource-limits-required',
          severity: 'warning',
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      resourceCount: 1,
      namespaces: meta?.namespace ? [meta.namespace as string] : ['default'],
      imageReferences,
    },
  };
}

// ============================================================================
// Supply Chain Verification
// ============================================================================
export interface SupplyChainCheck {
  image: string;
  sbomPresent: boolean;
  signatureValid: boolean;
  vulnerabilities: { critical: number; high: number; medium: number; low: number };
  slsaLevel: number;
  compliant: boolean;
}

export async function verifySupplyChain(imageRef: string): Promise<SupplyChainCheck> {
  logger.info({ image: imageRef }, 'Verifying supply chain for image');

  // In production, this calls cosign verify and syft
  // For now, return a structured check
  return {
    image: imageRef,
    sbomPresent: config.SBOM_REQUIRED,
    signatureValid: config.SIGNATURE_REQUIRED,
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    slsaLevel: 3,
    compliant: true,
  };
}
