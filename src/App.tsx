import React, { useState, useEffect } from 'react';
import ss from './App.module.scss';
import { Order } from './types';
import Orders from './components/Orders';
import Filter from './components/Filter';
import Settings from './components/Settings';
import Info from './components/Info';

function App() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        // Фикс высоты для PWA
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });

        // Добавляем обработчик сообщений сразу
        navigator.serviceWorker?.addEventListener('message', getOrdesList);

        // Функция для проверки готовности сервис воркера и запроса заявок
        // const requestOrders = () => {
        //     navigator.serviceWorker?.controller?.postMessage({
        //         type: 'GET_ORDERS',
        //     });
        // };

        // setTimeout(requestOrders, 1000);

        return () => {
            window.removeEventListener('resize', () => {});
            navigator.serviceWorker?.removeEventListener('message', getOrdesList);
        };
    }, []);

    // Обработчик сообщений от service worker
    const getOrdesList = async (event: MessageEvent) => {
        if (!event.data) return;
        console.log(event);

        console.log(event.data.type, event.data);
        switch (event.data.type) {
            case 'STORED_ORDERS':
                setOrders(event.data.orders);
                break;
            default:
                break;
        }
    };

    return (
        <div className={ss.root}>
            <div className={ss.decor}></div>
            <div className={ss.header}>
                <div className={ss.left}>
                    <a
                        href="https://fl.ru"
                        target="_blank"
                        rel="noreferrer"
                        className={ss.logo}
                    >
                        FL.ru парсер
                    </a>
                    <Info />
                </div>
                <div className={ss.icons}>
                    <Settings />
                    <div
                        className={ss.toggle}
                        onClick={() => setShowSettings(!showSettings)}
                    >
                        <i className={'icon_gear ' + ss.icon + ' ' + (showSettings ? ss.active : '')}></i>
                    </div>
                </div>
            </div>
            <div className={ss.main}>
                <Orders orders={orders} />
                <div className={ss.aside + (showSettings ? ' ' + ss.show : '')}>
                    <div
                        className={ss.icon + ' ' + ss.close + ' icon_close'}
                        onClick={() => setShowSettings(!showSettings)}
                    ></div>
                    <Filter onFilterChange={() => {}} />
                    <div className={ss.donate}>
                        <a
                            href={process.env.REACT_APP_SBP_LINK}
                            target="_blank"
                            rel="noreferrer"
                            className={ss.footer_link}
                        >
                            Поддержать автора
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
