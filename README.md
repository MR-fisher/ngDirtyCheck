# ngDirtyCheck
Separate dirty-checking code from Angular1.x.Can be used in our normal front-end project.Otherwise, the function can run in ie8.

## Usage

ngDirtyCheck can be used in both node.js and in the browser.

Install ngDirtyCheck using [npm](https://www.npmjs.com/package/mathjs):

```bash
npm install ngDirtyCheck
```

### simple example

```js
// tree data
const root = {
    watchers: [],
    data: {
        "x": 1
    }
}
// watch data
ngDirtyCheck.watch(root.watchers, root.data, 'x', function (newVal, oldVal){
    // New Value: 2, Old Value: 1
    console.log(`New Value: ${newVal}, Old Value: ${oldVal}`)
})
// trigger digest
root.data.x = 2
ngDirtyCheck.digest(root)
```

### deep level example

```js
// tree data
const root = {
    watchers: [],
    data: {
        "x": 1
    },
    children: [
        {
            watchers: [],
            data: {
                "y": 1
            }
        }
    ]
}
// watch data
ngDirtyCheck.watch(root.children[0].watchers, root.children[0].data, 'y', function (newVal, oldVal){
    // New Value: 2, Old Value: 1
    console.log(`New Value: ${newVal}, Old Value: ${oldVal}`)
})
// trigger digest
root.children[0].data.y = 2
ngDirtyCheck.digest(root)
```

### watch chain example

```js
// tree data
const root = {
    watchers: [],
    data: {
        "x": 1,
        "y": 1
    }
}
// watch data
ngDirtyCheck.watch(root.watchers, root.data, 'x', function (newVal, oldVal){
    // trigger another watcher of 'y'
    root.data.y = 2
})
ngDirtyCheck.watch(root.watchers, root.data, 'y', function (newVal, oldVal){
    // New Value: 2, Old Value: 1
    console.log(`New Value: ${newVal}, Old Value: ${oldVal}`)
})
// trigger digest
root.data.x = 2
ngDirtyCheck.digest(root)
```

## Test

To execute tests for the library, install the project dependencies once:

```bash
npm install
```

Then, the tests can be executed:

```bash
npm test
```

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2018 Boris Dai