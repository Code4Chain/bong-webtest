import React from "react";
import cn from "classnames";
import styles from "../Admin.module.scss";
export const AdminModal = (props) => {
    return (
        <div
            className={
                props.type === "Delete" ? cn(styles.modal, styles.delete) : styles.modal
            }
        >
            <h3 className={styles.title_h3}>{props.type}</h3>
            <h6 className={styles.title_h6}>{props.text}</h6>
            {props.type === "Error" && (
                <button
                    type="button"
                    className={cn(
                        styles.button,
                        styles.primary,
                        styles.modal,
                        styles.yellow
                    )}
                    onClick={props.close}
                >
                    OK
                </button>
            )}
            {props.type === "Post" && (
                <button
                    type="submit"
                    className={cn(
                        styles.button,
                        styles.primary,
                        styles.modal,
                        styles.blue
                    )}
                    onClick={props.onClick}
                >
                    Post Now
                </button>
            )}
            {props.type === "Modify" && (
                <button
                    type="button"
                    className={cn(
                        styles.button,
                        styles.primary,
                        styles.modal,
                        styles.blue
                    )}
                    onClick={props.onClick}
                >
                    Modify
                </button>
            )}
            {props.type === "Import" && (
                <button
                    type="button"
                    className={cn(
                        styles.button,
                        styles.primary,
                        styles.modal,
                        styles.import
                    )}
                    onClick={props.onClick}
                >
                    ...
                </button>
            )}
            {(props.type === "Migration" || props.type === "Duplicated") && (
                <button
                    type="button"
                    className={cn(
                        styles.button,
                        styles.primary,
                        styles.modal,
                        styles.blue
                    )}
                    onClick={props.onClick}
                >
                    Ok
                </button>
            )}
            {props.type === "Delete" && (
                <>
                    <h6 className={cn(styles.title_h6, styles.uniq)}>{props.text2}</h6>
                    <button
                        type="button"
                        className={cn(
                            styles.button,
                            styles.primary,
                            styles.modal,
                            styles.red
                        )}
                        onClick={props.close}
                    >
                        Delete Now
                    </button>
                </>
            )}
        </div>
    );
};
