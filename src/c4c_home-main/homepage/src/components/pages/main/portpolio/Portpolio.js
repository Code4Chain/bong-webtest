import React, { useState } from "react";
import cn from "classnames";
import styles from './Portpolio.module.scss'
import Slider from "react-slick";
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app

export const Portpolio = () => {

    const [images, setImages] = useState([]);
    const [photoIndex, setPhotoIndex] = useState(0);
    const [isOpen, setOpen] = useState(false);


    const [items, setItems] = useState([
        {
            title: "Minting",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Minting/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Minting/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Minting/3.png"
            ]
        },
        {
            title: "NFT Marketplace",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/NFT+Marketplace/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/NFT+Marketplace/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/NFT+Marketplace/3.png"
            ]
        },
        {
            title: "Wallet - mobile",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+mobile/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+mobile/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+mobile/3.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+mobile/4.png"
            ]
        },
        {
            title: "Wallet - web",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+web/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+web/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Wallet+-+web/3.png"
            ]
        },
        {
            title: "Mainnet - Public / Private",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Mainnet+-+Public++Private/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Mainnet+-+Public++Private/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Mainnet+-+Public++Private/3.png"
            ]
        },
        {
            title: "Metaverse",
            text: "ETH / SOL / KLAY / POLYGON / etc",
            images: [
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Metaverse/1.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Metaverse/2.png",
                "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/2_portfolio/Metaverse/3.png"
            ]
        },
    ]);

    const settings = {
        dots: false,
        infinite: false,
        centerMode: false,
        slidesToShow: 1,
        slidesToScroll: 1,
        variableWidth: true
    };

    function showFulllscreen(images, index) {
        //setImages(images);
        //setPhotoIndex(index);
        //setOpen(true);
    }

    return (
        <section className={styles.section} id="portpolio">
            <div className={cn("container", styles.container)}>
                <div className="title">Portpolio</div>
                <div className={styles.items_container}>
                    {items.map((item, index) => (
                        <div className={styles.item} key={index}>
                            <div className={styles.title}>{item.title}</div>
                            <div className={styles.text}>{item.text}</div>
                            <Slider {...settings}>
                                {item.images.map((icon, index) => (
                                    <img src={icon} key={index} />
                                ))}
                            </Slider>
                        </div>
                    ))}
                </div>
            </div>
            {isOpen && (
                <Lightbox
                    mainSrc={images[photoIndex]}
                    nextSrc={images[(photoIndex + 1) % images.length]}
                    prevSrc={images[(photoIndex + images.length - 1) % images.length]}
                    onCloseRequest={() => setOpen(false)}
                    onMovePrevRequest={() =>
                        setPhotoIndex((photoIndex + images.length - 1) % images.length)
                    }
                    onMoveNextRequest={() =>
                        setPhotoIndex((photoIndex + 1) % images.length)
                    }
                />
            )}
        </section>
    )
}