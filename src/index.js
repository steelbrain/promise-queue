// @flow

type QueueItem = () => void
type IdleCallback = () => void | Promise<void>
type AddCallback = () => Promise<void>

class PromiseQueue {
  running: number
  queue: Array<QueueItem>
  idleCallbacks: Array<IdleCallback>

  constructor() {
    this.running = 0
    this.queue = []
    this.idleCallbacks = []
  }
  clear() {
    this.queue = []
  }
  onIdle(callback: IdleCallback) {
    this.idleCallbacks.push(callback)
    return () => {
      const index = this.idleCallbacks.indexOf(callback)
      if (index !== -1) {
        this.idleCallbacks.splice(index, 1)
      }
    }
  }
  waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      const dispose = this.onIdle(() => {
        dispose()
        resolve()
      })
    })
  }
  add(callback: AddCallback) {
    return new Promise(function(resolve, reject) {
      const runCallback = () => {
        try {
          this.running++
          Promise.resolve(callback()).then(
            val => {
              resolve(val)
              this.processNext()
            },
            err => {
              reject(err)
              this.processNext()
            },
          )
        } catch (err) {
          reject(err)
          this.processNext()
        }
      }
      if (this.running) {
        this.queue.push(runCallback)
      } else {
        runCallback()
      }
    })
  }
  // Internal function, don't use
  processNext() {
    this.running--
    const callback = this.queue.shift()
    if (callback) {
      callback()
    }
  }
}

module.exports = PromiseQueue
