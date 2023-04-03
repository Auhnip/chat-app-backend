import Joi from 'joi';

export const userIdSchema = Joi.string().min(2).max(25);
export const passwordSchema = Joi.string().pattern(/^[a-zA-Z0-9]{6,25}$/);
export const emailSchema = Joi.string().pattern(
  /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]+$/
);

export const verificationCodeSchema = Joi.string().pattern(/^[A-Z0-9]{6}$/);
