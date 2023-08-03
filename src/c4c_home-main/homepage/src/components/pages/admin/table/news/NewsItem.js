import React from "react";
import cn from "classnames";
import styles from "../../Admin.module.scss";
export const NewsItem = (props) => {
    return (
        <div className={styles.notice__main_item} onClick={props.onClick}>
            <h6 className={styles.title_h6}>
                {props.Id}. {props.Title}
            </h6>
            <p className={cn(styles.para, styles.uniq)}>{props.Date}</p>
        </div>
    );
};
