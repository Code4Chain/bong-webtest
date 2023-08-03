import React, { useState } from "react";
import cn from "classnames";
import styles from "./Offer.module.scss";
import { TextInput } from "../text_input/TextInput";
import { toast } from 'react-toastify';
import { ReactComponent as ApproveIcon } from "../../../assets/images/content/approve.svg";
import { ReactComponent as ApproveFailedIcon } from "../../../assets/images/content/approve_failed.svg";
import { ReactComponent as CompletedIcon } from "../../../assets/images/content/completed.svg";
import { ReactComponent as SellOrderIcon } from "../../../assets/images/content/sell_order.svg";
import { Loader } from "../loader/Loader";
import { makeOffer } from "../../../hooks/restModule";
import { useMyInfo } from "../../../hooks/useMyInfo";
import { useMarket } from "../../../hooks/useMarket";
import { CurrencyDropdown } from "../dropdown/CurrencyDropdown";


const STEP_SETUP_PRICE = 0;
const STEP_TRANSFER = 1;
const STEP_TRANSFERING = 2;
const STEP_TRANSFER_FAILED = 3;
const STEP_BID_ORDER = 4;
const STEP_BID_ORDERING = 5;
const STEP_BID_ORDER_FAILED = 6;
const STEP_BID_ORDER_COMPLETED = 7;

