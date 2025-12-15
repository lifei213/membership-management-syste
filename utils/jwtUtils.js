// 先加载环境变量，确保JWT_SECRET可用
require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * 生成JWT令牌
 * @param {object} payload - 要包含在令牌中的数据
 * @returns {string} - 生成的JWT令牌
 */
function generateToken(payload) {
  try {
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    return token;
  } catch (error) {
    console.error('生成JWT令牌失败:', error);
    throw new Error('生成JWT令牌失败');
  }
}

/**
 * 验证JWT令牌
 * @param {string} token - 要验证的JWT令牌
 * @returns {object} - 令牌中包含的数据
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('验证JWT令牌失败:', error);
    throw new Error('无效的令牌');
  }
}

module.exports = {
  generateToken,
  verifyToken
};