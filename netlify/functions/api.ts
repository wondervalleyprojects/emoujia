// Production API: the shared router (server/api.ts) behind serverless-http.
// netlify.toml rewrites /api/* here and caps requests per visitor.
import express from 'express';
import serverless from 'serverless-http';
import * as dotenv from 'dotenv';
import { apiRouter } from '../../server/api';

dotenv.config();

const app = express();
app.disable('x-powered-by');
const router = apiRouter();
// Mounted under each prefix a request can arrive with.
app.use('/api', router);
app.use('/.netlify/functions/api', router);
// The stub host page (deploy previews only) reaches the function by a rewrite,
// and Netlify hands the function the address the browser asked for.
app.use('/stub/lab/emoujia/api', router);
app.use('/', router);

export const handler = serverless(app);
