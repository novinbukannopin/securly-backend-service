import Joi from 'joi';

const create = {
  body: Joi.object().keys({
    originalUrl: Joi.string().uri().required(),
    shortCode: Joi.string().optional(),
    comments: Joi.string().optional(),
    expiration: Joi.object()
      .keys({
        datetime: Joi.date().optional(),
        url: Joi.string().uri().optional()
      })
      .optional(),
    type: Joi.string(),
    qrcode: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    utm: Joi.object()
      .optional()
      .keys({
        source: Joi.string().optional(),
        medium: Joi.string().optional(),
        campaign: Joi.string().optional(),
        term: Joi.string().optional(),
        content: Joi.string().optional(),
        expiresAt: Joi.date().optional()
      })
      .allow(null)
  })
};

const update = {
  body: Joi.object().keys({
    shortCode: Joi.string().optional(),
    expiresAt: Joi.date().optional(),
    isExpired: Joi.boolean().optional(),
    isHidden: Joi.boolean().optional(),
    utm: Joi.object()
      .optional()
      .keys({
        source: Joi.string().optional(),
        medium: Joi.string().optional(),
        campaign: Joi.string().optional(),
        term: Joi.string().optional(),
        content: Joi.string().optional()
      })
      .allow(null)
  })
};

const isHidden = {
  body: Joi.object().keys({
    isHidden: Joi.boolean().required()
  })
};

export default {
  create,
  isHidden,
  update
};
