import React, { useEffect } from "react";
import styles from './Footer.module.scss'
import cn from "classnames";
import { useLang } from "../../hooks/useLang";
import { useState } from "react";
import { getDisplay } from "../../hooks/restModule";

export const Footer = () => {
    const { language } = useLang();
    const [display, setDisplay] = useState({});

    useEffect(() => {
        getDisplay({}).then(ret => setDisplay(ret));
    }, [setDisplay]);

    const items = [
        {
            key: "Company",
            text: {
                ko: "업체명 : 주식회사 코드포체인",
                en: "Company : Code4Chain"
            }
        },
        {
            key: "Business",
            text: {
                ko: "사업자번호 : 733-81-02728",
                en: "Business Number : 733-81-02728"
            }
        },
        {
            key: "CEO",
            text: {
                ko: "대표이사 : 김동훈",
                en: "CEO : KIM DONG HOON"
            }
        },
        {
            key: "Address",
            text: {
                ko: "주소 : 서울특별시 강남구 테헤란로82길 15",
                en: "Address : 15, Teheran-ro 82-gil, Gangnam-gu, Seoul, Republic of Korea"
            }
        },
    ];

    return (
        <footer>
            <section className={cn("container", styles.container)} id="contact">
                <div className="title">
                    <span className={styles.title_text}>Contact US</span>
                </div>
                <div className={styles.link_container}>
                    <a href="https://t.me/Code4Chain" target='_blank'>
                        <img className={styles.icon}
                            src={require("../../assets/images/common/telegram.png")}
                        />
                    </a>
                    <a href="https://pf.kakao.com/_xkbWVxj" target='_blank'>
                        <img className={styles.icon}
                            src={require("../../assets/images/common/kakao.png")}
                        />
                    </a>
                </div>
                <div className={styles.logo_container}>
                    <img className={styles.logo}
                        src={require("../../assets/images/common/c4c_logo_04.png")}
                    />
                </div>
                {display &&
                    <div className={styles.info}>
                        {items.map((item, index) => (
                            <div key={index}>
                                {(display[item.key] == null || display[item.key] == true) &&

                                    <div className={styles.contents} >
                                        <span className={styles.contents_text}>{item.text[language]}</span>
                                    </div>
                                }
                            </div>
                        ))}
                        <div className={styles.contents}>
                            <a href="mailto:contact@codeforchain.com">
                                <span className={styles.contents_text}>contact@codeforchain.com</span>
                            </a>
                        </div>
                        <div className={styles.contents}>
                            <span className={styles.contents_text}>Copyright 2022. Code4Chain., Corp all rights reserved.</span>
                        </div>
                    </div>
                }
            </section>
        </footer>
    );
};