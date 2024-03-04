import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import { rateLimit } from 'express-rate-limit'

import "dotenv/config.js";

import uploadRouter from './routes/upload.mjs';

import { createApolloServer } from './graphql/server.mjs';

const allowedOrigins = process.env.ALLOWED_ORIGINS !== undefined ?
  process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000','http://localhost:4000'];
const app = express();

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('The origin of the request is not permitted by the server\'s CORS policy.'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));

// create rate limiter
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)

const httpServer = http.createServer(app);

// connect the db
import mongodb from './lib/mongodb.mjs';

const server = createApolloServer(httpServer);
await server.start();

app.use(
  '/graphql',
  bodyParser.json(),
  expressMiddleware(server),
);
app.use(
  "/upload", 
  bodyParser.json(), 
  uploadRouter
);

/* setup the routes */
import reportRouter from './routes/report.mjs';
app.use("/report", reportRouter);
import templateRouter from './routes/template.mjs';
app.use("/template", templateRouter);
import  logsRouter from './routes/logs.mjs';
app.use("/logs", logsRouter);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000`);