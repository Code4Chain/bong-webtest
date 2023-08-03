import { useState } from "react";
import { LangContext } from "../hooks/useLang";

export const LangProvider = ({ children }) => {

    const [language, setLanguage] = useState("ko")

    return (
        <LangContext.Provider value={{ language, setLanguage }}>
            {children}
        </LangContext.Provider>
    )
}
