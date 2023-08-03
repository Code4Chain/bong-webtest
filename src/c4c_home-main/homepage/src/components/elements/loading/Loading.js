import React from "react";
import cn from "classnames";
import styles from "./Loading.module.scss";

export const Loading = ({ className }) => {
    return <div className={cn(styles.loader, className)}></div>;
};
