import React from "react";
import cn from "classnames";
import styles from "./NotFound.module.scss";
import { Image } from "../../Image";

export const NotFound = ({ className, text }) => {

    return (
        <div className={cn(className, styles.preview)}>
            <Image
                srcSet={require("../../../assets/images/content/no_result.jpg")}
                srcSetDark={require("../../../assets/images/content/no_result_dark.jpg")}
                src={require("../../../assets/images/content/no_result.jpg")}
                srcDark={require("../../../assets/images/content/no_result_dark.jpg")}
                alt="Figures"
            />

            <div className={styles.wrap}>
                <h2 className={cn("h2", styles.title)}>
                    {text}
                </h2>
            </div>
        </div>
    );
};