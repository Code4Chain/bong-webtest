import React, { useEffect, useRef, useState } from "react";
import { upload } from "./SVG,";
import cn from "classnames";
import styles from "../Admin.module.scss";
import { toast } from 'react-toastify';

const sizeLimit = 10 * 1024 * 1024; // bytes
export const CustomFile = (props) => {
    const [file, setFile] = useState(null);
    const dropZone = useRef(null);

    const options = {
        autoClose: 5000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_CENTER,
        pauseOnHover: true,
    };

    const getPromotionImage = () => {
        if (file) {
            return URL.createObjectURL(file[0])
        }

        if (props.form.url) {
            return props.form.url;
        }

        return null;
    }


    const inputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > sizeLimit) {
                toast.warn("Image size too large. It can be up to 10mb.", options);
                return;
            }

            setFile(e.target.files);
            props.setForm({
                ...props.form,
                file: e.target.files[0],
            });
        }
    };
    useEffect(() => {
        dropZone.current.ondrop = function (e) {
            e.preventDefault();
            if (
                (e.dataTransfer.files[0].type === "image/png" ||
                    e.dataTransfer.files[0].type === "image/jpeg") &&
                e.dataTransfer.files.length === 1
            ) {
                setFile(e.dataTransfer.files);
                props.setForm({
                    ...props.form,
                    image: e.dataTransfer.files,
                });
            }
        };
    }, [dropZone]);
    useEffect(() => { }, [dropZone]);

    return (
        <div
            className={cn(styles.upload__customFile, {
                [styles.active]: file !== null,
            })}
            ref={dropZone}
        >
            <input
                type="file"
                accept="image/*"
                multiple={false}
                onChange={inputChange}
            />

            <div className={styles.upload__customFile_info}>
                {file == null && props.form.url == null ? (
                    <>
                        {upload}
                        <h6 className={cn(styles.title_h6, styles.uniq)}>JPEG or PNG</h6>
                    </>
                ) : (
                    <>
                            <img src={getPromotionImage()} alt="image" />
                    </>
                )}
            </div>
            {file != null &&
                <h6 className={styles.title_h6}>{file[0].name}</h6>
            }
        </div>
    );
};
