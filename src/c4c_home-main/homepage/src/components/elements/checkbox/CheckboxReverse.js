import React from "react";
import cn from "classnames";
import styles from "./CheckboxReverse.module.scss";

const CheckboxReverse = ({ className, content, value, onChange, bold, error, tickClassName }) => {
    return (
        <label className={cn(styles.checkbox, className)}>
            <input
                className={styles.input}
                type="checkbox"
                onChange={onChange}
                checked={value}
            />
            <span className={styles.inner}>
                <span className={cn(styles.text, { [styles.bold]: bold }, { [styles.error]: error })}>{content}</span>
                <span className={cn(tickClassName, styles.tick, { [styles.error]: error })}></span>
            </span>
        </label>
    );
};

export default CheckboxReverse;
