import test from 'ava'
import { PromiseQueue } from '..'

async function wait(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

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
    await wait(1)
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

test('it supports concurrency', async t => {
  const queue = new PromiseQueue({ concurrency: 3 })
  const called = []

  queue.onIdle(() => {
    called.push('onIdle')
  })

  queue.add(async () => {
    called.push('first - started')
    await wait(10)
    called.push('first - finished')
  })
  queue.add(async () => {
    called.push('second - started')
    await wait(9)
    called.push('second - finished')
  })
  queue.add(async () => {
    called.push('third - started')
    await wait(5)
    called.push('third - finished')
  })
  queue.add(async () => {
    called.push('forth - started')
    await wait(4)
    called.push('forth - finished')
  })
  queue.add(async () => {
    called.push('fifth - started')
    await wait(8)
    called.push('fifth - finished')
  })
  await queue.waitTillIdle()
  called.push('waited till idle')

  // Since actual completion order will be random each time,
  // just check for behavior instead
  t.deepEqual(called.slice(0, 5), [
    'first - started',
    'second - started',
    'third - started',
    'third - finished',
    'forth - started',
  ])
  // Sort to test functionality, not order
  t.deepEqual(called.sort(), [
    'fifth - finished',
    'fifth - started',
    'first - finished',
    'first - started',
    'forth - finished',
    'forth - started',
    'onIdle',
    'second - finished',
    'second - started',
    'third - finished',
    'third - started',
    'waited till idle',
  ])
})

test('it invokes waitTillIdle immediately when queue is empty', async t => {
  const queue = new PromiseQueue()
  await queue.waitTillIdle()
  t.pass()
})
