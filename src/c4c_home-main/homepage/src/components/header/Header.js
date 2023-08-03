import React, { useState } from 'react'

import styles from './Header.module.scss'
import { Link } from 'react-router-dom'
import { clearAllBodyScrollLocks } from "body-scroll-lock";
import cn from "classnames";

import { useEffect } from 'react';
import { useLang } from '../../hooks/useLang';

export const Header = () => {

    const menuItems = [
        {
            link: "#home",
            text: "Home",
        },
        {
            link: "#service",
            text: "Service",
        },
        {
            link: "#portpolio",
            text: "Portpolio",
        },
        {
            link: "#news",
            text: "News",
        },
        {
            link: "#partners",
            text: "Partners",
        },
        {
            link: "#contact",
            text: "Contact",
        },
    ]

    const [mobileMenu, setMobileMenu] = useState(false);
    const { language, setLanguage } = useLang();

    useEffect(() => {
        clearAllBodyScrollLocks();
    });

    return (
        <>
            <nav>
                <section className={cn("container", styles.container)}>
                    <div className={styles.box_container}>
                        <button className={styles.mobile_menu} onClick={() => setMobileMenu(s => !s)} >
                            <img src={require("../../assets/images/common/btn_tap.png")} ></img>
                        </button>
                        <Link className={styles.logo_container} to="/">
                            <img className={styles.logo}
                                src={require("../../assets/images/common/c4c_logo_04.png")}
                            />
                        </Link>
                        <div id="menu_container" className={cn(styles.menu_container, { [styles.active]: mobileMenu })}>
                            {menuItems.map((item, index) => (
                                <span className={styles.menu} key={index}>
                                    <a href={item.link} onClick={() => setMobileMenu(false)}>{item.text}</a>
                                </span>
                            ))}
                        </div>
                        <div className={styles.lang_container}>
                            <button className={cn(styles.lang_box, { [styles.active]: language == "ko" })} onClick={() => setLanguage("ko")}>
                                <span className={styles.kr} >KR</span>
                            </button>
                            <button className={cn(styles.lang_box, { [styles.active]: language == "en" })} onClick={() => setLanguage("en")}>
                                <span className={styles.en} >EN</span>
                            </button>
                        </div>
                    </div>
                </section>
            </nav >
            <div className={styles.nav_padding}>
            </div>
        </>
    )
}