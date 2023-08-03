import React from "react";
import { ToastContainer } from "react-toastify";
import { LangProvider } from "./providers/LangProvider";

export const Providers = ({ children }) => {
    return (
        <>
            <ToastContainer />
            <LangProvider>
                {children}
            </LangProvider>
        </>
    );
};
