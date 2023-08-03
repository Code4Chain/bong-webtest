import React from "react";
import useDarkMode from "use-dark-mode";

export const Image = ({ className, src, srcDark, srcSet, srcSetDark, alt }) => {
    const darkMode = useDarkMode(false);

    return (
        <img
            className={className}
            srcSet={darkMode.value ? srcSetDark : srcSet}
            src={darkMode.value ? srcDark : src}
            alt={alt}
        />
    );
};
