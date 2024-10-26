import Joi from 'joi';

const createLinkSchema = Joi.object({
  originalUrl: Joi.string().uri().required(),
  utmSource: Joi.string().optional(),
  utmMedium: Joi.string().optional(),
  utmCampaign: Joi.string().optional(),
  utmTerm: Joi.string().optional(),
  utmContent: Joi.string().optional(),
  expiresAt: Joi.date().optional()
});

export default {
  createLinkSchema
};
