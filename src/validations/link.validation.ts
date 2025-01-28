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
    expiresAt: Joi.string().optional().allow(null).empty(''),
    expiredRedirectUrl: Joi.string().uri().optional().allow(null).empty(''),
    qrcode: Joi.string().optional(),
    comments: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    isHidden: Joi.boolean().optional(),
    utm: Joi.object()
      .keys({
        source: Joi.string().optional().allow(''),
        medium: Joi.string().optional().allow(''),
        campaign: Joi.string().optional().allow(''),
        term: Joi.string().optional().allow(''),
        content: Joi.string().optional().allow('')
      })
      .optional()
      .allow('')
  })
};

const isHidden = {
  body: Joi.object().keys({
    isHidden: Joi.boolean().required()
  })
};

const archive = {
  body: Joi.object().keys({
    action: Joi.string().required().only().valid('archive', 'unarchive')
  })
};

export default {
  create,
  isHidden,
  update,
  archive
};
