export interface ICategory {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
}


export interface ICategoryList {
    categories: ICategory[];
    total: number;
}