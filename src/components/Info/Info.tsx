import React, { useState } from 'react';
import ss from './Info.module.scss';
import packageJson from '../../../package.json';

const Info = () => {
    const [modal, showModal] = useState(false);

    return (
        <>
            <i
                className={ss.icon + ' icon_info'}
                onClick={() => showModal(!modal)}
            ></i>

            {modal && (
                <div className={ss.modal}>
                    <div className={ss.dialog}>
                        <div
                            className={ss.close + ' icon_close'}
                            onClick={() => showModal(!modal)}
                        ></div>
                        <h3 className={ss.title}>О программе:</h3>
                        <div className={ss.ver}>Версия: {packageJson.version}</div>
                        <div className={ss.body}>
                            <p>
                                Это простая программа для отслеживания заявок с RSS-ленты*. Я сделал её для себя, потому что надоело постоянно обновлять страницу fl.ru, а их приложение для телефона
                                никак не хотело нормально и оперативно показывать уведомления о новых заказах.
                            </p>
                            <p>
                                Программа работает на ПК в виде PWA или просто в браузере. Мне этого вполне хватает. Как только приходит уведомление, я сразу перехожу на сайт и пишу отклик. Вот и всё,
                                что мне нужно.
                            </p>
                            <p>
                                Если вам тоже пригодится, пользуйтесь на здоровье. Если благодаря этой программе вы получите заказ, буду рад, если скажете{' '}
                                <a
                                    href={process.env.REACT_APP_SBP_LINK}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    спасибо рублем
                                </a>{' '}
                                (или двумя)
                            </p>
                            <small>* не все заявки попадают в RSS, но подавляющее большинство</small>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Info;
