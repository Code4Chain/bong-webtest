// Import React, useEffect, useState, useRef
import React, { useEffect, useRef, useState } from "react";
import styles from "../Admin.module.scss";
import cn from "classnames";
import { chevronBot, tooltip, chevronFilter } from "./SVG,";
// Import Arrow from SVG.jsx

// Genearate a select template that requires a list of options and a function to handle the change
export const CustomSelect = ({
    selected = null,
    type = null,
    list,
    key = null,
    svg = null,
    onChange,
}) => {
    const wrapper = useRef(null);
    const [active, setActive] = useState(false);
    const [currentList, setCurrentList] = useState(list);
    const [currentSelected, setCurrentSelected] = useState(selected);
    const onClick = (item) => {
        setCurrentSelected(item);
        if (onChange) onChange(item);

        setActive(false);
    };

    const toggleActive = () => {
        setActive(!active);
    };

    // useEffect(() => {
    //   if (currentSelected)
    //     setCurrentList(
    //       list.filter((item) => {
    //         let compareKey = key ?? "value";
    //         return item[compareKey] !== currentSelected[compareKey];
    //       })
    //     );
    // }, [currentSelected]);

    useEffect(() => {
        setCurrentSelected(selected);
    }, [selected]);

    useEffect(() => {
        const windowClick = ({ target }) => {
            if (!wrapper.current.contains(target)) setActive(false);
        };

        if (active) window.addEventListener("click", windowClick);
        else window.removeEventListener("click", windowClick);

        return () => window.removeEventListener("click", windowClick);
    }, [active]);

    return (
        <div
            className={
                type === "table"
                    ? cn({ [styles.active]: active === true }, styles.select, styles.coll)
                    : cn({ [styles.active]: active === true }, styles.select)
            }
            ref={wrapper}
        >
            <div className={styles.select__selected} onClick={toggleActive}>
                <div className={styles.select__selected_inner}>
                    {type === "table" ? (
                        <div className={styles.collection__table_action}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    ) : (
                        <span>{currentSelected ? currentSelected : "-----"}</span>
                    )}
                </div>
                {type === "table" ? (
                    ""
                ) : (
                    <> {svg === "pag" ? <>{chevronFilter}</> : <>{chevronBot}</>}</>
                )}
            </div>
            <ul
                className={cn(
                    { [styles.active]: active === true },
                    styles.select__options
                )}
            >
                {tooltip}
                {currentList.map((item, index) => (
                    <li
                        className={cn({
                            [styles.active]: currentSelected === item,
                        })}
                        key={index}
                        onClick={() => onClick(item)}
                    >
                        <span> {item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
