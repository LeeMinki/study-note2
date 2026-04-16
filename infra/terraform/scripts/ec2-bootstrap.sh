#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/study-note-bootstrap.log"
DATA_ROOT="/var/lib/study-note"
KUBECONFIG_PATH="/etc/rancher/k3s/k3s.yaml"
APP_NAMESPACE="study-note"
ARGO_APP_MANIFEST_URL="https://raw.githubusercontent.com/LeeMinki/study-note2/main/infra/kubernetes/argocd/applications/study-note-mvp.yaml"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "[study-note] bootstrap started at $(date -Is)"

install_base_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y curl ca-certificates jq awscli
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y curl ca-certificates jq awscli
  else
    echo "[study-note] unsupported package manager" >&2
    exit 1
  fi
}

prepare_host_paths() {
  mkdir -p "$DATA_ROOT/backend/uploads"
  touch "$DATA_ROOT/backend/data.json"
  touch "$DATA_ROOT/backend/users.json"
  chmod 750 "$DATA_ROOT" "$DATA_ROOT/backend" "$DATA_ROOT/backend/uploads"
  chmod 640 "$DATA_ROOT/backend/data.json" "$DATA_ROOT/backend/users.json"
}

install_k3s() {
  if command -v k3s >/dev/null 2>&1; then
    echo "[study-note] k3s already installed"
    return
  fi

  curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --write-kubeconfig-mode=644" sh -
}

wait_for_k3s() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  for attempt in $(seq 1 30); do
    if kubectl get nodes >/dev/null 2>&1; then
      kubectl get nodes
      return
    fi

    echo "[study-note] waiting for k3s node readiness ($attempt/30)"
    sleep 10
  done

  echo "[study-note] k3s did not become ready in time" >&2
  exit 1
}

configure_coredns_upstream() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  kubectl get configmap coredns -n kube-system -o yaml \
    | sed 's#forward \. /etc/resolv.conf#forward . 169.254.169.253#' \
    | kubectl apply -f -
  kubectl rollout restart deployment/coredns -n kube-system
  kubectl rollout status deployment/coredns -n kube-system --timeout=180s
}

install_argocd_core() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

  if kubectl get deployment -n argocd argocd-application-controller >/dev/null 2>&1; then
    echo "[study-note] Argo CD core already installed"
    return
  fi

  kubectl apply --server-side -n argocd -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/core-install.yaml"
  kubectl rollout status statefulset/argocd-application-controller -n argocd --timeout=180s
}

ensure_argocd_secret_key() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  if kubectl get secret argocd-secret -n argocd -o jsonpath='{.data.server\.secretkey}' | grep -q .; then
    echo "[study-note] Argo CD server secret key already exists"
    return
  fi

  local secret_key
  secret_key="$(head -c 32 /dev/urandom | base64)"
  kubectl patch secret argocd-secret -n argocd --type merge \
    -p "{\"stringData\":{\"server.secretkey\":\"${secret_key}\"}}"
  kubectl rollout restart statefulset/argocd-application-controller -n argocd
  kubectl rollout status statefulset/argocd-application-controller -n argocd --timeout=180s
}

create_ecr_pull_secret() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  local identity_document
  local region
  local account_id
  local registry
  local token

  identity_document="$(curl -fsS http://169.254.169.254/latest/dynamic/instance-identity/document)"
  region="$(printf "%s" "$identity_document" | jq -r ".region")"
  account_id="$(printf "%s" "$identity_document" | jq -r ".accountId")"
  registry="${account_id}.dkr.ecr.${region}.amazonaws.com"
  token="$(aws ecr get-login-password --region "$region")"

  kubectl create namespace "$APP_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
  kubectl create secret docker-registry ecr-registry \
    --namespace "$APP_NAMESPACE" \
    --docker-server="$registry" \
    --docker-username=AWS \
    --docker-password="$token" \
    --dry-run=client \
    -o yaml | kubectl apply -f -
}

install_argocd_application() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  kubectl apply -n argocd -f "$ARGO_APP_MANIFEST_URL"
}

install_base_packages
prepare_host_paths
install_k3s
wait_for_k3s
configure_coredns_upstream
install_argocd_core
ensure_argocd_secret_key
create_ecr_pull_secret
install_argocd_application

echo "[study-note] bootstrap completed at $(date -Is)"
