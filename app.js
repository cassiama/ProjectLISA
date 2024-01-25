import express from 'express';
import { configRoutes } from './routes/index.js';

const app = express();

configRoutes(app);

app.listen(3000, () => {
    console.log('The server is now running on http://localhost:3000.');
});