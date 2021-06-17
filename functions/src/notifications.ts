import { Client } from 'postmark'

import { POSTMARK_SERVER_TOKEN, ARTSFLOW_WEBSITE_URL } from './config'
import { getImageKitUrl } from './utils'

const client = new Client(POSTMARK_SERVER_TOKEN)

interface AddActivityProps {
  id: string
  title: string
  name: string
  email: string
  image: string
}

const FROM_EMAIL = 'Artsflow<hello@artsflow.com>'

export const notifyAddActivity = ({ id, title, name, email, image }: AddActivityProps) => {
  sendEmail(email, 'add-activity', {
    name,
    activity_title: title,
    activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
    activity_image: getImageKitUrl(image, { w: 640, h: 360 }),
  })
}

export const notifyNewCreativeSignup = ({ name, email }: { name: string; email: string }) => {
  sendEmail(email, 'new-creative', { name })
}

export const notifyCreativeVerified = ({ name, email }: { name: string; email: string }) => {
  sendEmail(email, 'verified-creative', { name })
}

interface NewCreativeBookingProps {
  title: string
  name: string
  email: string
  activityDate: string
  userName: string
  userEmail: string
}

export const notifyCreativeNewBooking = ({
  title,
  name,
  email,
  activityDate,
  userName,
  userEmail,
}: NewCreativeBookingProps) => {
  sendEmail(email, 'creative-new-booking', {
    name,
    activity_title: title,
    activity_date: activityDate,
    user_name: userName,
    user_email: userEmail,
  })
}

interface NewUserBookingProps {
  id: string
  title: string
  name: string
  email: string
  activityDate: string
  creativeName: string
  image: string
  price: string
  presenceUrl: string
}

export const notifyUserNewBooking = ({
  id,
  title,
  name,
  email,
  activityDate,
  creativeName,
  image,
  price,
  presenceUrl,
}: NewUserBookingProps) => {
  sendEmail(email, 'user-new-booking', {
    name,
    activity_title: title,
    activity_date: activityDate,
    creative_name: creativeName,
    activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
    activity_image: getImageKitUrl(image, { w: 640, h: 360 }),
    activity_price: price,
    activity_presenceUrl: presenceUrl,
  })
}

export interface UserScheduledBookingProps extends NewUserBookingProps {
  startsIn: string
}

export const notifyUserScheduledBooking = ({
  id,
  title,
  name,
  email,
  activityDate,
  creativeName,
  image,
  price,
  presenceUrl,
  startsIn,
}: UserScheduledBookingProps) => {
  const alias = startsIn === '1 hour' ? 'user-scheduled-booking-1h' : 'user-scheduled-booking-1d'

  sendEmail(email, alias, {
    name,
    activity_title: title,
    activity_date: activityDate,
    creative_name: creativeName,
    activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
    activity_image: getImageKitUrl(image, { w: 640, h: 360 }),
    activity_price: price,
    activity_presenceUrl: presenceUrl,
    starts_in: startsIn,
  })
}

const sendEmail = (to: string, templateAlias: string, templateModel: any) => {
  client.sendEmailWithTemplate({
    From: FROM_EMAIL,
    To: to,
    TemplateAlias: templateAlias,
    TemplateModel: templateModel,
  })
}
