import * as functions from 'firebase-functions'
import { uniqBy, differenceBy } from 'lodash'

import { db, serverTimestamp } from '../../config'
import { isEmailValid } from '../../utils'

const AUDIENCE_LIMIT = 500

export const importCSV = functions.region('europe-west2').https.onCall(async (list, context) => {
  const userId = context.auth?.uid

  if (!userId) return false

  const audienceRef = await db.collection('audience').where('userId', '==', userId).get()
  const audience = audienceRef.docs.map((doc) => doc.data())

  const valid = list.filter((item: string[]) => isEmailValid(item[1]))
  const unique = uniqBy(valid, (item: string[]) => item[1])

  const final = differenceBy(
    unique.map((item) => ({ name: item[0], email: item[1] })),
    audience,
    'email'
  )

  const batch = db.batch()

  const contactsLeft = AUDIENCE_LIMIT - audience.length
  const isOveLimit = final.length > contactsLeft

  const size = isOveLimit ? AUDIENCE_LIMIT - audience.length : final.length

  final.slice(0, size).forEach(({ name, email }) => {
    const aRef = db.collection('audience').doc()
    batch.set(aRef, { name, email, userId, createdAt: serverTimestamp() })
  })

  await batch.commit()

  return { ok: true }
})
