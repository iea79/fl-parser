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
