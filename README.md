# Promise-Queue

Sequential promise queue with a nice API.

### Installation

```
npm install --save sb-promise-queue
```

## API

```js
export default class PromiseQueue {
  clear()
  onIdle(callback: Function): Function
  // call the return value function to remove listener
  waitTillIdle(): Promise<void>
  add(callback: Function)
}
```

## License

The contents of this repository/package are licensed under the terms of The MIT License. See the LICENSE file for more info.
