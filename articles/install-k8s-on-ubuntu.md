---
title: "k8s構築奮闘記"
description: ''
date: '2024-06-12T19:39:00.000+09:00'
emoji: "💭"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: 
    - k8s
    - docker
published: true
---

こんにちは、ここあです。  
k8s環境の構築に手間取って朝5時に寝たものの、始業はいつもと変わらず9時なのでとても眠いです。  
月曜から夜ふかし。  

::: message
この記事は、k8sの構築方法について解説するものではありません。手元の環境で、詰まったことをつらつらと書いていくだけです。
:::


## 環境
- ubuntu 22.04
  - containerd 1.6.32
  - k8s 1.29.5
- ubuntu server 22.04
  - containerd 1.6.12
  - k8s 1.29.5


## 困っていたこと
1. マスターもワーカーも無限にNotReadyになる
2. CNIが無限にReady再起動を繰り返す
3. CNIがうまく動かないのでマスターが動かず、なのでスケジューラも動かず、そしてすべてが動かない


## まずは結論

いろいろ試しましたが、最終的には
```
sudo apt install containerd
```

そう、containerdのバージョンを上げてみた。  
解決しました。。。。  
が、この記事を書いているときに見てみるとまた無限にCrashしている。あとで調査。

::: message alert
【追記】
いやこれ、containerd.ioを消して、Ubuntu提供のcontainerdを入れてないか？？？  
これで動くということは、使用するランタイムの設定がおかしかったのかもしれないね。  
とはいえ、dockerが入っていたらcontainerd.ioが入っていると思うし、使用するランタイムもいじっていないから同じUNIXソケットを見ていると思うし、謎だね
:::


## 試したこと
### 1. k8sのリセット
運が良いことに、構築段階での問題なので、気軽にリセットすることができます。

リセット
```
sudo kubeadm reset

sudo rm -rf /etc/cni/net.d
sudo rm -rf /var/lib/etcd
sudo rm -rf ~/.kube
```

初期化

```
sudo kubeadm init --pod-network-cidr=10.200.0.0/16

mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml
```

無意味でした。

### 2. calicoの変わりにflannelを使用する
コマンドを残していなかったので作業詳細は省きます。  
無意味でした。

### 3. RBAC色々いじった
RBACってなんやねんって感じになりながら、ChatGPTに教えてもらって試した。  
無意味でした。

### 4. なんかDNS周りのエラーが出てる

こんな感じのログ
```
err="Nameserver limits were exceeded, some nameservers have been omitted
```

kubeletの設定を変えた。（そういえばこれ元にに戻してないな。。。）
※省略

### 5. なんか色々やりました
深夜テンションで朝5時までやったので作業を覚えていません。  
ただ、無限に同じ設定を見直して、「あーでもないこーでもない」としていました

### 6. そしてcontainerdのアップデート
冒頭の結論に戻り、`containerd` をダメ元でアプデしました。  
再起動はしたけどアプデはしてなかったな。  
これでひとまず動くようになりました。めでたし


## まとめ
- 深夜テンションで作業をするな。  
- 迷ったら最新バージョンを確認しよう（さておきk8s周りのバージョンって複雑だよね（？））
