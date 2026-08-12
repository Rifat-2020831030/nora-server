const httpStatus = require('http-status');
const pick = require('../utils/pick');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/response');
const { postService } = require('../services');

const createPost = catchAsync(async (req, res) => {
  const post = await postService.createPost(req.user.id, req.body);
  sendSuccess(res, httpStatus.CREATED, post);
});

const getPosts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['search']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await postService.queryPosts(filter, options);

  const { results, ...meta } = result;
  res.status(httpStatus.OK).send({
    success: true,
    data: results,
    meta,
  });
});

const getPost = catchAsync(async (req, res) => {
  const post = await postService.getPostById(req.params.postId);
  sendSuccess(res, httpStatus.OK, post);
});

const updatePost = catchAsync(async (req, res) => {
  const post = await postService.updatePostById(req.params.postId, req.user.id, req.body);
  sendSuccess(res, httpStatus.OK, post);
});

const deletePost = catchAsync(async (req, res) => {
  await postService.deletePostById(req.params.postId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
};
