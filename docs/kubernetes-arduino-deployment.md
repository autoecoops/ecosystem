# AXIOM Arduino 部署第一階段完整實施方案

基於深入的技術研究和生產環境最佳實踐，本實施方案提供了符合 AXIOM v2.0 自主修復原則的完整 Kubernetes Arduino 平台部署策略。該方案整合了企業級安全、監控、自動化部署和零人工干預的運營模式。

## 核心架構設計

AXIOM Arduino 平台採用微服務架構，包含五個核心組件：**Kubernetes Operator 控制平面**負責 Arduino 設備的生命週期管理；**監控堆疊**提供全方位的可觀測性；**容器映像倉庫**確保供應鏈安全；**安全控制層**實現零信任架構；**自動化部署引擎**實現 GitOps 持續交付。所有組件都具備自主修復能力，支援漸進式部署和自動故障恢復。

## 1. Kubernetes Operator 框架部署

### 1.1 Arduino Custom Resource Definition

```yaml
# arduino-device-crd.yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: arduinodevices.devices.axiom.io
  annotations:
    controller-gen.kubebuilder.io/version: v0.13.0
spec:
  group: devices.axiom.io
  names:
    kind: ArduinoDevice
    listKind: ArduinoDeviceList
    plural: arduinodevices
    singular: arduinodevice
    shortNames: ["ard", "arduino"]
  scope: Namespaced
  versions:
  - name: v1alpha1
    served: true
    storage: true
    subresources:
      status: {}
      scale:
        specReplicasPath: .spec.replicas
        statusReplicasPath: .status.replicas
        labelSelectorPath: .status.selector
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              deviceType:
                type: string
                enum: ["uno", "mega", "nano", "esp32", "esp8266"]
                description: "Arduino board type"
              firmware:
                type: object
                properties:
                  version:
                    type: string
                    pattern: '^v\d+\.\d+\.\d+$'
                  image:
                    type: string
                  checksum:
                    type: string
                    pattern: '^[a-fA-F0-9]{64}$'
                required: ["version", "image"]
              connectivity:
                type: object
                properties:
                  protocol:
                    type: string
                    enum: ["wifi", "bluetooth", "lora", "cellular"]
                  endpoint:
                    type: string
                    format: uri
                  credentials:
                    type: object
                    properties:
                      secretRef:
                        type: object
                        properties:
                          name: {type: string}
                          key: {type: string}
                        required: ["name", "key"]
              sensors:
                type: array
                items:
                  type: object
                  properties:
                    name: {type: string}
                    type:
                      type: string
                      enum: ["temperature", "humidity", "pressure", "motion", "light", "sound"]
                    pin: {type: integer, minimum: 0, maximum: 53}
                    sampleRate: {type: string, default: "30s"}
                  required: ["name", "type", "pin"]
              replicas: {type: integer, minimum: 1, maximum: 100, default: 1}
            required: ["deviceType", "firmware"]
          status:
            type: object
            properties:
              conditions:
                type: array
                items:
                  type: object
                  properties:
                    type:
                      type: string
                      enum: ["Ready", "Progressing", "Degraded", "Available"]
                    status:
                      type: string
                      enum: ["True", "False", "Unknown"]
                    lastTransitionTime: {type: string, format: date-time}
                    reason: {type: string}
                    message: {type: string}
                  required: ["type", "status"]
              replicas: {type: integer}
              readyReplicas: {type: integer}
              observedGeneration: {type: integer}
              phase:
                type: string
                enum: ["Pending", "Running", "Failed", "Succeeded"]
              lastUpdateTime: {type: string, format: date-time}
    additionalPrinterColumns:
    - name: Type
      type: string
      jsonPath: .spec.deviceType
    - name: Replicas
      type: integer
      jsonPath: .spec.replicas
    - name: Ready
      type: integer
      jsonPath: .status.readyReplicas
    - name: Age
      type: date
      jsonPath: .metadata.creationTimestamp
```

### 1.2 Operator 控制器部署配置

```yaml
# arduino-operator-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arduino-operator-controller
  namespace: arduino-operator-system
  labels:
    app: arduino-operator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: arduino-operator
  template:
    metadata:
      labels:
        app: arduino-operator
    spec:
      serviceAccountName: arduino-operator-controller
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: manager
        image: quay.io/axiom/arduino-operator:v1.0.0
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          capabilities:
            drop: ["ALL"]
        resources:
          limits:
            cpu: 500m
            memory: 256Mi
          requests:
            cpu: 100m
            memory: 128Mi
        env:
        - name: WATCH_NAMESPACE
          value: ""
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: OPERATOR_NAME
          value: arduino-operator
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8081
          initialDelaySeconds: 15
          periodSeconds: 20
        readinessProbe:
          httpGet:
            path: /readyz
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 10
        ports:
        - containerPort: 9443
          name: webhook-server
          protocol: TCP
        - containerPort: 8080
          name: metrics
          protocol: TCP
        - containerPort: 8081
          name: health-probe
          protocol: TCP
        volumeMounts:
        - mountPath: /tmp/k8s-webhook-server/serving-certs
          name: cert
          readOnly: true
      volumes:
      - name: cert
        secret:
          defaultMode: 420
          secretName: webhook-server-certs
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: arduino-operator
            topologyKey: kubernetes.io/hostname
```

