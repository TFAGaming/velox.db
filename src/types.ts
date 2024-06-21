export type JSONDataTypes = string | number | boolean | JSONDataTypes[] | { [key: string]: JSONDataTypes } | null;

export type Model = {
    table: string,
    columns: {
        _id: string,
        [key: string]: JSONDataTypes
    }
}

export interface ClientOptions {
    path: `${string}.json`,
    cache?: {
        interval: number
    },
    json?: {
        spaces?: number,
    }
}

export type Structure = { [key: string]: JSONDataTypes }[];

export interface QueryOptions<T> {
    sort?: { [K in keyof T]?: 1 | -1 };
    limit?: number;
    skip?: number;
    projection?: (keyof T)[];
}