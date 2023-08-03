import React from "react";
import cn from "classnames";
import styles from "./LinkCheckbox.module.scss";
import { Link } from "react-router-dom";

const LinkCheckbox = ({ className, content, linkText, link, value, onChange, bold, error, tickClassName }) => {
    return (
        <label className={cn(styles.checkbox, className)}>
            <input
                className={styles.input}
                type="checkbox"
                onChange={onChange}
                checked={value}
            />
            <span className={styles.inner}>
                <span className={cn(tickClassName, styles.tick, { [styles.error]: error })}></span>
                <span className={cn(styles.text, { [styles.bold]: bold }, { [styles.error]: error })}>{content}</span><a className={styles.link} href={link} target="_blank"><span>{linkText}</span></a>
            </span>
        </label>
    );
};

export default LinkCheckbox;