## 2. 基礎監控堆疊實施

### 2.1 Prometheus Operator 部署

```yaml
# monitoring-stack-values.yaml
prometheus:
  prometheusSpec:
    replicas: 2
    retention: 30d
    retentionSize: "50GiB"
    storageSpec:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 100Gi
    resources:
      requests:
        memory: 2Gi
        cpu: 1000m
      limits:
        memory: 4Gi
        cpu: 2000m
    serviceMonitorSelectorNilUsesHelmValues: false
    
alertmanager:
  alertmanagerSpec:
    replicas: 3
    retention: 120h
    storage:
      volumeClaimTemplate:
        spec:
          storageClassName: fast-ssd
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi

grafana:
  replicas: 2
  persistence:
    enabled: true
    storageClassName: fast-ssd
    size: 10Gi
  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 200m
```

### 2.2 Arduino 設備監控告警規則

```yaml
# arduino-prometheus-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: arduino-alert-rules
  namespace: monitoring
spec:
  groups:
  - name: arduino-devices
    interval: 30s
    rules:
    - alert: ArduinoDeviceDown
      expr: up{job="arduino-devices"} == 0
      for: 5m
      labels:
        severity: critical
        team: arduino
      annotations:
        summary: "Arduino device {{ $labels.arduino_device }} is down"
        description: "Arduino device {{ $labels.arduino_device }} at {{ $labels.location }} has been unreachable for more than 5 minutes."
        
    - alert: ArduinoDeviceHighCPU
      expr: 100 - (avg by (arduino_device) (rate(node_cpu_seconds_total{mode="idle",job="arduino-devices"}[5m])) * 100) > 80
      for: 10m
      labels:
        severity: warning
        team: arduino
      annotations:
        summary: "High CPU usage on Arduino device {{ $labels.arduino_device }}"
        description: "CPU usage is above 80% for Arduino device {{ $labels.arduino_device }}"
```

## 3. 容器映像倉庫建立

### 3.1 Harbor 企業級部署

```yaml
# harbor-production-values.yaml
expose:
  type: ingress
  tls:
    enabled: true
    certSource: secret
    secret:
      secretName: harbor-tls-cert
  ingress:
    hosts:
      core: harbor.axiom.internal
    controller: nginx

# High Availability Configuration
portal:
  replicas: 3
core:
  replicas: 3
jobservice:
  replicas: 3
registry:
  replicas: 3

# Trivy Configuration for Vulnerability Scanning
trivy:
  enabled: true
  vulnType: "os,library"
  severity: "UNKNOWN,LOW,MEDIUM,HIGH,CRITICAL"
  ignoreUnfixed: false

# Enable metrics for monitoring
metrics:
  enabled: true
  core:
    port: 8001
  registry:
    port: 8001
```

### 3.2 映像安全政策

```yaml
# harbor-image-policy.yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: HarborImageSource
metadata:
  name: arduino-harbor-policy
spec:
  enforcementAction: warn
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Pod"]
    - apiGroups: ["apps"]
      kinds: ["Deployment", "ReplicaSet", "DaemonSet", "StatefulSet"]
    excludedNamespaces: ["kube-system", "gatekeeper-system", "cert-manager"]
  parameters:
    allowedRegistries:
    - "harbor.axiom.internal/arduino-production/"
    - "harbor.axiom.internal/base/"
    requireSigned: true
```

## 4. 基本安全配置

### 4.1 Pod Security Standards 實施

```yaml
# pod-security-standards.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: arduino-production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: arduino-secure-app
  namespace: arduino-production
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
        seccompProfile:
          type: RuntimeDefault
      containers:
      - name: arduino-app
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          runAsNonRoot: true
          capabilities:
            drop: ["ALL"]
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 100m
            memory: 128Mi
```

### 4.2 Network Policies 微分段

```yaml
# arduino-network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: arduino-production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: arduino-app-policy
  namespace: arduino-production
spec:
  podSelector:
    matchLabels:
      app: arduino-app
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: arduino-frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: arduino-database
    ports:
    - protocol: TCP
      port: 5432
```

## 5. 部署順序和依賴關係

### 主要部署指令

```bash
# 第一階段：基礎設施準備
kubectl create namespace arduino-operator-system
kubectl create namespace monitoring  
kubectl create namespace harbor
kubectl create namespace arduino-production

# 第二階段：安全基礎設施
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.14/deploy/gatekeeper.yaml
helm install external-secrets external-secrets/external-secrets --namespace external-secrets-system --create-namespace

# 第三階段：容器倉庫
helm install harbor harbor/harbor --namespace harbor --values harbor-production-values.yaml

# 第四階段：監控堆疊
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --values monitoring-stack-values.yaml

# 第五階段：Arduino Operator
kubectl apply -f arduino-device-crd.yaml
kubectl apply -f arduino-operator-rbac.yaml
kubectl apply -f arduino-operator-deployment.yaml

# 第六階段：安全配置
kubectl apply -f pod-security-standards.yaml
kubectl apply -f arduino-network-policies.yaml
```

