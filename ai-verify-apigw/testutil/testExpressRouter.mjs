import express from 'express';

export const setupServerWithRouter = (urlpath, router) => {
	const app = express()
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(urlpath, router);
	return app;
}