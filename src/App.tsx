import React, { useState, useEffect } from 'react';
import ss from './App.module.scss';
import { Order } from './types';
import Orders from './components/Orders';
import Filter from './components/Filter';
import Settings from './components/Settings';
import Info from './components/Info';
import { getOrders, getFilteredOrders } from './utils/orderUtils';
import { getStoredFilters, saveOrdersToStorage, getStoredOrders } from './utils/dbUtils';

function App() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // navigator.serviceWorker
        //     .register('/sw.js')
        //     .then((reg: ServiceWorkerRegistration) => {
        //         // console.log('Service Worker - успешная регистрация:', registration);
        //         // reg.update();
        //     })
        //     .catch((error) => {
        //         console.error('Service Worker - ошибка регистрации:', error);
        //     });

        // Фикс высоты для PWA
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        window.addEventListener('resize', () => {
            vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        });

        const handleNotificationsToggle = (event: CustomEvent) => {
            console.log(event.detail);

            const { notificationsEnabled } = event.detail;
            localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());

            if (notificationsEnabled && Notification.permission !== 'granted') {
                Notification.requestPermission().then((permission) => {
                    if (permission !== 'granted') {
                        setError('Проверьте разрешения на отправку уведомлений');
                        localStorage.setItem('notificationsEnabled', 'false');
                    }
                });
            }
        };

        window.addEventListener('notificationsToggle', handleNotificationsToggle as EventListener);

        // Загружаем заявки сразу после загрузки приложения
        loadOrders();

        // Интервал для обновления заявок каждые 2 минуты
        let getOrdersInterval = setInterval(() => {
            loadOrders();
        }, 1000 * 60 * 2);

        return () => {
            window.removeEventListener('notificationsToggle', handleNotificationsToggle as EventListener);
            window.removeEventListener('resize', () => {});
            clearInterval(getOrdersInterval);
        };
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        console.log(`Сохранено ${orders.length} заявок`);
    }, [orders]);

    useEffect(() => {
        if (error) {
            setError(error);
        }
    }, [error]);

    // Функция для загрузки заявок
    const loadOrders = async () => {
        try {
            // Получаем заявки с сервера
            const fetchedOrders = await getOrders();

            if (fetchedOrders.length > 0) {
                // Получаем сохраненные заявки ДО сохранения новых,
                // чтобы корректно определить, какие из них новые
                const previouslyStoredOrders = await getStoredOrders();

                // Получаем сохраненные фильтры
                const storedFilters = await getStoredFilters();

                // Применяем фильтрацию к заявкам
                const filteredOrders = await getFilteredOrders(fetchedOrders, storedFilters);

                // Определяем новые заявки по сравнению с теми, что уже были сохранены
                const newOrdersForNotification = filteredOrders.filter(
                    (order) => !previouslyStoredOrders.find((storedOrder) => storedOrder.id === order.id)
                );

                // Сохраняем отфильтрованные заявки в IndexedDB
                await saveOrdersToStorage(filteredOrders);

                // Обновляем состояние заявок
                setOrders(filteredOrders);

                // Показываем уведомления только для действительно новых заявок
                showNotifications(newOrdersForNotification);
            } else {
                // Если новых заявок нет, загружаем сохраненные
                const storedOrders = await getStoredOrders();
                setOrders(storedOrders);
            }
        } catch (error) {
            console.error('Ошибка при загрузке заявок:', error);
        }
    };

    // Функция для показа уведомлений
    const showNotifications = async (orders: Order[]) => {
        // Проверяем, есть ли разрешение на показ уведомлений
        if (Notification.permission !== 'granted') {
            setError('Проверьте разрешения на отправку уведомлений');
            localStorage.setItem('notificationsEnabled', 'false');
            return;
        }

        const notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
        console.log(notificationsEnabled);
        if (!notificationsEnabled) return;

        // На этом этапе в orders уже передаются только новые заявки
        if (orders.length > 0) {
            if (orders.length > 5) {
                // Если много новых заявок, показываем одно уведомление со счетчиком
                const notification = new Notification('Новые заявки', {
                    body: `Получено ${orders.length} новых заявок`,
                    icon: '/assets/icon.jpg',
                    badge: '/assets/badge72.jpg',
                });

                notification.onclick = () => {
                    notification.close();
                    window.focus();
                };
            } else {
                // Для небольшого количества заявок показываем отдельные уведомления
                orders.forEach((order) => {
                    const notification = new Notification(order.title || 'Новая заявка', {
                        body: order.content || '',
                        icon: '/assets/icon.jpg',
                        badge: '/assets/badge72.jpg',
                        data: { url: order.link },
                    });

                    notification.onclick = () => {
                        notification.close();
                        if (order.link) {
                            window.open(order.link, '_blank');
                        }
                    };
                });
            }
        }
    };

    return (
        <div className={ss.root}>
            <div
                className={ss.error}
                onClick={() => setError('')}
            >
                {error}
            </div>
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
                    <Settings notifficationError={error} />
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
                    <Filter onFilterChange={loadOrders} />
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
