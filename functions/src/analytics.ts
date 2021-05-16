import Analytics from 'analytics-node'

import { SEGMENT_KEY } from './config'

const analytics = new Analytics(SEGMENT_KEY)

export const trackCompleteVerification = (userId: string) => {
  analytics.identify({ userId, traits: { isVerified: true } })
  analytics.track({ userId, event: 'Verification Completed' })
}

interface PersonProps {
  userId: string
  firstName: string
  lastName: string
  displayName: string
  phone: string
  address: string
  dob: string
  stripePersonId: string
}

export const trackUpdatePerson = ({ userId, ...rest }: PersonProps) => {
  analytics.identify({ userId, traits: { ...rest } })
  analytics.track({ userId, event: 'Person Updated' })
}
