import React, { useEffect, useState } from "react";
import styles from "../../Admin.module.scss";
import { toast } from 'react-toastify';
import Checkbox from "../../../../elements/checkbox/Checkbox";
import { getDisplay, updateDisplay } from "../../../../../hooks/restModule";

export const Display = () => {
    const [displayComponent, setDisplayComponent] = useState({ CEO: false });

    const options = {
        autoClose: 5000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_CENTER,
        pauseOnHover: true,
    };

    useEffect(() => {
        update();
    }, [setDisplayComponent]);

    const update = () => {
        getDisplay({}).then(ret => {
            setDisplayComponent({ ...ret });
        })
    }

    const onCEOChanged = (set) => {
        setDisplayComponent(prevState => ({
            ...prevState,
            CEO: set,
        }));
        const toastId = toast.loading("Updating display...", options)

        updateDisplay({
            ceo: set,
        }).then(code => {
            if (code == 200) {
                toast.update(toastId, { ...options, type: "info", render: "Display is updated", isLoading: false })
            } else {
                toast.update(toastId, { ...options, type: "error", render: "Something went wrong. code(" + code + ")", isLoading: false })
            }
        }).catch(err => {
            toast.update(toastId, { ...options, type: "error", render: "Something went wrong. err(" + err + ")", isLoading: false })
        })
    }

    return (
        <>
            <div className={styles.display}>
                <div className={styles.display__title}>
                    <h2 className={styles.title_h2}>Display</h2>
                    <h6 className={styles.title_h6}>Adjust the display components.</h6>
                </div>
                <div className={styles.display__main}>
                    <Checkbox
                        className={styles.checkbox}
                        content="김동훈 표시"
                        tickClassName={styles.tick}
                        value={displayComponent.CEO}
                        onChange={() => onCEOChanged(!displayComponent.CEO)}
                    />
                </div>
            </div>
        </>
    );
};
