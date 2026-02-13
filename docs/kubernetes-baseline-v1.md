# AXIOM Kubernetes 基線架構骨架集合 v1.0

## 骨架1: 供應鏈完整性與證明系統 (Supply Chain Integrity & Attestation System)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: axiom-supply-chain
  labels:
    axiom.system/tier: l-a-canonical
    axiom.system/baseline: v1.0
    axiom.system/integrity: required
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hash-verification-engine
  namespace: axiom-supply-chain
  labels:
    component: hash-verifier
    axiom.system/critical: true
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: hash-verification-engine
  template:
    metadata:
      labels:
        app: hash-verification-engine
        axiom.system/attestation: enabled
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
      - name: hash-verifier
        image: axiom/hash-verifier:baseline-v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http-api
        - containerPort: 9090
          name: metrics
        env:
        - name: HASH_CONSISTENCY_THRESHOLD
          value: "10"
        - name: ATTESTATION_REQUIRED_PERCENT
          value: "100"
        - name: VERIFICATION_TIMEOUT
          value: "30s"
        - name: DRIFT_DETECTION_WINDOW
          value: "60s"
        - name: POLICY_COVERAGE_MINIMUM
          value: "95"
        - name: SBOM_SCAN_ENABLED
          value: "true"
        - name: AKG_TRACE_REQUIRED
          value: "100"
        - name: UPGRADE_DRYRUN_ENABLED
          value: "true"
        - name: JSON_SCHEMA_VALIDATION
          value: "strict"
        - name: JOB_ATTEST_ENFORCEMENT
          value: "required"
        - name: DIGEST_CROSS_VERIFY
          value: "enabled"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: hash-storage
          mountPath: /data/hashes
        - name: attestation-cache
          mountPath: /cache/attestations
        - name: policy-bundle
          mountPath: /policies
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: hash-storage
        persistentVolumeClaim:
          claimName: hash-storage-pvc
      - name: attestation-cache
        emptyDir:
          sizeLimit: 1Gi
      - name: policy-bundle
        configMap:
          name: baseline-policies
---
apiVersion: v1
kind: Service
metadata:
  name: hash-verification-svc
  namespace: axiom-supply-chain
  labels:
    component: hash-verifier
spec:
  selector:
    app: hash-verification-engine
  ports:
  - name: http-api
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: hash-storage-pvc
  namespace: axiom-supply-chain
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: baseline-policies
  namespace: axiom-supply-chain
data:
  hash-consistency.rego: |
    package axiom.hash.consistency
    allow {
      input.pipeline_runs >= 10
      input.hash_matches == input.pipeline_runs
    }
  attestation.rego: |
    package axiom.attestation
    allow {
      input.artifacts_with_attestation == input.total_artifacts
      input.attestation_coverage == 100
    }
  drift-detection.rego: |
    package axiom.drift
    allow {
      input.detection_time_seconds <= 60
      input.mttd_met == true
    }
  policy-coverage.rego: |
    package axiom.policy
    allow {
      input.coverage_percent >= 95
      input.policy_hits >= input.total_checks * 0.95
    }
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: integrity-baseline-check
  namespace: axiom-supply-chain
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: baseline-checker
            image: axiom/baseline-checker:v1.0
            command:
            - /bin/sh
            - -c
            - |
              echo "G1: Pipeline Hash Consistency Check"
              curl -s http://hash-verification-svc/api/v1/pipeline/verify-all | jq '.consistent_runs >= 10'
              echo "G2: Attestation Coverage Check"
              curl -s http://hash-verification-svc/api/v1/attestation/coverage | jq '.coverage_percent == 100'
              echo "G3: Drift Detection MTTD Check"
              curl -s http://hash-verification-svc/api/v1/drift/mttd | jq '.mttd_seconds <= 60'
              echo "G4: Policy Coverage Check"
              curl -s http://hash-verification-svc/api/v1/policy/coverage | jq '.coverage_percent >= 95'
              echo "G5: SBOM Vulnerability Check"
              curl -s http://hash-verification-svc/api/v1/sbom/scan | jq '.high_risk_count == 0'
              echo "G6: AKG Traceability Check"
              curl -s http://hash-verification-svc/api/v1/akg/trace | jq '.completeness_percent == 100'
              echo "G7: Upgrade Proposal Dry-run Check"
              curl -s http://hash-verification-svc/api/v1/upgrade/dryrun | jq '.hash_drift == false'
              echo "G8: JSON Schema Validation Check"
              curl -s http://hash-verification-svc/api/v1/json/validate | jq '.all_valid == true'
              echo "G9: Job Attest Marking Check"
              curl -s http://hash-verification-svc/api/v1/job/attest | jq '.required_marks_present == true'
              echo "G10: Digest Cross-verification Check"
              curl -s http://hash-verification-svc/api/v1/digest/cross-verify | jq '.consistency == true'
            resources:
              requests:
                memory: "64Mi"
                cpu: "100m"
              limits:
                memory: "128Mi"
                cpu: "200m"
