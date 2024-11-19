import Joi from 'joi';

const createLink = {
  body: Joi.object().keys({
    link: Joi.object().keys({
      originalUrl: Joi.string().uri().required(),
      shortCode: Joi.string().optional(),
      expiresAt: Joi.date().optional(),
      isExpired: Joi.boolean().optional(),
      type: Joi.string().optional(),
      score: Joi.number().optional(),
      isHidden: Joi.boolean().optional()
    }),
    utm: Joi.object().keys({
      source: Joi.string().optional(),
      medium: Joi.string().optional(),
      campaign: Joi.string().optional(),
      term: Joi.string().optional(),
      content: Joi.string().optional(),
      expiresAt: Joi.date().optional()
    })
  })
};

export default {
  createLink
};
