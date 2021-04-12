import { db, stripe } from '../config'

export const getStripeAccount = async (userId: string) => {
  const profileRef = db.collection('profiles').doc(userId)
  const doc = await profileRef.get()
  const sid = doc.data()?.sid

  if (!sid) return null

  const stripeAcc = await stripe.accounts.retrieve(sid)

  return stripeAcc
}
