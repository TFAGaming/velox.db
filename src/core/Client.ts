import { ClientOptions, JSONDataTypes, Model, QueryOptions, Structure } from "../types";
import { BaseClient } from "./BaseClient";
import { v6 as uuidv6 } from 'uuid';

const processQuery = <T>(data: T[], options: QueryOptions<T>): T[] => {
    let result = data;

    if (options.sort) {
        result.sort((a, b) => {
            for (const key in options.sort) {
                if (a[key as keyof T] > b[key as keyof T]) return options.sort[key as keyof T] === 1 ? 1 : -1;
                if (a[key as keyof T] < b[key as keyof T]) return options.sort[key as keyof T] === 1 ? -1 : 1;
            }

            return 0;
        });
    }

    if (options.skip) {
        result = result.slice(options.skip);
    }

    if (options.limit) {
        result = result.slice(0, options.limit);
    }

    if (options.projection) {
        result = result.map(item => {
            const projectedItem = {} as T;

            for (const key of options.projection!) {
                projectedItem[key] = item[key];
            }

            return projectedItem;
        });
    }

    return result;
}

export class Client<M extends Model[]> extends BaseClient {
    /**
     * Client class for handling operations on a JSON data store.
     * @param {ClientOptions} options The client options.
     */
    constructor(options: ClientOptions) {
        super(options);
    }

    public create<T extends M[number]['table']>(...tables: T[]): this {
        const json = this.read();

        for (const table of tables) {
            if (table in json) {
                continue;
            }

            json[table] = [];
        };

        this.write(json);

        return this;
    }

