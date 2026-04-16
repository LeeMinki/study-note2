# Argo CD Core Installation

`008` MVP는 Argo CD UI를 기본 설치하지 않고, core 설치를 기본안으로 사용한다.

설치 위치:

- Namespace: `argocd`
- 설치 방식: EC2 bootstrap에서 upstream `core-install.yaml` 적용
- 목적: GitOps reconcile 기능만 우선 확보

운영 기준:

- UI가 필요한 경우에는 `009` 이후 후속 spec에서 full Argo CD 설치를 검토한다.
- `008`에서는 public Argo CD UI endpoint를 만들지 않는다.
- 배포 상태 확인은 `kubectl`과 GitHub Actions 로그를 우선 사용한다.

수동 확인 예시:

```bash
kubectl get pods -n argocd
kubectl get applications -n argocd
```
