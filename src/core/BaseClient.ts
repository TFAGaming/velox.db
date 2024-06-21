import { readFileSync, writeFileSync } from 'node:fs';
import { ClientOptions, JSONDataTypes, Model } from '../types';

export class BaseClient {
    private readonly options: ClientOptions;
    public readonly cache = new Map<string, { [key: string]: JSONDataTypes }[]>();

    /**
     * The base class for the client.
     * @param {ClientOptions} options The constructor options.
     */
    constructor(options: ClientOptions) {
        this.options = options;

        if (options.cache) {
            const json = this.read(true);

            for (const key in json) {
                this.cache.set(key, json[key]);
            }

            setInterval(() => {
                const keys = [...this.cache.keys()];

                if (keys.length == 0) {
                    return;
                }

                const obj: { [key: string]: { [key: string]: JSONDataTypes }[] } = {};

                for (const key of keys) {
                    obj[key] = this.cache.get(key) as { [key: string]: JSONDataTypes }[];
                }

                this.write(obj, false);
            }, options.cache.interval);
        }
    }

    /**
     * Write the JSON file.
     * @param {{ [key: string]: { [key: string]: JSONDataTypes }[] }} data The data to put on the JSON file.
     * @param {boolean} updateCache Update cache
     * @returns {this}
     */
    protected write(data: { [key: string]: { [key: string]: JSONDataTypes }[] }, updateCache: boolean = true): this {
        try {
            if (this.options.cache && updateCache) {
                this.cache.clear();

                for (const key in data) {
                    this.cache.set(key, data[key]);
                }
            } else {
                if (Object.keys(data).length == 0) {
                    writeFileSync(this.options.path, JSON.stringify({}, null, 4), 'utf-8');
                } else {
                    writeFileSync(this.options.path, JSON.stringify(data, null, 4), 'utf-8');
                }
            }

            return this;
        } catch (err) {
            throw new Error('Unable to write the file.');
        }
    }

    /**
     * Read the JSON file.
     * @param {boolean | undefined} json Return JSON file data, without reading from cache.
     * @returns {{ [key: string]: { [key: string]: JSONDataTypes }[] }}
     */
    protected read(json: boolean | undefined = false): { [key: string]: { [key: string]: JSONDataTypes }[] } {
        try {
            if (json) {
                return JSON.parse(readFileSync(this.options.path, 'utf-8'));
            }

            if (this.options.cache) {
                const keys = [...this.cache.keys()];

                if (keys.length == 0) {
                    { };
                }

                const obj: { [key: string]: { [key: string]: JSONDataTypes }[] } = {};

                for (const key of keys) {
                    obj[key] = this.cache.get(key) as { [key: string]: JSONDataTypes }[];
                }

                return obj;
            } else {
                return JSON.parse(readFileSync(this.options.path, 'utf-8'));
            }
        } catch (err) {
            throw new Error('Unable to read the file.');
        }
    }
}