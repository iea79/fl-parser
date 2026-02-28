import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { isPWA, isMobileDevice } from '../../utils/deviceUtils';
import ss from './Settings.module.scss';

const Settings = () => {
    const notificationsEnabled = localStorage.getItem('notificationsEnabled');
    const { theme, toggleTheme } = useTheme();
    const [notifications, setNotifications] = useState(notificationsEnabled ? JSON.parse(notificationsEnabled) : false);

    useEffect(() => {
        if (!notificationsEnabled) {
            checkPermission();
        } else {
            const message = {
                type: 'NOTIFFICATIONS_ENABLED',
                notificationsEnabled: notifications,
            };
            navigator.serviceWorker?.controller?.postMessage(message);
        }
    }, []);

    useEffect(() => {
        // Устанавливаем тему в атрибут data-theme тега body
        document.body.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('notificationsEnabled', JSON.stringify(notifications));
    }, [notifications]);

    const checkPermission = async () => {
        if (Notification.permission === 'granted') {
            setNotifications(true);
        } else if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotifications(true);
            }
        } else {
            setNotifications(false);
        }
    };

    const handleToggleNotiffication = () => {
        const message = {
            type: 'NOTIFFICATIONS_ENABLED',
            notificationsEnabled: !notifications,
            title: 'Уведомления' + (!notifications ? ' включены' : ' отключены'),
            body: '',
        };
        navigator.serviceWorker?.controller?.postMessage(message);
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
