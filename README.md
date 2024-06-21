# Velox.db

**velox.db** is an open-source Node.js library that allows you to store data in a JSON file easily. The module is fully written in TypeScript to enhance types for JavaScript. This package has a built-in cache (using [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) to avoid reading and writing the file every millisecond.

## How it works?

Here is an example of how the library is saving your data:

```json
{
    "users": [
        {
            "username": "Tom",
            "age": 24,
            "alive": true,
            "hobbies": []
        }
    ]
}
```

Each property from the first object represents a table name, and each property's value represents data saved for the table's columns. This means the JSON file can support multiple tables in one single file.

## Example usage
In this example, create a JSON file and set the file's path into the constructor's parameter. The file extensions allowed to use: `.json`. The code below is based on TypeScript.

### Define a new database:
Create a new database using the class **Client**. You can set models in the type parameter of the class.

```ts
import { Client } from 'velox.db';

type Models = [{
    table: 'users',
    columns: {
        username: string,
        age: number,
        alive: boolean,
        hobbies: string[]
    }
}];

const client = new Client<Models>({
    path: './path/to/the/file.json'
});
```

To enable caching, use the following options:

```ts
new Client<Models>({
    path: './path/to/the/file.json',
    cache: {
        interval: 10000 // Saves the data every 10 seconds
    }
});
```

### The method: `insert`
This method adds a new column to a table.

```ts
client.insert('users', {
    username: 'Tom',
    age: 24,
    alive: true,
    hobbies: [] 
});
```

### The method: `find`

This method performs filtering based on dynamic conditions (like functions for comparisons).

```ts
client.find('users', {
    age: (num) => num > 18
});
```

### The method: `delete`

This method deletes filtered objects from a table.

```ts
client.delete('users', {
    age: (num) => num <= 34,
    username: (str) => str === 'Tom'
});
```

### The method: `update`

This method updates data for multiple columns from a table.

```ts
client.update('users',
    {
        username: (str) => str.startsWith('Tom')
    },
    {
        age: 25
    }
);
```

There are other methods you can find within the class `Client`!

## License
[MIT License](./LICENSE)