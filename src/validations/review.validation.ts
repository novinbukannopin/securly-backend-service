import Joi from 'joi';
import { ReviewAction } from '@prisma/client';

const reviewValidation = {
  body: Joi.object().keys({
    originalUrl: Joi.string().uri().required(),
    type: Joi.string()
      .valid('BENIGN', 'MALICIOUS', 'DEFACEMENT', 'MALWARE', 'PHISHING', 'BLOCKED')
      .required(),
    reviewerId: Joi.number().integer().required(),
    action: Joi.string()
      .valid(...Object.values(ReviewAction))
      .required(),
    reason: Joi.string().optional().allow(null),
    evidence: Joi.string().optional().allow(null)
  })
};

export default reviewValidation;
