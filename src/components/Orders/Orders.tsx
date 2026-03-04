import React, { useState } from 'react';
import ss from './Orders.module.scss';
import Order from '../Order';
import { Order as OrderType } from '../../types';

interface OrdersProps {
    orders: OrderType[];
}

const Orders: React.FC<OrdersProps> = ({ orders }) => {
    const [top, showTop] = useState(true);
    const onTopSortedOrders = orders.filter((order) => order.onTop);
    const otherOrders = orders.filter((order) => !order.onTop);

    return (
        <>
            <div className={ss.orders}>
                {onTopSortedOrders.length > 0 && (
                    <div className={ss.top}>
                        <span
                            className={ss.toggle}
                            onClick={() => showTop(!top)}
                        >
                            <i className="icon_pin"></i>
                            {top ? 'Скрыть' : 'Показать'}
                        </span>
                    </div>
                )}
                {onTopSortedOrders.length > 0 && top && (
                    <div className={ss.ontop}>
                        {onTopSortedOrders.map((order) => (
                            <Order
                                key={order.id}
                                order={order}
                            />
                        ))}
                    </div>
                )}
                {otherOrders.map((order) => (
                    <Order
                        key={order.id}
                        order={order}
                    />
                ))}
            </div>
        </>
    );
};

export default Orders;
