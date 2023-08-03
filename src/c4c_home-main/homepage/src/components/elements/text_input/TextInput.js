import React from "react";
import cn from "classnames";
import styles from "./TextInput.module.scss";

export const TextInput = ({ className, label, password, submit, error, ...props }) => {
    function onKeyDown(e) {
        if (e.key === 'Enter' && submit) {
            submit();
        }
    }

    return (
        <div className={cn(styles.field, className)}>
            {label && <div className={styles.label}>{label}</div>}
            <div className={styles.wrap}>
                <input className={cn(styles.input, { [styles.invalid]: error })} type={!password ? 'text' : 'password'}  {...props} onKeyPress={onKeyDown} />
            </div>
            {error && <div className={styles.error}>{error}</div>}
        </div>
    );
};

