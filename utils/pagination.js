const paginate = (query = {}, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

module.exports = paginate;