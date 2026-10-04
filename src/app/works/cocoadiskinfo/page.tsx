import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {
    FaArrowRight,
    FaClockRotateLeft,
    FaCodeBranch,
    FaDatabase,
    FaGithub,
    FaHardDrive,
    FaLayerGroup,
    FaServer,
} from "react-icons/fa6";
import dashboardOverview from "../../../../public/assets/works/cocoadiskinfo/dashboard-overview.png";
import styles from "./cocoadiskinfo.module.css";

const githubUrl = "https://github.com/koron0902/CocoaDiskInfo";
const title = "CocoaDiskInfo — ディスクの兆候を、見過ごさない。";
const description = "ATA/NVMeのS.M.A.R.T.情報を共通の見方へ整え、現在状態と履歴を確認できるオープンソースのディスクヘルスビューア。";

export const metadata: Metadata = {
    title,
    description,
    alternates: {canonical: "/works/cocoadiskinfo"},
    openGraph: {
        title,
        description,
        url: "/works/cocoadiskinfo",
        type: "website",
        locale: "ja_JP",
        images: [{
            url: "/assets/works/cocoadiskinfo/dashboard-overview.png",
            width: 1989,
            height: 1379,
            alt: "CocoaDiskInfoのダッシュボード。ノード、ディスクのhealth、温度、S.M.A.R.T.属性を一覧表示している。",
        }],
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/assets/works/cocoadiskinfo/dashboard-overview.png"],
        creator: "@milkcocoa0902",
    },
};

const capabilities = [
    {
        icon: FaLayerGroup,
        number: "01",
        title: "違う規格を、同じ視点へ。",
        description: "ATA/SATAとNVMeの差を吸収しながら、温度、通電時間、消耗度、警告を共通のDiskSnapshotとhealthへ整理します。",
    },
    {
        icon: FaClockRotateLeft,
        number: "02",
        title: "いまだけでなく、変化を見る。",
        description: "snapshotをSQLiteまたはPostgreSQLへ保存。デバイスごとのCurrentとHistoryを切り替え、過去との違いを追えます。",
    },
    {
        icon: FaServer,
        number: "03",
        title: "画面のないマシンも、手元から。",
        description: "Linuxマシン上のAgentがsmartctlを実行し、Desktop Clientへread APIで公開。NASやホームサーバーも同じUIで確認できます。",
    },
];

const flow = [
    ["Collect", "smartctl --json", "対象マシンでATA/NVMeのraw情報を取得"],
    ["Normalize", "DiskSnapshot", "protocol差を共通modelとhealthへ変換"],
    ["Persist", "SQLite / PostgreSQL", "現在値とbounded historyを保存"],
    ["Observe", "Compose Desktop", "一覧、詳細、履歴から変化を確認"],
] as const;

const roadmap = [
    {
        period: "2026 Q3",
        ref: "HEAD · CURRENT",
        title: "一台で、収集から履歴まで。",
        description: "現在のCocoaDiskInfoは、Standalone構成で収集・保存・API・表示・cleanupまでを完結できます。分散構成へ進むためのlocal topologyが、すでに動く現在地です。",
        details: [
            {
                label: "Collect",
                text: "ATA / SATAとNVMeをsmartctl JSONから共通snapshotへ正規化。Oneshotの単発確認とStandaloneの定期収集に対応しています。",
            },
            {
                label: "Store & Serve",
                text: "SQLite / PostgreSQLへ保存し、node・device単位のlatestと期間を絞ったhistoryをread APIで公開します。",
            },
            {
                label: "Observe & Maintain",
                text: "Compose Desktopで一覧・詳細・Current / Historyを表示。自動refreshとretention cleanup、VACUUMまで備えています。",
            },
        ],
        topics: ["Oneshot / Standalone", "ATA + NVMe", "SQLite / PostgreSQL", "Latest / History API", "Desktop Client", "Retention cleanup"],
        current: true,
    },
    {
        period: "2026 Q3",
        ref: "NEXT · FOUNDATION",
        title: "Hubの土台を組む。",
        description: "node-scoped identity、冪等なingest、Node registry、nonceと署名検証を先に固定し、安全に接続できる境界を作ります。",
        topics: ["Identity", "Ingest", "JWS + Nonce"],
    },
    {
        period: "2026 Q4",
        ref: "DISTRIBUTED",
        title: "複数ノードを、安全につなぐ。",
        description: "HubとNode Agentを接続し、HTTPS経由でsnapshotを集約。停止中のノードがあってもcacheとfreshnessを返せる体験へ進めます。",
        topics: ["Hub / Node Agent", "HTTPS", "Freshness"],
    },
    {
        period: "2026 Q4",
        ref: "EXPLAINABLE",
        title: "Health判定に、理由を持たせる。",
        description: "GOOD / CAUTION / BADという結果だけでなく、どのpolicyとruleが、なぜその判定を出したかを追えるようにします。",
        topics: ["Health Policy", "ruleKey", "Reason"],
    },
    {
        period: "2027 Q1",
        ref: "OPERABLE",
        title: "導入と運用を、製品の一部にする。",
        description: "systemd、設定・DB・logの配置、実行権限を固定し、Linux環境へ再現可能に導入できるpackageへまとめます。",
        topics: ["systemd", ".deb", "Permissions"],
    },
    {
        period: "2027 Q1",
        ref: "FINAL VISION · OBSERVABLE",
        title: "監視基盤へ、現在値を開く。",
        description: "CocoaDiskInfoの履歴を保ったまま、現在値をPrometheusへexport。既存の監視運用にも自然に接続できる状態を目指します。",
        topics: ["/metrics", "Prometheus", "Stable labels"],
    },
] as const;

