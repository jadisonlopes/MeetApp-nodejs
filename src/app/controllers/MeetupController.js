import Meetup from '../models/Meetup';

class MeetupController {
  async store(req, res) {
    const meetup = await Meetup.create(req.body);

    return res.json(meetup);
  }
}

export default new MeetupController();
