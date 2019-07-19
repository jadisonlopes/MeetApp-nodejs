import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, user, organizer } = data;

    await Mail.sendMail({
      to: `${organizer.name} <${organizer.email}>`,
      subject: `Nova inscrição: ${meetup.title}`,
      template: 'subscription',
      context: {
        organizer: organizer.name,
        user: user.name,
        email: user.email,
        date: format(
          parseISO(meetup.date),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new SubscriptionMail();
