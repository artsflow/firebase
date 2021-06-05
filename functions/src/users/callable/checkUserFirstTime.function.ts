import * as functions from 'firebase-functions'

import { getDocument } from '../../utils'
import { notifyNewCreativeSignup } from '../../notifications'

export const checkUserFirstTime = functions
  .region('europe-west2')
  .https.onCall(async (_, context) => {
    const userId = context.auth?.uid

    if (!userId) return false

    const { data, snapshot } = await getDocument(userId, 'users')
    const { isCreative, firstName, displayName, email } = data

    if (!isCreative) {
      await snapshot.ref.update({ isCreative: true })
      notifyNewCreativeSignup({ email, name: firstName || displayName })
    }

    return null
  })
