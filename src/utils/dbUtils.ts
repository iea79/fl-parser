// Функция для открытия базы данных IndexedDB
export function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FLParserDB', 2); // Увеличиваем версию базы данных

        request.onerror = () => reject(request.error);

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Создаем хранилище объектов для заявок (если еще не создано)
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

// Функция для сохранения фильтров в IndexedDB
export async function saveFiltersToStorage(filters: any) {
    try {
        const db = await openDatabase();
        const tx = db.transaction('filters', 'readwrite');
        const store = tx.objectStore('filters');

        // Сохраняем фильтры с фиксированным id
        await store.put({ id: 'userFilters', ...filters });

        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        // Отправляем сообщение service worker для получения новых заявок
        navigator.serviceWorker?.controller?.postMessage({
            type: 'GET_ORDERS',
        });
    } catch (error) {
        console.error('Ошибка при сохранении фильтров:', error);
    }
}

// Функция для получения фильтров из IndexedDB
export async function getStoredFilters() {
    try {
        const db = await openDatabase();
        const tx = db.transaction('filters', 'readonly');
        const store = tx.objectStore('filters');

        const request = store.get('userFilters');

        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        return request.result || null;
    } catch (error) {
        console.error('Ошибка при получении фильтров:', error);
        return null;
    }
}

// Функция для сохранения заявок в IndexedDB
export async function saveOrdersToStorage(newOrders: any[]) {
    try {
        const storedOrders = await getStoredOrders();

        const db = await openDatabase();
        const tx = db.transaction('orders', 'readwrite');
        const store = tx.objectStore('orders');

        // Получаем существующие заявки
        // console.log('Сохраняем заявки в IndexedDB', newOrders, storedOrders);

        // Объединяем новые заявки с существующими
        const allOrders = [...newOrders, ...storedOrders];

        // Удаляем дубликаты по id
        const uniqueOrders = allOrders.filter((order, index, self) => index === self.findIndex((o) => o.id === order.id));

        // Ограничиваем до 300 последних заявок
        const lastOrders = uniqueOrders.slice(0, 300);

        // Очищаем хранилище и сохраняем новые данные
        await store.clear();
        for await (const order of lastOrders) {
            await store.put(order);
        }

        // Заменено tx.done на tx.oncomplete
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        console.log('Заявки сохранены в IndexedDB', lastOrders.length);

        return lastOrders;
    } catch (error) {
        console.error('Ошибка при сохранении заявок:', error);
    }
}

// Функция для получения заявок из IndexedDB
export async function getStoredOrders() {
    try {
        const db = await openDatabase();
        const tx = db.transaction('orders', 'readonly');
        const store = tx.objectStore('orders');

        const orders = await getAllOrders(store);

        // Заменено tx.done на tx.oncomplete
        await new Promise<void>((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });

        return orders;
    } catch (error) {
        console.error('Ошибка при получении заявок:', error);
        return [];
    }
}

// Вспомогательная функция для получения всех заявок из хранилища
function getAllOrders(store: IDBObjectStore) {
    return new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
