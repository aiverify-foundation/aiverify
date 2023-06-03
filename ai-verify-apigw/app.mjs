import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';

import "dotenv/config.js";

import uploadRouter from './routes/upload.mjs';

import { createApolloServer } from './graphql/server.mjs';

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));

const httpServer = http.createServer(app);

// connect the db
import mongodb from './lib/mongodb.mjs';

const server = createApolloServer(httpServer);
await server.start();

app.use(
  '/graphql',
  // cors(),
  bodyParser.json(),
  expressMiddleware(server),
);
app.use(
  "/upload", 
  cors(),
  bodyParser.json(), 
  uploadRouter
);

// app.post("/testing", (req, res) => {
//   console.log('Request body received at /testing is: ', req.body)
// })

/* setup the routes */
import reportRouter from './routes/report.mjs';
app.use("/report", reportRouter);
import templateRouter from './routes/template.mjs';
app.use("/template", templateRouter);
import  logsRouter from './routes/logs.mjs';
app.use("/logs", logsRouter);

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
console.log(`🚀 Server ready at http://localhost:4000`);