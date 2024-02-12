import { Router } from "express";
import xss from "xss";
import {
    checkEmail,
    checkId,
    checkName,
    checkPassword
} from "../utils/helpers.js";
import {
    registerUser,
    updateUser,
    checkUser
} from "../data/users.js";
import {
    serialNumAlreadyExists,
    registerDevice,
    getDevice,
    removeDevice
} from "../data/devices.js";
const routes = Router();

routes.get('/', (req, res) => {
    res.json({message: "Hello World!"});
});

routes
    .route('/register')
    .get(async (req, res) => {
        console.log(req.session.user);
        if (req.session.user) res.redirect('/account');
        else res.render('register');
    })
    .post(async (req, res) => {
        // console.log(req.body);
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

        let validFirstName;
        try {
            validFirstName = checkName(firstName, "First Name");
        } catch (e) {
            errors.push(e);
        }

        let validLastName;
        try {
            validLastName = checkName(lastName, "Last Name");
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
            user = await registerUser(
                xss(validFirstName),
                xss(validLastName),
                xss(validEmail),
                xss(validPassword)
            );
        } catch (e) {
            errors.push(e);
        }

        if (errors.length > 0) {
            console.log(errors);
            res.status(400).render('login', {
                error: true,
                message: errors
            });
            return;
        }

        if (user) {
            req.session.user = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            };
            res.redirect('/account');
        } else {
            errors.push('Internal Server Error');
            console.log(errors);
            res.status(500).render('register', {
                error: true,
                message: errors[0]
            });
            return;
        }
    });

routes
    .route('/login')
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

routes.get('/logout', async (req, res) => {
    req.session.destroy();
    res.render('logout');
});

routes
    .route('/account')
    .get(async (req, res) => {
        if (!req.session.user) res.redirect('/login');
        else res.render('profile', {
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            email: req.session.user.email,
            devices: req.session.user.devices
        });
    })
    .patch(async (req, res) => {
        let errors = [];
        let id = req.body.id;
        let email = req.body.email;
        let firstName = req.body.firstName;
        let lastName = req.body.lastName;
        let password = req.body.password;

        if (typeof id === 'undefined')
            errors.push('No user ID provided.');
        else if (typeof email === 'undefined')
            errors.push('No email provided.');
        else if (typeof firstName === 'undefined')
            errors.push('No first name provided.');
        else if (typeof lastName === 'undefined')
            errors.push('No last name provided.');
        else if (typeof password === 'undefined')
            errors.push('No password provided.');

        if (errors.length > 0) {
            res.status(400).render('profile', {
                error: true,
                message: errors[0]
            });
            return;
        }

        let validId;
        try {
            validId = checkId(req.body.id);
        } catch (e) {
            errors.push(e);
        }

        let validEmail;
        try {
            validEmail = checkEmail(email);
        } catch (e) {
            errors.push(e);
        }

        let validFirstName;
        try {
            validFirstName = checkName(firstName, "First Name");
        } catch (e) {
            errors.push(e);
        }

        let validLastName;
        try {
            validLastName = checkName(lastName, "Last Name");
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
            res.status(400).render('profile', {
                error: true,
                message: errors[0]
            });
            return;
        }

        let updatedUser;
        try {
            updatedUser = await updateUser(
                xss(validId),
                xss(validFirstName),
                xss(validLastName),
                xss(validEmail),
                xss(validPassword)
            );
        } catch (e) {
            errors.push(e);
            res.status(400).render('profile', {
                error: true,
                message: errors[0]
            });
            return;
        }

        req.session.user = {
            id: updatedUser.id,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.emailAddress
        };
        res.render('profile', {
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            email: req.session.user.email,
            devices: req.session.user.devices
        });
    });

routes
    .route('/forgetpassword')
    .get(async (req, res) => { res.render('forgetpassword'); })
    .post(async (req, res) => {
        // should send an email to req.body.emailAddress
        res.redirect('/newpassword');
    });

routes
    .route('/newpassword')
    .get(async (req, res) => { res.render('newpassword'); })
    .post(async (req, res) => {
        // console.log(req.body);
        let errors = [];
        let newPassword = req.body.newPassword;
        let newPasswordInput = req.body.newPasswordInput;

        if (typeof newPassword === 'undefined' || typeof newPasswordInput === 'undefined') {
            errors.push('New password must be provided.');
            console.log(errors);
            res.status(400).render('newpassword', {
                error: true,
                message: errors[0]
            });
            return;
        }

        if (newPassword !== newPasswordInput) {
            errors.push('Passwords do not match.');
            console.log(errors);
            res.status(400).render('newpassword', {
                error: true,
                message: errors[0]
            });
            return;
        }

        let validPassword;
        try {
            validPassword = checkPassword(newPassword);
        } catch (e) {
            errors.push(e);
        }

        if (errors.length > 0) {
            console.log(errors);
            res.status(400).render('newpassword', {
                error: true,
                message: errors[0]
            });
            return;
        }

        try {
            await updateUser(
                xss(req.session.user.id),
                xss(req.session.user.firstName),
                xss(req.session.user.lastName),
                xss(req.session.user.email),
                xss(validPassword)
            );
            res.redirect('/account'); // change this to dashboard
        } catch (e) {
            errors.push(e);
            res.status(400).render('newpassword', {
                error: true,
                message: errors[0]
            });
            return;
        }
    });

routes
    .route('/rewards')
    .get(async (req, res) => {});

routes
    .route('/rewards/redeem')
    .get(async (req, res) => {});

routes
    .route('/devices')
    .get(async (req, res) => { res.render('registerDevice');})
    .post(async (req, res) => {
        let errors = [];
        let serialNum = req.body.serialNumber;
        let devGoals = req.body.deviceGoals;
        if (typeof serialNum === 'undefined' || serialNum.trim().length === 0) {
           return res.status(400).render('registerDevice', {
            error: true,
            message: errors[0]
        });
        }
        try {
            await registerDevice(
                xss(req.session.user.id),
                xss(serialNum),
                xss(devGoals)
            );
            res.redirect('/account'); // change this to dashboard
        } catch (e) {
            errors.push(e);
            res.status(400).render('registerDevice', {
                error: true,
                message: errors[0]
            });
            return;
        }
    });

routes
    .route('/devices/:id')
    .get(async (req, res) => {});

routes //sustainability facts
    .route('/facts')
    .get(async (req, res) => {res.render('facts');});

routes //sustainable goals
    .route('/goals')
    .get(async (req, res) => {res.render('goals');});


export default routes;