```

## 骨架2: 彈性與離線韌性系統 (Resilience & Offline Robustness System)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: axiom-resilience
  labels:
    axiom.system/tier: l-a-canonical
    axiom.system/baseline: v1.0
    axiom.system/offline-ready: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: circuit-breaker-controller
  namespace: axiom-resilience
  labels:
    component: circuit-breaker
    axiom.system/critical: true
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: circuit-breaker-controller
  template:
    metadata:
      labels:
        app: circuit-breaker-controller
        axiom.system/resilience: enabled
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
      - name: circuit-breaker
        image: axiom/circuit-breaker:baseline-v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http-api
        - containerPort: 9090
          name: metrics
        env:
        - name: CIRCUIT_FAILURE_THRESHOLD
          value: "5"
        - name: CIRCUIT_TIMEOUT_SECONDS
          value: "30"
        - name: CIRCUIT_RECOVERY_TIMEOUT
          value: "60"
        - name: RETRY_BUDGET_LIMIT
          value: "10"
        - name: BULKHEAD_POOL_SIZE
          value: "20"
        - name: OFFLINE_CACHE_TTL
          value: "3600"
        - name: DEGRADE_POLICY_ENABLED
          value: "true"
        - name: FALLBACK_MODE_ENABLED
          value: "true"
        - name: WAL_QUEUE_ENABLED
          value: "true"
        - name: LOCAL_SNAPSHOT_ENABLED
          value: "true"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        volumeMounts:
        - name: offline-cache
          mountPath: /cache/offline
        - name: wal-queue
          mountPath: /data/wal
        - name: config-snapshot
          mountPath: /config/snapshot
          readOnly: true
        - name: degrade-policies
          mountPath: /policies/degrade
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: offline-cache
        persistentVolumeClaim:
          claimName: offline-cache-pvc
      - name: wal-queue
        persistentVolumeClaim:
          claimName: wal-queue-pvc
      - name: config-snapshot
        configMap:
          name: config-snapshot
      - name: degrade-policies
        configMap:
          name: degrade-policies
---
apiVersion: v1
kind: Service
metadata:
  name: circuit-breaker-svc
  namespace: axiom-resilience
  labels:
    component: circuit-breaker
spec:
  selector:
    app: circuit-breaker-controller
  ports:
  - name: http-api
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: offline-cache-pvc
  namespace: axiom-resilience
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wal-queue-pvc
  namespace: axiom-resilience
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: degrade-policies
  namespace: axiom-resilience
data:
  degrade-matrix.json: |
    {
      "policies": [
        {
          "service": "model-inference",
          "dependency": "feature-store",
          "fallback": "last-good-cache",
          "quality_impact": "accuracy -1-3%",
          "recovery_condition": "registry_available && hash_verified"
        },
        {
          "service": "quantum-optimization",
          "dependency": "qpu-runtime",
          "fallback": "local-simulator",
          "quality_impact": "time +30%",
          "recovery_condition": "qpu_healthy && consecutive_success >= 2"
        },
        {
          "service": "audit-logging",
          "dependency": "main-database",
          "fallback": "local-wal-append",
          "quality_impact": "delay max 30min",
          "recovery_condition": "db_flush_success && checksum_valid"
        },
        {
          "service": "user-authentication",
          "dependency": "keycloak-idp",
          "fallback": "token-cache-extend",
          "quality_impact": "no_forced_refresh",
          "recovery_condition": "oidc_discovery_restored"
        }
      ]
    }
  offline-readiness.json: |
    {
      "metrics": [
        {
          "name": "cache_coverage",
          "weight": 0.25,
          "target": 0.95,
          "current": 0.0
        },
        {
          "name": "degrade_policy_coverage",
          "weight": 0.25,
          "target": 0.90,
          "current": 0.0
        },
        {
          "name": "replica_health",
          "weight": 0.20,
          "target": 0.95,
          "current": 0.0
        },
        {
          "name": "prewarmed_images_ratio",
          "weight": 0.15,
          "target": 0.95,
          "current": 0.0
        },
        {
          "name": "resilience_test_pass_ratio",
          "weight": 0.15,
          "target": 0.85,
          "current": 0.0
        }
      ]
    }
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: resilience-baseline-check
  namespace: axiom-resilience
spec:
  schedule: "*/10 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: resilience-checker
            image: axiom/resilience-checker:v1.0
            command:
            - /bin/sh
            - -c
            - |
              echo "G11: Hash-based Promotion Block Rate Check"
              curl -s http://circuit-breaker-svc/api/v1/promotion/block-rate | jq '.block_rate_percent == 100'
              echo "G12: Auto-rollback Success Rate Check"
              curl -s http://circuit-breaker-svc/api/v1/rollback/success-rate | jq '.success_rate_percent >= 95'
              echo "G13: Multi-env Consistency Check"
              curl -s http://circuit-breaker-svc/api/v1/consistency/multi-env | jq '.difference_rate_percent == 0'
            resources:
              requests:
                memory: "64Mi"
                cpu: "100m"
              limits:
                memory: "128Mi"
                cpu: "200m"
```

