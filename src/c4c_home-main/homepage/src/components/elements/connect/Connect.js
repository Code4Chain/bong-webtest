import React from "react";
import cn from "classnames";
import styles from "./Connect.module.scss";
import Icon from "../../Icon";
import { blockchain } from '../../../utility/helpers';
import { Link } from "react-router-dom";

const Connect = ({ className, close }) => {

    return (
        <div className={cn(className, styles.connect)}>
            <div className={styles.icon}>
                <Icon name="wallet" size="24" />
            </div>
            <div className={styles.info}>
                You need to connect your wallet first to sign messages and send
                transaction to {blockchain} network
            </div>
            <div className={styles.btns}>
                <Link className={cn("button", styles.button)} onClick={close} to="/login">Log in</Link>
                <button className={cn("button-stroke", styles.button)} onClick={close}>Cancel</button>
            </div>
        </div >
    );
};

export default Connect;
