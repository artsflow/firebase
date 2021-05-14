import * as functions from 'firebase-functions'

import { db, admin } from '../../config'
import { workers } from '../workers'

export const taskRunner = functions
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .region('europe-west2')
  .pubsub.schedule('* * * * *')
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now()

    const query = db
      .collection('tasks')
      .where('performAt', '<=', now)
      .where('status', '==', 'scheduled')

    const tasks = await query.get()

    const jobs: Promise<any>[] = []

    tasks.forEach((snapshot) => {
      const { worker, options } = snapshot.data()

      const job = workers[worker](options)
        .then(() => snapshot.ref.update({ status: 'complete' }))
        .catch((error: any) => snapshot.ref.update({ status: 'error', error }))

      jobs.push(job)
    })

    return await Promise.all(jobs)
  })
