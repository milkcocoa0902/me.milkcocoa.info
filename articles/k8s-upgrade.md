---
title: "自宅k8sをアップグレードしたときの備忘録"
description: 'kubeadm構成のKubernetesクラスターをアップグレードするときの手順と、containerdやCNIの対応範囲など事前に確認しておきたいポイントをまとめています。'
date: '2026-06-07T13:30:00.000+09:00'
emoji: "☸️"
type: "tech"
topics:
  - Kubernetes
  - kubeadm
  - containerd
  - Calico
published: true
---

:::: message alert 
この記事は, k8sをアップグレードする際にCodexと相談しながら進めたものを、最終的にブログ調にしてもらっています。  
インラインコードがそのまま出てしまっていますが、レンダリングの問題に起因するもので、治すのも面倒なので無視しています。
::::


## この記事はなに？

kubeadmで作ったKubernetesクラスターをアップグレードするときの備忘録です。

Kubernetes本体のアップグレード手順だけなら公式ドキュメントを読めばよいのですが、実際にやるとなるとCNIやcontainerd、各種アドオンの対応範囲も気にする必要があります。

なので今回は、`kubeadm upgrade` の流れに加えて、アップグレード前後で見ておいたほうがよさそうなものをまとめます。

なお、特定環境でだけ起きるエラーの修正方法はこの記事では扱いません。  
あくまで「次回アップグレードするときに自分が見るためのメモ」くらいの温度感です。

## 前提

想定している環境はだいたいこんな感じです。

- kubeadmで構築したKubernetesクラスター
- containerdをコンテナランタイムとして利用
- CNIとしてCalicoなどを利用
- `kubeadm`, `kubelet`, `kubectl` はaptで管理

もちろん環境によって細かい差分はあると思いますが、kubeadm構成であれば大枠は同じはずです。

## まず方針

Kubernetesのアップグレードでは、minor versionを飛ばさないようにします。

たとえば、`1.33` から `1.35` に上げたい場合でも、以下のように1つずつ上げます。

```text
1.33 -> 1.34 -> 1.35
```

`1.33 -> 1.35` のような飛ばし方はしません。

また、基本的な順番は以下です。

```text
control planeを上げる
worker nodeを1台ずつ上げる
CNIなど周辺コンポーネントを上げる
```

Kubernetesはcontrol planeとkubeletのバージョン差についてルールがあります。  
ざっくり言うと、kubeletをkube-apiserverより新しくしてはいけません。

なので、先にcontrol planeを上げて、そのあとworker nodeを順番に上げる流れになります。

## アップグレード前に確認する

まずは今の状態を見ます。

```sh
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl get pv,pvc -A
kubectl get events -A --sort-by=.lastTimestamp | tail -50
```

ノードごとのKubernetesバージョンとコンテナランタイムも見ておきます。

```sh
kubectl get nodes -o custom-columns=NAME:.metadata.name,KUBELET:.status.nodeInfo.kubeletVersion,RUNTIME:.status.nodeInfo.containerRuntimeVersion,OS:.status.nodeInfo.osImage,KERNEL:.status.nodeInfo.kernelVersion
```

各ノードではこのあたりを確認します。

```sh
kubeadm version
kubelet --version
kubectl version --client
containerd --version
crictl info
```

この時点で既に `NotReady` のノードがあるとか、落ちているPodがあるなら、先にそちらを直しておいたほうがよいです。  
アップグレード作業中に問題が起きたとき、もともとの問題なのかアップグレードで壊したのか分からなくなるためです。

## etcdのバックアップを取る

control planeを触る前にetcdのsnapshotを取ります。

kubeadmで構築したクラスターで、etcdがstatic Podとして動いている場合は、証明書類はだいたい `/etc/kubernetes/pki/etcd/` にあります。

```sh
sudo ETCDCTL_API=3 etcdctl snapshot save /root/etcd-snapshot-$(date +%Y%m%d%H%M%S).db \
  --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key
```

取得できたら状態も見ておきます。

```sh
sudo ETCDCTL_API=3 etcdctl snapshot status /root/etcd-snapshot-*.db --write-out=table
```

バックアップを取っただけで復元できる気になりがちですが、手順は別途確認しておいたほうがよいです。  
壊れてから公式ドキュメントを読み始めるのはかなりつらいので。

## containerdの対応範囲を見る

Kubernetesを上げるときは、containerdの対応範囲も見ます。

たとえばKubernetes `1.35` の場合、containerd公式のサポート表では以下が対応範囲になっています。

