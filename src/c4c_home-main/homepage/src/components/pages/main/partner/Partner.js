import React, { useState } from "react";
import cn from "classnames";
import styles from './Partner.module.scss'
import { useLang } from "../../../../hooks/useLang";
import Popup from 'reactjs-popup';

export const Partner = () => {

    const { language } = useLang();

    const [open, setOpen] = useState(false);
    const [modalItem, selectItem] = useState(null);

    const [items, setItems] = useState([
        {
            image: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/4_partner/obdia.png",
            url: "",
            exp: {
                ko: "OBDIA는 블록체인 관련 기업들 간의 정보 공유의 장을 마련하고, 민/관 협력이 가능한 다양한 사업을 발굴하여 블록체인 산업 활성화에 기여중인 협회이다.\n\n주요 회원사로는 SK텔리콤, 신한은행, LG CNS, NH농협은행, 롯데정보통신, 신한 DC, 삼성 SDS, 국민은헹, 한국인터넷진흥원등이 있으며 약 40개의 기업이 회원사로써 교류중이다.",
                en: "OBDIA는 블록체인 관련 기업들 간의 정보 공유의 장을 마련하고, 민/관 협력이 가능한 다양한 사업을 발굴하여 블록체인 산업 활성화에 기여중인 협회이다.\n\n주요 회원사로는 SK텔리콤, 신한은행, LG CNS, NH농협은행, 롯데정보통신, 신한 DC, 삼성 SDS, 국민은헹, 한국인터넷진흥원등이 있으며 약 40개의 기업이 회원사로써 교류중이다.",
            },
        },
        {
            image: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/4_partner/grid.png",
            url: "",
            exp: {
                ko: "GRID 얼리언스는 카카오의 자회사인 GroundX에서 운영하는 얼라이언스로써 멤버기업간 전략적 협업으로 비즈니스의 연계, 확장방안에 대해 논의하고 연결지으며 NFT시장의 빠른 변화에 발맞춘 NFT 프로젝트의 추진과 실행을 지원한다.\n\n주요 멤버기업으로는 SBS, JTBC, 대웅제약, 광종제약, 카카오게임즈, 카카오엔터테인먼트, 카카오브레인, 크러스트유니버스, 제일기획, 아모레퍼시픽, 롯데백화점, SBS, 신한은행, 신한카드, 신한금융투자등이 있으며 약 200여개의 국내 기업이 참여중이다.",
                en: "GRID 얼리언스는 카카오의 자회사인 GroundX에서 운영하는 얼라이언스로써 멤버기업간 전략적 협업으로 비즈니스의 연계, 확장방안에 대해 논의하고 연결지으며 NFT시장의 빠른 변화에 발맞춘 NFT 프로젝트의 추진과 실행을 지원한다.\n\n주요 멤버기업으로는 SBS, JTBC, 대웅제약, 광종제약, 카카오게임즈, 카카오엔터테인먼트, 카카오브레인, 크러스트유니버스, 제일기획, 아모레퍼시픽, 롯데백화점, SBS, 신한은행, 신한카드, 신한금융투자등이 있으며 약 200여개의 국내 기업이 참여중이다.",
            },
        },
        {
            image: "https://code4chain.s3.ap-northeast-2.amazonaws.com/3_homepage/4_partner/2nd_block.png",
            url: "",
            exp: {
                ko: "세컨블록은 두나무가 2022년 11월 공개 시범 서비스를 개시한 메타버스 플랫폼이다. 국내 최초로 메타버스에 영생채팅 기능을 결합하였으며 한 공간 안에 1000명 이상의 동시 접속이 가능하다. NFT 전시기능을 도입하며 ‘업비트 NFT’와의 연계 가능성 또한 확장했다.\n\n새컨블록과 주요 협력사로는 코드포체인, 아울로그, 스크루바, 라이브온미, 달달프렌즈, 디노마드 등이 있다.",
                en: "세컨블록은 두나무가 2022년 11월 공개 시범 서비스를 개시한 메타버스 플랫폼이다. 국내 최초로 메타버스에 영생채팅 기능을 결합하였으며 한 공간 안에 1000명 이상의 동시 접속이 가능하다. NFT 전시기능을 도입하며 ‘업비트 NFT’와의 연계 가능성 또한 확장했다.\n\n새컨블록과 주요 협력사로는 코드포체인, 아울로그, 스크루바, 라이브온미, 달달프렌즈, 디노마드 등이 있다.",
            },
        }
    ])


    function showPopup(item) {
        selectItem(item);
        setOpen(true);
    }

    function closePopup() {
        setOpen(false);
    }

    return (
        <section className={styles.section} id="partners">
            <div className={cn("container", styles.container)}>
                <div className={cn("title", styles.title)}>Partners</div>
                <div className={styles.partners_block}>
                    {items.map((item, index) => (
                        <button className={styles.partner_card} onClick={() => showPopup(item)} key={index}>
                            <img className={styles.logo} src={item.image} />
                        </button>
                    ))}
                </div>
            </div>
            <Popup open={open} closeOnDocumentClick onClose={closePopup}>
                <div className={styles.modal}>
                    <img className={styles.modal_icon} src={modalItem ? modalItem.image : ""} />
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