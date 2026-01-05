---
title: "k8sにGrafanaとかをインストールして監視できるようにする"
description: ''
date: '2024-06-17T23:33:00.000+09:00'
emoji: "🐋"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - k8s
    - Grafana
    - Prometheus
published: true
---

こんにちは、あるいはこんばんは。  
先日、自宅環境にk8sを導入しました。  
その環境にGrafanaやらPrometheusやらを持ち込んだので、その備忘録です。  

## 動作環境
- Ubuntu 22.04
- k8s 1.29.5
- containerd 14.6.32
- Helm 3.15.1


## 事前準備
### Helmの導入
Helmとは、k8s環境におけるパッケージマネージャです。  
各種アプリケーションがパッケージ化されており、簡単にインストールできるのはもちろん、アップデートの際などにリビジョンが割り当てられることで、変更に対するロールバックなども用意になります。  
以下のコマンドでインストールしましょう。

```: bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

~~~~~~~~
helm version
# version.BuildInfo{Version:"v3.15.1", GitCommit:"e211f2aa62992bd72586b395de50979e31231829", GitTreeState:"clean", GoVersion:"go1.22.3"}
```

## Grafana環境の構築
### Grafana, Prometheusの導入
まずは、Helmにそれぞれリポジトリを追加します。

```: bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts

helm repo update
```

その後、インストールしましょう。
```: bash
helm install prometheus-grafana prometheus-community/kube-prometheus-stack
```

インストールが完了すると、おおよそ以下のような状態になっているかと思います。

```: bash
kubectl get pods -n default

NAME                                                         READY    STATUS    RESTARTS   AGE
alertmanager-prometheus-grafana-kube-prom-alertmanager-0      2/2     Running       0       5m
prometheus-grafana-grafana-5c6d6d7f5d-dbljh                   1/1     Running       0       5m
prometheus-grafana-kube-prometheus-operator-7f4b58b7f7-9dsgs  1/1     Running       0       5m
prometheus-grafana-kube-state-metrics-57957c59d6-v8jkh        1/1     Running       0       5m
prometheus-grafana-prometheus-node-exporter-bzkl8             1/1     Running       0       5m
prometheus-prometheus-grafana-kube-prom-prometheus-0          2/2     Running       1       5m
```


```: bash
kubectl get svc -n default

NAME                                           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
alertmanager-operated                          ClusterIP   None             <none>        9093/TCP,9094/TCP,9094/UDP   5m
prometheus-grafana                             ClusterIP   10.96.0.1        <none>        80/TCP                       5m
prometheus-grafana-kube-prom-alertmanager      ClusterIP   10.96.0.2        <none>        9093/TCP                     5m
prometheus-grafana-kube-prometheus             ClusterIP   10.96.0.3        <none>        9090/TCP                     5m
prometheus-grafana-kube-prometheus-operator    ClusterIP   10.96.0.4        <none>        443/TCP                      5m
prometheus-grafana-kube-state-metrics          ClusterIP   10.96.0.5        <none>        8080/TCP                     5m
prometheus-grafana-prometheus-node-exporter    ClusterIP   10.96.0.6        <none>        9100/TCP                     5m
prometheus-operated                            ClusterIP   None             <none>        9090/TCP                     5m
```


### アクセスしてみる
上記のような状態になっていたら、正常に動作しているはずです。  
ダッシュボードを確認してみましょう

初期パスワードは以下の方法で確認することができます。

```: bash
kubectl get secret prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

さて、Grafanaは現在ClusterIPモードで動作しているので、アクセスするためにはポートフォワーディングの必要があります。  

```: bash
kubectl port-forward svc/prometheus-grafana 3000:80
```

では、http://localhost:3000 にアクセスしてみましょう。
ユーザがadmin、パスワードは先ほど確認したものでログインできるはずです。  

ログインできたら、左のペインからDashboardsを選択してみましょう。  
おそらく、いろいろなダッシュボードが確認できるはずです。

![Node Exporter / Nodes](/images/install-grafana-on-k8s/01-grafana-dashboard.png)
*Node Exporter / Nodes*


## ホスト名でアクセスできるようにする（LAN内）
このセクションでは、LoadBalancerとしてMetalLBを導入し、最終的にGrafanaにポートフォワーディング無しでアクセスできるようにするのを目標にします。  
アクセスするために毎回ポートフォワーディングするのは面倒ですよね。  

ということで、今回は `grafana.internal` でアクセスできるように設定していきます。

::: message alert
この記事を書いたあとに気がついたのですが、単にポートフォワーディングしたくないだけであれば、grafana自体をLoadBalancerでデプロイすれば良かったですね。  
その方法を、この節のあとに追記しています。
:::

### MetalLBの導入
> MetalLBは、Kubernetesクラスタにロードバランシング機能を追加するためのオープンソースプロジェクトです。  
>クラウドプロバイダーのロードバランサー機能（例えば、AWSのELB、GCPのGLB）を模倣して、オンプレミス環境やベアメタル環境でも同様の機能を提供します。  
> MetalLBを使用すると、KubernetesのServiceリソースに外部IPを割り当て、クラスター外部からのトラフィックを特定のサービスにルーティングできます。
>
> *ChatGPT-4oによる解説*

```: bash
helm repo add metallb https://metallb.github.io/metallb
helm repo update
helm install metallb metallb/metallb --set crds.create=true
```

#### IP-Address Poolの設定
IP-Addrss Poolの設定では、MetalLBが割り当てることのできるIPアドレスの範囲を設定します。  
物理ネットワークのアドレス範囲で、DHCPとかぶらない領域を任意の範囲で指定しましょう。

```yml: ipaddress_pool.yml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: metallb-ip-pool
  namespace: metallb-system