    public insert<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, ...data: Omit<C, "_id">[]): C[] {
        const json = this.read();

        if (!(table in json)) {
            throw new Error('Table not found');
        }

        const columns = json[table];

        const final: { [key: string]: JSONDataTypes }[] = [];

        for (let each of (data as Structure)) {
            each = {
                "_id": uuidv6(),
                ...each
            }

            final.push(each);
        }

        json[table] = [...columns, ...final];
        this.write(json);

        return (json[table] as C[]);
    }

    /**
     * Filters records in the specified table based on the given criteria.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to filter.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} where - Criteria to filter records.
     * @param {QueryOptions<C>} [query] - Additional options like sorting, limiting, and projection.
     * @returns {C[]} - Array of filtered records.
     */
    public find<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }, query?: QueryOptions<C>): C[] {
        const json = this.read();

        if (!(table in json)) {
            throw new Error('Table not found');
        }

        const columns = json[table];

        if (!columns || columns.length == 0) {
            return [];
        }

        const filtered = columns.filter((item: { [key: string]: JSONDataTypes }) => {
            return Object.entries(where).every(([key, condition]) => {
                if (typeof condition === 'function') {
                    return condition(item[key]);
                }

                return true;
            });
        }) as C[];

        if (query) {
            return processQuery(filtered, query);
        } else {
            return filtered;
        }
    }

    /**
     * Filters records in the specified table based on the given criteria, returns the first record.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to filter.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} where - Criteria to filter records.
     * @param {QueryOptions<C>} [query] - Additional options like sorting, limiting, and projection.
     * @returns {C | null} - Filtered record.
     */
    public findFirst<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }, query?: QueryOptions<C>): C | null {
        const found = this.find(table, where, query);

        if (found.length == 0) {
            return null;
        }

        return found[0];
    }

    /**
     * Deletes records from the specified table based on the given criteria.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to delete from.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} [where] - Criteria to filter records to delete.
     * @returns {number} - Number of records deleted.
     */
    public delete<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): number {
        const json = this.read();

        if (!(table in json)) {
            throw new Error('Table not found');
        }

        const columns = json[table];

        if (!columns) {
            throw new Error(`Table ${table} not found.`);
        }

        const newColumns = columns.filter((item: { [key: string]: JSONDataTypes }) => {
            return !Object.entries(where).every(([key, condition]) => {
                if (typeof condition === 'function') {
                    return condition(item[key]);
                }
                return true;
            });
        });

        json[table] = newColumns;
        this.write(json);

        return columns.length - newColumns.length;
    }

    /**
     * Deletes first record from the specified table based on the given criteria.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to delete from.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} [where] - Criteria to filter records to delete.
     * @returns {number} - Number of records deleted.
     */
    public deleteFirst<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): number {
        const json = this.read();

        if (!(table in json)) {
            throw new Error('Table not found');
        }

        const columns = json[table];

        const index = columns.findIndex((item: { [key: string]: JSONDataTypes }) => {
            return Object.entries(where || {}).every(([key, condition]) => {
                if (typeof condition === 'function') {
                    return condition(item[key]);
                }

                return true;
            });
        });

        if (index !== -1) {
            columns.splice(index, 1);
            this.write(json);

            return 1;
        } else {
            return 0;
        }
    }

    /**
     * Updates records in the specified table based on the given criteria and update values.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to update.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} [where] - Criteria to filter records to update.
     * @param {Partial<C>} updates - Update values for the records.
     * @returns {number} - Number of records updated.
     */
    public update<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }, updates: Partial<Omit<C, "_id">>): C[] {
        const json = this.read();

        if (!(table in json)) {
            throw new Error('Table not found');
        }

        const columns = json[table];

        if (!columns) {
            return [];
        }

        columns.forEach((item: { [key: string]: JSONDataTypes }) => {
            const match = Object.entries(where || {}).every(([key, condition]) => {
                if (typeof condition === 'function') {
                    return condition(item[key]);
                }

                return true;
            });

            if (match) {
                Object.entries(updates).forEach(([key, value]) => {
                    item[key] = value;
                });
            }
        });

        this.write(json);

        return columns as C[];
    }

    /**
     * Drops specified tables from the database.
     * @template T - Table name type.
     * @param {...T[]} tables - Tables to drop from the database.
     * @returns {Record<string, Record<string, JSONDataTypes>[]>} - Updated JSON data after dropping tables.
     */
    public drop<T extends M[number]['table']>(...tables: T[]): Record<string, Record<string, JSONDataTypes>[]> {
        const json = this.read();

        for (const table of tables) {
            if (table in json) {
                delete json[table];
            }
        }

        this.write(json);

        return json;
    }

    /**
     * Retrieves the number of records in a specific table or the total number of tables if no table is specified.
     * @template T - Table name type.
     * @param {T} [table] - Optional. The table to get the size of.
     * @returns {number} - Number of records in the specified table or total number of tables if no table is specified.
     */
    public size<T extends M[number]['table']>(table?: T): number {
        const json = this.read();

        if (!table) {
            return Object.keys(json).length;
        } else {
            if (!(table in json)) {
                throw new Error('Table not found');
            }

            const columns = json[table];

            if (!columns) {
                return 0;
            }

            return columns.length;
        }
    }

    /**
     * Counts the number of records that match the specified criteria in the given table.
     * @template T - Table name type.
     * @template C - Columns type of the table.
     * @param {T} table - The name of the table to count the records from.
     * @param {{ [K in keyof C]?: (value: C[K]) => boolean }} where - Criteria to filter records.
     * @param {QueryOptions<C>} [query] - Additional options like sorting, limiting, and projection.
     * @returns {number} - Number of records that match the criteria.
     */
    public count<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }, query?: QueryOptions<C>): number {
        const found = this.find(table, where, query);

        return found.length;
    }

    /**
     * Clears all records from the specified tables.
     * @template T - Table name type.
     * @param {...T[]} tables - Tables to clear records from.
     * @returns {this} - Current instance for method chaining.
     */
    public clear<T extends M[number]['table']>(...tables: T[]): this {
        const json = this.read();

        for (const table of tables) {
            if (!(table in json)) {
                continue;
            }

            json[table] = [];
        };

        this.write(json);

        return this;
    }
}