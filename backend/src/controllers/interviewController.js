import Interview from '../models/Interview.js';
import Application from '../models/Application.js';
import Notification from '../models/Notification.js';

export const getInterviews = async (req, res, next) => {
  try {
    const filter = { userId: req.user.id };
    if (req.query.upcoming === 'true') filter.scheduledDate = { $gte: new Date() };
    const interviews = await Interview.find(filter)
      .populate('applicationId', 'company role status')
      .sort({ scheduledDate: 1 });
    res.json({ success: true, count: interviews.length, interviews });
  } catch (err) { next(err); }
};

export const createInterview = async (req, res, next) => {
  try {
    const interview = await Interview.create({ ...req.body, userId: req.user.id });
    const app = await Application.findOne({ _id: req.body.applicationId, userId: req.user.id });
    if (app) {
      if (!app.interviews.includes(interview._id)) app.interviews.push(interview._id);
      app.status = 'Interview Scheduled';
      app.timeline.push({ status: 'Interview Scheduled', date: new Date(), note: `Interview: ${interview.round}` });
      await app.save();
    }
    await Notification.create({
      userId: req.user.id,
      type: 'INTERVIEW_UPCOMING',
      title: 'Interview scheduled',
      message: `${interview.round} on ${interview.scheduledDate.toDateString()}`,
      link: `/interviews`,
      metadata: { interviewId: interview._id }
    });
    res.status(201).json({ success: true, interview });
  } catch (err) { next(err); }
};

export const updateInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body },
      { new: true }
    );
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, interview });
  } catch (err) { next(err); }
};

export const deleteInterview = async (req, res, next) => {
  try {
    await Interview.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) { next(err); }
};