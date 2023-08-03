import React from 'react'

export const CustomFileCat = ({ file, onStart, onLoad, onLoadend }) => {
    return (
        <div>CustomFileCat</div>
    )
}
export const readFile = ({ file, onStart, onLoad, onLoadend }) => {
    if (file) {
        var reader = new FileReader();
        onStart();
        reader.onload = ({ target }) => onLoad(target.result);
        reader.onloadend = () => onLoadend();
        reader.readAsDataURL(file);
    }
};