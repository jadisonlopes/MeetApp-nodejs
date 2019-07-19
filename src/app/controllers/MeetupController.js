import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  parseISO,
  startOfHour,
  startOfDay,
  endOfDay,
  isBefore,
} from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    if (!req.query.date) {
      return res.status(400).json({ error: 'Required date.' });
    }

    const page = req.query.page || 1;
    const searchDate = parseISO(req.query.date);

    const meetup = await Meetup.findAll({
      where: {
        date: {
          [Op.gte]: startOfDay(searchDate),
        },
        [Op.and]: {
          date: {
            [Op.lte]: endOfDay(searchDate),
          },
        },
      },
      attributes: ['title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          as: 'banner',
          attributes: ['path', 'url'],
        },
        {
          model: User,
          as: 'organizer',
          attributes: ['name', 'email'],
        },
      ],
      limit: 10,
      offset: 10 * page - 10,
    });

    return res.json(meetup);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      location: Yup.string().required(),
      date: Yup.date().required(),
      file_id: Yup.number().required(),
      user_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const { title, description, location, date, file_id, user_id } = req.body;

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past dates are not permitted.' });
    }

    const meetup = await Meetup.create({
      title,
      description,
      location,
      date: hourStart,
      file_id,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      date: Yup.date(),
      file_id: Yup.number(),
      user_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails.' });
    }

    const meetup = await Meetup.findByPk(req.params.id);

    if (!meetup) {
      return res.status(401).json({ error: 'Meetup already exists' });
    }

    const { date, user_id } = meetup;

    if (user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to update this weetup.",
      });
    }

    if (isBefore(date, new Date())) {
      return res.status(401).json({ error: 'Past dates are not permitted.' });
    }

    await meetup.update(req.body);

    return res.json({ meetup });
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.meetupId);

    if (!meetup) {
      return res.status(400).json({ error: 'Register not found.' });
    }

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({ error: 'Not authorized.' });
    }

    if (meetup.past) {
      return res.status(401).json({ error: "Can't delete past meetups." });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
