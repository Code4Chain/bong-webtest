import { createRoot } from 'react-dom/client';

import "react-toastify/dist/ReactToastify.css";
import "./styles/global.scss";

import App from './App';

const container = document.getElementById('root');
const root = createRoot(container); // createRoot(container!) if you use TypeScript

root.render(<App />);
