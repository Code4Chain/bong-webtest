import React, { useState } from "react";
import styles from '../Admin.module.scss'
import cn from "classnames";
import { News } from "./news/News";
import { Display } from "./display/Display";

export const Table = () => {
    const [page, setPage] = useState("News");

    const tap = [
        "News",
        "Display"
    ]

    return (
        <section className={styles.section}>
            <div className={cn("container", styles.container)}>
                <div className={styles.admin}>
                    <div className={styles.auto__container}>
                        <div className={styles.admin__inner}>
                            <div className={styles.admin__inner_title}>
                                <h6 className={cn(styles.title_h6, styles.sm)}>
                                    Administrator Page
                                </h6>
                                <h1 className={styles.title_h1}>Settings</h1>
                                <h6 className={styles.title_h6}>
                                    Manage the homepage for the administrator.
                                </h6>
                            </div>
                            <div className={styles.admin__body}>
                                <div className={styles.admin__menu}>
                                    {tap.map((item, index) => (
                                        <div
                                            key={index}
                                            className={cn(styles.admin__menu_link, {
                                                [styles.active]: page === { item },
                                            })}
                                            onClick={() => {
                                                setPage(item);
                                            }}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className={cn(styles.admin__content)}
                                >
                                    {page === "News" && <News />}
                                    {page === "Display" && <Display />}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section >
    )
}