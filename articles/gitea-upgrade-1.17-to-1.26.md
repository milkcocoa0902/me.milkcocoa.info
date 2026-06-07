---
title: "Giteaをアップグレードしたときの備忘録"
description: 'systemd + binary構成のGiteaを1.17系から1.26系へAnsibleで段階アップグレードした際に、work-pathやgitea dump、DBマイグレーションまわりでハマった点をまとめています。'
date: '2026-06-07T17:25:00.000+09:00'
emoji: "🛠️"
type: "tech" # tech: 技術記事 / idea: アイデア
topics:
  - Gitea
  - Ansible
  - MySQL
  - PostgreSQL
  - ZFS
published: true
---

:::: message alert
この記事は, Giteaをアップグレードする際にCodexと相談しながら進めたものを、最終的にブログ調にしてもらっています。  
ところどころ変な言い回しがあるかもしれませんが、内容は確認しているのでご容赦ください。
::::

こんにちは

長らく運用していたGiteaを、ようやく重い腰を上げてアップグレードしました。

もともとは、Giteaのバージョンアップに加えて、DBをMySQLからPostgreSQLへ移行したいというところが発端です。  
ただし、アプリケーションのアップグレードとDBエンジンの移行を同時にやると、何か起きたときに切り分けが難しくなります。

そのため今回は、まずGitea本体を 1.17.x から 1.26.x まで上げるところに集中することにしました。  
PostgreSQLへの移行は別フェーズです。

なお、今回の記事はきれいな手順書というより、実際に作業しながら踏んだ罠の記録です。

:::message
最終的に 1.26.2 までは到達しましたが、途中でいくつか方針を変えています。  
特に gitea dump をアップグレード中のバックアップとして使う方針は途中でやめました。
:::

## 環境

- Gitea 1.17.1
- Ubuntu Server
- systemd + Gitea binary
- MySQL
- Ansible
- Cloudflare Tunnel
- ZFS

GiteaはDockerではなく、binaryを配置してsystemdで起動している構成です。

## もともとの配置

Giteaは、バージョンごとにディレクトリを作成し、currentというシンボリックリンクで切り替える構成にしていました。

```text
/usr/local/gitea/
  1.17.1/
    bin/gitea
    ini/app.ini
  current -> /usr/local/gitea/1.17.1
```

systemd側はcurrentを参照しています。

```ini
ExecStart=/usr/local/gitea/current/bin/gitea web -c /usr/local/gitea/current/ini/app.ini
WorkingDirectory=/var/lib/gitea
```

データ類は以下のような感じでした。

```text
/var/lib/gitea/custom
/var/lib/gitea/data
/var/lib/gitea/log

/tank/data/app/gitea/gitea-repositories
/tank/data/app/gitea/lfs
```

/tankはZFSで、定期的にスナップショットを取得してS3に転送しています。  
そのため、最終的にはlog以外の永続データを/tank側に寄せたほうがよさそうです。

ただ、アップグレード中にデータ配置まで変えると、何か起きたときに原因がわからなくなります。  
今回は既存の配置を維持したまま進めることにしました。

## 方針

Giteaは起動時にDB migrationが走ります。

つまり、binaryを差し替えて起動した時点でDBスキーマが更新される可能性があります。  
currentのリンクを古いバージョンに戻しただけではロールバックできません。

そこで、最初は以下のようにマイナーバージョンを刻んで上げていく方針にしました。

```text
1.17.1
 -> 1.18.5
 -> 1.19.4
 -> 1.20.6
 -> 1.21.11
 -> 1.22.6
 -> 1.23.8
 -> 1.24.7
 -> 1.25.5
 -> 1.26.2
```

Ansibleでは、おおよそ以下を繰り返すようにしました。

1. 対象バージョンのディレクトリを作成する
1. Gitea binaryをダウンロードする
1. app.iniをコピーする
1. Giteaを停止する
1. currentのリンクを切り替える
1. Giteaを起動する
1. HTTP health checkを行う

:::message
currentのリンク切り替えは便利ですが、ロールバック手段ではありません。  
DB migrationが走った後に戻すには、DB dumpやスナップショットから戻す必要があります。
:::

