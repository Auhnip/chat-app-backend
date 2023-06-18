import Joi from 'joi';

export const groupIdSchema = Joi.number().integer().greater(0);

export const groupNameSchema = Joi.string().max(255).min(2);

export const groupDescriptionSchema = Joi.string().max(255);
