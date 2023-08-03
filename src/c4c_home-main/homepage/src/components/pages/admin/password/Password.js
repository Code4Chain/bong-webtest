import React, { useState } from "react";
import styles from './Password.module.scss'
import { TextInput } from "../../../elements/text_input/TextInput";

export const Password = ({ setShowAdmin }) => {
    const [password, setPassword] = useState('');

    function onPasswordChecked() {
        if (password == '0000!') {
            setShowAdmin(true);
        }
    }

    return (
        <section className={styles.section}>
            <div className={styles.password_box}>
                <TextInput
                    className={styles.field}
                    label="Password"
                    password="true"
                    placeholder="Enter password"
                    max="128"
                    value={password}
                    submit={onPasswordChecked}
                    onChange={e => setPassword(e.target.value)}
                    required
                >
                </TextInput>
            </div>
        </section >
    )
}