## Ansible化する

今回の作業はAnsible化しました。

PythonやAnsible自体はuvで管理しています。

```bash
uv add ansible ansible-lint
uv run ansible-playbook --version
```

作成したファイル構成はだいたいこんな感じです。

```text
ansible.cfg
group_vars/gitea.yml
inventory/hosts.example.yml
playbooks/preflight.yml
playbooks/upgrade.yml
roles/gitea_upgrade/
```

preflight.ymlは、その名の通り事前検証用です。  
Giteaの停止やアップグレードは行わず、次のような確認だけをします。

- currentがシンボリックリンクか
- current/bin/giteaが存在するか
- current/ini/app.iniが存在するか
- systemd serviceが存在するか
- 現在のGiteaバージョンは何か

実際にアップグレードするのはupgrade.ymlです。
## ハマりどころ
### ハマりどころ1: group_varsが読まれない

最初に、変数が未定義で落ちました。

```text
Error while resolving value for 'path': 'gitea_current_link' is undefined
```

group_vars/gitea.ymlをプロジェクト直下に置いていたのですが、playbookはplaybooks/配下にありました。  
この構成だと、期待していたようにgroup_varsが読まれていませんでした。（Ansibleに詳しい人には自明の理かもしれませんね）

ひとまず、playbook側で明示的に読み込むようにしました。

```yaml
vars_files:
  - ../group_vars/gitea.yml
```

### ハマりどころ2: binaryに実行権限がない

次に、ダウンロードしたGitea binaryを実行しようとして失敗しました。

```text
Permission denied: /usr/local/gitea/1.18.5/bin/gitea
```

get_urlで mode: "0755"を指定していたのですが、既存ファイルがある場合なども考えると、後段で明示的に補正したほうが安全そうでした。

```yaml
- name: Ensure target Gitea binary is executable
  ansible.builtin.file:
    path: "{{ gitea_upgrade_target_binary }}"
    owner: root
    group: root
    mode: "0755"
```

これで再実行時にも権限が補正されるようになりました。

### ハマりどころ3: become_userとremote_tmp

Gitea関連のコマンドは、rootではなくGitea実行ユーザーで実行したいです。  
今回の環境ではgiteaユーザーです。

ところが、become_user: giteaで実行した際にAnsibleの一時ディレクトリへ書き込めずに失敗しました。

```text
Permission denied: /tmp/.ansible-tmp/...
```

対処として、ansible.cfgでremote tmpを/tmp配下に寄せ、preflightで1777のディレクトリとして作成するようにしました。

```ini
remote_tmp = /tmp/.ansible-tmp
system_tmpdirs = /tmp, /var/tmp
```

```yaml
- name: Ensure Ansible remote tmp is usable by become users
  ansible.builtin.file:
    path: "{{ gitea_ansible_remote_tmp }}"
    state: directory
    owner: root
    group: root
    mode: "1777"
```

### ハマりどころ4: gitea dumpが変な場所のdataを見に行く

当初、各ステップの直前にgitea dumpを取るようにしていました。

しかし、CLIからgitea dumpを実行すると、以下のように/usr/local/gitea/current/bin/dataを見に行って失敗しました。

```text
Creating new Local Storage at /usr/local/gitea/current/bin/data/attachments
mkdir /usr/local/gitea/current/bin/data: permission denied
```

systemdで動いているときはWorkingDirectory=/var/lib/giteaが効いています。  
一方で、Ansibleから直接binaryを実行すると、systemdのWorkingDirectoryは当然効きません。

つまり、CLI実行時のwork pathがsystemd起動時とズレていました。

対処として、Gitea CLIには--work-path /var/lib/giteaを明示するようにしました。

```bash
/usr/local/gitea/current/bin/gitea \
  --work-path /var/lib/gitea \
  dump \
  -c /usr/local/gitea/current/ini/app.ini
```

Ansible側では変数として持たせています。

```yaml
gitea_work_path: /var/lib/gitea
```

