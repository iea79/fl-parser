import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.scss';
import './assets/icons/style.scss';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';

if (process.env.NODE_ENV === 'production') {
    // console.log = () => {};
    // console.error = () => {};
    // console.warn = () => {};
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <ThemeProvider>
        <App />
    </ThemeProvider>
);