## 骨架3: 動態風險評估與自適應系統 (Dynamic Risk Assessment & Adaptive System)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: axiom-adaptive
  labels:
    axiom.system/tier: l-a-canonical
    axiom.system/baseline: v1.0
    axiom.system/adaptive: enabled
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: risk-assessment-engine
  namespace: axiom-adaptive
  labels:
    component: risk-engine
    axiom.system/critical: true
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  selector:
    matchLabels:
      app: risk-assessment-engine
  template:
    metadata:
      labels:
        app: risk-assessment-engine
        axiom.system/adaptive: enabled
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
      - name: risk-engine
        image: axiom/risk-engine:baseline-v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http-api
        - containerPort: 9090
          name: metrics
        env:
        - name: DYNAMIC_POLICY_INJECTION_ENABLED
          value: "true"
        - name: POLICY_ACCURACY_TARGET
          value: "99"
        - name: PREDICTIVE_WARNING_ENABLED
          value: "true"
        - name: FALSE_POSITIVE_THRESHOLD
          value: "5"
        - name: PQC_MIGRATION_TARGET
          value: "30"
        - name: THREAT_INTEL_INTEGRATION
          value: "true"
        - name: ONLINE_LEARNING_ENABLED
          value: "true"
        - name: KNOWLEDGE_GRAPH_UPDATE
          value: "dynamic"
        - name: PERFORMANCE_MONITORING
          value: "enabled"
        - name: AUTO_TUNING_ENABLED
          value: "true"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
        volumeMounts:
        - name: risk-models
          mountPath: /models/risk
        - name: threat-intel
          mountPath: /data/threat-intel
        - name: knowledge-graph
          mountPath: /data/knowledge-graph
        - name: policy-templates
          mountPath: /templates/policies
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 60
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: risk-models
        persistentVolumeClaim:
          claimName: risk-models-pvc
      - name: threat-intel
        persistentVolumeClaim:
          claimName: threat-intel-pvc
      - name: knowledge-graph
        persistentVolumeClaim:
          claimName: knowledge-graph-pvc
      - name: policy-templates
        configMap:
          name: policy-templates
