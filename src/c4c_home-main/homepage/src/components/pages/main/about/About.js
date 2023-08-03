import React from "react";
import cn from "classnames";
import styles from './About.module.scss'
import { useLang } from "../../../../hooks/useLang";

export const About = () => {
    const { language } = useLang();

    const items = [
        {
            text: {
                ko: "전문성",
                en: "Professionalism"
            },
            exp: {
                ko: "개발, 기획, 마케팅, 디자인 등 각 분야별 전문가들이 맞춤형 솔루션개발 및 운영에 투입됩니다.",
                en: "Experts in each field, such as development, planning, marketing, and design, will help you customize it"
            },
        },
        {
            text: {
                ko: "커스터마이즈 서비스",
                en: "Customized Service"
            },
            exp: {
                ko: "맞춤형 사업제안을 통하여 차별화된 솔루션을 제공해드립니다.",
                en: "We provide differentiated solutions through customized business proposals."
            },
        },
        {
            text: {
                ko: "체계적인 프로세스",
                en: "Systematic Process"
            },
            exp: {
                ko: "체계화된 솔루션  및 비즈니스 컨설팅을 통해 프로젝트를 성공적으로 이끌어갑니다.",
                en: "Lead your project successfully with structured solutions and business consulting."
            },
        },
        {
            text: {
                ko: "원활한 커뮤니케이션",
                en: "Smooth Communication"
            },
            exp: {
                ko: "원활한 커뮤니케이션을 통한 보다 확실한 피드백을 약속드립니다.",
                en: "We promise more reliable feedback through smooth communication."
            },
        },
    ]


    return (
        <section className={styles.section} >
            <div className={cn("container", styles.container)}>
                <div className="title">
                    <span className={styles.title_text}>About us</span>
                </div>
                <div className={styles.box_conatiner}>
                    {items.map((item, index) => (
                        <div className={styles.box} key={index}>
                            <div className={styles.header}>
                                <span className={styles.header_text}>{item.text[language]}</span>
                            </div>
                            <div className={styles.contents}>
                                <span className={styles.contents_text}>{item.exp[language]}</span>
                            </div>
                        </div>
                    ))}

                    <div className={styles.logo_container}>
                        <img src={require("../../../../assets/images/common/about_logo.png")} />
                    </div>
                </div>
            </div>
        </section >
    )
}