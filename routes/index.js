export const configRoutes = app => {
    app.use('*', (req, res) => {
        res.status(404).send({error: 'Page not found.'});
    });
};