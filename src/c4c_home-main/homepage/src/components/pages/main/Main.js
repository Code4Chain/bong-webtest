import React, { useEffect } from 'react'
import styles from './Main.module.scss'

import { clearAllBodyScrollLocks } from "body-scroll-lock";
import { Intro } from './intro/Intro';
import { About } from './about/About';
import { Service } from './service/Service';
import { Portpolio } from './portpolio/Portpolio';
import { Procedure } from './procedure/Procedure';
import { News } from './news/News';
import { Partner } from './partner/Partner';
import { Bg } from './bg/Bg';

export const Main = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
        clearAllBodyScrollLocks();
    });

    return (
        <main className={styles.main}>
            <Bg />
            <Intro />
            <About />
            <Service />
            <Portpolio />
            <Procedure />
            <News />
            <Partner />
        </main>
    )
}