export default function CocoaDiskInfoPage() {
    return (
        <article className={styles.page}>
            <nav className={styles.breadcrumb} aria-label="パンくずリスト">
                <ol role="list">
                    <li><Link href="/works">Works</Link></li>
                    <li aria-current="page">CocoaDiskInfo</li>
                </ol>
            </nav>

            <header className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}><span aria-hidden="true" /> Open source disk health viewer</p>
                    <h1>ディスクの<br />兆候を、<br /><span>見過ごさない。</span></h1>
                    <p className={styles.lead}>
                        S.M.A.R.T.を一度見るツールから、<br className={styles.desktopBreak} />
                        変化を追うための小さな観測基盤へ。
                    </p>
                    <p className={styles.heroDescription}>
                        CocoaDiskInfoは、LinuxマシンのATA/NVMe情報を収集・正規化し、
                        現在のhealthと履歴をひとつの画面で確認できるディスクヘルスビューアです。
                    </p>

                    <div className={styles.heroActions}>
                        <a
                            className={styles.primaryAction}
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHubでCocoaDiskInfoを見る（新しいタブで開く）"
                        >
                            <FaGithub aria-hidden="true" />
                            GitHubで見る
                            <FaArrowRight aria-hidden="true" />
                        </a>
                        <a className={styles.secondaryAction} href="#quick-start">まず動かしてみる</a>
                    </div>

                    <ul className={styles.signalList} role="list" aria-label="対応機能">
                        <li><span>Protocol</span><strong>ATA + NVMe</strong></li>
                        <li><span>Storage</span><strong>SQLite + PostgreSQL</strong></li>
                        <li><span>Runtime</span><strong>Oneshot + Standalone</strong></li>
                    </ul>
                </div>

                <figure className={styles.productFigure}>
                    <div className={styles.figureTopbar} aria-hidden="true">
                        <span /><span /><span />
                        <p>CocoaDiskInfo / localhost:14631</p>
                    </div>
                    <Image
                        src={dashboardOverview}
                        alt="CocoaDiskInfoのダッシュボード。5台のディスクと選択中ディスクのhealth、温度、通電時間、S.M.A.R.T.属性を表示している。"
                        priority
                        sizes="(min-width: 1280px) 760px, (min-width: 768px) 88vw, calc(100vw - 2rem)"
                        className={styles.dashboardImage}
                    />
                    <figcaption>
                        <span>Current dashboard</span>
                        ひとつの画面から、全体と一台の詳細へ。
                    </figcaption>
                </figure>
            </header>

            <section className={styles.statement} aria-labelledby="statement-title">
                <p className={styles.sectionIndex}>Why CocoaDiskInfo</p>
                <div>
                    <h2 id="statement-title">壊れたか、だけでは足りない。</h2>
                    <p>
                        温度が上がった。エラーが増えた。消耗度が進んだ。
                        ストレージの判断には、現在値と、それまでの文脈が必要です。
                        CocoaDiskInfoはrawな数値を隠さず、日常的に読める形へ整えます。
                    </p>
                </div>
            </section>

            <section className={styles.capabilities} aria-labelledby="capabilities-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>What it does</p>
                    <h2 id="capabilities-title">収集から確認までを、一本につなぐ。</h2>
                </div>
                <ol className={styles.capabilityList} role="list">
                    {capabilities.map((capability) => {
                        const Icon = capability.icon;
                        return (
                            <li key={capability.number}>
                                <div className={styles.capabilityMarker}>
                                    <span>{capability.number}</span>
                                    <Icon aria-hidden="true" />
                                </div>
                                <div>
                                    <h3>{capability.title}</h3>
                                    <p>{capability.description}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className={styles.flowSection} aria-labelledby="flow-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>Data flow</p>
                    <h2 id="flow-title">小さく、分離された観測パイプライン。</h2>
                    <p>収集、変換、保存、表示を分けることで、ローカル運用から分散構成まで育てられる設計です。</p>
                </div>
                <ol className={styles.flowList} role="list">
                    {flow.map(([label, technology, itemDescription], index) => (
                        <li key={label}>
                            <span className={styles.flowNumber}>{String(index + 1).padStart(2, "0")}</span>
                            <div>
                                <p>{label}</p>
                                <strong>{technology}</strong>
                                <span>{itemDescription}</span>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.roadmapSection} aria-labelledby="roadmap-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>Roadmap</p>
                    <h2 id="roadmap-title">現在地から、観測基盤になるまで。</h2>
                    <p>2026 Q3のStandaloneを起点に、分散、説明可能性、運用、外部監視への接続を順に積み上げます。</p>
                </div>

                <ol className={styles.roadmapGraph} role="list">
                    {roadmap.map((milestone) => (
                        <li
                            key={`${milestone.period}-${milestone.ref}`}
                            className={`${styles.roadmapItem} ${"current" in milestone && milestone.current ? styles.currentMilestone : ""}`}
                        >
                            <div className={styles.roadmapPeriod}>
                                <span>{milestone.period}</span>
                                <code>{milestone.ref}</code>
                            </div>
                            <span className={styles.roadmapRail} aria-hidden="true"><span /></span>
                            <div className={styles.roadmapCommit}>
                                <h3>{milestone.title}</h3>
                                <p>{milestone.description}</p>
                                {"details" in milestone && (
                                    <dl className={styles.roadmapDetails}>
                                        {milestone.details.map((detail) => (
                                            <div key={detail.label}>
                                                <dt>{detail.label}</dt>
                                                <dd>{detail.text}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                                <ul role="list">
                                    {milestone.topics.map((topic) => <li key={topic}>{topic}</li>)}
                                </ul>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.quickStart} id="quick-start" aria-labelledby="quick-start-title">
                <div className={styles.quickStartCopy}>
                    <p className={styles.sectionIndex}>Quick start</p>
                    <h2 id="quick-start-title">まずは、手元の一台から。</h2>
                    <p>
                        JDK 21とsmartmontoolsを用意し、schemaを明示的にmigrationしてからStandaloneを起動します。
                        既定ではloopbackだけでAPIを公開します。
                    </p>
                    <ul className={styles.stackList} role="list" aria-label="使用技術">
                        <li><FaCodeBranch aria-hidden="true" /> Kotlin</li>
                        <li><FaHardDrive aria-hidden="true" /> smartctl</li>
                        <li><FaDatabase aria-hidden="true" /> Flyway</li>
                    </ul>
                </div>
                <figure className={styles.terminal}>
                    <figcaption>
                        <span aria-hidden="true">● ● ●</span>
                        terminal
                    </figcaption>
                    <pre tabIndex={0}><code><span>$</span> ./gradlew :diskinfo-agent:run \<br />
  --args=&apos;db migrate&apos;<br /><br />
<span>$</span> ./gradlew :diskinfo-agent:run \<br />
  --args=&apos;standalone --scan&apos;</code></pre>
                    <p><span aria-hidden="true" /> API ready at http://127.0.0.1:14631</p>
                </figure>
            </section>

            <aside className={styles.securityNote} aria-labelledby="security-title">
                <div>
                    <p className={styles.sectionIndex}>Security note</p>
                    <h2 id="security-title">現在は、信頼できるローカルネットワーク向けです。</h2>
                </div>
                <p>
                    現在の通信はplain HTTP・未認証です。インターネットへ直接公開しないでください。
                    最終構想ではHTTPSと署名requestを導入します。
                </p>
            </aside>

            <footer className={styles.finalCta}>
                <p className={styles.sectionIndex}>Open source</p>
                <h2>ディスクの変化を、<br />見える状態にしておく。</h2>
                <p>ソースコードと開発の記録はGitHubで公開しています。</p>
                <a
                    className={styles.primaryAction}
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="GitHubでCocoaDiskInfoを見る（新しいタブで開く）"
                >
                    <FaGithub aria-hidden="true" />
                    CocoaDiskInfo on GitHub
                    <FaArrowRight aria-hidden="true" />
                </a>
            </footer>
        </article>
    );
}
