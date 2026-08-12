const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const noteRoute = require('./note.route');
const mediaRoute = require('./media.route');
const postRoute = require('./post.route');
const adminRoute = require('./admin.route');
const docsRoute = require('./docs.route');
const config = require('../../config/config');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/notes',
    route: noteRoute,
  },
  {
    path: '/media',
    route: mediaRoute,
  },
  {
    path: '/posts',
    route: postRoute,
  },
  {
    path: '/admin',
    route: adminRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
