import { Router } from "express";
import {
    checkEmail,
    checkPassword
} from "../utils/helpers.js";
import {
    checkUser
} from "../data/users.js";
const loginRouter = Router();

/**
 * /login (self-explanatory)
 * /login/forgot (for forgot password)
 * /login/new (for new password)
 */

loginRouter
    .route('/')
    .get(async (req, res) => {
        if (req.session.user) res.redirect('/account');
        else res.render('login');
    })
    .post(async (req, res) => {
        let errors = [];
        let email = req.body.email;
        let password = req.body.password;

        if (typeof email === 'undefined')
            errors.push('No email provided.');
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
            validEmail = checkEmail(email);
        } catch (e) {
            errors.push(e);
        }

        let validPassword;
        try {
            validPassword = checkPassword(password);
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

        let user;
        try {
            user = await checkUser(validEmail, validPassword);
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

        if (user) {
            req.session.user = {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.emailAddress
            };
            res.redirect('/account');
        } else {
            errors.push('An invalid email and/or password was provided.');
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }
    });

loginRouter
    .route('/forgot')
    .get(async (req, res) => {})
    .post(async (req, res) => {});

loginRouter
    .route('/new')
    .get(async (req, res) => {})
    .post(async (req, res) => {});

export default loginRouter;