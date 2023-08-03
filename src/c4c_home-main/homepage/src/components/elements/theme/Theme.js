import React from 'react'

import cn from "classnames";
import useDarkMode from "use-dark-mode";

import styles from './Theme.module.scss'

export const Theme = ({ className }) => {
    const darkMode = useDarkMode(false);

    return (
        <label
            className={cn(
                styles.theme,
                { [styles.theme]: className === "theme" },
                { [styles.themeBig]: className === "theme-big" }
            )}
        >
            <input
                className={styles.input}
                checked={darkMode.value}
                onChange={darkMode.toggle}
                type="checkbox"
            />
            <span className={styles.inner}>
                <span className={styles.box}></span>
            </span>
        </label>
    );
};