import React from "react";
import { usePagination, DOTS } from "../../../../hooks/usePagination";
import cn from "classnames";
import styles from "../Admin.module.scss";

export const Pagination = (props) => {
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
        <ul className={styles.pagination}>
            {/* Left navigation arrow */}
            <li
                className={cn(styles.pagination__item, styles.arrow, {
                    [styles.disabled]: currentPage === 1,
                })}
                onClick={onPrevious}
            >
                &lt;
            </li>
            {paginationRange.map((pageNumber, index) => {
                // If the pageItem is a DOT, render the DOTS unicode character
                if (pageNumber === DOTS) {
                    return (
                        <li
                            key={index}
                            className={cn(styles.pagination__item, styles.dots)}
                        >
                            &#8230;
                        </li>
                    );
                }

                // Render our Page Pills
                return (
                    <li
                        key={index}
                        className={cn(styles.pagination__item, {
                            [styles.selected]: pageNumber === currentPage,
                        })}
                        onClick={() => onPageChange(pageNumber)}
                    >
                        {pageNumber}
                    </li>
                );
            })}
            {/*  Right Navigation arrow */}
            <li
                className={cn(styles.pagination__item, styles.arrow, {
                    [styles.disabled]: currentPage === lastPage,
                })}
                onClick={onNext}
            >
                &gt;
            </li>
        </ul>
    );
};
