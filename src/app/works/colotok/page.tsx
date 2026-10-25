import type {Metadata} from "next";
import Link from "next/link";
import {
    FaArrowRight,
    FaBolt,
    FaBoxOpen,
    FaCloud,
    FaCodeBranch,
    FaFileLines,
    FaGithub,
    FaLayerGroup,
    FaRoute,
    FaTerminal,
} from "react-icons/fa6";
import styles from "./colotok.module.css";

const githubUrl = "https://github.com/milkcocoa0902/Colotok";
const docsUrl = "https://milkcocoa0902.github.io/colotok/";
const version = "1.0.0";
const mavenUrl = "https://central.sonatype.com/artifact/io.github.milkcocoa0902/colotok";
const title = "Colotok — Kotlinのログを、行き先から自由に。";
const description = "ログの整形・付加情報・出力先をコードで組み合わせる、Kotlin Multiplatform対応のオープンソースロギングライブラリ。";

export const metadata: Metadata = {
    title,
    description,
    alternates: {canonical: "/works/colotok"},
    openGraph: {
        title,
        description,
        url: "/works/colotok",
        type: "website",
        locale: "ja_JP",
        images: [{
            url: "/assets/works/Colotok.png",
            width: 1442,
            height: 723,
            alt: "ColotokのロギングランタイムとProvider、Formatter、Context、SLF4J連携の関係図。",
        }],
    },
    twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/assets/works/Colotok.png"],
        creator: "@milkcocoa0902",
    },
};

const features = [
    {
        icon: FaRoute,
        number: "01",
        label: "Providers",
        title: "書く処理と、届ける処理を分ける。",
        description: "Console・File・Streamを組み合わせ、同じログを必要な場所へ。独自のProviderを追加して、出力先を拡張することもできます。",
    },
    {
        icon: FaLayerGroup,
        number: "02",
        label: "Context & Format",
        title: "文字列の先に、文脈を残す。",
        description: "注文IDやリクエスト情報をログと一緒に記録。イベントをJSON形式で出力し、検索や分析に活用できます。",
    },
    {
        icon: FaBolt,
        number: "03",
        label: "Runtime",
        title: "非同期処理を、最後まで扱う。",
        description: "ログを一時的に蓄えるバッファから出力・終了処理まで管理。処理状況や出力先のエラーをメトリクスで把握できます。",
    },
];

const pipeline = [
    ["Record", "level · message · attributes", "ログ呼び出し時に時刻と属性を記録"],
    ["Context", "MDC snapshot", "MDCのスナップショットをイベントに保持"],
    ["Format", "text · structured JSON", "各ProviderでテキストやJSONへ整形"],
    ["Provide", "local · remote · custom", "複数の行き先へそれぞれ配信"],
] as const;

const destinations = [
    {icon: FaTerminal, name: "Console", detail: "組み込み · 開発中のログ出力", doc: "02-01-provider-configuration.html"},
    {icon: FaFileLines, name: "File / Stream", detail: "組み込み · ファイル保存／ストリーム出力", doc: "02-01-provider-configuration.html"},
    {icon: FaCloud, name: "Grafana Loki", detail: "追加モジュール · KMP", doc: "official-plugin.html"},
    {icon: FaCloud, name: "CloudWatch", detail: "追加モジュール · JVM", doc: "official-plugin.html"},
    {icon: FaCodeBranch, name: "SLF4J", detail: "1.7 / 2.x対応 · JVM", doc: "official-plugin.html"},
    {icon: FaBoxOpen, name: "Your Provider", detail: "独自の出力先へ拡張", doc: "custom-provider.html"},
];

const platforms = ["JVM", "Android", "JS / Node.js", "iOS / Simulator · Arm64", "macOS · Arm64"];
const modules = [
    ["colotok", "ログ出力・整形・組み込みProvider", "上記の全環境"],
    ["colotok-coroutines", "コルーチン連携・非同期出力", "上記の全環境"],
    ["colotok-loki", "Grafana Lokiへの出力", "上記の全環境"],
    ["colotok-cloudwatch", "CloudWatch Logsへの出力", "JVM"],
    ["colotok-slf4j / colotok-slf4j2", "SLF4J 1.7 / 2.xバインディング", "JVM"],
];