:::message
APP_DATA_PATHを書けばよいのでは、と思いましたが、今回の問題はCLI実行時のwork path差分でした。  
systemd経由で起動した場合と、手元から直接binaryを叩いた場合で見える世界が違う、という話です。
:::

### ハマりどころ5: gitea dumpがsystem_settingで落ちる

--work-pathを直したので、これでgitea dumpが通るかと思ったのですが、次はDB dumpで落ちました。

```text
Failed to dump database: Error 1146: Table 'gitea.system_setting' doesn't exist
```

system_settingは、Gitea内部のDB-backed system settings用のテーブルです。  
ざっくり言うと、Giteaの設定の一部をDB側にも持つためのkey-value storeです。

ただ、今回の問題はsystem_settingそのものというより、古いスキーマに対して新しいGiteaのdumpが存在しないテーブルを参照してしまうことでした。

GiteaのdumpはGitea/XORM経由でDB dumpを行います。  
そのため、バージョン境界の古いスキーマと相性が悪い場面がありそうでした。

ここで方針を変えました。

```yaml
gitea_dump_before_each_step: false
```

アップグレード中のバックアップとしてgitea dumpを使うのをやめ、以下に寄せます。

- MySQL native dump
- ZFS snapshot
- VM/volume snapshot

必要であれば、各ステップ直前に任意のコマンドを挟めるようにしました。

```yaml
gitea_extra_backup_commands:
  - "mysqldump --single-transaction --routines --triggers --events --default-character-set=utf8mb4 gitea > /var/backups/gitea/mysql-before-{{ gitea_version }}-{{ ansible_facts.date_time.iso8601_basic_short }}.sql"
```

:::message
最初は「毎回gitea dumpを取れば安心」と思っていましたが、今回のような大幅アップグレードでは逆に足を引っ張る場面がありました。  
DBはDBのnative dumpを使うほうが素直そうです。
:::

### ハマりどころ6: hooks再生成でdefault_wiki_branchがない

1.26.2まで到達したあと、最後にadmin regenerate hooksを実行したところ失敗しました。

```text
Unknown column 'default_wiki_branch' in 'SELECT'
```

default_wiki_branchはrepository table側のカラムで、wiki repositoryのdefault branchを扱うためのものです。

この時点でアップグレード本体は1.26.2まで進んでいたのですが、hooks再生成のタイミングでDB schemaの不整合を踏んでしまいました。

少なくとも、hooks再生成をplaybookの最後で自動実行すると、migration状態を確認する前に別のエラーで落ちてしまいます。

そのため、hooks再生成は自動実行しない方針に変更しました。

```yaml
gitea_regenerate_hooks_after_upgrade: false
```

DB migrationとWeb起動確認が終わった後に、必要に応じて手動で実行することにします。

```bash
sudo -u gitea /usr/local/gitea/current/bin/gitea \
  --work-path /var/lib/gitea \
  admin regenerate hooks \
  -c /usr/local/gitea/current/ini/app.ini
```

## 最終的な方針

最終的に、今回のアップグレード方針は以下のようになりました。

- Giteaはminor versionを段階的に踏んで上げる
- PostgreSQL移行はGitea本体のupgrade後に別フェーズで行う
- upgrade中のbackupにgitea dumpは使わない
- DBはMySQL native dumpを使う
- ファイル類はZFS snapshotを使う
- Gitea CLIには --work-path /var/lib/giteaを明示する
- hooks再生成はmigration確認後に手動で行う
- currentを用いたsymlinkは便利だがrollback手段ではない

## 確認コマンド

最終的に到達したら、まずsystemdとversionを確認します。

```bash
sudo systemctl status gitea
/usr/local/gitea/current/bin/gitea --version
sudo journalctl -u gitea -n 200 --no-pager
```

起動ログでmigration errorがないことを確認します。

```bash
sudo systemctl restart gitea
sudo journalctl -u gitea -f
```

問題なさそうであれば、必要に応じてhooksを再生成します。

```bash
sudo -u gitea /usr/local/gitea/current/bin/gitea \
  --work-path /var/lib/gitea \
  admin regenerate hooks \
  -c /usr/local/gitea/current/ini/app.ini
```

## まとめ
こまめにアップグレードしよう