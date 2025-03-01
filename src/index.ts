type QueueItem = () => void
type IdleCallback = () => void | Promise<void>
type AddCallback = () => void | Promise<void>

interface Options {
  concurrency?: number
}

class PromiseQueue {
  options: Required<Options>
  running: number = 0;
  queue: QueueItem[] = []
  idleCallbacks: IdleCallback[] = []

  constructor({ concurrency = 1 }: Options = {}) {
    this.options = { concurrency }
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
    return new Promise((resolve) => {
      if (this.running === 0) {
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
        this.running += 1
        Promise.resolve()
          .then(() => callback())
          .then(resolve, reject)
          .then(() => {
            this.running -= 1
            const callback = this.queue.shift()
            if (callback) {
              callback()
            } else if (this.running === 0) {
              this.idleCallbacks.forEach((item) => item())
            }
          })
      }
      if (this.running >= this.options.concurrency) {
        this.queue.push(runCallback)
      } else {
        runCallback()
      }
    })
  }
}

export { PromiseQueue }