export default function ColotokPage() {
    return (
        <article className={styles.page}>
            <nav className={styles.breadcrumb} aria-label="パンくずリスト">
                <ol role="list">
                    <li><Link href="/works">Works</Link></li>
                    <li aria-current="page">Colotok</li>
                </ol>
            </nav>

            <header className={styles.hero}>
                <div className={styles.heroCopy}>
                    <p className={styles.eyebrow}><span aria-hidden="true" /> Code-based logging runtime for Kotlin</p>
                    <h1>Kotlinのログを、<br /><span>行き先から自由に。</span></h1>
                    <p className={styles.lead}>
                        ログを書く。文脈を加える。形を整える。<br className={styles.desktopBreak} />
                        そして、必要な場所へ届ける。
                    </p>
                    <p className={styles.heroDescription}>
                        Colotokは、出力先とログの形式をコードで組み合わせる、
                        Kotlin Multiplatform対応のロギングライブラリです。
                    </p>

                    <div className={styles.heroActions}>
                        <a
                            className={styles.primaryAction}
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="GitHubでColotokを見る（新しいタブで開く）"
                        >
                            <FaGithub aria-hidden="true" />
                            GitHubで見る
                            <FaArrowRight aria-hidden="true" />
                        </a>
                        <a className={styles.secondaryAction} href="#quick-start">導入方法を見る</a>
                    </div>

                    <ul className={styles.signalList} role="list" aria-label="Colotokの基本情報">
                        <li><span>Release</span><strong><a href={`${githubUrl}/releases/tag/${version}`}>{version}</a></strong></li>
                        <li><span>Core</span><strong>Kotlin Multiplatform</strong></li>
                        <li><span>License</span><strong>Apache 2.0</strong></li>
                    </ul>
                </div>

                <div className={styles.runtimeVisual} aria-label="Colotokでログを複数のProviderへ届けるコードと出力例">
                    <div className={styles.runtimeGlow} aria-hidden="true" />
                    <div className={styles.codeWindow}>
                        <div className={styles.windowBar}>
                            <span /><span /><span />
                            <p>Application.kt · 設定省略</p>
                        </div>
                        <pre tabIndex={0} aria-label="複数の出力先を組み合わせる概念例"><code><span className={styles.keyword}>val</span> logger = <span className={styles.type}>ColotokLoggerContext</span>(){"\n"}
    .<span className={styles.method}>addProvider</span>(<span className={styles.type}>ConsoleProvider</span>(<span className={styles.type}>ConsoleProviderConfig</span>())){"\n"}
    .<span className={styles.method}>addProvider</span>(<span className={styles.type}>LokiProvider</span> {`{ ... }`}){"\n"}
    .<span className={styles.method}>getLogger</span>(){"\n\n"}
logger.<span className={styles.method}>info</span>({"\n"}
    <span className={styles.string}>&quot;Order accepted&quot;</span>,{"\n"}
    <span className={styles.attribute}>mapOf</span>(<span className={styles.string}>&quot;order_id&quot;</span> to <span className={styles.string}>&quot;A-1024&quot;</span>),{"\n"}
)</code></pre>
                    </div>

                    <div className={styles.deliveryRail} aria-hidden="true">
                        <span>record</span><i /><span>format</span><i /><span>deliver</span>
                    </div>

                    <div className={styles.outputWindow}>
                        <div className={styles.outputHeading}>
                            <span>出力イメージ</span>
                            <i aria-hidden="true" />
                        </div>
                        <p><span>12:21:13.354</span> <strong>INFO</strong> Order accepted</p>
                        <dl>
                            <div><dt>order_id</dt><dd>A-1024</dd></div>
                            <div><dt>providers</dt><dd>console, loki</dd></div>
                        </dl>
                    </div>
                </div>
            </header>

            <section className={styles.statement} aria-labelledby="statement-title">
                <p className={styles.sectionIndex}>Why Colotok</p>
                <div>
                    <h2 id="statement-title">アプリケーションの出来事を、<br />文脈とともに残す。</h2>
                    <p>
                        開発中はConsoleへ。本番ではFileやLoki、CloudWatchへ。
                        ログを書くコードを変えずに、用途に合わせて出力先を組み合わせられます。
                    </p>
                </div>
            </section>

            <section className={styles.features} aria-labelledby="features-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>Built as a runtime</p>
                    <h2 id="features-title">出力だけで終わらない、<br />ログの実行基盤。</h2>
                </div>
                <ol className={styles.featureGrid} role="list">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <li key={feature.number}>
                                <div className={styles.featureMeta}>
                                    <span>{feature.number}</span>
                                    <Icon aria-hidden="true" />
                                </div>
                                <p>{feature.label}</p>
                                <h3>{feature.title}</h3>
                                <div className={styles.featureRule} aria-hidden="true" />
                                <p>{feature.description}</p>
                            </li>
                        );
                    })}
                </ol>
            </section>

            <section className={styles.pipelineSection} aria-labelledby="pipeline-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>Logging pipeline</p>
                    <h2 id="pipeline-title">ひとつのログが、<br />行き先へ届くまで。</h2>
                    <p>ログに付加情報を添え、出力先ごとに形式を整えて届けます。</p>
                </div>
                <ol className={styles.pipeline} role="list">
                    {pipeline.map(([name, technology, itemDescription], index) => (
                        <li key={name}>
                            <span className={styles.pipelineNumber}>{String(index + 1).padStart(2, "0")}</span>
                            <div>
                                <p>{name}</p>
                                <strong>{technology}</strong>
                                <span>{itemDescription}</span>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            <section className={styles.destinationsSection} aria-labelledby="destinations-title">
                <div className={styles.sectionHeading}>
                    <p className={styles.sectionIndex}>Route anywhere</p>
                    <h2 id="destinations-title">近くにも、遠くにも。</h2>
                    <p>ファイルやクラウドへの出力に加え、既存のログAPIとの連携や、独自の出力先への拡張にも対応します。</p>
                </div>
                <ul className={styles.destinationGrid} role="list">
                    {destinations.map((destination) => {
                        const Icon = destination.icon;
                        return (
                            <li key={destination.name}>
                                <a href={`${docsUrl}${destination.doc}`}>
                                    <Icon aria-hidden="true" />
                                    <div>
                                        <strong>{destination.name}</strong>
                                        <span>{destination.detail}</span>
                                    </div>
                                    <FaArrowRight aria-hidden="true" />
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section className={styles.platformSection} aria-labelledby="platform-title">
                <div>
                    <p className={styles.sectionIndex}>Multiplatform at the core</p>
                    <h2 id="platform-title">共通コードのログを、<br />それぞれの環境へ。</h2>
                    <p>
                        基本機能とコルーチン・Loki連携は、複数のプラットフォームに対応。
                        JVMではSLF4JやCloudWatchとの連携も利用できます。
                    </p>
                </div>
                <ul role="list">
                    {platforms.map((platform, index) => (
                        <li key={platform}>
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{platform}</strong>
                        </li>
                    ))}
                </ul>
                <div className={styles.moduleSupport}>
                    <div className={styles.tableScroll} role="region" aria-label="モジュールの対応環境" tabIndex={0}>
                        <table>
                            <caption>モジュールと対応環境 · {version}</caption>
                            <thead><tr><th scope="col">モジュール</th><th scope="col">用途</th><th scope="col">対応環境</th></tr></thead>
                            <tbody>{modules.map(([name, purpose, targets]) => (
                                <tr key={name}><th scope="row"><code>{name}</code></th><td>{purpose}</td><td>{targets}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section className={styles.quickStart} id="quick-start" aria-labelledby="quick-start-title">
                <div className={styles.quickStartCopy}>
                    <p className={styles.sectionIndex}>Quick start · v{version}</p>
                    <h2 id="quick-start-title">新しいアプリにも、<br />既存のコードにも。</h2>
                    <p>Maven Centralから必要なモジュールを追加して導入できます。既存のJVMアプリケーションには、SLF4Jを通じて組み込むこともできます。</p>
                    <div className={styles.quickLinks}>
                        <a href={`${docsUrl}01-colotok-introduce.html`} target="_blank" rel="noopener noreferrer">
                            ドキュメントを読む <FaArrowRight aria-hidden="true" />
                        </a>
                        <a href={mavenUrl} target="_blank" rel="noopener noreferrer">
                            Maven Central <FaArrowRight aria-hidden="true" />
                        </a>
                    </div>
                </div>
                <div className={styles.installStack}>
                    <div className={styles.snippet}>
                        <p>build.gradle.kts · 基本モジュール</p>
                        <pre tabIndex={0} aria-label="Gradleの依存関係"><code><span className={styles.method}>implementation</span>(<span className={styles.string}>{`"io.github.milkcocoa0902:colotok:${version}"`}</span>)</code></pre>
                    </div>
                    <div className={styles.snippet}>
                        <p>SLF4J連携 · JVM</p>
                        <div className={styles.integrationCopy}>
                            <h3>ログの呼び出しは、そのまま。</h3>
                            <p>SLF4JのバックエンドをColotokに切り替えると、アプリや依存ライブラリがSLF4Jに出力するログを、Colotokで扱えます。</p>
                            <div className={styles.quickLinks}>
                                <a href={`${docsUrl}official-plugin.html`}>SLF4J連携を見る <FaArrowRight aria-hidden="true" /></a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className={styles.finalCta}>
                <p className={styles.sectionIndex}>Open source on GitHub</p>
                <h2>ログの流れを、<br />コードで設計しよう。</h2>
                <p>Colotokは、Apache 2.0ライセンスで公開しているオープンソースプロジェクトです。</p>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                    <FaGithub aria-hidden="true" />
                    ColotokをGitHubで見る
                    <FaArrowRight aria-hidden="true" />
                </a>
            </footer>
        </article>
    );
}
