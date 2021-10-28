import { NextFunction, Request } from "express";
const cors = require('cors');
import express from "express"

import sequelize from './models/postgres_index.js';
import { config } from  './config/config';
import indexRouter from './routes/index';
import galleryRouter from './routes/gallery';
import analyseRouter from './routes/analyse';
import searchRouter from './routes/search';
import displayRouter from './routes/display';
import uploadRouter from './routes/upload';

const port = config.port || 3001;

let app = express();
app.use(cors());

app.use((req, res, next) => {
    console.log("\n#####################");
    console.log("new request made");
    console.log(`host: ${req.hostname}`);
    console.log(`path: ${req.path}`);
    console.log(`method: ${req.method}`);
    console.log("#####################\n");

    next();
});

sequelize.authenticate()
    .then(() => {
        console.log("DB connection ON");
        sequelize.sync()
        .then(() => {
            console.log("Synchronized model with DB");
            app.listen(port, () => {
                console.log(`Server is up at: ${port}`)
            });         
        })
        .catch(console.log);
    })
    .catch((err: string) => {
        console.log(`Can't conenct to DB: ${err}`);
    })

app.use('/', indexRouter);
app.use('/gallery', galleryRouter);
app.use('/analyse', analyseRouter);
app.use('/search', searchRouter);
app.use('/display', displayRouter);
app.use('/upload', uploadRouter);

app.use((req, res) => {
    res.status(404).send(`Woops, no such page here`);
})