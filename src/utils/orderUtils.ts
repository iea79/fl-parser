import { Order } from '../types';

// Функция для получения заявок
export async function getOrders(path = '/orders/50') {
    try {
        // Заню что так не правильно, но в данном случае не вижу ничего страшного
        let url = 'https://fl-parser-server.frontendie.ru/api' + path;
        // let url = 'http://localhost:5599/api' + path;
        // Запрашиваем данные с JSON API с таймаутом 10 секунд
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        // Преобразуем данные в нужный формат
        let orders = data.map((item: Order) => {
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
                onTop: item.onTop,
                logo: item.logo || '',
            };
        });

        return orders;
    } catch (error) {
        console.log('Ошибка при получении заявок:', error);
        return [];
    }
}

// Функция для фильтрации заявок
export async function getFilteredOrders(orders: Order[], storedFilters: any) {
    let filteredOrders = [...orders];

    // Применяем фильтрацию к заявкам
    if (storedFilters) {
        const { selectedCategories, selectedSubcategories, hot, fromAll } = storedFilters;

        // Фильтрация по категориям
        if (selectedCategories && selectedCategories.length > 0) {
            const categoryNames = selectedCategories.map((cat: any) => cat.name);
            filteredOrders = filteredOrders.filter((order) => categoryNames.some((name: any) => order.categories?.some((cat: any) => cat.includes(name))));
        }

        // Фильтрация по подкатегориям
        if (selectedSubcategories && selectedSubcategories.length > 0) {
            const subcategoryNames = selectedSubcategories.map((sub: any) => sub.name);
            filteredOrders = filteredOrders.filter((order) => subcategoryNames.some((name: any) => order.categories?.some((cat: any) => cat.includes(name))));
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
    filteredOrders?.sort((a, b) => {
        if (a.isoDate && b.isoDate) {
            return new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime();
        }
        return 0;
    });

    return filteredOrders || [];
}
