import { ClientOptions, JSONDataTypes, Model } from "../types";
import { BaseClient } from "./BaseClient";

export class Client<M extends Model[]> extends BaseClient {
    /**
     * The main client to create the database and manage its data.
     * @param {ClientOptions} options The client options.
     */
    constructor(options: ClientOptions) {
        super(options);
    }
    
    /**
     * Add columns to a table.
     * @param {string} table The table name.
     * @param {{[key: string]: JSONDataTypes}[]} data The data for each column.
     * @returns 
     */
    public insert<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, ...data: C[]): { [key: string]: JSONDataTypes }[] {
        const json = this.read();
        const columns = json[table];

        if (!columns) {
            return [];
        }

        json[table] = [...columns, ...data];
        this.write(json);

        return json[table];
    }

    /**
     * Perform filtering based on dynamic conditions (like functions for comparisons) in a table.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {{ [key: string]: JSONDataTypes }[]}
     */
    public find<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): { [key: string]: JSONDataTypes }[] {
        const json = this.read();
        const columns = json[table];

        if (!columns || columns.length == 0) {
            return [];
        }

        return columns.filter((item: { [key: string]: JSONDataTypes }) => {
            return Object.entries(where).every(([key, condition]) => {
                if (typeof condition === 'function') {
                    return condition(item[key]);
                }

                return true;
            });
        });
    }

    /**
     * Perform filtering based on dynamic conditions (like functions for comparisons) in a table, returns the first element from array.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {{ [key: string]: JSONDataTypes } | null}
     */
    public findFirst<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): { [key: string]: JSONDataTypes } | null {
        const found = this.find(table, where);

        if (found.length == 0) {
            return null;
        }

        return found[0];
    }

    /**
     * Delete filtered objects from a table.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {{ [key: string]: JSONDataTypes }[]}
     */
    public delete<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): { [key: string]: JSONDataTypes }[] {
        const json = this.read();
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

        return newColumns;
    }

    /**
     * Delete first filtered object from a table.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {{ [key: string]: JSONDataTypes }[]}
     */
    public deleteFirst<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where?: { [K in keyof C]?: (value: C[K]) => boolean }): { [key: string]: JSONDataTypes }[] {
        const json = this.read();
        const columns = json[table];

        if (!columns) {
            return [];
        }

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
        }

        return columns;
    }

    /**
     * Update data for multiple columns in a table.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {{ [key: string]: JSONDataTypes }[]}
     */
    public update<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }, updates: Partial<C>): { [key: string]: JSONDataTypes }[] {
        const json = this.read();
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

        return columns;
    }

    /**
     * Delete a table from the database.
     * @param {string[]} tables The table name.
     * @returns {{ [key: string]: { [key: string]: JSONDataTypes; }[]; }}
     */
    public drop<T extends M[number]['table']>(...tables: T[]): { [key: string]: { [key: string]: JSONDataTypes; }[]; } {
        const json = this.read();

        for (const table of tables) {
            delete json[table];
        }

        this.write(json);

        return json;
    }

    /**
     * Get the database tables count, or a table columns count.
     * @param {string | undefined} table The table name.
     * @returns {number}
     */
    public size<T extends M[number]['table']>(table?: T): number {
        const json = this.read();

        if (!table) {
            return Object.keys(json).length;
        } else {
            const columns = json[table];

            if (!columns) {
                return 0;
            }

            return columns.length;
        }
    }
    
    /**
     * Perform filtering based on dynamic conditions (like functions for comparisons) in a table, returns the size of the array.
     * @param {string} table The table name.
     * @param where The filtering object.
     * @returns {number}
     */
    public count<T extends M[number]['table'], C extends Extract<M[number], { table: T }>['columns']>(table: T, where: { [K in keyof C]?: (value: C[K]) => boolean }): number {
        const found = this.find(table, where);

        return found.length;
    }
}