---
apiVersion: v1
kind: Service
metadata:
  name: risk-assessment-svc
  namespace: axiom-adaptive
  labels:
    component: risk-engine
spec:
  selector:
    app: risk-assessment-engine
  ports:
  - name: http-api
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: risk-models-pvc
  namespace: axiom-adaptive
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: threat-intel-pvc
  namespace: axiom-adaptive
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: knowledge-graph-pvc
  namespace: axiom-adaptive
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 15Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: policy-templates
  namespace: axiom-adaptive
data:
  dynamic-security.template: |
    apiVersion: kyverno.io/v1
    kind: Policy
    metadata:
      name: dynamic-security-{{ .context.environment }}
    spec:
      validationFailureAction: enforce
      rules:
      - name: validate-image-signature
        match:
          any:
          - resources:
              kinds:
              - Pod
        validate:
          message: "Image must be signed and attested"
          pattern:
            spec:
              containers:
              - name: "*"
                image: "{{ .context.trusted_registry }}/*@sha256:*"
  adaptive-compliance.template: |
    apiVersion: kyverno.io/v1
    kind: Policy
    metadata:
      name: adaptive-compliance-{{ .context.risk_level }}
    spec:
      validationFailureAction: enforce
      rules:
      - name: enforce-security-context
        match:
          any:
          - resources:
              kinds:
              - Pod
        validate:
          message: "Security context required for {{ .context.risk_level }} risk level"
          pattern:
            spec:
              securityContext:
                runAsNonRoot: true
                runAsUser: ">0"
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: adaptive-baseline-check
  namespace: axiom-adaptive
spec:
  schedule: "0 */4 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: adaptive-checker
            image: axiom/adaptive-checker:v1.0
            command:
            - /bin/sh
            - -c
            - |
              echo "Dynamic Policy Injection Accuracy Check"
              curl -s http://risk-assessment-svc/api/v1/policy/injection-accuracy | jq '.accuracy_percent >= 99'
              echo "Predictive Warning False Positive Rate Check"
              curl -s http://risk-assessment-svc/api/v1/prediction/false-positive-rate | jq '.rate_percent <= 5'
              echo "PQC Migration Progress Check"
              curl -s http://risk-assessment-svc/api/v1/pqc/migration-progress | jq '.progress_percent >= 30'
              echo "Online Learning Model Performance Check"
              curl -s http://risk-assessment-svc/api/v1/learning/model-performance | jq '.performance_score >= 0.85'
            resources:
              requests:
                memory: "64Mi"
                cpu: "100m"
              limits:
                memory: "128Mi"
                cpu: "200m"