```text
Kubernetes 1.35:
  containerd 2.2.0+
  containerd 2.1.5+
  containerd 1.7.28+
```

Kubernetes本体だけ上げても、コンテナランタイムが古いままだと変なところで詰まる可能性があります。

確認はこのあたりです。

```sh
containerd --version
crictl info
systemctl status containerd --no-pager
```

Docker Engineも同じマシンで使っている場合は少し注意が必要です。  
Ubuntu標準の `containerd` と、Docker公式パッケージの `containerd.io` が混ざると管理がややこしくなります。

Dockerを使っているなら、Docker公式リポジトリから `docker-ce`, `docker-ce-cli`, `containerd.io` をまとめて管理するほうが見通しがよいと思います。

## CNIの対応範囲を見る

Kubernetesのアップグレードで忘れがちなのがCNIです。

Kubernetes本体が正常に上がっても、CNIが対応していないとPod間通信、DNS、NetworkPolicyあたりで困ることがあります。

Calicoの場合は、公式ドキュメントにKubernetesの対応範囲が載っています。  
たとえばCalico `v3.32` は、Kubernetes `1.34`, `1.35`, `1.36` がテスト対象になっています。

アップグレード前には、このあたりを見ます。

```sh
kubectl -n kube-system get ds calico-node -o wide
kubectl -n kube-system get deploy calico-kube-controllers -o wide
kubectl get ippool -o yaml
kubectl -n kube-system get cm calico-config -o yaml
```

特にmanifestで直接管理している場合は、既存のカスタマイズが新しいmanifestで消えないか確認したほうがよいです。

たとえば以下のようなものです。

- IPPoolのCIDR
- IP-in-IP / VXLAN / BGPの設定
- CNI pluginの追加設定
- `calico-kube-controllers` の有効コントローラ
- image registry

新しいmanifestをそのまま `kubectl apply` すると、意図せず既存設定が変わることがあります。  
まずはdiffを見ます。

```sh
kubectl diff --server-side -f calico.yaml
```

問題なければapplyします。

```sh
kubectl apply --server-side --force-conflicts -f calico.yaml
```

`--force-conflicts` は強いオプションなので、diffを見ずに雑に付けるものではないです。  
ただ、古いmanifest管理からserver-side applyへ寄せるときなど、必要になる場面はあります。

## apt repositoryを切り替える

Kubernetesのapt repositoryはminor versionごとに分かれています。

たとえば `v1.35` に上げる場合は、repositoryも `v1.35` にします。

```sh
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' \
  | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt update
apt-cache madison kubeadm
```

実際に入れるバージョンは、アップグレード先minorの最新patchを選ぶのが基本です。

## control planeを上げる

まずcontrol plane nodeで `kubeadm` だけを上げます。

```sh
sudo apt-mark unhold kubeadm
sudo apt-get install -y kubeadm='1.35.x-*'
sudo apt-mark hold kubeadm
```

アップグレード計画を確認します。

```sh
sudo kubeadm upgrade plan
```

問題なければ適用します。

```sh
sudo kubeadm upgrade apply v1.35.x
```

続いて、control plane nodeの `kubelet` と `kubectl` を上げます。

```sh
kubectl drain <control-plane-node> --ignore-daemonsets --delete-emptydir-data

sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet='1.35.x-*' kubectl='1.35.x-*'
sudo apt-mark hold kubelet kubectl

sudo systemctl daemon-reload
sudo systemctl restart kubelet

kubectl uncordon <control-plane-node>
```

状態を確認します。

```sh
kubectl get nodes -o wide
kubectl get pods -n kube-system -o wide
```

## worker nodeを上げる

worker nodeは1台ずつ上げます。

まずcontrol plane側から対象nodeをdrainします。

```sh
kubectl drain <worker-node> --ignore-daemonsets --delete-emptydir-data
```

対象worker nodeで `kubeadm` を上げます。

```sh
sudo apt-mark unhold kubeadm
sudo apt-get install -y kubeadm='1.35.x-*'
sudo apt-mark hold kubeadm
```

worker nodeの設定を更新します。

```sh
sudo kubeadm upgrade node
```

続いて `kubelet` と `kubectl` を上げます。

