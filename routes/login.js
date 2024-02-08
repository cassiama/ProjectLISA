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
                message: errors[0]
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
                message: errors[0]
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
                message: errors[0]
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

export default loginRouter;