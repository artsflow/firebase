import Stripe from 'stripe'
import { customAlphabet } from 'nanoid'

import { db, stripe } from './config'

const alphabet = 'abcdefghijklmnopqrstuvwxyz1234567890'

export const nanoid = customAlphabet(alphabet, 8)

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
  return { data: { ...data, id }, snapshot }
}
