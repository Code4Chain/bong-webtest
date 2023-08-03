import React from "react";
import cn from "classnames";
import styles from './Intro.module.scss'
import { useLang } from "../../../../hooks/useLang";

export const Intro = () => {
    const { language } = useLang();

    const items = {
        title: {
            ko: "블록체인 전문 개발자들이\n여러분을\n기다리고 있습니다.",
            en: "Code4Chain\nBlockchain developers\nare waiting for you.",
        },
        exp1: {
            ko: "다양한 경험을 가진 블록체인 전문가들이\n여러분이 기획한 아이디어를 현실로 구현되게 만들어 드립니다.",
            en: "Blockchain experts with various experiences\nwill make your ideas a reality.",
        },
        exp2: {
            ko: "C4C 와 함께라면 블록체인은 더 이상 어려운 영역이 아닙니다.\nC4C를 통해 혁신을 이끌어내세요.",
            en: "With C4C, blockchain is no longer a difficult area.\nSeek Innovation with C4C.",
        },
    }

    return (
        <section className={styles.section}>
            <div id="home" className={cn("container", styles.container)}>
                <div className={styles.box_container}>
                    <div className={styles.bg}></div>
                    <div className={styles.title}>
                        <span className={cn("title", styles.title)}>{items.title[language]}</span>
                    </div>
                    <div className={styles.exp}>
                        <span className={styles.exp_text}>{items.exp1[language]}</span>
                    </div>

                    <a className={styles.contact_link} href="#contact">
                        <div className={styles.btn}>
                            <span className={styles.btn_text}>Contact</span>
                        </div>
                    </a>
                </div>
                <div className={styles.bottom_exp}>
                    <span className={styles.bottom_exp_text}>{items.exp2[language]}</span>
                </div>
            </div >
        </section >
    )
}