const Setting = require('../../models/admin/Setting');
const { success, error } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const axios = require('axios');

const buildSystemPrompt = async () => {
  const keys = [
    'app_name', 'support_email', 'support_phone',
    'landing_hero_title', 'landing_hero_subtitle',
    'landing_features', 'landing_downloads', 'landing_testimonials',
    'landing_stats_schools', 'landing_stats_students', 'landing_stats_staff',
    'chat_bot_name',
  ];

  const settings = await Setting.find({ key: { $in: keys } });
  const config = {};
  settings.forEach((s) => {
    if (['landing_features', 'landing_downloads', 'landing_testimonials'].includes(s.key)) {
      try {
        config[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
      } catch {
        config[s.key] = s.value;
      }
    } else {
      config[s.key] = s.value;
    }
  });

  const appName = config.app_name || 'EduPrime';
  const botName = config.chat_bot_name || `${appName} Assistant`;
  const features = (config.landing_features || []).filter(f => f.isActive !== false);
  const downloads = (config.landing_downloads || []).filter(d => d.isActive !== false);
  const testimonials = config.landing_testimonials || [];
  const stats = {
    schools: config.landing_stats_schools || 0,
    students: config.landing_stats_students || 0,
    staff: config.landing_stats_staff || 0,
  };

  const featuresList = features.map(f => `- ${f.icon} ${f.title}: ${f.description}`).join('\n');
  const downloadsList = downloads.map(d => `- ${d.name} v${d.version} (${d.platform}): ${d.size}`).join('\n');
  const testimonialsList = testimonials.map(t => `"${t.quote}" — ${t.name}, ${t.school}`).join('\n');

  return `You are ${botName}, the official AI assistant for ${appName} School Management System.

About ${appName}:
${config.landing_hero_title || 'Complete School Management Solution'}
${config.landing_hero_subtitle || ''}

📊 We serve ${stats.schools}+ schools, ${stats.students.toLocaleString()}+ students, and ${stats.staff.toLocaleString()}+ staff members.

✨ Our Features:
${featuresList || 'Student Management, Exams & Results, Finance & Fees, Attendance, Library, HR & Payroll, Inventory, Parent Portal, Communication, Homework'}

💻 Downloads Available:
${downloadsList || 'Windows Desktop App available on our website'}

🌟 What Schools Say:
${testimonialsList || 'Schools love EduPrime for its ease of use and comprehensive features.'}

📧 Support: ${config.support_email || 'support@eduprime.com'} | 📞 ${config.support_phone || 'N/A'}

Instructions: Be friendly, helpful, and concise. Answer questions about EduPrime's features, pricing, setup process, and how schools can get started. If asked about something not in your knowledge, suggest contacting support. Keep responses under 4 sentences unless listing features.`;
};

const sendMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return error(res, 'Message is required', 400);

  // Get chat config
  const keys = ['chat_enabled', 'chat_api_url', 'chat_api_key'];
  const settings = await Setting.find({ key: { $in: keys } });
  const config = {};
  settings.forEach((s) => { config[s.key] = s.value; });

  if (!config.chat_enabled) return error(res, 'Chat is currently disabled', 403);
  if (!config.chat_api_key) return error(res, 'Chat not configured', 500);

  const baseUrl = config.chat_api_url || 'https://hdmaiserver.pxxl.click';
  const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/v1/projects/general/public-chat`;

  const systemPrompt = await buildSystemPrompt();

  try {
    const response = await axios.post(
      apiUrl,
      { message, system_prompt: systemPrompt },
      {
        headers: {
          'Authorization': `Bearer ${config.chat_api_key}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const reply = response.data?.data?.reply || 'Sorry, I could not process that.';
    return success(res, { reply });
  } catch (err) {
    console.error('Chat API error:', err.response?.data || err.message);
    return error(res, 'Failed to get response. Please try again.', 500);
  }
});

module.exports = { sendMessage };