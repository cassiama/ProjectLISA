import { Router } from "express";
const routes = Router();

/**
 * potential routes:
 * / (landing page)
 * /register (self-explanatory)
 * /logout (self-explanatory)
 * /dashboard (for dashboard)
 * /account (for profile page)
 * /leaderboard (self-explanatory)
 * /help (self-explanatory)
 * /goals (for sustainability goals)
 */

routes.get('/', (req, res) => {
    res.json({message: "Hello World!"});
});

export default routes;