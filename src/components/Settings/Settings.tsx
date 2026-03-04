import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { isPWA, isMobileDevice } from '../../utils/deviceUtils';
import ss from './Settings.module.scss';

const Settings = ({ notifficationError }: { notifficationError: string }) => {
    const notificationsEnabled = localStorage.getItem('notificationsEnabled');
    const [notifications, setNotifications] = useState(notificationsEnabled ? JSON.parse(notificationsEnabled) : false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const checkPermission = async () => {
            if (Notification.permission !== 'granted') {
                await Notification.requestPermission().then((permission) => {
                    if (permission === 'granted') {
                        setNotifications(true);
                    }
                    if (permission === 'denied') {
                        setNotifications(false);
                    }
                });
            }
        };
        checkPermission();
    }, []);

    useEffect(() => {
        // Устанавливаем тему в атрибут data-theme тега body
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('notificationsEnabled', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        if (notifficationError) {
            setNotifications(false);
        }
    }, [notifficationError]);

    const handleToggleNotiffication = () => {
        // Отправляем сообщение в основное приложение о смене состояния уведомлений
        window.dispatchEvent(new CustomEvent('notificationsToggle', {
            detail: { notificationsEnabled: !notifications }
        }));
        
        setNotifications(!notifications);
    };

    return (
        <div className={ss.root}>
            <div className={ss.icons}>
                <i
                    className={theme === 'light' ? ss.icon + ' icon_sun' : ss.icon + ' icon_moon'}
                    onClick={toggleTheme}
                    title="Сменить тему"
                ></i>

                <i
                    onClick={handleToggleNotiffication}
                    className={ss.icon + ' icon_notification' + (notifications ? ' ' + ss.active : '')}
                    title={isPWA() && isMobileDevice() ? 'Push-уведомления' : 'Браузерные уведомления'}
                ></i>
            </div>
        </div>
    );
};

export default Settings;
