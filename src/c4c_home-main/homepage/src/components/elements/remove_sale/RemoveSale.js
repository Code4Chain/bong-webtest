import React, { useEffect, useState } from "react";
import cn from "classnames";
import styles from "./RemoveSale.module.scss";
import { ReactComponent as ApproveIcon } from "../../../assets/images/content/approve.svg";
import { ReactComponent as ApproveFailedIcon } from "../../../assets/images/content/approve_failed.svg";
import { ReactComponent as CompletedIcon } from "../../../assets/images/content/completed.svg";
import { ReactComponent as SellOrderIcon } from "../../../assets/images/content/sell_order.svg";
import { removeFromSale } from "../../../hooks/restModule";
import { useMetaplex } from "../../../hooks/useMetaplex";
import { useMarket } from "../../../hooks/useMarket";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from '@solana/wallet-adapter-react';
import { useMyInfo } from "../../../hooks/useMyInfo";
import { Loading } from "../loading/Loading";
import { Loader } from "../loader/Loader";
import { toast } from 'react-toastify';

const STEP_CONFIRM = 0;
const STEP_TX_CONFIRM = 1;
const STEP_TX_CONFIRMING = 2;
const STEP_TX_CONFIRMED_FAILED = 3;
const STEP_SELL_REMOVE = 4;
const STEP_SELL_REMOVING = 5;
const STEP_SELL_REMOVE_FAILED = 6;
const STEP_SELL_REMOVE_COMPLETED = 7;

