const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * 创建邮件发送器
 * @returns {Object} - Nodemailer发送器
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT === '465', // 465端口使用SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' // 开发环境可设置为false以避免证书错误
    }
  });
}

/**
 * 发送邮件
 * @param {Object} mailOptions - 邮件选项
 * @returns {Promise<Object>} - 邮件发送结果
 */
async function sendEmail(mailOptions) {
  try {
    // 开发环境模拟邮件发送，避免因配置问题导致功能无法使用
    if (process.env.NODE_ENV === 'development') {
      console.log('开发环境 - 模拟邮件发送成功:');
      console.log('收件人:', mailOptions.to);
      console.log('主题:', mailOptions.subject);
      console.log('内容:', mailOptions.html.substring(0, 100) + '...');
      return {
        messageId: `mock-${Date.now()}`,
        env: 'development',
        status: 'success'
      };
    }
    
    // 生产环境实际发送邮件
    const transporter = createTransporter();
    
    const options = {
      from: process.env.EMAIL_FROM,
      ...mailOptions
    };
    
    const info = await transporter.sendMail(options);
    console.log('邮件发送成功:', info.messageId);
    return info;
  } catch (error) {
    console.error('邮件发送失败:', error);
    
    // 提供更详细的错误信息
    if (error.code === 'ETIMEDOUT') {
      throw new Error('邮件服务器连接超时，请检查网络连接或邮件服务器配置');
    } else if (error.code === 'EAUTH') {
      throw new Error('邮件认证失败，请检查邮件账户和密码配置');
    } else if (error.code === 'EENVELOPE') {
      throw new Error('邮件地址无效，请检查收件人邮箱格式');
    } else {
      throw new Error('邮件发送失败');
    }
  }
}

/**
 * 发送入会申请确认邮件
 * @param {string} toEmail - 收件人邮箱
 * @param {string} applicantName - 申请人姓名
 * @returns {Promise<Object>} - 邮件发送结果
 */
async function sendApplicationConfirmation(toEmail, applicantName) {
  const mailOptions = {
    to: toEmail,
    subject: '广西自动化学会 - 入会申请已收到',
    html: `
      <h2>尊敬的${applicantName}：</h2>
      <p>感谢您申请加入广西自动化学会。我们已经收到您的申请，并将尽快进行审核。</p>
      <p>审核结果将通过邮件通知您，请保持邮箱畅通。如有疑问，请联系学会秘书处。</p>
      <p>广西自动化学会</p>
    `
  };
  
  return sendEmail(mailOptions);
}

/**
 * 发送入会申请审核结果邮件
 * @param {string} toEmail - 收件人邮箱
 * @param {string} applicantName - 申请人姓名
 * @param {boolean} isApproved - 是否通过审核
 * @param {string} reviewNotes - 审核意见
 * @returns {Promise<Object>} - 邮件发送结果
 */
async function sendApplicationResult(toEmail, applicantName, isApproved, reviewNotes = '') {
  const subject = isApproved 
    ? '广西自动化学会 - 入会申请已通过' 
    : '广西自动化学会 - 入会申请未通过';
  
  const html = `
    <h2>尊敬的${applicantName}：</h2>
    <p>您的广西自动化学会入会申请已完成审核，结果如下：</p>
    <p><strong>${isApproved ? '恭喜！您的申请已通过审核。' : '很遗憾，您的申请未通过审核。'}</strong></p>
    ${reviewNotes ? `<p>审核意见：${reviewNotes}</p>` : ''}
    ${isApproved ? 
      '<p>接下来，请按照邮件附件的指引完成会员注册和会费缴纳手续。如有疑问，请联系学会秘书处。</p>' : 
      '<p>感谢您对广西自动化学会的关注，希望未来有机会再次收到您的申请。</p>'}
    <p>广西自动化学会</p>
  `;
  
  const mailOptions = {
    to: toEmail,
    subject,
    html
  };
  
  return sendEmail(mailOptions);
}

/**
 * 发送会费缴纳提醒邮件
 * @param {string} toEmail - 收件人邮箱
 * @param {string} memberName - 会员姓名
 * @param {Date} dueDate - 截止日期
 * @returns {Promise<Object>} - 邮件发送结果
 */
async function sendFeeReminder(toEmail, memberName, dueDate) {
  const mailOptions = {
    to: toEmail,
    subject: '广西自动化学会 - 会费缴纳提醒',
    html: `
      <h2>尊敬的${memberName}：</h2>
      <p>您的会员资格将于${dueDate.toLocaleDateString()}到期，请及时缴纳会费以保持会员资格的有效性。</p>
      <p>感谢您对广西自动化学会的支持！</p>
      <p>广西自动化学会</p>
    `
  };
  
  return sendEmail(mailOptions);
}

/**
 * 发送通用消息邮件给会员
 * @param {string} toEmail - 收件人邮箱
 * @param {string} memberName - 会员姓名
 * @param {string} subject - 邮件主题
 * @param {string} content - 邮件内容
 * @returns {Promise<Object>} - 邮件发送结果
 */
async function sendMessageToMember(toEmail, memberName, subject, content) {
  const mailOptions = {
    to: toEmail,
    subject: `广西自动化学会 - ${subject}`,
    html: `
      <h2>尊敬的${memberName}：</h2>
      <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50;">
        ${content}
      </div>
      <p>此邮件为系统自动发送，请不要直接回复。</p>
      <p>广西自动化学会</p>
    `
  };
  
  return sendEmail(mailOptions);
}

module.exports = {
  sendEmail,
  sendApplicationConfirmation,
  sendApplicationResult,
  sendFeeReminder,
  sendMessageToMember
};