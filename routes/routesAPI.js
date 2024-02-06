import { Router } from "express";
import * as helpers from "../utils/helpers";
import * as users from "../data/users";
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

routes
    .route('/register')
    .get(async (req, res) => {
        if (req.session.user) res.redirect('/account');
        else res.render('register');
    })
    .post(async (req, res) => {
        let errors = [];
        let email = req.body.email;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let password = req.body.password;

        if (typeof email === 'undefined')
            errors.push('No email provided.');
        else if (typeof firstName === 'undefined')
            errors.push('No first name provided.');
        else if (typeof lastName === 'undefined')
            errors.push('No last name provided.');
        else if (typeof password === 'undefined')
            errors.push('No password provided.');

        if (errors.length > 0) {
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }

        let validEmail;
        try {
            validEmail = helpers.checkValidEmail(email);
        } catch (e) {
            errors.push(e);
        }

        let validFirstName;
        try {
            validFirstName = helpers.checkValidString(firstName, "First Name");
        } catch (e) {
            errors.push(e);
        }

        let validLastName;
        try {
            validLastName = helpers.checkValidString(lastName, "Last Name");
        } catch (e) {
            errors.push(e);
        }

        let validPassword;
        try {
            validPassword = helpers.checkValidPassword(password);
        } catch (e) {
            errors.push(e);
        }

        if (errors.length > 0) {
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }

        let registerUserResult = undefined;
        try {
            registerUserResult = await users.registerUser(
                validFirstName,
                validLastName,
                validEmail,
                validPassword
            );
        } catch (e) {
            errors.push(e);
        }

        if (errors.length > 0) {
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }

        if (registerUserResult.insertedUser) {
            req.session.user = {
                firstName: validFirstName,
                lastName: validLastName,
                email: validEmail
            };
            res.redirect('/account');
        } else {
            errors.push('Internal Server Error');
            res.status(500).render('register', {
                error: true,
                errors: errors
            });
            return;
        }
    });

routes.get('/logout', async (req, res) => {
    req.session.destroy();
    res.render('logout');
});

routes
    .route('/account')
    .get(async (req, res) => {})
    .patch(async (req, res) => {});

export default routes;