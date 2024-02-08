import routes from './routesAPI.js';

export const configRoutes = app => {
    app.use('/', routes);
    app.use('*', (req, res) => {
        res.status(404).send({error: 'Page not found.'});
    });
};