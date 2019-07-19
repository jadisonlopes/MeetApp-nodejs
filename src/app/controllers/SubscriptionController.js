import { Op } from 'sequelize';
import * as Yup from 'yup';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import SubscriptionMail from '../jobs/SubscriptionMail';
import User from '../models/User';
import Queue from '../../lib/Queue';

class SubscriptionController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: [],
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          attributes: ['title', 'description', 'location', 'date'],
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      meetup_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { meetup_id } = req.body;

    const checkIsOrganizer = await Meetup.findOne({
      where: {
        id: meetup_id,
        user_id: req.userId,
      },
    });

    if (checkIsOrganizer) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to you own meetups." });
    }

    const meetup = await Meetup.findByPk(meetup_id);

    if (meetup.past) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to past meetups." });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(401)
        .json({ error: "Can't subscribe to two meetups at the same time." });
    }

    const subscription = await Subscription.create({
      meetup_id,
      user_id: req.userId,
    });

    const user = await User.findByPk(req.userId);
    const organizer = await User.findByPk(meetup.user_id);

    await Queue.add(SubscriptionMail.key, { meetup, user, organizer });

    return res.json(subscription);
  }
}
export default new SubscriptionController();
