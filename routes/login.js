import { Router } from "express";
import xss from "xss";
import {
    checkEmail,
    checkPassword
} from "../utils/helpers.js";
import {
    checkUser,
    updateUser
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
        // console.log(req.body);
        let errors = [];
        let email = req.body.email;
        let password = req.body.password;

        if (typeof email === 'undefined')
            errors.push('No email provided.');
        else if (typeof password === 'undefined')
            errors.push('No password provided.');

        if (errors.length > 0) {
            console.log(errors);
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
            console.log(errors);
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }

        let user;
        try {
            user = await checkUser(xss(validEmail), xss(validPassword));
        } catch (e) {
            errors.push(e);
            console.log(errors);
            res.status(400).render('login', {
                error: true,
                errors: errors
            });
            return;
        }

        req.session.user = {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.emailAddress,
            devices: user.devices
        };
        res.redirect('/account');
    });

loginRouter
    .route('/forgot')
    .get(async (req, res) => { res.render('forgotPassword'); })
    .post(async (req, res) => {
        // should send an email to req.body.emailAddress
    });

loginRouter
    .route('/new')
    .get(async (req, res) => { res.render('newPassword'); })
    .post(async (req, res) => {
        // console.log(req.body);
        let errors = [];
        let password1 = req.body.password1;
        let password2 = req.body.password2;

        if (typeof password1 === 'undefined' || typeof password2 === 'undefined') {
            errors.push('New password must be provided.');
            console.log(errors);
            res.status(400).render('newPassword', {
                error: true,
                errors: errors
            });
            return;
        }

        if (password1 !== password2) {
            errors.push('Passwords do not match.');
            console.log(errors);
            res.status(400).render('newPassword', {
                error: true,
                errors: errors
            });
            return;
        }

        let validPassword;
        try {
            validPassword = checkPassword(password1);
        } catch (e) {
            errors.push(e);
        }

        if (errors.length > 0) {
            console.log(errors);
            res.status(400).render('newPassword', {
                error: true,
                errors: errors
            });
            return;
        }

        let updatedUser;
        try {
            updatedUser = await updateUser(
                xss(req.session.user.id),
                xss(req.session.user.firstName),
                xss(req.session.user.lastName),
                xss(req.session.user.email),
                xss(validPassword)
            );
            res.redirect('/account');
        } catch (e) {
            errors.push(e);
            res.status(400).render('newPassword', {
                error: true,
                errors: errors
            });
            return;
        }
    });

export default loginRouter;