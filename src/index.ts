type QueueItem = () => void
type IdleCallback = () => void | Promise<void>
type AddCallback = () => void | Promise<void>

interface Options {
  concurrency?: number
}

class PromiseQueue {
  options: Required<Options>
  running: number
  queue: QueueItem[]
  idleCallbacks: IdleCallback[]

  constructor({ concurrency = 1 }: Options = {}) {
    this.options = { concurrency }

    this.running = 0
    this.queue = []
    this.idleCallbacks = []
  }
  public clear() {
    this.queue = []
  }
  public onIdle(callback: IdleCallback) {
    this.idleCallbacks.push(callback)
    return () => {
      const index = this.idleCallbacks.indexOf(callback)
      if (index !== -1) {
        this.idleCallbacks.splice(index, 1)
      }
    }
  }
  public waitTillIdle(): Promise<void> {
    return new Promise(resolve => {
      if (this.running < 1) {
        resolve()
        return
      }

      const dispose = this.onIdle(() => {
        dispose()
        resolve()
      })
    })
  }
  public add(callback: AddCallback) {
    return new Promise((resolve, reject) => {
      const runCallback = () => {
        try {
          this.running += 1
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
      if (this.running >= this.options.concurrency) {
        this.queue.push(runCallback)
      } else {
        runCallback()
      }
    })
  }
  // Internal function, don't use
  private processNext() {
    this.running -= 1
    const callback = this.queue.shift()
    if (callback) {
      callback()
    } else {
      this.idleCallbacks.forEach(item => item())
    }
  }
}

export { PromiseQueue }
