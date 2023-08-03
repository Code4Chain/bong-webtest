import React, { useState } from "react";
import cn from "classnames";
import styles from './News.module.scss'
import Slider from "react-slick";
import { useEffect } from "react";
import { getNews } from "../../../../hooks/restModule";

export const News = () => {

    const [items, setItems] = useState([]);

    useEffect(() => {
        getNews({}).then(ret => {
            setItems(ret.map(item => {
                return {
                    icon: item.ImageUrl,
                    title: item.Title,
                    contents: item.Contents,
                    date: item.Date,
                    url: item.Url,
                }
            }))
        });
    }, [setItems]);

    const settings = {
        dots: true,
        infinite: false,
        centerMode: false,
        slidesToShow: 4,
        slidesToScroll: 1,

        responsive: [
            {
                breakpoint: 1500,
                settings: {
                    slidesToShow: 2,
                    rows: 2,
                    slidesPerRow: 1
                }
            },
        ]
    };

    const settings_mobile = {
        dots: true,
        infinite: false,
        centerMode: false,
        slidesToShow: 2,
        rows: 2,
        slidesPerRow: 1
    };

    return (
        <section className={styles.section} id="news">
            <div className={cn("container", styles.container)}>
                <div className={cn("title", styles.title)}>C4C News</div>
                <div className={styles.news_list} >
                    <Slider className={cn("news-slider", styles.not_mobile)} {...settings}>
                        {items.map((item, index) => (
                            <a className={styles.news_card} key={index} href={item.url} target="_blank">
                                <img className={styles.icon} src={item.icon} />
                                <div className={styles.card_title}>{item.title}</div>
                                <div className={styles.card_contents}>{item.contents}</div>
                                <div className={styles.date}>{item.date}</div>
                            </a>
                        ))}
                    </Slider>

                    <Slider className={cn("news-slider", styles.mobile)} {...settings_mobile}>
                        {items.map((item, index) => (
                            <a className={styles.news_card} key={index} href={item.url} target="_blank">
                                <img className={styles.icon} src={item.icon} />
                                <div className={styles.card_title}>{item.title}</div>
                                <div className={styles.card_contents}>{item.contents}</div>
                                <div className={styles.date}>{item.date}</div>
                            </a>
                        ))}
                    </Slider>
                </div>
                <a className={styles.more_container} href="https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=%EC%BD%94%EB%93%9C%ED%8F%AC%EC%B2%B4%EC%9D%B8" target="_blank" >
                    <div className={styles.more} >
                        <span>More</span>

                    </div>
                </a>
            </div>
        </section>
    )
}