import FollowUp from '../models/FollowUp.js';

export const getFollowUps = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { userId: req.user.id };
    if (status) filter.status = status;
    const followUps = await FollowUp.find(filter).sort({ dueDate: 1 });
    res.json({ success: true, count: followUps.length, followUps });
  } catch (err) { next(err); }
};

export const createFollowUp = async (req, res, next) => {
  try {
    const fu = await FollowUp.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, followUp: fu });
  } catch (err) { next(err); }
};

export const updateFollowUp = async (req, res, next) => {
  try {
    const fu = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, req.body, { new: true }
    );
    if (!fu) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, followUp: fu });
  } catch (err) { next(err); }
};
