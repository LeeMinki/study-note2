#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/var/log/study-note-bootstrap.log"
DATA_ROOT="/var/lib/study-note"
KUBECONFIG_PATH="/etc/rancher/k3s/k3s.yaml"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "[study-note] bootstrap started at $(date -Is)"

install_base_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -y
    apt-get install -y curl ca-certificates jq
  elif command -v dnf >/dev/null 2>&1; then
    dnf install -y curl ca-certificates jq
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

install_argocd_core() {
  export KUBECONFIG="$KUBECONFIG_PATH"

  kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

  if kubectl get deployment -n argocd argocd-application-controller >/dev/null 2>&1; then
    echo "[study-note] Argo CD core already installed"
    return
  fi

  kubectl apply -n argocd -f "https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/core-install.yaml"
  kubectl rollout status deployment/argocd-application-controller -n argocd --timeout=180s
}

install_base_packages
prepare_host_paths
install_k3s
wait_for_k3s
install_argocd_core

echo "[study-note] bootstrap completed at $(date -Is)"
