import React from "react";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { Providers } from "./providers";
import { Main } from "./components/pages/main/Main";
import { Admin } from "./components/pages/admin/Admin";

function App() {

    return (
        <div className="App">
            <BrowserRouter basename="/">
                <Providers>
                    <Header />
                    <Routes>
                        <Route path="/" element={<Main />}></Route>
                        <Route path="/admin" element={<Admin />}></Route>
                    </Routes>
                    <Footer />
                </Providers>
            </BrowserRouter>
        </div>
    );
}

export default App;
