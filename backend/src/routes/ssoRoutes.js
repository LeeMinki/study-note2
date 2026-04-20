'use strict';

const express = require('express');
const { ssoRedirectHandler, ssoLinkStartHandler, ssoCallbackHandler } = require('../controllers/ssoController');
const { requireAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:provider', ssoRedirectHandler);
router.post('/:provider/link-start', requireAuth, ssoLinkStartHandler);
router.get('/:provider/callback', ssoCallbackHandler);

module.exports = router;
