import React, { useEffect, useMemo, useState } from "react";
import cn from "classnames";
import styles from "../../Admin.module.scss";
import { Pagination } from "../../base/Pagination";
import Modal from "../../../../elements/modal/Modal";
import { AdminModal } from "../../base/AdminModal";
import { deleteNews, updateNews, createNews, getNews } from "../../../../../hooks/restModule";
import { toast } from 'react-toastify';
import { NewsItem } from "./NewsItem";

const initForm = {
    ImageUrl: "",
    Title: "",
    Contents: "",
    Date: "",
    Url: "",
};

let PageSize = 5;

export const News = () => {
    const [itemIndex, setItemIndex] = useState(0);
    const [form, setForm] = useState(initForm);
    const [tab, setTab] = useState("main");
    const [modal, setModal] = useState(null);
    const [newsList, setNewsList] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);

    const options = {
        autoClose: 5000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_CENTER,
        pauseOnHover: true,
    };

    useEffect(() => {
        updateNewsList();
    }, [setNewsList]);

    const updateNewsList = () => {
        getNews({}).then(news => {
            setNewsList(news.map(record => {
                return {
                    ...record
                }
            }));
        })
    }

    const updateForm = (data) => {
        setForm({ ...form, ...data });
    };

    const setInput = (key) => (event) =>
        updateForm({ [key]: event.target.value });


    const validation = () => {
        if (tab === "post") {
            setModal("post");
        } else if (tab === "modify") {
            setModal("modify");
        }
    };

    const updt = () => {
        setForm({
            ...form,
            ...newsList[itemIndex]
        });
    };

    const createNewsCallback = () => {
        const toastId = toast.loading("Creating news...", options)

        createNews({
            imageUrl: form.ImageUrl,
            title: form.Title,
            contents: form.Contents,
            date: form.Date,
            url: form.Url
        }).then(code => {
            if (code == 200) {
                toast.update(toastId, { ...options, type: "info", render: "News is created", isLoading: false })
                updateNewsList();
            } else {
                toast.update(toastId, { ...options, type: "error", render: "Something went wrong. code(" + code + ")", isLoading: false })
            }
        }).catch(err => {
            toast.update(toastId, { ...options, type: "error", render: "Something went wrong. err(" + err + ")", isLoading: false })
        })
    }

    const updateNewsCallback = () => {
        const toastId = toast.loading("Updating news...", options)

        updateNews({
            id: newsList[itemIndex].Id,
            imageUrl: form.ImageUrl,
            title: form.Title,
            contents: form.Contents,
            date: form.Date,
            url: form.Url
        }).then(code => {
            if (code == 200) {
                toast.update(toastId, { ...options, type: "info", render: "News is updated", isLoading: false })
                updateNewsList();
            } else {
                toast.update(toastId, { ...options, type: "error", render: "Something went wrong. code(" + code + ")", isLoading: false })
            }
        }).catch(err => {
            toast.update(toastId, { ...options, type: "error", render: "Something went wrong. err(" + err + ")", isLoading: false })
        })
    }

    const deleteNewsCallback = () => {
        const toastId = toast.loading("Deleting news...", options)

        deleteNews({
            id: newsList[itemIndex].Id,
        }).then(code => {
            if (code == 200) {
                toast.update(toastId, { ...options, type: "info", render: "News is deleted", isLoading: false })
                updateNewsList();
            } else {
                toast.update(toastId, { ...options, type: "error", render: "Something went wrong. code(" + code + ")", isLoading: false })
            }
        }).catch(err => {
            toast.update(toastId, { ...options, type: "error", render: "Something went wrong. err(" + err + ")", isLoading: false })
        })
    }

    const currentTableData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * PageSize;
        const lastPageIndex = firstPageIndex + PageSize;
        return newsList.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, newsList]);

    return (
        <>
            <div className={styles.notice}>
                <div className={styles.notice__title}>
                    <h2 className={styles.title_h2}>News</h2>
                    <h6 className={styles.title_h6}>Write and revise the news.</h6>
                </div>
                {tab === "main" && (
                    <div className={styles.notice__main}>
                        <div className={styles.notice__main_btn}>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary, styles.filled)}
                                onClick={() => {
                                    setTab("post");
                                }}
                            >
                                Write News
                            </button>
                        </div>
                        <div className={styles.notice__main_items}>
                            {currentTableData.map((item, index) => {
                                return (
                                    <NewsItem
                                        key={index}
                                        {...item}
                                        onClick={() => {
                                            setTab("detail");
                                            setItemIndex(index);
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <Pagination
                            currentPage={currentPage}
                            totalCount={newsList.length}
                            pageSize={PageSize}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                )}
                {tab === "post" && (
                    <div className={styles.notice__post}>
                        <div className={styles.notice__post_label}>Imageg url</div>
                        {form.ImageUrl &&
                            <div className={styles.notice__post_image}><img src={form.ImageUrl}></img></div>
                        }
                        <div className={styles.input}>
                            <input
                                type="text"
                                placeholder="https://cdn.coindeskkorea.com/news/4224.png"
                                onChange={setInput("ImageUrl")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Title</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                placeholder="코드포체인, NFT 얼라이언스 '그리드' 참여"
                                onChange={setInput("Title")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Contents</div>
                        <div className={styles.input}>
                            <input
                                placeholder="블록체인 전문 기업 코드포체인(Code4Chain)이 대체불가능토큰(NFT) 얼라이언스 '그리드(GRID)'에 참여한다고 12일 밝혔다."
                                onChange={setInput("Contents")}
                            ></input>
                        </div>
                        <div className={styles.notice__post_label}>Date</div>
                        <div className={styles.input}>
                            <input
                                placeholder="2023.1.12"
                                onChange={setInput("Date")}
                            ></input>
                        </div>
                        <div className={styles.notice__post_label}>Url</div>
                        {form.Url &&
                            <div className={styles.notice__post_url}><a href={form.Url} target="_blank">{form.Url}</a></div>
                        }
                        <div className={styles.input}>
                            <input
                                placeholder="http://www.coindeskkorea.com/news/articleView.html?idxno=82899"
                                onChange={setInput("Url")}
                            ></input>
                        </div>
                        <div className={styles.notice__post_btns}>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary)}
                                onClick={() => {
                                    setTab("main");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary, styles.filled)}
                                onClick={validation}
                            >
                                Post
                            </button>
                        </div>
                    </div>
                )}
                {tab === "detail" && (
                    <div className={cn(styles.notice__post, styles.detail)}>
                        <div className={styles.notice__post_label}>Image Url</div>
                        {newsList[itemIndex].ImageUrl &&
                            <div className={styles.notice__post_image}><img src={newsList[itemIndex].ImageUrl}></img></div>
                        }
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].ImageUrl}
                                disabled
                            />
                        </div>
                        <div className={styles.notice__post_label}>Title</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Title}
                                disabled
                            />
                        </div>
                        <div className={styles.notice__post_label}>Contents</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Contents}
                                disabled
                            />
                        </div>
                        <div className={styles.notice__post_label}>Date</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Date}
                                disabled
                            />
                        </div>
                        <div className={styles.notice__post_label}>Url</div>
                        {newsList[itemIndex].Url &&
                            <div className={styles.notice__post_url}><a href={newsList[itemIndex].Url} target="_blank">{newsList[itemIndex].Url}</a></div>
                        }
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Url}
                                disabled
                            />
                        </div>
                        <div className={styles.notice__post_btns}>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary)}
                                onClick={() => {
                                    setTab("main");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary, styles.delete)}
                                onClick={() => {
                                    setModal("delete");
                                }}
                            >
                                Delete
                            </button>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary, styles.modify)}
                                onClick={() => {
                                    setTab("modify");
                                    updt();
                                }}
                            >
                                Modify
                            </button>
                        </div>
                    </div>
                )}
                {tab === "modify" && (
                    <div className={styles.notice__post}>
                        <div className={styles.notice__post_label}>Image Url</div>
                        {form.ImageUrl &&
                            <div className={styles.notice__post_image}><img src={form.ImageUrl}></img></div>
                        }
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].ImageUrl}
                                onChange={setInput("ImageUrl")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Title</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Title}
                                onChange={setInput("Title")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Contents</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Contents}
                                onChange={setInput("Contents")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Date</div>
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Date}
                                onChange={setInput("Date")}
                            />
                        </div>
                        <div className={styles.notice__post_label}>Url</div>
                        {form.Url &&
                            <div className={styles.notice__post_url}><a href={form.Url} target="_blank">{form.Url}</a></div>
                        }
                        <div className={styles.input}>
                            <input
                                type="text"
                                defaultValue={newsList[itemIndex].Url}
                                onChange={setInput("Url")}
                            />
                        </div>
                        <div className={styles.notice__post_btns}>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary)}
                                onClick={() => {
                                    setTab("main");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={cn(styles.button, styles.primary, styles.modify)}
                                onClick={validation}
                            >
                                Modify
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Modal visible={modal} onClose={() => setModal(null)}>
                {modal === "post" && (
                    <AdminModal
                        type="Post"
                        text="Do you want to create a post?"
                        close={() => {
                            setModal(null);
                        }}
                        onClick={() => {
                            setTab("main");
                            setModal(null);
                            createNewsCallback();
                        }}
                    />
                )}
                {modal === "delete" && (
                    <AdminModal
                        type="Delete"
                        text="Are you sure you want to delete the post?"
                        text2="Deleted posts cannot be recovered."
                        close={() => {
                            setTab("main");
                            setModal(null);
                            deleteNewsCallback();
                        }}
                    />
                )}
                {modal === "modify" && (
                    <AdminModal
                        type="Modify"
                        text="Are you sure you want to modify the post?"
                        close={() => {
                            setModal(null);
                        }}
                        onClick={() => {
                            setTab("main");
                            updateNewsCallback();
                            setModal(null);
                        }}
                    />
                )}
            </Modal>
        </>
    );
};
