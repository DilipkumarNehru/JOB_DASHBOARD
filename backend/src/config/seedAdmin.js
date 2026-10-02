import User from '../models/User.js';
import { encryptSecret } from '../utils/encryptionUtil.js';

export const ensureAdminAccount = async () => {
  try {
    // 1. Promote existing user dilipkumarnehru75@gmail.com to admin
    const primaryUser = await User.findOne({ email: 'dilipkumarnehru75@gmail.com' });
    if (primaryUser && primaryUser.role !== 'admin') {
      primaryUser.role = 'admin';
      primaryUser.status = 'active';
      await primaryUser.save({ validateBeforeSave: false });
      console.log(`[Admin] Promoted primary user ${primaryUser.email} to Administrator`);
    }

    // 2. Ensure dedicated default admin account exists
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@jobdashboard.com';
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@12345';

    const existingAdmin = await User.findOne({ email: adminEmail.toLowerCase() }).select('+encryptedPassword');
    if (!existingAdmin) {
      const admin = await User.create({
        name: 'System Administrator',
        email: adminEmail.toLowerCase(),
        password: adminPass,
        encryptedPassword: encryptSecret(adminPass),
        role: 'admin',
        status: 'active',
        title: 'Platform Administrator',
        location: 'Global',
      });
      console.log(`[Admin] Created default administrator account: ${admin.email}`);
    } else {
      let changed = false;
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.status = 'active';
        changed = true;
      }
      if (!existingAdmin.encryptedPassword) {
        existingAdmin.encryptedPassword = encryptSecret(adminPass);
        changed = true;
      }
      if (changed) {
        await existingAdmin.save({ validateBeforeSave: false });
        console.log(`[Admin] Synchronized administrator account: ${existingAdmin.email}`);
      }
    }
  } catch (err) {
    console.warn('[Admin] Could not ensure admin account:', err.message);
  }
};
