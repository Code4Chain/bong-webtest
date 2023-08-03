import React, { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./Filter.module.scss";
import { TextInput } from "../text_input/TextInput";
import { CurrencyDropdown } from "../dropdown/CurrencyDropdown";
import CheckboxReverse from "../checkbox/CheckboxReverse";
import { Dropdown } from "../dropdown/Dropdown";
import Icon from "../../Icon";
import { useMarket } from "../../../hooks/useMarket";

const sortingOptions = ["Alphabetical (A to Z)", "Recently created", "Price low to high", "Price high to low", "Most favorited"];

export const Filter = ({ className, nftList, onFilterChanged, category }) => {
    const { currencyData, categoryData } = useMarket();

    const [sorting, setSorting] = useState(sortingOptions[0]);
    const [selectedCurrency, setCurrency] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("All Items");
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    const [onSaleChecked, setOnSaleChecked] = useState(false);

    useEffect(() => {
        if (currencyData.length > 0) {
            setCurrency(currencyData[0]);
        }
    }, [currencyData, setCurrency])

    useEffect(() => {
        let minPriceInt = parseInt(minPrice);
        let maxPriceInt = parseInt(maxPrice);

        onFilterChanged(
            nftList.filter(
                item =>
                    (!onSaleChecked || (onSaleChecked && item.sell.price > 0)) &&
                    ((selectedCurrency == null || isNaN(minPriceInt) || isNaN(maxPriceInt) || (minPriceInt == 0 && maxPriceInt == 0)) ||
                        (selectedCurrency.Id == item.sell.currencyId && item.sell.price >= minPriceInt && item.sell.price <= maxPriceInt)) &&
                    (selectedCategory === "All Items" || selectedCategory === item.category)
            ).sort((a, b) => {
                let aPrice;
                let bPrice;
                switch (sorting) {
                    default:
                    case sortingOptions[0]:
                        return a.title.localeCompare(b.title);
                    case sortingOptions[1]:
                        return b.CreationTime.localeCompare(a.CreationTime);
                    case sortingOptions[2]:
                        aPrice = a.sell.price == 0 ? Number.MAX_VALUE : a.sell.price;
                        bPrice = b.sell.price == 0 ? Number.MAX_VALUE : b.sell.price;
                        return aPrice - bPrice;
                    case sortingOptions[3]:
                        aPrice = a.sell.price == 0 ? Number.MIN_VALUE : a.sell.price;
                        bPrice = b.sell.price == 0 ? Number.MIN_VALUE : b.sell.price;
                        return bPrice - aPrice;
                    case sortingOptions[4]:
                        return b.favorite - a.favorite;
                }
            })
        );
    }, [onSaleChecked, selectedCurrency, minPrice, maxPrice, sorting, selectedCategory]);

    const resetFilter = () => {
        setOnSaleChecked(false);
        setCurrency(currencyData[0]);
        setMinPrice('');
        setMaxPrice('');
        setSorting(sortingOptions[0]);
        setSelectedCategory("All Items")
    }

    return (
        <div className={cn(className, styles.filters)}>
            <div className={styles.filters_title}>Filters</div>
            <div className={styles.status}>
                <div className={styles.label}>Status</div>
                <CheckboxReverse
                    className={cn(styles.checkbox)}
                    content="On sale"
                    tickClassName={styles.tick}
                    value={onSaleChecked}
                    onChange={() => setOnSaleChecked(!onSaleChecked)}
                />
            </div>
            <div className={styles.status}>
                <div className={styles.label}>Price</div>
                <div className={styles.price_filter}>
                    <CurrencyDropdown
                        className={styles.dropdown}
                        value={selectedCurrency}
                        setValue={setCurrency}
                        options={currencyData}
                    />
                    <div className={styles.price_input}>
                        <TextInput className={styles.field}
                            placeholder="min"
                            onChange={event => setMinPrice(event.target.value)}
                            value={minPrice}
                        />
                        <div className={styles.price_to}> to </div>
                        <TextInput className={styles.field}
                            placeholder="max"
                            onChange={event => setMaxPrice(event.target.value)}
                            value={maxPrice}
                        />
                    </div>
                </div>
            </div>
            {category &&
                <div className={styles.status}>
                    <div className={styles.label}>Category</div>
                    <Dropdown
                        className={styles.dropdown}
                        value={selectedCategory}
                        setValue={setSelectedCategory}
                        options={["All Items"].concat(categoryData.map(ret => ret.Name))}
                    />
                </div>
            }
            <div className={styles.group}>
                <div className={styles.item}>
                    <div className={styles.label}>Sorting</div>
                    <Dropdown
                        className={styles.dropdown}
                        value={sorting}
                        setValue={setSorting}
                        options={sortingOptions}
                    />
                </div>
            </div>
            <div className={styles.reset} onClick={resetFilter}>
                <Icon name="close-circle-fill" size="24" />
                <span>Reset filter</span>
            </div>
        </div>
    );
};