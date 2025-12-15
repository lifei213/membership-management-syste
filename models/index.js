// 临时模型文件 - 用于兼容性
module.exports = {
  Member: {
    findOne: () => Promise.resolve(null),
    create: () => Promise.resolve({ member_id: 1 }),
    findAndCountAll: () => Promise.resolve({ count: 0, rows: [] })
  },
  User: {
    findOne: () => Promise.resolve(null)
  },
  Message: {
    findOne: () => Promise.resolve(null)
  }
};