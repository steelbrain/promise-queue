import PromiseQueue from '../'

describe('Promise Queue', function() {
  it('works properly', async function() {
    const queue = new PromiseQueue()
    const called = []

    queue.onIdle(() => {
      called.push('onIdle')
    })

    queue.add(() => {
      called.push('first')
    })
    queue.add(async () => {
      await new Promise(resolve => setTimeout(resolve, 1))
      called.push('second')
    })
    queue.add(() => {
      called.push('third')
    })
    await expect(queue.add(() => Promise.reject(new Error('ding')))).rejects.toHaveProperty('message', 'ding')
    queue.add(() => {
      called.push('forth')
    })
    await queue.waitTillIdle()
    called.push('waited till idle')
    expect(called).toEqual(['first', 'second', 'third', 'onIdle', 'forth', 'onIdle', 'waited till idle'])
  })
})