### 自動化部署腳本

```bash
#!/bin/bash
# deploy-axiom-arduino-phase1.sh

set -euo pipefail

log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
    echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
    exit 1
}

# Prerequisites check
check_prerequisites() {
    log "Checking prerequisites..."
    command -v kubectl > /dev/null 2>&1 || error "kubectl is required"
    command -v helm > /dev/null 2>&1 || error "helm is required"
    kubectl cluster-info > /dev/null 2>&1 || error "kubectl cannot connect"
    log "Prerequisites check passed"
}

# Main execution phases
main() {
    log "Starting AXIOM Arduino Phase 1 deployment..."
    
    check_prerequisites
    
    # Phase 1: Namespaces
    log "Phase 1: Creating namespaces..."
    kubectl create namespace arduino-operator-system --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace harbor --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace arduino-production --dry-run=client -o yaml | kubectl apply -f -
    
    # Phase 2: Security foundations
    log "Phase 2: Installing security foundations..."
    kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.14/deploy/gatekeeper.yaml
    kubectl wait --for=condition=Ready pod -l control-plane=controller-manager -n gatekeeper-system --timeout=300s
    
    helm repo add external-secrets https://charts.external-secrets.io
    helm install external-secrets external-secrets/external-secrets --namespace external-secrets-system --create-namespace --wait
    
    # Phase 3: Harbor
    log "Phase 3: Deploying Harbor..."
    helm repo add harbor https://helm.goharbor.io
    helm install harbor harbor/harbor --namespace harbor --values harbor-production-values.yaml --wait --timeout=15m
    
    # Phase 4: Monitoring
    log "Phase 4: Deploying monitoring stack..."
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack --namespace monitoring --values monitoring-stack-values.yaml --wait --timeout=15m
    
    # Phase 5: Arduino Operator
    log "Phase 5: Deploying Arduino Operator..."
    kubectl apply -f arduino-device-crd.yaml
    kubectl apply -f arduino-operator-rbac.yaml
    kubectl apply -f arduino-operator-deployment.yaml
    kubectl wait --for=condition=Available deployment/arduino-operator-controller -n arduino-operator-system --timeout=300s
    
    # Phase 6: Security configurations
    log "Phase 6: Applying security configurations..."
    kubectl apply -f pod-security-standards.yaml
    kubectl apply -f arduino-network-policies.yaml
    
    log "🎉 AXIOM Arduino Phase 1 deployment completed successfully!"
}

main "$@"
```

## 驗證和故障排除

### 部署驗證檢查清單

- ✅ **CRD 安裝驗證**: `kubectl get crd arduinodevices.devices.axiom.io`
- ✅ **Operator 狀態檢查**: `kubectl get deployment arduino-operator-controller -n arduino-operator-system`
- ✅ **監控服務驗證**: `kubectl get prometheus -n monitoring` 和 `kubectl get alertmanager -n monitoring`
- ✅ **Harbor 服務狀態**: `kubectl get pods -n harbor -l app=harbor`
- ✅ **網路政策檢查**: `kubectl get networkpolicies -n arduino-production`
- ✅ **安全約束驗證**: `kubectl get constraints`

### 常見故障排除

**Operator 啟動失敗**: 檢查 RBAC 權限配置，使用 `kubectl logs` 查看詳細錯誤。驗證 CRD 正確安裝，確保映像可正常拉取。

**監控資料缺失**: 驗證 ServiceMonitor 配置，檢查網路政策是否阻止 Prometheus 存取。確認目標服務的 metrics 端點可達。

**Harbor 映像推送失敗**: 確認 TLS 憑證配置，檢查網路連接性和使用者權限。驗證專案配置和儲存空間。

## 效能調優和最佳實踐

### 資源配置優化

根據實際工作負載調整資源限制，使用 **Vertical Pod Autoscaler (VPA)** 實現動態資源調整。配置適當的 **Horizontal Pod Autoscaler (HPA)** 策略，監控資源使用率並及時調整。

### 高可用性配置

部署多副本確保服務高可用，配置 **Pod Disruption Budgets (PDB)** 防止意外中斷。使用反親和性規則將 Pod 分散到不同節點，實現跨可用區部署。

### 安全最佳實踐

實施**最小權限原則**，定期審核 RBAC 配置。使用**外部秘密管理**系統，啟用**網路分段**和流量加密。定期進行**安全掃描**和**滲透測試**。

## 結論

本完整實施方案提供了生產就緒的 AXIOM Arduino 第一階段部署策略，實現了企業級的安全性、可觀測性和自動化運營。通過採用 Kubernetes Operator 模式、全方位監控堆疊、安全的容器倉庫和零信任安全架構，平台具備了自主修復能力和零人工干預的運營特性。

所有配置都遵循業界最佳實踐，包含適當的資源限制、安全設定和監控整合，確保平台在生產環境中的穩定性和可擴展性。自動化部署腳本和驗證程序提供了完整的實施流程，支援逐步部署和驗證，最大化降低部署風險並確保系統的長期可靠性和維護性。