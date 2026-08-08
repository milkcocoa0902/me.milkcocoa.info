"use client";

import {useEffect, useState} from "react";
import {flushSync} from "react-dom";
import Link from "next/link";
import {
    FaArrowLeft,
    FaArrowRight,
    FaEnvelope,
    FaGithub,
    FaLocationDot,
    FaXTwitter,
} from "react-icons/fa6";
import {SiZenn} from "react-icons/si";
import styles from "./business-card.module.css";

type BusinessCardProps = {
    presentedDate?: string;
};

const links = [
    {
        label: "GitHub",
        value: "milkcocoa0902",
        href: "https://github.com/milkcocoa0902",
        icon: FaGithub,
    },
    {
        label: "X",
        value: "@milkcocoa0902",
        href: "https://twitter.com/milkcocoa0902",
        icon: FaXTwitter,
    },
    {
        label: "Zenn",
        value: "milkcocoa0902",
        href: "https://zenn.dev/milkcocoa0902",
        icon: SiZenn,
    },
    {
        label: "Email",
        value: "developer@milkcocoa.info",
        href: "mailto:developer@milkcocoa.info",
        icon: FaEnvelope,
    },
];

export function BusinessCard({presentedDate}: BusinessCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [cardRevision, setCardRevision] = useState(0);

    useEffect(() => {
        const resetCard = () => {
            flushSync(() => {
                setIsFlipped(false);
                setCardRevision((revision) => revision + 1);
            });
        };

        window.addEventListener("pageshow", resetCard);
        return () => window.removeEventListener("pageshow", resetCard);
    }, []);

    const openPortfolio = () => {
        // The state must reach the DOM before the browser stores this page in
        // the back-forward cache. Otherwise Safari can restore a stale 3D
        // hit-test layer even though the front face is being painted.
        flushSync(() => setIsFlipped(false));
    };

    return (
        <div className={styles.scene}>
            <div className={styles.ambient} aria-hidden="true"/>

            <div className={styles.cardPosition}>
                <div
                    className={`${styles.card} ${isFlipped ? styles.flipped : ""}`}
                    key={cardRevision}
                >
                    <section className={`${styles.face} ${styles.front}`} aria-hidden={isFlipped}>
                        <div className={styles.grid} aria-hidden="true"/>
                        <div className={styles.frontContent}>
                            <div className={styles.brandRow}>
                                <div className={styles.mark} aria-hidden="true">
                                    <span>m</span>
                                </div>
                                <span className={styles.studio}>Cocoa Tech. Lab.</span>
                            </div>

                            <div className={styles.identity}>
                                <p className={styles.eyebrow}>Kotlin Backend Engineer</p>
                                <h1>milkcocoa</h1>
                                <p className={styles.location}>
                                    <FaLocationDot aria-hidden="true"/>
                                    Osaka, Japan
                                </p>
                            </div>

                            <div className={styles.frontFooter}>
                                {presentedDate ? (
                                    <div className={styles.dateStamp}>
                                        <span>HANDED ON</span>
                                        <time>{presentedDate}</time>
                                    </div>
                                ) : (
                                    <span className={styles.domain}>me.milkcocoa.info</span>
                                )}

                                <span className={styles.flipHint}>
                                    TAP TO FLIP
                                    <FaArrowRight aria-hidden="true"/>
                                </span>
                            </div>
                        </div>

                        <button
                            className={styles.faceButton}
                            type="button"
                            onClick={() => setIsFlipped(true)}
                            aria-label="名刺を裏返して連絡先を見る"
                            tabIndex={isFlipped ? -1 : 0}
                        />
                    </section>

                    <section className={`${styles.face} ${styles.back}`} aria-hidden={!isFlipped}>
                        <div className={styles.backGlow} aria-hidden="true"/>
                        <div className={styles.backHeader}>
                            <div>
                                <p className={styles.eyebrow}>LET&apos;S CONNECT</p>
                                <h2>Find me online.</h2>
                            </div>
                            <button
                                className={styles.flipBack}
                                type="button"
                                onClick={() => setIsFlipped(false)}
                                tabIndex={isFlipped ? 0 : -1}
                            >
                                <FaArrowLeft aria-hidden="true"/>
                                <span>BACK</span>
                            </button>
                        </div>

                        <div className={styles.linkGrid}>
                            {links.map(({label, value, href, icon: Icon}) => (
                                <a
                                    className={styles.contactLink}
                                    href={href}
                                    key={label}
                                    target={href.startsWith("http") ? "_blank" : undefined}
                                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                                    tabIndex={isFlipped ? 0 : -1}
                                >
                                    <Icon className={styles.contactIcon} aria-hidden="true"/>
                                    <span>
                                        <small>{label}</small>
                                        <strong>{value}</strong>
                                    </span>
                                    <FaArrowRight className={styles.linkArrow} aria-hidden="true"/>
                                </a>
                            ))}
                        </div>

                        <Link
                            className={styles.portfolioLink}
                            href="/"
                            onClick={openPortfolio}
                            tabIndex={isFlipped ? 0 : -1}
                        >
                            View full portfolio
                            <FaArrowRight aria-hidden="true"/>
                        </Link>
                    </section>
                </div>
            </div>

            <p className={styles.instruction} aria-live="polite">
                {isFlipped ? "リンクを選ぶか、BACKで表面に戻れます" : "カードをタップして裏返す"}
            </p>
        </div>
    );
}
