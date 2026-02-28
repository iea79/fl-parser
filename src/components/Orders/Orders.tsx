import React from 'react';
import ss from './Orders.module.scss';
import Order from '../Order';
import { Order as OrderType } from '../../types';

interface OrdersProps {
    orders: OrderType[];
}

const Orders: React.FC<OrdersProps> = ({ orders }) => {
    return (
        <div className={ss.orders}>
            {orders.map((order) => (
                <Order
                    key={order.id}
                    order={order}
                />
            ))}
        </div>
    );
};

export default Orders;
