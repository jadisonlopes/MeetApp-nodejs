import * as Yup from 'yup';
import { parseISO, startOfHour, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class MeetupController {
  async index(req, res) {
    const meetup = await Meetup.findAll({
      where: {
        user_id: req.userId,
      },
      attributes: ['title', 'description', 'location', 'date'],
      include: [
        {
          model: File,
          as: 'file',
          attributes: ['path', 'url'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
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
}

export default new MeetupController();
