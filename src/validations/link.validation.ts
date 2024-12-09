import Joi from 'joi';
import { TYPE } from '../types/type';

const create = {
  body: Joi.object().keys({
    originalUrl: Joi.string().uri().required(),
    shortCode: Joi.string().optional(),
    expiresAt: Joi.date().optional(),
    isExpired: Joi.boolean().optional(),
    type: Joi.string()
      .valid(...Object.values(TYPE))
      .optional(),
    score: Joi.number().optional(),
    isHidden: Joi.boolean().optional(),
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
