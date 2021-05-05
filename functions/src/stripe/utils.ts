import Stripe from 'stripe'

import { db, stripe } from '../config'

export const getOrCreateStripeAccount = async (userId: string) => {
  const batch = db.batch()

  const userRef = db.collection('users').doc(userId)
  const profileRef = db.collection('profiles').doc(userId)
  const userDoc = await userRef.get()
  const email = userDoc.data()?.email
  const stripeAccountId = userDoc.data()?.stripeAccountId

  if (stripeAccountId) return await stripe.accounts.retrieve(stripeAccountId)

  const stripeAccount = await stripe.accounts.create({
    country: 'GB',
    type: 'custom',
    capabilities: {
      card_payments: {
        requested: true,
      },
      transfers: {
        requested: true,
      },
    },
    email,
    metadata: {
      userId,
    },
  })

  batch.update(userRef, { stripeAccountId: stripeAccount.id, isVerified: false })
  batch.update(profileRef, { isVerified: false })

  await batch.commit()

  return stripeAccount
}

export const getStripeAccount = async (userId: string) => {
  const { data } = await getDocument(userId, 'users')
  const { stripeAccountId } = data

  if (!stripeAccountId) return null

  return await stripe.accounts.retrieve(stripeAccountId)
}

export const getOrCreateStripeCustomer = async (userId: string, params?: any) => {
  const { data, snapshot } = await getDocument(userId, 'users')
  const { stripeCustomerId, email, displayName } = data
  const { name, phone } = params

  const updatedName = displayName !== name ? name : displayName

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email,
      name: updatedName,
      phone,
      metadata: {
        firebaseUID: userId,
      },
      ...params,
    })
    await snapshot.ref.update({
      stripeCustomerId: customer.id,
      displayName: updatedName,
    })
    return customer
  } else {
    return (await stripe.customers.retrieve(stripeCustomerId)) as Stripe.Customer
  }
}

export const getDocument = async (id: string, collection: string) => {
  const snapshot = await db.collection(collection).doc(id).get()
  const data = snapshot.data() as any
  return { data, snapshot }
}
