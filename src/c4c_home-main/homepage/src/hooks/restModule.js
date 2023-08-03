import axios from 'axios';
import { toast } from 'react-toastify';

var lastToastMessage = ""

axios.defaults.baseURL = process.env.REACT_APP_SERVER_URL_PREFIX;
axios.defaults.withCredentials = process.env.REACT_APP_WITH_CREDENTIALS;

function logging(msg) {
    if (process.env.REACT_APP_DEBUG) {
        console.log(msg);
    }
}

const options = {
    onClose: props => lastToastMessage = "",
    autoClose: 5000,
    hideProgressBar: false,
    position: toast.POSITION.TOP_CENTER,
    pauseOnHover: true,
};

function handleError(res) {
    const msg = res.data.status + " " + res.data.msg

    if (res.data.status === 401) { // TokenExpiredError
        window.location.reload()
        return null;
    } else if (lastToastMessage !== msg) {
        lastToastMessage = msg;
        toast.error(msg, options);
        logging('error ' + msg);
    }

    throw msg;
}

export const createNews = async (params) => {
    params.function = 'createNews'
    const res = await axios.post("/news", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return 200;
    }

    return handleError(res);
}

export const updateNews = async (params) => {
    params.function = 'updateNews'
    const res = await axios.post("/update_news", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return 200;
    }

    return handleError(res);
}

export const deleteNews = async (params) => {
    params.function = 'deleteNews'
    const res = await axios.delete("/news", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return 200;
    }

    return handleError(res);
}

export const getNews = async (params) => {
    params.function = 'getNews'
    const res = await axios.get("/news", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return res.data.news;
    }

    return handleError(res);
}

export const updateDisplay = async (params) => {
    params.function = 'updateDisplay'
    const res = await axios.post("/display", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return 200;
    }

    return handleError(res);
}

export const getDisplay = async (params) => {
    params.function = 'getDisplay'
    const res = await axios.get("/display", { "params": params })
    params.res = res
    logging(params);
    if (res.data.status === 200) {
        return res.data.display;
    }

    return handleError(res);
}