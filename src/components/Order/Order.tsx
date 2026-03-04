import React, { useState, useEffect } from 'react';
import ss from './Order.module.scss';
import { Order as OrderType } from '../../types';

interface OrderProps {
    order: OrderType;
}

// Считаем разницу между датой и текущей датой и выводим время прошедшее с даты публикации в минутах часах днях
function calcTimeDiff(isoDate: string) {
    // Получаем текущее время с учетом локальной таймзоны от МСК
    // Корректируем разницу с учетом смещения сервера (GMT+3 = -180 минут относительно UTC) и текущей time zone
    const now = new Date().getTime();
    const date = new Date(isoDate).getTime();

    // Вычисляем разницу во времени
    let dateDiff = isoDate ? now - date : 0;

    const dateDiffMinutes = Math.floor(dateDiff / 60000);
    const dateDiffHours = Math.floor(dateDiffMinutes / 60);
    const dateDiffDays = Math.floor(dateDiffHours / 24);

    if (dateDiffDays > 0) {
        return dateDiffDays + ' д. ' + (dateDiffHours % 24) + ' ч. ' + (dateDiffMinutes % 60) + ' мин. ';
    } else if (dateDiffHours > 0) {
        return dateDiffHours + ' ч. ' + (dateDiffMinutes % 60) + ' мин. ';
    } else {
        if (dateDiffMinutes > 0) {
            return dateDiffMinutes + ' мин. ';
        } else {
            return 'Только что';
        }
    }
}

const Order: React.FC<OrderProps> = ({ order }) => {
    const { categories, content, link, price, title, hot, fromAll, isoDate = new Date().toISOString(), onTop } = order;
    const [showContent, setShowContent] = useState(false);
    const [timeDiff, setTimeDiff] = useState(calcTimeDiff(isoDate));

    // Обновляем время каждую минуту
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeDiff(calcTimeDiff(isoDate));
        }, 60000); // Обновляем каждую минуту (60000 мс)

        // Очищаем интервал при размонтировании компонента
        return () => clearInterval(timer);
    }, [isoDate]);

    return (
        <div className={ss.order}>
            <div className={ss.top}>
                <div className={ss.categories}>{categories}</div>
                {/* Выводим разницу между датой заявки и текущей датой */}
                {isoDate && <div className={ss.date}>{timeDiff}</div>}
            </div>
            <div className={ss.body}>
                {/* Выводим ссылку на заявку с реферным параметром */}
                <a
                    href={link + '?ref=80234'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ss.link}
                >
                    {onTop && <i className="icon_pin"></i>}
                    {title}
                </a>
                <div className={ss.info}>
                    {price && (
                        <b>
                            <span dangerouslySetInnerHTML={{ __html: price || '' }} />
                        </b>
                    )}
                    {hot && (
                        <span className={ss.hot}>
                            <i className="icon_hot"></i> <span>Срочно</span>
                        </span>
                    )}
                    {fromAll && (
                        <span className={ss.fromAll}>
                            <i className="icon_bullhorn"></i> Для всех
                        </span>
                    )}
                </div>
            </div>
            <div className={ss.description}>
                <span
                    className={ss.toggle}
                    onClick={() => setShowContent(!showContent)}
                >
                    {showContent ? 'Скрыть' : 'Показать'} описание
                </span>
                <div className={ss.content + (showContent ? ' ' + ss.show : '')}>{content}</div>
            </div>
        </div>
    );
};

export default Order;
