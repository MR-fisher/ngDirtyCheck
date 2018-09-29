const ngDirtyCheck = require('../lib/ngDirtyCheck')

describe('ngDirtyCheck', () => {
  it('smple case', (done) => {
    const root = {
      watchers: [],
      data: {
        "x": 1
      }
    }
    let before = root.data.x
    let after = root.data.x
    ngDirtyCheck.watch(root.watchers, root.data, 'x', function (newVal, oldVal){
      before = oldVal
      after = newVal
    })
    let runtime = new Promise((resolve) => {
      setTimeout(() => {
        root.data.x = 2
        ngDirtyCheck.digest(root)
        resolve()
      }, 100)
    })
    runtime.then(() => {
      expect(before).toBe(1)
      expect(after).toBe(2)
      done()
    })
  })

  it('diffrent data types case', (done) => {
    const noop = function(){}
    const testFn = function(){true;}
    const root = {
      watchers: [],
      data: {
        "string": "a",
        "number": 1,
        "boolean": true,
        "object": {},
        "array": [],
        "function": noop,
        "date": new Date('2018-1-1'),
        "regexp": /a/
      }
    }
    let before = {}
    let after = {}
    ngDirtyCheck.watch(root.watchers, root.data, 'string', function (newVal, oldVal){
      before.string = oldVal
      after.string = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'number', function (newVal, oldVal){
      before.number = oldVal
      after.number = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'boolean', function (newVal, oldVal){
      before.boolean = oldVal
      after.boolean = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'object', function (newVal, oldVal){
      before.object = oldVal
      after.object = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'array', function (newVal, oldVal){
      before.array = oldVal
      after.array = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'function', function (newVal, oldVal){
      before.function = oldVal
      after.function = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'date', function (newVal, oldVal){
      before.date = oldVal
      after.date = newVal
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'regexp', function (newVal, oldVal){
      before.regexp = oldVal
      after.regexp = newVal
    })
    let runtime = new Promise((resolve) => {
      setTimeout(() => {
        root.data.string = "b"
        root.data.number = 2
        root.data.boolean = false
        root.data.object.x = 1
        root.data.array.push(1)
        root.data.function = testFn
        root.data.date = new Date('2018-10-10')
        root.data.regexp = /b/
        ngDirtyCheck.digest(root)
        resolve()
      }, 100)
    })
    runtime.then(() => {
      expect(before).toEqual({
        "string": "a",
        "number": 1,
        "boolean": true,
        "object": {},
        "array": [],
        "function": noop,
        "date": new Date('2018-1-1'),
        "regexp": /a/
      })
      expect(after).toEqual({
        "string": "b",
        "number": 2,
        "boolean": false,
        "object": {x:1},
        "array": [1],
        "function": testFn,
        "date": new Date('2018-10-10'),
        "regexp": /b/
      })
      done()
    })
  })

  it('deep level case', (done) => {
    const root = {
      watchers: [],
      data: {
        "x": 1
      },
      children: [
        {
          watchers: [],
          data: {
            "y": "a"
          }
        }
      ]
    }
    let before = root.children[0].data.y
    let after = root.children[0].data.y
    ngDirtyCheck.watch(root.watchers, root.children[0].data, 'y', function (newVal, oldVal){
      before = oldVal
      after = newVal
    })
    let runtime = new Promise((resolve) => {
      setTimeout(() => {
        root.children[0].data.y = 'b'
        ngDirtyCheck.digest(root)
        resolve()
      }, 100)
    })
    runtime.then(() => {
      expect(before).toBe('a')
      expect(after).toBe('b')
      done()
    })
  })

  it('watcher change chain case', (done) => {
    const root = {
      watchers: [],
      data: {
        "x": 1,
        "y": "a"
      }
    }
    let before = root.data.y
    let after = root.data.y
    ngDirtyCheck.watch(root.watchers, root.data, 'x', function (newVal, oldVal){
      root.data.y = 'b'
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'y', function (newVal, oldVal){
      before = oldVal
      after = newVal
    })
    let runtime = new Promise((resolve) => {
      setTimeout(() => {
        root.data.x = 2
        ngDirtyCheck.digest(root)
        resolve()
      }, 100)
    })
    runtime.then(() => {
      expect(before).toBe('a')
      expect(after).toBe('b')
      done()
    })
  })

  it('watcher change infinite loop case', () => {
    const root = {
      watchers: [],
      data: {
        "x": 0,
        "y": 0
      }
    }
    let count = 0
    ngDirtyCheck.watch(root.watchers, root.data, 'x', function (newVal, oldVal){
      root.data.y = ++count
    })
    ngDirtyCheck.watch(root.watchers, root.data, 'y', function (newVal, oldVal){
      root.data.x = ++count
    })
    let runtime = () => {
      root.data.x = 1
      ngDirtyCheck.digest(root)
    }
    expect(runtime).toThrowError('10 digest() iterations reached. Aborting!');
  })
})
