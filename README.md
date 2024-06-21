# Velox.db

**velox.db** is an open-source Node.js library that allows you to store data in a JSON file easily. The module is fully written in TypeScript to enhance types for JavaScript. This package has a built-in cache (using [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) to prevent latency when reading and writing files.

## How it works?

Here is an example of how the library is saving your data:

```json
{
    "users": [
        {   
            "_id": "1ef3011f-9650-6820-b7b3-c80571feaa41",
            "name": "Tom",
            "age": 19,
            "hobbies": ["Swimming"]
        },
        ...
    ]
}
```

Each property from the first object represents a table name, and each property's value represents records saved for the table. The `_id` field is a unique field and cannot be deleted or modified.

## Example usage

### Define a new database:
Create a new database using the class **Client**. You can set models in the type parameter of the class.

```ts
import { Client } from 'velox.db';

type Models = [{
    table: 'users',
    columns: {
        _id: string,
        name: string,
        age: number,
        hobbies: string[]
    }
}];

const client = new Client<Models>({
    path: './path/to/the/file.json'
});
```

The field `_id` must be a **string**, other types are not supported.

Other client options:

```ts
new Client<Models>({
    path: './path/to/the/file.json',
    // Cache configuration
    cache: {
        interval: 10000 // Saves data every 10 seconds.
    },
    // JSON configuration
    json: {
        spaces: 4 // The required spaces when saving data (4 spaces = 1 TAB).
    }
});
```

### The method: `insert`
This method adds a new column to a table.

```ts
const records = [
    { name: 'Alice', age: 23, hobbies: ['Reading', 'Music'] },
    { name: 'Bob', age: 20, hobbies: ['Sports'] },
    { name: 'Tom', age: 19, hobbies: ['Swimming'] }
];

client.insert('users', ...records);
```

### The method: `find`

This method performs filtering based on dynamic conditions (like functions for comparisons).

```ts
client.find('users',
    {
        age: (integer) => integer > 20
    }
);
```

### The method: `delete`

This method deletes filtered objects from a table.

```ts
client.delete('users',
    {
        age: (integer) => integer <= 24,
        name: (string) => string === 'Tom'
    }
);
```

### The method: `update`

This method updates data for multiple columns from a table.

```ts
client.update('users',
    {
        name: (string) => string === 'Alice',
        hobbies: (array) => array.includes('Music')
    },
    {
        age: 24
    }
);
```

## Query options

This feature operates on an array of data and performs filtering, sorting, limiting, and skipping based on the provided options. It only exists in the following methods: `find()`, `findFirst()`, and `count()`.

```ts
client.find('users',
    {
        age: (integer) => integer % 2 === 0,
        name: (string) => (/^[a-zA-Z]/g).test(string)
    },
    {
        sort: {
            age: -1
        },
        limit: 3,
        skip: 1,
        projection: ['name', 'hobbies']
    }
);
```

### Explanation
- **Sorting:** The sort object specifies the fields and the sort order (**1** for ascending, **-1** for descending).
- **Limit and Skip:** The limit and skip options allow restricting the number of results and offsetting the results, respectively.
- **Projection:** Refers to selecting specific fields from records to include in the results.

## Documentation

- [Velox.db](https://tfagaming.github.io/velox.db/)

## License
[MIT License](./LICENSE)