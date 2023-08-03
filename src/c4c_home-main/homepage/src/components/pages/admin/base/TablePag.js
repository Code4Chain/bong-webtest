import React from "react";
import { usePagination, DOTS } from "../../../../hooks/usePagination";
import cn from "classnames";
import styles from "../Admin.module.scss";
import { chevronNext, chevronPrev } from "./SVG,";

export const TablePag = (props) => {
    const {
        onPageChange,
        totalCount,
        siblingCount = 1,
        currentPage,
        pageSize,
    } = props;

    const paginationRange = usePagination({
        currentPage,
        totalCount,
        siblingCount,
        pageSize,
    });
    // If there are less than 2 times in pagination range we shall not render the component
    if (currentPage === 0 || paginationRange.length < 2) {
        return null;
    }

    const onNext = () => {
        onPageChange(currentPage + 1);
    };

    const onPrevious = () => {
        onPageChange(currentPage - 1);
    };

    let lastPage = paginationRange[paginationRange.length - 1];
    return (
        <ul className={styles.tablePag}>
            {/* Left navigation arrow */}
            <li
                className={cn(styles.tablePag__item, styles.arrow, {
                    [styles.disabled]: currentPage === 1,
                })}
                onClick={onPrevious}
            >
                {chevronPrev}
            </li>
            <li
                className={cn(styles.tablePag__item, {
                    [styles.selected]: currentPage === currentPage,
                })}
            >
                {currentPage}
            </li>
            <li className={cn(styles.tablePag__item, styles.slash)}>/</li>
            <li className={styles.tablePag__item}>{lastPage}</li>

            {/*  Right Navigation arrow */}
            <li
                className={cn(styles.tablePag__item, styles.arrow, {
                    [styles.disabled]: currentPage === lastPage,
                })}
                onClick={onNext}
            >
                {chevronNext}
            </li>
        </ul>
    );
};
