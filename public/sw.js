let notificationsEnabled = false;

// Сервис воркер для сбора заявок и показа уведомлений
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());

    // Запуск интервала для проверки заявок каждые 2 минуты
    setInterval(getOrders, 1000 * 60 * 2);
    // setInterval(getOrders, 500 * 60 * 1);
});

// Обработчик клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    //можно регулировать ссылку вручную или положится на ответ сервера
    const url = event.notification.data?.url || '/';

    event.waitUntil(clients.openWindow(url));
});

// Обработчик сообщений от основного приложения
self.addEventListener('message', async (event) => {
    if (!event.data) return;
    console.log(event);

    // Получаем сохраненные заявки
    const storedOrders = await getStoredOrders();

    let currentOrders = [];
    if (!storedOrders?.length) {
        // Если сохранений нет, то получаем с сервера
        currentOrders = await getOrders();
    } else {
        currentOrders = [...storedOrders];
    }
    // Фильтруем согласно выбранным параметрам
    const filteredOrders = await getFilteredOrders(currentOrders);

    switch (event.data.type) {
        case 'GET_ORDERS':
            console.log('GET_ORDERS');
            // Отправляем сохраненные заявки обратно клиенту
            event.source.postMessage({
                type: 'STORED_ORDERS',
                orders: filteredOrders,
            });
            break;

        case 'NEW_ORDERS_FOUND':
            const { orders } = event.data;
            const newFilteredOrders = await getFilteredOrders(orders);
            console.log('NEW_ORDER_FOUND');
            if (newFilteredOrders?.length > 5) {
                sendMessage({ title: 'Новые заявки', body: `${newFilteredOrders.length} новых заявок` });
            } else {
                newFilteredOrders.forEach(function (order) {
                    const { title, content, link } = order;
                    const message = {
                        title,
                        body: content,
                        link,
                    };
                    // Показываем уведомления для новых заявок
                    this.sendMessage(message);
                });
            }

            const clients = await self.clients.matchAll();
            clients?.forEach((client) => {
                if (client?.type === 'window') {
                    client.postMessage({
                        type: 'STORED_ORDERS',
                        orders: filteredOrders,
                    });
                }
            });
            break;

        case 'NOTIFFICATIONS_ENABLED':
            notificationsEnabled = event.data.notificationsEnabled;
            sendMessage(event.data);
            break;
        default:
            // getOrders();
            break;
    }
});

// Функция для получения фильтров из IndexedDB
async function getStoredFilters() {
    try {
        const db = await openDatabase();
        const tx = db.transaction('filters', 'readonly');
        const store = tx.objectStore('filters');

        const request = store.get('userFilters');

        await new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        return request.result || null;
    } catch (error) {
        console.error('Ошибка при получении фильтров:', error);
        return null;
    }
}

// Функция для получения заявок
async function getOrders() {
    try {
        // Заню что так не правильно, но в данном случае не вижу ничего страшного
        let url = 'https://fl-parser-server.frontendie.ru/api/orders/50';
        // Запрашиваем данные с JSON API
        const response = await fetch(url);

        const data = await response.json();

        // Преобразуем данные в нужный формат
        let orders = data.map((item) => {
            return {
                id: item.id,
                title: item.title,
                link: item.link,
                content: item.content,
                isoDate: item.isoDate,
                categories: item.categories,
                price: item.price,
                fromAll: item.fromAll,
                hot: item.hot,
                currency: item.currency,
            };
        });

        await saveOrdersToStorage(orders);
        return orders;
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
        return [];
    }
}