spec:
  addresses:
  - 192.168.1.240-192.168.1.250
```

```: bash
kubectl apply -f ipaddress_pool.yml
```

#### L2 Advertisementの設定
続いて、L2 Advertisementの設定です。  
これの具体的な解説は避けますが、ひとまずは **使用するIPアドレスプールを指定するもの** とだけ覚えていただければと思います。

```yml: l2_advertisement.yml
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: metallb-l2-advertisement
  namespace: metallb-system
spec:
  ipAddressPools:
  - metallb-ip-pool
```

```: bash
kubectl apply -f l2_advertisement.yml
```


### Nginx-ingressの導入
Ingressとは、クラスター外部からクラスター内部へのHTTP(S)のルーティングを管理するものです。  
これを利用すると、ロードバランシングやSSL/TLS、リバースプロキシなどを利用することができます。  
また、ネームベースでバーチャルホストを設定することも可能です。  

そのひとつであるNginx-ingressは、Nginxの機能を利用したIngressコントローラです。  

これも、今までと同様にHelmで導入し、設定をしていきます。

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install nginx-ingress ingress-nginx/ingress-nginx
```

```yml: grafana-ingress.yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: grafana.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: grafana
            port:
              number: 80
```


```bash: bash
kubectl apply -f grafana-ingress.yml
```

### hostsの設定
さて、ここまでの設定で `grafana.internal`というホスト名に対して、prometheus-grafanaのpodsが解決されるようになりました。  
しかし、ホストマシンは、`grafana.internal`が誰であるのか結局わかりません。  
そこで、名前解決してあげる必要があります。ここでは、hostsファイルを使用して名前解決することにします。

まずは、MetalLBがnginx-ingressに割り当てたIPアドレスを確認してみます。  
```bash: bash
kubectl get svc -n ingress-nginx

NAME                               TYPE           CLUSTER-IP       EXTERNAL-IP     PORT(S)                      AGE
nginx-ingress-controller           LoadBalancer   10.96.120.218    192.168.1.240   80:31582/TCP,443:32223/TCP   5m
nginx-ingress-default-backend      ClusterIP      10.96.131.227    <none>          80/TCP                       5m
```

割り振られたIPアドレスがわかったので、hostsを編集します。

```
sudo nano /etc/hosts

grafana.internal  192.168.1.240
```
これで、設定したマシンからは`grafana.internal`という名前でアクセスできるようになりました。  
http://grafana.internal でアクセスできるようになっていると思います。


## 【追記】ホスト名を使わずに、LAN内で直接アクセスする
prometheus-grafanaの設定をいじって、ポートフォワーディングなしでアクセスできるようにします。  
まずは、通常通りインストールします。

```bash: bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus-grafana prometheus-community/kube-prometheus-stack
```

このままだとClusterIPで動作するので、設定を変更します。  
`custom-values.yml`というファイルを作成し、以下のように記述してください。

```yml: custom-values.yml
grafana:
  service:
    type: LoadBalancer
```

そして、再度prometheus-grafanaをインストール（更新）します。

```bash: bash
helm upgrade --install prometheus-grafana prometheus-community/kube-prometheus-stack -f custom-values.yml
```

このあと、状態を確認すると以下のようになっているはずです。
```bash: bash
kubectl get svc -n default

NAME                                  TYPE           CLUSTER-IP      EXTERNAL-IP      PORT(S)                      AGE
prometheus-grafana-grafana            LoadBalancer   10.96.120.218   192.168.1.240    80:31582/TCP                 5m
```
こうして、prometheus-grafanaには、192.168.1.240というIPアドレスが割り当てられました。  
この設定により、 http://192.168.1.240 にアクセスすると、Grafanaのダッシュボードに到達することができます。


## さいごに
k8sを利用し、モニタリングができるところまでの解説をしました。  
なお、インターネットからアクセスしたいときには、今回の設定だけではおそらく足りないと思うので、適宜自分の環境に合わせて設定してみてください。  
わたしはCloudflare ZeroTrustのTunnelを用いて外部からアクセスできるようにしたので、余裕があったら別でその記事を書くかもしれません。  

k8s歴1週間なのでところどころ曖昧だったり、誤った説明になっているかもしれません。。。  
お手柔らかに。。。。。  
