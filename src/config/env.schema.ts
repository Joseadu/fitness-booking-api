import * as Joi from 'joi';

export const envSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  SUPABASE_JWT_SECRET: Joi.string().required(),
  SUPABASE_URL: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  FRONTEND_URL: Joi.string().required(),
  RESEND_API_KEY: Joi.string().optional(), // Optional to avoid errors in other envs not using email
});