export const Offer = ({ className, item, close }) => {
    const { userInfo } = useMyInfo();

    const { currencyData } = useMarket();

    const [price, setPrice] = useState(0);
    const [selectedCurrency, setCurrency] = useState(currencyData[0]);
    const [step, setStep] = useState(STEP_SETUP_PRICE);

    function onContinueClicked() {
        if (isNaN(price) || price <= 0 || price > userInfo.walletInfo[process.env.REACT_APP_DEFAULT_CHAIN].balance) {
            const options = {
                autoClose: 5000,
                hideProgressBar: false,
                position: toast.POSITION.TOP_CENTER,
                pauseOnHover: true,
            };
            toast.warn("Please enter an vaild price.", options);
            return;
        }

        setStep(STEP_TRANSFER);
    }

    function handleChange(e) {
        setPrice(e.target.value);
    };

    function onTransferClicked() {
        // TODO
        setStep(STEP_TRANSFERING);
        setTimeout(() => setStep(STEP_BID_ORDER), 3000);
    }

    function onOfferCompletedClicked() {
        setStep(STEP_BID_ORDERING);
        makeOffer({
            uid: userInfo.commonInfo.id,
            contract: item.contract,
            tokenId: item.tokenId,
            price: price,
            currency: selectedCurrency.Id
        }).then(ret => {
            setStep(STEP_BID_ORDER_COMPLETED)
        }).catch(err => {
            setStep(STEP_BID_ORDER_FAILED);
        })
        return;
    }

    return (
        <div className={cn(className, styles.checkout)}>
            {step == STEP_SETUP_PRICE &&
                <>
                    <div className={cn("h4", styles.title)}>Make offer</div>
                    <div className={styles.info}>
                        You are about to purchase <strong>{item.title}</strong> from{" "}
                        <strong>{item.owner.name}</strong>
                    </div>
                    <div className={styles.table}>
                        <div className={styles.sub_title}>
                            Set a price
                        </div>
                        <div className={styles.row} key="0">
                            <TextInput className={styles.field}
                                name="price"
                                placeholder="Enter your offer price"
                                required="required"
                                onChange={handleChange}
                                value={price}
                                type="number"
                            >
                            </TextInput>
                            <CurrencyDropdown
                                className={styles.dropdown}
                                value={selectedCurrency}
                                setValue={setCurrency}
                                options={currencyData}
                            />
                        </div>
                        <div className={styles.row} key="3">
                            <div className={styles.col}>Your balance</div>
                            <div className={styles.col}><strong>{userInfo.walletInfo[process.env.REACT_APP_DEFAULT_CHAIN].balance} {selectedCurrency.Symbol}</strong></div>
                        </div>
                    </div>
                    <div className={styles.btns}>
                        <button className={cn("button", styles.button)} onClick={onContinueClicked}>Continue</button>
                        <button className={cn("button-stroke", styles.button)} onClick={close}>Cancel</button>
                    </div>
                </>
            }
            {step >= STEP_TRANSFER && step < STEP_BID_ORDER_COMPLETED &&
                <>
                    <div className={cn("h4", styles.title)}>Follow steps</div>
                    <div className={styles.step_box}>
                        <div className={styles.icon_box} >
                            {(step == STEP_TRANSFER || step == STEP_TRANSFERING) &&
                                <ApproveIcon className={styles.icon} />
                            }
                            {step >= STEP_BID_ORDER &&
                                <CompletedIcon className={styles.icon} />
                            }
                            {step == STEP_TRANSFER_FAILED &&
                                <ApproveFailedIcon className={styles.icon} />
                            }
                        </div>
                        <div className={styles.exp_line}>
                            <div className={styles.exp_title} >
                                Transfer Coin
                            </div>
                            <div className={styles.exp_contents} >
                                Transfer coins to market contract for offer.
                            </div>
                        </div>
                        <button className={cn("button", styles.button, { [styles.inprogress]: step == STEP_TRANSFERING }, { [styles.failed]: step == STEP_TRANSFER_FAILED }, { [styles.done]: step >= STEP_BID_ORDER })}
                            disabled={step >= STEP_BID_ORDER || step == STEP_TRANSFERING}
                            onClick={onTransferClicked}>
                            {step == STEP_TRANSFER &&
                                <>
                                    Transfer
                                </>
                            }
                            {step == STEP_TRANSFERING &&
                                <>
                                    <Loader color="white" />
                                </>
                            }
                            {step == STEP_TRANSFER_FAILED &&
                                <>
                                    Try again
                                </>
                            }
                            {step >= STEP_BID_ORDER &&
                                <>
                                    Done
                                </>
                            }
                        </button>
                        {step == STEP_TRANSFER_FAILED &&
                            <div className={styles.error_msg} >
                                Something went wrong, please try again
                            </div>
                        }
                    </div>
                    <div className={styles.step_box}>
                        <div className={styles.icon_box} >
                            {step >= STEP_BID_ORDER_COMPLETED ?
                                <CompletedIcon className={styles.icon} />
                                :
                                <SellOrderIcon className={styles.icon} />
                            }
                        </div>
                        <div className={styles.exp_line}>
                            <div className={styles.exp_title} >
                                Offer order
                            </div>
                            <div className={styles.exp_contents} >
                                Complete the offer order.
                            </div>
                        </div>
                        <button className={cn("button", styles.button, { [styles.inprogress]: step == STEP_BID_ORDERING }, { [styles.failed]: step == STEP_BID_ORDER_FAILED }, { [styles.disabled]: step < STEP_BID_ORDER || step >= STEP_BID_ORDER_COMPLETED })}
                            disabled={step < STEP_BID_ORDER || (step > STEP_BID_ORDER && step != STEP_BID_ORDER_FAILED)}
                            onClick={onOfferCompletedClicked}>
                            {step <= STEP_BID_ORDER &&
                                <>
                                    Complete offering
                                </>
                            }
                            {step == STEP_BID_ORDERING &&
                                <>
                                    <Loader color="white" />
                                </>
                            }
                            {step == STEP_BID_ORDER_FAILED &&
                                <>
                                    Try again
                                </>
                            }
                            {step >= STEP_BID_ORDER_COMPLETED &&
                                <>
                                    Done
                                </>
                            }

                        </button>
                        {step == STEP_BID_ORDER_FAILED &&
                            <div className={styles.error_msg} >
                                Something went wrong, please try again
                            </div>
                        }
                    </div>
                </>
            }
            {step == STEP_BID_ORDER_COMPLETED &&
                <div className={styles.result}>
                    <div className={styles.result_title}>
                        Yay!🎉
                    </div>
                    <div className={styles.result_contents}>
                        You successfully offer
                    </div>

                    <button className={cn("button", styles.button)} onClick={close}>View item</button>

                </div>
            }
        </div>
    );
};