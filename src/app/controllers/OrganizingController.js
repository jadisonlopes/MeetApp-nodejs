import Meetup from '../models/Meetup';
import File from '../models/File';
import User from '../models/User';

class OrganizingController {
  async index(req, res) {
    const meetup = await Meetup.findAll({
      where: {
        user_id: req.userId,
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
    });

    return res.json(meetup);
  }
}

export default new OrganizingController();
