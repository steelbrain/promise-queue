import test from 'ava'
import { PromiseQueue } from '..'

test('it works', async t => {
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
  await t.throwsAsync(
    async () => {
      await queue.add(() => Promise.reject(new Error('ding')))
    },
    null,
    'ding',
  )
  queue.add(() => {
    called.push('forth')
  })
  await queue.waitTillIdle()
  called.push('waited till idle')
  t.deepEqual(called, ['first', 'second', 'third', 'onIdle', 'forth', 'onIdle', 'waited till idle'])
})

test('it invokes waitTillIdle immediately when queue is empty', async t => {
  const queue = new PromiseQueue()
  await queue.waitTillIdle()
  t.pass()
})
