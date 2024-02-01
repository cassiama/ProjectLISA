import routes from './routesAPI.js';
import rewardsRouter from './rewards.js';
import devicesRouter from './devices.js';
import loginRouter from './login.js';

export const configRoutes = app => {
    app.use('/', routes);
    app.use('/login', loginRouter);
    app.use('/rewards', rewardsRouter);
    app.use('/devices', devicesRouter);
    app.use('*', (req, res) => {
        res.status(404).send({error: 'Page not found.'});
    });
};