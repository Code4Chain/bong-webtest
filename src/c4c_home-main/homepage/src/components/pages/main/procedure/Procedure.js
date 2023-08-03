import React from "react";
import cn from "classnames";
import styles from './Procedure.module.scss'
import { useLang } from "../../../../hooks/useLang";

export const Procedure = () => {

    const { language } = useLang();

    const items = [
        {
            step: "01",
            text: {
                ko: "클라이언트와\n아이디어 공유",
                en: "Share ideas\nwith clients"
            },
            degree: -90,
        },
        {
            step: "02",
            text: {
                ko: "온/오프라인\n미팅",
                en: "Online / Offline\nmeeting"
            },
            degree: 198,
        },
        {
            step: "03",
            text: {
                ko: "기획내용 확인",
                en: "Check your\nProposal"
            },
            degree: 126,
        },
        {
            step: "04",
            text: {
                ko: "개발 진행",
                en: "Development"
            },
            degree: 54,
        },
        {
            step: "05",
            text: {
                ko: "개발 완료 후\n피드백",
                en: "Feedback after\nDevelopment"
            },
            degree: -18,
        },
    ]

    function getStyles(degree) {
        return {
            left: "calc(50% + " + (451.5 * Math.cos(degree * (Math.PI / 180))) + "px)",
            top: "calc(50% + " + (451.5 * Math.sin(degree * (Math.PI / 180))) + "px)",
        }
    }

    return (
        <section className={styles.section} id="procedure">
            <div className={cn("container", styles.container)}>
                <div className={cn("title", styles.title)}>Procedure</div>
                <div className={styles.box}>
                    <div className={styles.circle} />
                    <div className={styles.logo_container}>
                        <img src={require("../../../../assets/images/common/about_logo.png")} />
                    </div>
                    {items.map((item, index) => (
                        <div style={getStyles(item.degree)} className={styles.step} key={index}>
                            <div className={styles.step_title}>{item.step}</div>
                            <div className={styles.step_contens}>{item.text[language]}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}