import React, { useState } from "react";
import cn from "classnames";
import OutsideClickHandler from "react-outside-click-handler";
import styles from "./Dropdown.module.scss";
import Icon from "../../Icon";

export const Dropdown = ({ className, value, setValue, options }) => {
    const [visible, setVisible] = useState(false);

    const handleClick = (value) => {
        setValue(value);
        setVisible(false);
    };

    return (
        <OutsideClickHandler onOutsideClick={() => setVisible(false)}>
            <div
                className={cn(styles.dropdown, className, { [styles.active]: visible })}
            >
                <div className={styles.head} onClick={() => setVisible(!visible)}>
                    <div className={styles.selection}>{value}</div>
                    <div className={styles.arrow}>
                        <Icon name="arrow-bottom" size="10" />
                    </div>
                </div>
                <div className={styles.body}>
                    {options.map((x, index) => (
                        <div
                            className={cn(styles.option, {
                                [styles.selected]: x === value,
                            })}
                            onClick={() => handleClick(x, index)}
                            key={index}
                        >
                            {x}
                        </div>
                    ))}
                </div>
            </div>
        </OutsideClickHandler>
    );
};