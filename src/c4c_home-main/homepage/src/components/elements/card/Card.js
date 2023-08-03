import React, { useEffect, useState } from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import styles from "./Card.module.scss";
import Icon from "../../Icon";
import { currency, defaultAvatar } from '../../../utility/helpers';
import { toast } from 'react-toastify';
import { getLikes, updateLikes } from "../../../hooks/restModule";
import { useMyInfo } from "../../../hooks/useMyInfo";
import { useModal } from "../../../hooks/useModal";
import Player from "../player/Player";
import { useMarket } from "../../../hooks/useMarket";

const Card = ({ className, item, refresh }) => {
    const { userInfo } = useMyInfo();
    const { showOfferModal, showSaleModal } = useModal();
    const { getCurrencyData } = useMarket();

    const [favorite, setFavorite] = useState(false);

    useEffect(() => {
        if (userInfo.commonInfo.id <= 0) {
            return;
        }

        getLikes({
            uid: userInfo.commonInfo.id,
            contract: item.contract,
            tokenId: item.tokenId
        }).then(ret => {
            setFavorite(ret.likes);
        })

    }, [setFavorite])


    const switchFavorite = () => {
        if (userInfo.commonInfo.id <= 0) {
            const options = {
                autoClose: 5000,
                hideProgressBar: false,
                position: toast.POSITION.TOP_CENTER,
                pauseOnHover: true,
            };
            toast.info('Please connect your wallet first.', options);

            return;
        }

        var enabled = !favorite;
        setFavorite(enabled);
        updateLikes({
            uid: userInfo.commonInfo.id,
            contract: item.contract,
            tokenId: item.tokenId,
            enabled: enabled
        })
    }

    function getAvatar(src) {
        if (src) {
            return src;
        }

        return defaultAvatar;
    }

    return (
        <div className={cn(styles.card, className)}>
            <div className={styles.preview}>
                {item.image.split('.').pop() === 'mp4' ?
                    <Player className={styles.image} src={item.image} />
                    :
                    <img className={styles.image} src={item.image} alt="image" />
                }

                <div className={styles.control}>
                    <Link className={styles.control_bg} to={"/asset/" + item.contract + "/" + item.tokenId} />
                    <div
                        className={cn(
                            { "status-green": item.category === "green" },
                            styles.category
                        )}
                    >
                        {item.categoryText}
                    </div>
                    {userInfo.commonInfo.id > 0 &&
                        <>
                            <button
                                className={cn(styles.favorite, { [styles.active]: favorite })}
                                onClick={switchFavorite}
                            >
                                <Icon name="heart" size="20" />
                            </button>
                            {item.owner && userInfo.commonInfo.id != item.owner.id &&
                                <button className={cn("button-small", styles.button)} onClick={() => showOfferModal(item, refresh)}>
                                    <span>Make offer</span>
                                    <Icon name="scatter-up" size="16" />
                                </button>
                            }
                            {item.owner && userInfo.commonInfo.id == item.owner.id && item.sell && item.sell.price <= 0 &&
                                <button className={cn("button-small", styles.button)} onClick={() => showSaleModal(item, refresh)}>
                                    <span>Put on sale</span>
                                    <Icon name="scatter-up" size="16" />
                                </button>
                            }
                        </>
                    }
                </div>

            </div>
            <Link className={styles.link} to={"/asset/" + item.contract + "/" + item.tokenId}>
                <div className={styles.body}>
                    <div className={styles.line}>
                        <div className={styles.title}>{item.title}</div>

                    </div>
                    <div className={styles.line}>
                        {item.creator.id > 0 &&
                            <>
                                <img className={styles.avatar} src={getAvatar(item.creator.avatar)} alt="Avatar" />
                                <div className={styles.name}>Artist <span>{item.creator.name}</span></div>
                            </>
                        }
                        {item.sell && item.sell.price > 0 &&
                            <div className={styles.price}>
                                {item.sell.price} {getCurrencyData(item.sell.currencyId).Symbol}
                            </div>
                        }
                    </div>
                    <div className={styles.line}>
                        {item.users &&
                            <div className={styles.users}>
                                {item.users.map((x, index) => (
                                    <div className={styles.avatar} key={index}>
                                        <img src={x.avatar} alt="Avatar" />
                                    </div>
                                ))}
                            </div>
                        }
                        {item.counter &&
                            <div className={styles.counter}>{item.counter}</div>
                        }
                    </div>
                </div>
                {false &&
                    <div className={styles.foot}>
                        <div className={styles.status}>
                            {item.highestOffer &&
                                <>
                                    <Icon name="candlesticks-up" size="20" />
                                    Highest offer <span>{item.highestOffer} {currency}</span>
                                </>
                            }
                        </div>
                        {item.newOffer && (
                            <div
                                className={styles.offer}
                            >
                                New offer <span role="img" aria-label="fire">🔥</span>
                            </div>
                        )
                        }
                    </div>
                }
            </Link>
        </div>
    );
};

export default Card;
