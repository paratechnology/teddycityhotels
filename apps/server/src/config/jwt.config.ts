import dotenv from 'dotenv';
dotenv.config({ path: './.env.production' });

export const JWT_SECRET = process.env['JWT_SECRET'];

export const TOKEN_EXPIRY = process.env['COOKIE_EXP']; // 70 days in milliseconds