```

## 骨架4: 量子計算整合與模擬備援系統 (Quantum Computing Integration & Simulation Backup System)

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: axiom-quantum
  labels:
    axiom.system/tier: l-a-canonical
    axiom.system/baseline: v1.0
    axiom.system/quantum-enabled: true
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: quantum-orchestrator
  namespace: axiom-quantum
  labels:
    component: quantum-orchestrator
    axiom.system/critical: true
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: quantum-orchestrator
  template:
    metadata:
      labels:
        app: quantum-orchestrator
        axiom.system/quantum: enabled
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 65534
        fsGroup: 65534
      containers:
      - name: quantum-orchestrator
        image: axiom/quantum-orchestrator:baseline-v1.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http-api
        - containerPort: 9090
          name: metrics
        - containerPort: 5555
          name: quantum-circuit
        env:
        - name: QPU_RUNTIME_ENABLED
          value: "true"
        - name: SIMULATOR_FALLBACK_ENABLED
          value: "true"
        - name: QUANTUM_CIRCUIT_VALIDATION
          value: "strict"
        - name: COHERENCE_TIME_LIMIT
          value: "100"
        - name: FIDELITY_THRESHOLD
          value: "0.95"
        - name: NOISE_MODEL_ENABLED
          value: "true"
        - name: CIRCUIT_OPTIMIZATION_ENABLED
          value: "true"
        - name: QUANTUM_ERROR_CORRECTION
          value: "surface_code"
        - name: FALLBACK_TIMEOUT_SECONDS
          value: "30"
        - name: SIMULATION_ACCURACY_LEVEL
          value: "high"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "8Gi"
            cpu: "4"
        volumeMounts:
        - name: quantum-circuits
          mountPath: /circuits
        - name: simulation-cache
          mountPath: /cache/simulation
        - name: qpu-config
          mountPath: /config/qpu
          readOnly: true
        - name: quantum-algorithms
          mountPath: /algorithms
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 90
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 15
          periodSeconds: 15
      volumes:
      - name: quantum-circuits
        persistentVolumeClaim:
          claimName: quantum-circuits-pvc
      - name: simulation-cache
        persistentVolumeClaim:
          claimName: simulation-cache-pvc
      - name: qpu-config
        configMap:
          name: qpu-config
      - name: quantum-algorithms
        configMap:
          name: quantum-algorithms
---
apiVersion: v1
kind: Service
metadata:
  name: quantum-orchestrator-svc
  namespace: axiom-quantum
  labels:
    component: quantum-orchestrator
spec:
  selector:
    app: quantum-orchestrator
  ports:
  - name: http-api
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
  - name: quantum-circuit
    port: 5555
    targetPort: 5555
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: quantum-circuits-pvc
  namespace: axiom-quantum
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: simulation-cache-pvc
  namespace: axiom-quantum
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
  storageClassName: fast-ssd
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: quantum-algorithms
  namespace: axiom-quantum
data:
  shor-algorithm.py: |
    import numpy as np
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
    from qiskit.algorithms import Shor
    from qiskit.primitives import Sampler
    
    class ShoreAlgorithmExecutor:
        def __init__(self, n_qubits=15):
            self.n_qubits = n_qubits
            self.circuit = None
            self.result = None
            
        def create_circuit(self, number_to_factor):
            self.circuit = QuantumCircuit(self.n_qubits, self.n_qubits)
            shor = Shor(sampler=Sampler())
            self.result = shor.factor(number_to_factor)
            return self.circuit
            
        def execute_circuit(self, backend_type='simulator'):
            if backend_type == 'qpu' and self.qpu_available():
                return self.execute_on_qpu()
            else:
                return self.execute_on_simulator()
                
        def qpu_available(self):
            return True
            
        def execute_on_qpu(self):
            return {'factors': self.result.factors, 'backend': 'qpu'}
            
        def execute_on_simulator(self):
            return {'factors': self.result.factors, 'backend': 'simulator'}
  grover-search.py: |
    import numpy as np
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
    from qiskit.algorithms import AmplificationProblem, Grover
    from qiskit.primitives import Sampler
    
    class GroverSearchExecutor:
        def __init__(self, search_space_size=8):
            self.search_space_size = search_space_size
            self.n_qubits = int(np.log2(search_space_size))
            self.circuit = None
            
        def create_oracle(self, marked_items):
            oracle_circuit = QuantumCircuit(self.n_qubits)
            for item in marked_items:
                oracle_circuit.x(item)
            oracle_circuit.cz(*range(self.n_qubits))
            for item in marked_items:
                oracle_circuit.x(item)
            return oracle_circuit
            
        def execute_grover(self, marked_items, backend_type='simulator'):
            oracle = self.create_oracle(marked_items)
            problem = AmplificationProblem(oracle)
            grover = Grover(sampler=Sampler())
            result = grover.amplify(problem)
            
            if backend_type == 'qpu' and self.qpu_available():
                return self.execute_on_qpu(result)
            else:
                return self.execute_on_