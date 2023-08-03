import React, { useState } from "react";
import cn from "classnames";
import styles from './Service.module.scss'
import { useLang } from "../../../../hooks/useLang";
import Popup from 'reactjs-popup';

export const Service = () => {

    const { language } = useLang();

    const [open, setOpen] = useState(false);
    const [modalItem, selectItem] = useState(null);

    const [items, setItems] = useState({
        development: [
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/1.png",
                text: {
                    ko: "커스텀 블록체인 개발",
                    en: "Custom Blockchain Development"
                },
                exp: {
                    ko: "블록체인 생태계안에서 모두의 창의성이 존중받을 수 있는 새로운 개발 환경이 열리고 있습니다.\n코드포체인에서는 클라이언트의 니즈에 최적화 된 개발 진행을 함께 하고 있습니다.",
                    en: "In the blockchain ecosystem, A development environment where everyone's opinion is reflected is opening up. In C4C, it is optimized to the needs of the client."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/2.png",
                text: {
                    ko: "토큰발행 및 에어드랍",
                    en: "Token Minting & Airdrop"
                },
                exp: {
                    ko: "코인 및 토큰을 발행하고 관리할 수 있게 해주는 스마트 컨트랙트 개발과 DAO 구성원과 그 외 참여자들에게 전송 가능한 Airdrop 시스템을 제공합니다.\n현재 이더리움, 폴리곤, 클레이튼, BSC 등 다양한 체인을 지원하고 있습니다.",
                    en: "Coins and tokens with an independent network.\nWe develop smart contracts that allow us to issue and manage them.\nIn addition, we provide transferable information to DAO members and other participants."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/3.png",
                text: {
                    ko: "NFT발행",
                    en: "NFT Minting"
                },
                exp: {
                    ko: "코드포체인에서는 NFT 디자인, 발행, 민팅 사이트 제작, 화이트리스트 선별 등 또한 이더리움, 솔라나, 폴리곤, 클레이튼 등 다양한 체인을 지원하고 있습니다.",
                    en: "The NFT(Non-Fungible token) is an asset of the future considered to be a key value.\nC4C is working on most NFT- related solutions, including NFT design, publishing, minting site production, and whitelist screening.\nWe also support various chains such as Ethereum, Solana, Klayton, and BSC."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/4.png",
                text: {
                    ko: "스마트 컨트랙트",
                    en: "Smart Contract"
                },
                exp: {
                    ko: "스마트 컨트랙트란 블록체인 기술을 이용해 중앙화 된 보증 기관 없이 계약 당사자 간의 조건에 따라 작동하는 디지털 계약서를 의미합니다.",
                    en: "Smart Contract means a digital contract that operates on terms and conditions between the contracting parties without a centralized warranty agency using blockchain technology.\nA technology that automatically makes a set execution happen."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/5.png",
                text: {
                    ko: "디파이",
                    en: "Defi"
                },
                exp: {
                    ko: "블록체인 등장 이후 가장 큰 혁신이라 부를 수 있는 탈중앙화 금융입니다.\n코드포체인에서는 암호화폐를 담보로 하는 대출 시스템이나, 스마트 컨트랙트를 통해 특정 조건에서 작동하는 프로토콜 개발이 가능합니다.",
                    en: "Decentralized finance is the biggest innovation since the advent of blockchain.\nWe support various decentralized financial solutions such as In C4C, a loan system using cryptocurrency as collateral, operating under certain conditions through smart contracts."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/6.png",
                text: {
                    ko: "마켓플레이스",
                    en: "Marketplace"
                },
                exp: {
                    ko: "프라이빗, 퍼블릭 체인에서의 NFT를 거래할 수 있는 마켓플레이스 구축 서비스를 제공합니다. 클라이언트의 요구사항에 맞춰 맞춤형 마켓플레이스 제작을 도와드립니다.",
                    en: "Provides a marketplace development service that allows trading of NFTs on private and public chains. We can help you create a custom marketplace tailored to your needs."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/7.png",
                text: {
                    ko: "프라이빗 메인넷",
                    en: "Private Mainnet"
                },
                exp: {
                    ko: "미리 정해진 조직이나 개인들만 참여할수 있는 프라이빗 메인넷 구축 서비스입니다. 하이퍼레저 기반으로 개발하며, 사용자를 지정 및 분산하여 서버를 운용하고 데이터를 저장 및 활용합니다.",
                    en: "It is a private mainnet construction service that only pre-determined organizations or individuals can participate in. It is developed based on Hyperledger, operates servers by designating and distributing users, and stores and utilizes data."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/8.png",
                text: {
                    ko: "퍼블릭 메인넷",
                    en: "Public Mainnet"
                },
                exp: {
                    ko: "모든 사용자가 블록을 생성할 수 있는 퍼블릭 메인넷입니다. 코드포체인에서는 EVM 기반의 퍼블릭 메인넷 개발을 지원합니다. POA, POW 합의 알고리즘을 이용할 수 있으며, 원하시는 방향에 따라 메인넷의 세부 설정들을 조절할 수 있습니다.",
                    en: "It is a public mainnet where all users can create blocks. C4C supports EVM-based public mainnet development. You can use the POA and POW consensus algorithms, and you can adjust the detailed settings of the mainnet according to the direction you want."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/9.png",
                text: {
                    ko: "dAPP",
                    en: "dAPP"
                },
                exp: {
                    ko: "탈중앙화된 블록체인 플랫폼을 기반으로 작동하는 어플리케이션을 제작합니다.\n다년간의 경험을 통해 클라이언트 요구사항에 맞는 최적화된 dApp개발을 도와드립니다.",
                    en: "we develop applications operating on a decentralized blockchain platform.\nWith many years of experience, we can develop dApps that are optimized for your needs."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/10.png",
                text: {
                    ko: "STO",
                    en: "STO"
                },
                exp: {
                    ko: "STO는 \"Security Token Offering\"의 약자로서 주식이나 채권, 혹은 다양한 가치를 지닌 실물자산을 블록체인 기술과 연동한 디지털 자산을 의미합니다.",
                    en: "STO stands for \"Security Token Offering\" and refers to digital assets that link stocks, bonds, or real assets with various values ​​to blockchain technology."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/11.png",
                text: {
                    ko: "메타버스",
                    en: "Metaverse"
                },
                exp: {
                    ko: "블록체인 산업의 핵심이라 부를 수 있는 메타버스 플랫폼을 제작해드립니다.\n디자인부터 개발까지 유니티(Unity)를 활용해 자체 메타버스 플랫폼 제작이 가능합니다.메타버스 갤러리, 콘서트, 강연장 등 다양한 형태로 개발이 가능합니다.",
                    en: "Create content for the Metaverse platform! From design to development, we can create your own metaverse platform with Unity.It can be developed in various forms such as metabus galleries, concerts, and lecture halls."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/12.png",
                text: {
                    ko: "월렛",
                    en: "Wallet"
                },
                exp: {
                    ko: "월렛 제작은 기본적으로 입금, 출금, 내역확인, 계정 생성 등이 가능한 암호화폐 지갑 개발을 의미합니다.\n현재 코드포체인에서는 이더리움, 폴리곤, 클레이튼, BSC 등 다양한 체인의 월렛 제작을 지원하고 있습니다.",
                    en: "Wallet production basically means the development of a cryptocurrency wallet that can deposit, withdraw, check details, and create an account.\nWallet production is also possible depending on the operating environment(PC, mobile web, mobile application) required by the client."
                },
            },
        ],
        design: [
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/13.png",
                text: {
                    ko: "NFT, PFP 디자인",
                    en: "NFT, PFP Design"
                },
                exp: {
                    ko: "기획하시는 NFT 프로젝트의 맞춤형 이미지를 제작해 드립니다.\n구상하시는 세계관과 스토리, 컨셉에  맞게 활발한 커뮤니케이션을 통하여 최상의 작업물을 약속드립니다.",
                    en: "We produce customized images of your NFT project.\mI promise you the best work according to your worldview, story, and concept, through active communication.\n\n(PNG image, Metadata, JSON, Generating image)"
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/14.png",
                text: {
                    ko: "랜딩페이지 UX/UI",
                    en: "Landing Page UX, UI Design"
                },
                exp: {
                    ko: "기획하시는 NFT 프로젝트의 랜딩, 민팅 페이지를 구상하시는 세계관과 스토리, 컨셉에 맞게 디자인 및 개발을 도와드립니다.",
                    en: "According to your worldview, story, and concept.\nWe help you design and develop the landing and minting pages of the NFT project you're planning"
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/15.png",
                text: {
                    ko: "모바일 UX/UI",
                    en: "Mobile UX, UI Design"
                },
                exp: {
                    ko: "사용자 니즈에 맞춰 Defi, Dex, Cex, Wallet등 최적화된 UX와 UI를 통한 모바일 디자인을 도와드립니다.",
                    en: "We help you with mobile design through optimized UX and UI such as Defi, Dex, Cex, Wallet, etc."
                },
            },
            {
                icon: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/1_service/16.png",
                text: {
                    ko: "Defi, 거래소 UX/UI",
                    en: "Defi, Exchange UX, UI Design"
                },
                exp: {
                    ko: "많은 사용자들이 이용하는 Defi, Dex, Cex 등의 최적화된 UX와 UI를 통한 웹디자인을 도와드립니다.",
                    en: "We help you with web design through optimized UX and UI such as Defi, Dex, and Cex, which are used by many users."
                },
            },
        ]
    });

    function showPopup(item) {
        selectItem(item);
        setOpen(true);
    }

    function closePopup() {
        setOpen(false);
    }

    return (
        <section className={styles.section} id="service">
            <div className={cn("container", styles.container)}>
                <div className="title">
                    <span className={styles.title_text}>Service</span>
                </div>

                <div className={styles.sub_title} id="development">
                    <span className={styles.sub_title_text}>Development</span>
                </div>

                <div className={styles.box_conatiner}>
                    {items.development.map((item, index) => (
                        <button className={styles.button} onClick={() => showPopup(item)} key={index}>
                            <div className={styles.box}>
                                <img className={styles.icon} src={item.icon} />
                                <div className={styles.contents}>
                                    <span className={styles.contents_text}>{item.text[language]}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className={styles.sub_title} id="design">
                    <span className={styles.sub_title_text}>Design</span>
                </div>

                <div className={styles.box_conatiner}>
                    {items.design.map((item, index) => (
                        <button className={styles.button} onClick={() => showPopup(item)} key={index}>
                            <div className={styles.box}>
                                <img className={styles.icon} src={item.icon} />
                                <div className={styles.contents}>
                                    <span className={styles.contents_text}>{item.text[language]}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <Popup open={open} closeOnDocumentClick onClose={closePopup}>
                <div className={styles.modal}>
                    <img className={styles.modal_icon} src={modalItem ? modalItem.icon : ""} />
                    <div className={styles.modal_title}>
                        {modalItem ? modalItem.text[language] : ""}
                    </div>
                    <div className={styles.modal_contents}>
                        {modalItem ? modalItem.exp[language] : ""}
                    </div>
                    <button className={styles.modal_close} onClick={closePopup}>
                        <span>
                            Close
                        </span>
                    </button>
                </div>
            </Popup>
        </section>
    )
}