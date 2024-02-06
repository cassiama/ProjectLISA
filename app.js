import express from 'express';
import { configRoutes } from './routes/index.js';
import { engine } from 'express-handlebars';
const staticDir = express.static(__dirname + '/public')

const app = express();

app.use('/public', staticDir);
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.engine('handlebars', engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

configRoutes(app);

app.listen(3000, () => {
    console.log('The server is now running on http://localhost:3000.');
});