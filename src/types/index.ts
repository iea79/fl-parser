export interface Order {
    id: string | undefined;
    title: string | undefined;
    link: string | undefined;
    content: string | undefined;
    isoDate: string | undefined;
    categories: string[] | undefined;
    price?: string | undefined;
    logo?: string | undefined;
    onTop?: boolean;
    fromAll?: boolean;
    hot?: boolean;
    currency?: string;
}

export interface Category {
    id: number;
    name: string;
    name_en: string;
    rank: number;
    link: string;
}

export interface CategorySelection {
    id: string;
    name: string;
}

export interface Subcategory {
    id: number;
    name: string;
    name_en: string;
    ordering: null;
    description: string | null;
    rank: number;
    is_transaction_model: boolean;
    prof_group: Category;
}

export interface SubcategorySelection {
    id: string;
    name: string;
}

export type SelectedCategories = CategorySelection[];
export type SelectedSubcategories = SubcategorySelection[];

export interface Notiffication {
    id: string;
    title: string;
    body: string;
    icon?: string | '/assets/icon.jpg';
    bage?: string | '/assets/bage72.jpg';
}
