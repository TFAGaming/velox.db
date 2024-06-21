export type JSONDataTypes = string | number | boolean | JSONDataTypes[] | { [key: string]: JSONDataTypes } | null;

export type Model = {
    table: string,
    columns: { [key: string]: JSONDataTypes }
}

export interface ClientOptions {
    path: `${string}.json`,
    cache?: {
        interval: number
    }
}
