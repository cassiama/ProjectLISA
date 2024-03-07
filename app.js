import express from 'express';
import { configRoutes } from './routes/index.js';
import { engine } from 'express-handlebars';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticDir = express.static(__dirname + '/public');

const app = express();

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
        math: function(l, op="+", r) {
            return parseFloat(l) + parseFloat(r);
        }
    }
}));
app.set('view engine', 'handlebars');

app.use(session({
    name: 'AuthCookie',
    secret: 'projectlisa',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 } // maxAge = 30 min
}));

app.use('*', (req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
    console.log();
});

app.use('*', (req, res, next) => {
    if (req.originalUrl !== '/login' && req.originalUrl !== '/register' && req.originalUrl !== '/forgetpassword') {
        if (!req.session.user) {
            return res.status(403).json({error: "User must be logged in to access this page."});
        }
        next();
    } else {
        next();
    }
});

configRoutes(app);

app.listen(3000, () => {
    console.log('The server is now running on http://localhost:3000/login.');
});