```sh
sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet='1.35.x-*' kubectl='1.35.x-*'
sudo apt-mark hold kubelet kubectl

sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

control plane側からuncordonします。

```sh
kubectl uncordon <worker-node>
kubectl get nodes -o wide
```

これをworker nodeの台数分繰り返します。

:::message
ノード数が少ないクラスターでは、drain中に普通にアプリケーションが止まります。  
PodDisruptionBudgetやreplica数を見て、許容できるタイミングで作業しましょう。
:::

## アップグレード後に確認する

まずはノードとPodの状態を見ます。

```sh
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl get pods -A | grep -v Running
```

CNIも確認します。

```sh
kubectl rollout status ds/calico-node -n kube-system
kubectl rollout status deploy/calico-kube-controllers -n kube-system
kubectl -n kube-system get pods -o wide | grep calico
```

DNSも見ます。

```sh
kubectl run dnscheck --image=busybox:1.36 --restart=Never --rm -it -- \
  nslookup kubernetes.default.svc.cluster.local
```

Serviceへの到達も見ます。

```sh
kubectl run netcheck --image=busybox:1.36 --restart=Never --rm -it -- \
  sh -c 'nc -vz kubernetes.default.svc.cluster.local 443'
```

一時Podを作ってPodがReadyになるかも確認しておくとよいです。

```sh
kubectl run netcheck-a --image=busybox:1.36 --restart=Never -- sleep 3600
kubectl run netcheck-b --image=busybox:1.36 --restart=Never -- sleep 3600

kubectl wait pod/netcheck-a --for=condition=Ready --timeout=120s
kubectl wait pod/netcheck-b --for=condition=Ready --timeout=120s

kubectl get pod netcheck-a netcheck-b -o wide
kubectl delete pod netcheck-a netcheck-b
```

このあたりが通れば、少なくともCNIとDNSはかなり正常寄りと見てよさそうです。

## 困ったときに見るログ

まずはeventを見ます。

```sh
kubectl get events -A --sort-by=.lastTimestamp | tail -100
```

CNIまわりならCalicoのログを見ます。

```sh
kubectl -n kube-system logs ds/calico-node --tail=100
kubectl -n kube-system logs deploy/calico-kube-controllers --tail=100
```

ノードが `NotReady` になる場合は、対象ノードでkubeletを見ます。

```sh
sudo systemctl status kubelet --no-pager
sudo journalctl -u kubelet -n 200 --no-pager
```

コンテナランタイムも見ます。

```sh
sudo systemctl status containerd --no-pager
sudo journalctl -u containerd -n 200 --no-pager
crictl ps -a
```

だいたいの場合、`kubectl get events`、`kubelet`、`containerd`、CNIのログを見れば、どこで詰まっているかは見えてくると思います。

## チェックリスト

最後に、次回自分が見る用のチェックリストです。

### 作業前

- [ ] Kubernetesのアップグレード先minorを決めた
- [ ] minor versionを飛ばさない計画にした
- [ ] etcd snapshotを取得した
- [ ] CNIの対応Kubernetes versionを確認した
- [ ] containerdの対応Kubernetes versionを確認した
- [ ] CSI / Ingress / LB / monitoringなど周辺コンポーネントを確認した
- [ ] drainで止まるworkloadを把握した
- [ ] PDBでdrainが詰まらないか確認した

### 作業中

- [ ] control planeを先に上げた
- [ ] worker nodeは1台ずつdrainして上げた
- [ ] kubeletをkube-apiserverより新しくしていない
- [ ] 各nodeでkubelet restart後にReadyを確認した

### 作業後

- [ ] 全nodeがReady
- [ ] kube-systemのPodがRunning
- [ ] CNI Podが全nodeでRunning
- [ ] DNSが引ける
- [ ] Kubernetes Serviceに到達できる
- [ ] 主要workloadがRunning
- [ ] PVC/PVを使うworkloadが正常に起動する

## さいごに

Kubernetesのアップグレード自体は `kubeadm upgrade` に沿って進めればよいのですが、実際には周辺コンポーネントの確認がかなり大事でした。

特にcontainerdとCNIは、Kubernetes本体とは別に対応範囲を見ておいたほうがよいです。  
ここを見落とすと、control planeは上がったのにPodが動かない、DNSが引けない、NetworkPolicyが効かない、みたいな面倒な状態になりえます。

次回以降はこの記事のチェックリストを見ながら、もう少し落ち着いて作業したいところです。

## 参考

- [kubeadmクラスターのアップグレード](https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/)
- [Kubernetes Version Skew Policy](https://kubernetes.io/releases/version-skew-policy/)
- [containerd releases](https://containerd.io/releases/)
- [Calico system requirements](https://docs.tigera.io/calico/latest/getting-started/kubernetes/requirements)
- [Calico Kubernetes upgrade](https://docs.tigera.io/calico/latest/operations/upgrading/kubernetes-upgrade)
