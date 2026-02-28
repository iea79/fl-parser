import React, { useState, useEffect, useRef } from 'react';
import ss from './Filter.module.scss';
import { Category, Subcategory, SelectedCategories, SelectedSubcategories } from '../../types';
import { getStoredFilters, saveFiltersToStorage } from '../../utils/dbUtils';

interface FilterProps {
    onFilterChange: (categories: SelectedCategories, subcategories: SelectedSubcategories, hot: boolean, fromAll: boolean) => void;
}

const Filter: React.FC<FilterProps> = ({ onFilterChange }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    // Объединенный объект фильтров
    const [filters, setFilters] = useState({
        selectedCategories: [] as SelectedCategories,
        selectedSubcategories: [] as SelectedSubcategories,
        hot: false,
        fromAll: false,
    });

    // Состояния для текстовых полей и выпадающих списков
    const [categoryInput, setCategoryInput] = useState('');
    const [subcategoryInput, setSubcategoryInput] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);

    // Ссылки для обработки кликов вне компонента
    const categoryRef = useRef<HTMLDivElement>(null);
    const subcategoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Загружаем категории
        fetch('json/categories.json')
            .then((response) => response.json())
            .then((data) => setCategories(data))
            .catch((error) => console.error('Ошибка загрузки категорий:', error));

        // Загружаем подкатегории
        fetch('json/subcategories.json')
            .then((response) => response.json())
            .then((data) => setSubcategories(data))
            .catch((error) => console.error('Ошибка загрузки подкатегорий:', error));

        // Загружаем сохраненные фильтры из IndexedDB
        getStoredFilters().then((storedFilters: any) => {
            if (storedFilters) {
                // Убираем id из объекта фильтров перед установкой состояния
                const { id: filterId, ...filtersWithoutId } = storedFilters;
                setFilters(filtersWithoutId);
            }
        });
    }, []);

    useEffect(() => {
        // Сохраняем фильтры в IndexedDB каждый раз при их изменении
        saveFiltersToStorage(filters);
    }, [filters]);

    useEffect(() => {
        // Передаем выбранные значения в родительский компонент
        onFilterChange(filters.selectedCategories, filters.selectedSubcategories, filters.hot, filters.fromAll);
    }, [filters, onFilterChange]);

    // Обработчик кликов вне компонента для закрытия выпадающих списков
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
            if (subcategoryRef.current && !subcategoryRef.current.contains(event.target as Node)) {
                setShowSubcategoryDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Фильтрация категорий по введенному тексту
    const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(categoryInput.toLowerCase()));

    // Фильтрация подкатегорий по введенному тексту и выбранным категориям
    // Убираем дубликаты подкатегорий
    const filteredSubcategories = subcategories
        .filter((sub) => {
            const matchesCategory = filters.selectedCategories.length === 0 || filters.selectedCategories.some((cat) => parseInt(cat.id) === sub.prof_group.id);
            const matchesInput = sub.name.toLowerCase().includes(subcategoryInput.toLowerCase());
            return matchesCategory && matchesInput;
        })
        .filter((sub, index, self) => index === self.findIndex((s) => s.id === sub.id));

    // Обработчик выбора категории
    const handleCategorySelect = (category: Category) => {
        // Проверяем, не выбрана ли уже эта категория
        if (!filters.selectedCategories.some((cat) => cat.id === category.id.toString())) {
            setFilters((prev) => ({
                ...prev,
                selectedCategories: [
                    ...prev.selectedCategories,
                    {
                        id: category.id.toString(),
                        name: category.name,
                    },
                ],
            }));
        }
        setCategoryInput('');
        setShowCategoryDropdown(false);
        // Не сбрасываем выбранные подкатегории при добавлении категории
    };

    // Обработчик выбора подкатегории
    const handleSubcategorySelect = (subcategory: Subcategory) => {
        // Проверяем, не выбрана ли уже эта подкатегория
        if (!filters.selectedSubcategories.some((sub) => sub.id === subcategory.id.toString())) {
            setFilters((prev) => ({
                ...prev,
                selectedSubcategories: [
                    ...prev.selectedSubcategories,
                    {
                        id: subcategory.id.toString(),
                        name: subcategory.name,
                    },
                ],
            }));
        }
        setSubcategoryInput('');
        setShowSubcategoryDropdown(false);
    };

    // Обработчик удаления категории
    const handleRemoveCategory = (id: string) => {
        const newSelectedCategories = filters.selectedCategories.filter((cat) => cat.id !== id);
        setFilters((prev) => ({
            ...prev,
            selectedCategories: newSelectedCategories,
            // Если удалены все категории, сбрасываем подкатегории
            selectedSubcategories: newSelectedCategories.length === 0 ? [] : prev.selectedSubcategories,
        }));
    };

    // Обработчик удаления подкатегории
    const handleRemoveSubcategory = (id: string) => {
        setFilters((prev) => ({
            ...prev,
            selectedSubcategories: prev.selectedSubcategories.filter((sub) => sub.id !== id),
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            selectedCategories: [],
            selectedSubcategories: [],
            hot: false,
            fromAll: false,
        });
    };

    return (
        <div className={ss.filter}>
            <div
                className={ss.selectGroup}
                ref={categoryRef}
            >
                <label htmlFor="category">Категория:</label>
                <div className={ss.inputContainer}>
                    <input
                        type="text"
                        id="category"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Введите категорию"
                        className={ss.textInput}
                    />
                    {showCategoryDropdown && (
                        <ul className={ss.dropdown}>
                            {filteredCategories.map((category) => (
                                <li
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category)}
                                    className={ss.dropdownItem}
                                >
                                    <span>{category.name}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className={ss.selectedItems}>
                    {filters.selectedCategories.map((category) => (
                        <div
                            key={category.id}
                            className={ss.chip}
                        >
                            <span>{category.name}</span>
                            <button
                                onClick={() => handleRemoveCategory(category.id)}
                                className={ss.chipRemove}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div
                className={ss.selectGroup}
                ref={subcategoryRef}
            >
                <label htmlFor="subcategory">Специализация:</label>
                <div className={ss.inputContainer}>
                    <input
                        type="text"
                        id="subcategory"
                        value={subcategoryInput}
                        onChange={(e) => setSubcategoryInput(e.target.value)}
                        onFocus={() => setShowSubcategoryDropdown(true)}
                        placeholder="Введите специализацию"
                        className={ss.textInput}
                        disabled={filters.selectedCategories.length === 0}
                    />
                    {showSubcategoryDropdown && filters.selectedCategories.length > 0 && (
                        <ul className={ss.dropdown}>
                            {filteredSubcategories.map((subcategory) => {
                                // Находим название категории для подкатегории
                                const categoryName = categories.find((cat) => cat.id === subcategory.prof_group.id)?.name || '';
                                console.log(filters.selectedCategories.length);
                                return (
                                    <li
                                        key={subcategory.id}
                                        onClick={() => handleSubcategorySelect(subcategory)}
                                        className={ss.dropdownItem}
                                    >
                                        <span>
                                            {subcategory.name} {filters.selectedCategories.length > 1 && <small>/ {categoryName}</small>}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div className={ss.selectedItems}>
                    {filters.selectedSubcategories.map((subcategory) => {
                        // Находим полное имя с категорией для отображения в чипе
                        const fullSubcategory = subcategories.find((sub) => sub.id.toString() === subcategory.id);
                        const categoryName = fullSubcategory ? categories.find((cat) => cat.id === fullSubcategory.prof_group.id)?.name : '';
                        const displayName = categoryName ? `${categoryName} / ${subcategory.name}` : subcategory.name;

                        return (
                            <div
                                key={subcategory.id}
                                className={ss.chip}
                            >
                                <span>{displayName}</span>
                                <button
                                    onClick={() => handleRemoveSubcategory(subcategory.id)}
                                    className={ss.chipRemove}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className={ss.checkboxGroup}>
                <label className={ss.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={filters.hot}
                        onChange={(e) => setFilters((prev) => ({ ...prev, hot: e.target.checked }))}
                    />
                    <span>
                        <i className="icon_hot"></i>
                        Срочные
                    </span>
                </label>
                <label className={ss.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={filters.fromAll}
                        onChange={(e) => setFilters((prev) => ({ ...prev, fromAll: e.target.checked }))}
                    />
                    <span>
                        <i className="icon_bullhorn"></i>
                        Для всех
                    </span>
                </label>
            </div>
            <div className={ss.clear}>
                <button
                    className={ss.buttonClear}
                    onClick={handleClearFilters}
                >
                    Сбросить фильтр
                </button>
            </div>
        </div>
    );
};

export default Filter;
