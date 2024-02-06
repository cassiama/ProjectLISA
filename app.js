import express from 'express';
import { configRoutes } from './routes/index.js';
import { engine } from 'express-handlebars';
import session from 'express-session';
const staticDir = express.static(__dirname + '/public');

const app = express();

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.engine('handlebars', engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(session({
    name: 'AuthCookie',
    secret: 'projectlisa',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1800000 } // maxAge = 30 min
}));

configRoutes(app);

app.listen(3000, () => {
    console.log('The server is now running on http://localhost:3000.');
});