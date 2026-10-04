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
const mavenUrl = "https://central.sonatype.com/artifact/io.github.milkcocoa0902/colotok";
const title = "Colotok — Kotlinのログを、行き先から自由に。";
const description = "Kotlin Multiplatformで、整形・文脈・出力先をコードから組み立てられるオープンソースのロギングランタイム。";

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
        description: "Console・File・Streamを組み合わせ、同じログを必要な場所へ。独自Providerも共通のライフサイクル上で実装できます。",
    },
    {
        icon: FaLayerGroup,
        number: "02",
        label: "Context & Format",
        title: "文字列の先に、文脈を残す。",
        description: "attributesとMDCをログ時点でsnapshot。テキストだけでなく、kotlinx.serializationを使った構造化ログにも対応します。",
    },
    {
        icon: FaBolt,
        number: "03",
        label: "Runtime",
        title: "非同期処理を、最後まで扱う。",
        description: "buffer、overflow、flush、graceful shutdownをランタイムとして提供。出力先の失敗とログの受理状態をmetricsで観測できます。",
    },
];

const pipeline = [
    ["Record", "level · message · attributes", "ログ呼び出し時の情報をひとつのrecordへ"],
    ["Context", "MDC snapshot", "非同期処理へ渡る前に文脈を固定"],
    ["Format", "text · structured JSON", "用途に合わせた表現へ変換"],
    ["Provide", "local · remote · custom", "複数の行き先へそれぞれ配信"],
] as const;

const destinations = [
    {icon: FaTerminal, name: "Console", detail: "色付きの開発ログ"},
    {icon: FaFileLines, name: "File", detail: "size / date rotation"},
    {icon: FaCloud, name: "Grafana Loki", detail: "KMP remote provider"},
    {icon: FaCloud, name: "CloudWatch", detail: "AWS / JVM integration"},
    {icon: FaCodeBranch, name: "SLF4J", detail: "1.7.x / 2.x bindings"},
    {icon: FaBoxOpen, name: "Your Provider", detail: "独自の出力先へ拡張"},
];

const platforms = ["JVM", "Android", "JavaScript", "iOS", "macOS"];

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
                        Colotokは、ProviderとFormatterをコードから組み立てる
                        Kotlin Multiplatform向けのロギングランタイムです。
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
                        <a className={styles.secondaryAction} href="#quick-start">3行で始める</a>
                    </div>

                    <ul className={styles.signalList} role="list" aria-label="Colotokの基本情報">
                        <li><span>Release</span><strong>0.4.3</strong></li>
                        <li><span>Core</span><strong>Kotlin Multiplatform</strong></li>
                        <li><span>License</span><strong>Apache 2.0</strong></li>
                    </ul>
                </div>

                <div className={styles.runtimeVisual} aria-label="Colotokでログを複数のProviderへ届けるコードと出力例">
                    <div className={styles.runtimeGlow} aria-hidden="true" />
                    <div className={styles.codeWindow}>
                        <div className={styles.windowBar} aria-hidden="true">
                            <span /><span /><span />
                            <p>Application.kt</p>
                        </div>
                        <pre><code><span className={styles.keyword}>val</span> logger = <span className={styles.type}>ColotokLoggerContext</span>(){"\n"}
    .<span className={styles.method}>addProvider</span>(<span className={styles.type}>ConsoleProvider</span>()){"\n"}
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
                            <span>LIVE OUTPUT</span>
                            <i aria-hidden="true" />
                        </div>
                        <p><span>12:21:13.354</span> <strong>INFO</strong> Order accepted</p>
                        <dl>
                            <div><dt>order_id</dt><dd>A-1024</dd></div>
                            <div><dt>providers</dt><dd>console, loki</dd></div>
                            <div><dt>accepted</dt><dd>true</dd></div>
                        </dl>
                    </div>
                </div>
            </header>

            <section className={styles.statement} aria-labelledby="statement-title">
                <p className={styles.sectionIndex}>Why Colotok</p>
                <div>
                    <h2 id="statement-title">ログは文字列ではなく、<br />アプリケーションの出来事だ。</h2>
                    <p>
                        開発中はConsoleへ。本番ではFileやLoki、CloudWatchへ。
                        Colotokは呼び出し側を出力先の都合から切り離し、同じrecordを、同じ文脈のまま運びます。
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
                    <h2 id="pipeline-title">ひとつのrecordが、<br />行き先へ届くまで。</h2>
                    <p>記録・文脈・表現・出力を分ける、小さく交換可能なパイプラインです。</p>
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
                    <p>組み込みProviderから公式integration、独自実装まで。同じloggerから複数の出力先を選べます。</p>
                </div>
                <ul className={styles.destinationGrid} role="list">
                    {destinations.map((destination) => {
                        const Icon = destination.icon;
                        return (
                            <li key={destination.name}>
                                <Icon aria-hidden="true" />
                                <div>
                                    <strong>{destination.name}</strong>
                                    <span>{destination.detail}</span>
                                </div>
                                <FaArrowRight aria-hidden="true" />
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
                        core・coroutines・LokiはKotlin Multiplatformへ。
                        SLF4JとCloudWatchはJVM integrationとして、必要な場所にだけ追加できます。
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
            </section>

            <section className={styles.quickStart} id="quick-start" aria-labelledby="quick-start-title">
                <div className={styles.quickStartCopy}>
                    <p className={styles.sectionIndex}>Quick start · v0.4.3</p>
                    <h2 id="quick-start-title">Providerを選べば、<br />すぐに書ける。</h2>
                    <p>Maven Centralからcoreを追加し、ContextへProviderを登録します。最小構成はこれだけです。</p>
                    <div className={styles.quickLinks}>
                        <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                            ドキュメントを読む <FaArrowRight aria-hidden="true" />
                        </a>
                        <a href={mavenUrl} target="_blank" rel="noopener noreferrer">
                            Maven Central <FaArrowRight aria-hidden="true" />
                        </a>
                    </div>
                </div>
                <div className={styles.installStack}>
                    <div className={styles.snippet}>
                        <p><span>01</span> build.gradle.kts</p>
                        <pre><code><span className={styles.keyword}>implementation</span>(<span className={styles.string}>&quot;io.github.milkcocoa0902:colotok:0.4.3&quot;</span>)</code></pre>
                    </div>
                    <div className={styles.snippet}>
                        <p><span>02</span> Application.kt</p>
                        <pre><code><span className={styles.keyword}>val</span> logger = <span className={styles.type}>ColotokLoggerContext</span>(){"\n"}
    .<span className={styles.method}>addProvider</span>(<span className={styles.type}>ConsoleProvider</span>()){"\n"}
    .<span className={styles.method}>getLogger</span>(){"\n\n"}
logger.<span className={styles.method}>info</span>(<span className={styles.string}>&quot;Hello, Colotok&quot;</span>)</code></pre>
                    </div>
                </div>
            </section>

            <footer className={styles.finalCta}>
                <p className={styles.sectionIndex}>Open source on GitHub</p>
                <h2>ログの流れを、<br />コードで設計しよう。</h2>
                <p>Colotokは、Kotlinで育てているオープンソースプロジェクトです。</p>
                <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                    <FaGithub aria-hidden="true" />
                    ColotokをGitHubで見る
                    <FaArrowRight aria-hidden="true" />
                </a>
            </footer>
        </article>
    );
}
