const Setting = require('../../models/admin/Setting');
const { error } = require('../../utils/apiResponse');

const maintenanceCheck = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'maintenance_mode' });
    if (setting && setting.value === true) {
      return error(res, 'System is under maintenance. Please try again later.', 503);
    }
    next();
  } catch (err) {
    // If settings not available, allow through
    next();
  }
};

module.exports = maintenanceCheck;