async function getFilteredOrders(orders) {
    // Получаем сохраненные фильтры
    const storedFilters = await getStoredFilters();

    let filteredOrders = [];

    if (!orders?.length) {
        // Если нет сохраненных, получем по api
        filteredOrders = await getOrders();
    } else {
        filteredOrders = [...orders];
    }

    // Применяем фильтрацию к заявкам
    if (storedFilters) {
        const { selectedCategories, selectedSubcategories, hot, fromAll } = storedFilters;

        // Фильтрация по категориям
        if (selectedCategories && selectedCategories.length > 0) {
            const categoryNames = selectedCategories.map((cat) => cat.name);
            filteredOrders = filteredOrders.filter((order) => categoryNames.some((name) => order.categories?.some((cat) => cat.includes(name))));
        }

        // Фильтрация по подкатегориям
        if (selectedSubcategories && selectedSubcategories.length > 0) {
            const subcategoryNames = selectedSubcategories.map((sub) => sub.name);
            filteredOrders = filteredOrders.filter((order) => subcategoryNames.some((name) => order.categories?.some((cat) => cat.includes(name))));
        }

        // Фильтрация по hot
        if (hot) {
            filteredOrders = filteredOrders.filter((order) => order.hot);
        }

        // Фильтрация по fromAll
        if (fromAll) {
            filteredOrders = filteredOrders.filter((order) => order.fromAll);
        }
    }

    // Сортировка по дате (сначала новые)
    filteredOrders.sort((a, b) => {
        if (a.isoDate && b.isoDate) {
            return new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime();
        }
        return 0;
    });

    return filteredOrders;
}

// Функция для сохранения заявок в IndexedDB
async function saveOrdersToStorage(newOrders) {
    try {
        const storedOrders = await getStoredOrders();

        if (!storedOrders?.length) {
            this.registration.active.postMessage({
                type: 'GET_ORDERS',
            });
        }

        const db = await openDatabase();
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');

        // Получаем существующие заявки
        // console.log('Сохраняем заявки в IndexedDB', newOrders, storedOrders);

        // Объединяем новые заявки с существующими
        const allOrders = [...newOrders, ...storedOrders];

        // Удаляем дубликаты по id
        const uniqueOrders = allOrders.filter((order, index, self) => index === self.findIndex((o) => o.id === order.id));

        // Выбираем только новые заявки
        const newOnlyOrders = uniqueOrders.filter((order) => !storedOrders.some((o) => o.id === order.id));

        // Ограничиваем до 300 последних заявок
        const lastOrders = uniqueOrders.slice(0, 300);

        // Очищаем хранилище и сохраняем новые данные
        await store.clear();
        for await (const order of lastOrders) {
            await store.put(order);
        }

        await tx.done;
        // console.log('Заявки сохранены в IndexedDB', lastOrders);

        // Если есть новые заявки осправляем сообщение
        if (newOnlyOrders.length > 0) {
            console.log('Новые заявки:', newOnlyOrders);
            this.registration.active.postMessage({
                type: 'NEW_ORDERS_FOUND',
                orders: newOnlyOrders,
            });
        }

        return lastOrders;
    } catch (error) {
        console.error('Ошибка при сохранении заявок:', error);
    }
}

// Функция для получения заявок из IndexedDB
async function getStoredOrders() {
    try {
        const db = await openDatabase();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');

        const orders = await getAllOrders(store);

        await tx.done;
        return orders;
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
        return [];
    }
}

// Вспомогательная функция для получения всех заявок из хранилища
function getAllOrders(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Функция для открытия базы данных IndexedDB
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FLParserDB', 2);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;

            // Создаем хранилище объектов для заявок
            if (!db.objectStoreNames.contains('orders')) {
                const store = db.createObjectStore('orders', { keyPath: 'id' });
                store.createIndex('isoDate', 'isoDate', { unique: false });
            }

            // Создаем хранилище объектов для фильтров
            if (!db.objectStoreNames.contains('filters')) {
                db.createObjectStore('filters', { keyPath: 'id' });
            }
        };
    });
}

// Функция для показа уведомлений
async function sendMessage({ title, body, link }) {
    console.log('notificationsEnabled', notificationsEnabled, title);
    console.log('notifications', this);

    if (!notificationsEnabled || !title) return;
    // Проверяем, есть ли разрешение на показ уведомлений
    if (Notification.permission !== 'granted') {
        console.log('Разрешение на уведомления не предоставлено');
        return;
    }

    this.registration.showNotification(title, {
        body: body || '',
        icon: '/assets/icon.jpg',
        bage: '/assets/bage72.jpg',
    });
}
