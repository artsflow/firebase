import { Client } from 'postmark'

import { POSTMARK_SERVER_TOKEN, ARTSFLOW_WEBSITE_URL } from './config'

const client = new Client(POSTMARK_SERVER_TOKEN)

interface AddActivityProps {
  id: string
  title: string
  name: string
  email: string
}

const FROM_EMAIL = 'hello@artsflow.com'

export const notifyAddActivity = ({ id, title, name, email }: AddActivityProps) => {
  sendEmail(email, 'add-activity', {
    name,
    activity_title: title,
    activity_url: `${ARTSFLOW_WEBSITE_URL}/a/${id}`,
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
  title: string
  name: string
  email: string
  activityDate: string
  creativeName: string
}

export const notifyUserNewBooking = ({
  title,
  name,
  email,
  activityDate,
  creativeName,
}: NewUserBookingProps) => {
  sendEmail(email, 'user-new-booking', {
    name,
    activity_title: title,
    activity_date: activityDate,
    creative_name: creativeName,
  })
}

export interface UserScheduledBookingProps {
  title: string
  name: string
  email: string
  activityDate: string
  creativeName: string
  startsIn: string
}

export const notifyUserScheduledBooking = ({
  title,
  name,
  email,
  activityDate,
  creativeName,
  startsIn,
}: UserScheduledBookingProps) => {
  sendEmail(email, 'user-scheduled-booking', {
    name,
    activity_title: title,
    activity_date: activityDate,
    creative_name: creativeName,
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
