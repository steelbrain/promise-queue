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
  waitTillIdle(): Promise<void> {
    return new Promise(resolve => {
      if (!this.running) {
        resolve()
        return
      }

      const dispose = this.onIdle(() => {
        dispose()
        resolve()
      })
    })
  }
  add(callback: AddCallback) {
    return new Promise((resolve, reject) => {
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
    } else {
      this.idleCallbacks.forEach(item => item())
    }
  }
}

module.exports = PromiseQueue