export const RemoveSale = ({ className, item, close, setUnquenchable }) => {
    const { userInfo } = useMyInfo();
    const { metaplex } = useMetaplex();
    const { marketData } = useMarket();
    const wallet = useWallet();

    const [step, setStep] = useState(STEP_CONFIRM);

    function connectWallet() {
        wallet.connect().then(() => {
            if (!wallet.publicKey || !userInfo.walletInfo[process.env.REACT_APP_DEFAULT_CHAIN] || wallet.publicKey.toBase58() != userInfo.walletInfo[process.env.REACT_APP_DEFAULT_CHAIN].address) {
                const options = {
                    autoClose: 5000,
                    hideProgressBar: false,
                    position: toast.POSITION.TOP_CENTER,
                    pauseOnHover: true,
                };

                toast.warn("지갑 정보를 알 수 없거나, 유저 지갑 정보와 팬텀 지갑 주소가 다릅니다.", options);
                return;
            }

            runTransaction();
        })
    }

    useEffect(() => {
        setUnquenchable(step == STEP_TX_CONFIRMING || step == STEP_SELL_REMOVING);
    }, [step])

    function runTransaction() {
        setStep(STEP_TX_CONFIRMING);

        let auctionHouseAddress = item.sell.currencyId == 1 ? marketData.SolMarket : marketData.RoaCoreMarket;
        cancelListing(auctionHouseAddress, item.sell.receipt).then(() => {
            setStep(STEP_SELL_REMOVING);

            removeFromSale({
                uid: userInfo.commonInfo.id,
                contract: item.contract,
                tokenId: item.tokenId,
            }).then(ret => {
                setStep(STEP_SELL_REMOVE_COMPLETED)
            }).catch(err => {
                console.log(err);
                setStep(STEP_SELL_REMOVE_FAILED)

            })
        }).catch(err => {
            console.log(err);
            setStep(STEP_TX_CONFIRMED_FAILED)

        })
    }

    async function cancelListing(auctionHouseAddress, receiptAddress) {
        const auctionHouse = await metaplex
            .auctionHouse()
            .findByAddress({ address: new PublicKey(auctionHouseAddress) });

        const listing = await metaplex
            .auctionHouse()
            .findListingByReceipt({
                receiptAddress: new PublicKey(receiptAddress),
                auctionHouse
            }) // we will see how to fetch listings in the coming pages

        const cancelListingResponse = await metaplex
            .auctionHouse()
            .cancelListing({
                auctionHouse,            // The Auction House in which to cancel listing
                listing: listing,        // The listing to cancel
            });

        return cancelListingResponse;
    }

    return (
        <div className={cn(className, styles.sale)}>
            {step == STEP_CONFIRM &&
                <>
                    <div className={cn("h4", styles.title)}>판매 취소</div>
                    <div className={styles.table}>
                        <div className={styles.text}>
                            정말 판매를 취소합니까? 언제든지 다시 판매할 수 있습니다.
                        </div>
                    </div>
                    <div className={styles.btns}>
                        <button className={cn("button", styles.button)} onClick={connectWallet}>계속</button>
                        <button className={cn("button-stroke", styles.button)} onClick={close}>취소</button>
                    </div>
                </>
            }
            {step >= STEP_TX_CONFIRM && step < STEP_SELL_REMOVE_COMPLETED &&
                <>
                    <div className={cn("h4", styles.title)}>추가 단계</div>
                    <div className={styles.step_box}>
                        <div className={styles.icon_box} >
                            {step == STEP_TX_CONFIRM &&
                                <ApproveIcon className={styles.icon} />
                            }
                            {step == STEP_TX_CONFIRMING &&
                                <Loading className={styles.loader} />
                            }
                            {step >= STEP_SELL_REMOVE &&
                                <CompletedIcon className={styles.icon} />
                            }
                            {step == STEP_TX_CONFIRMED_FAILED &&
                                <ApproveFailedIcon className={styles.icon} />
                            }
                        </div>
                        <div className={styles.exp_line}>
                            <div className={styles.exp_title} >
                                트랜잭션 확인
                            </div>
                            <div className={styles.exp_contents} >
                                판매 취소를 위한 트랜잭션을 실행합니다.
                            </div>

                            {step == STEP_TX_CONFIRMED_FAILED &&
                                <div className={styles.error_msg} >
                                    무엇인가 잘못되었습니다. 다시 시도해 주세요.
                                </div>
                            }
                        </div>
                    </div>
                    <div className={styles.step_box}>
                        <div className={styles.icon_box} >
                            {step <= STEP_SELL_REMOVE &&
                                <SellOrderIcon className={styles.icon} />
                            }
                            {step == STEP_SELL_REMOVING &&
                                <Loading className={styles.loader} />
                            }
                            {step >= STEP_SELL_REMOVE_COMPLETED &&
                                <CompletedIcon className={styles.icon} />
                            }
                            {step == STEP_SELL_REMOVE_FAILED &&
                                <ApproveFailedIcon className={styles.icon} />
                            }
                        </div>
                        <div className={styles.exp_line}>
                            <div className={styles.exp_title} >
                                판매 취소 주문
                            </div>
                            <div className={styles.exp_contents} >
                                판매 취소에 대한 주문을 수행합니다.
                            </div>

                            {step == STEP_SELL_REMOVE_FAILED &&
                                <div className={styles.error_msg} >
                                    무엇인가 잘못되었습니다. 다시 시도해 주세요.
                                </div>
                            }
                        </div>

                    </div>
                    <button className={cn("button", styles.button, { [styles.inprogress]: step == STEP_SELL_REMOVING || step == STEP_TX_CONFIRMING }, { [styles.failed]: step == STEP_SELL_REMOVE_FAILED || step == STEP_TX_CONFIRMED_FAILED }, { [styles.disabled]: step != STEP_TX_CONFIRMED_FAILED && step != STEP_SELL_REMOVE_FAILED })}
                        disabled={step != STEP_TX_CONFIRMED_FAILED && step != STEP_SELL_REMOVE_FAILED}
                        onClick={connectWallet}>
                        <>
                            {(step == STEP_SELL_REMOVE_FAILED || step == STEP_TX_CONFIRMED_FAILED) ?
                                <>
                                    재시도
                                </>
                                :
                                <Loader color="white" />
                            }
                        </>

                    </button>
                </>
            }
            {step == STEP_SELL_REMOVE_COMPLETED &&
                <div className={styles.result}>
                    <div className={styles.result_title}>
                        축하합니다!🎉
                    </div>
                    <div className={styles.result_contents}>
                        성공적으로 판매를 취소하였습니다.
                    </div>

                    <button className={cn("button", styles.button)} onClick={close}>아이템 보기</button>

                </div>
            }
        </div >
    );
};