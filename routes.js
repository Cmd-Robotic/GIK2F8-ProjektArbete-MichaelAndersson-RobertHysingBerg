//const { timeStamp } = require('console');
//const { json } = require('express');
//var cors = require('cors');
const routes = require('express').Router();
const database = require('./database');
const multer = require('multer');
const upload = multer({ dest: 'upload/' });
const file = require("fs").promises;
const fs = require('fs');
const dv = require('./dataValidation');
//routes.use(cors());
const bcrypt = require('bcrypt');
const dataValidation = require('./dataValidation');
const session = require('express-session');
const { doesNotReject } = require('assert');
const { send } = require('process');
const { EROFS } = require('constants');
const { updateQueryDupeCount, updateAnswer } = require('./database');
//const { PerformanceObserver } = require('perf_hooks');
const saltRounds = 10;

async function generatePass(password) {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};
async function comparePass(password, hash) {
    const match = await bcrypt.compare(password, hash);
    return match;
};

routes.use(session({
    secret: 'DeimosIsReal',
    saveUninitialized: false,
    resave: false
}));

//###############################################################
//############################ LOGIN ############################
routes.post('/login/', async (req, res) => {
    if (!req.body.emailUsername) {
        res.status(400).send('No email or username sent to server');
    }
    else {
        if (!req.body.password) {
            res.status(400).send('No password sent to server');
        }
        else {
            const email = await dv.validEmail(req.body.emailUsername);
            const username = await dv.validUsername(req.body.emailUsername);
            if (!email && !username) {
                res.status(400).send('Invalid username or email sent to server');
            }
            else {
                const password = await dv.validPassword(req.body.password);
                if (!password) {
                    res.status(400).send('Invalid password sent to server');
                }
                else {
                    if (email) {
                        console.log(`| Handling LOGIN-request for user email: ${email} |`);
                        logSave(`| LOGIN | EMAIL: ${email} |`);
                        const dbRes = await database.getUserByEmail(email);
                        if (dbRes.errorMessage) {
                            // error time
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(404).send(`Could not find a user with email ${email}`);
                        }
                        else {
                            // go further
                            const user = dbRes.user;
                            const pass = await comparePass(password, user.password);
                            // const pass = (password == user.password);
                            if (!pass) {
                                const errorMessage = 'Passwords do not match';
                                errorLog(400, errorMessage);
                                res.status(400).send(errorMessage);
                            }
                            else {
                                const dbRes = await database.getUser(user.id);
                                if (dbRes.user.accessLevel < 1) {
                                    res.status(400).send('ERROR! You have been hit by the MIGHTY BANHAMMER!');
                                }
                                else {
                                    req.session.userId = user.id;
                                    req.session.accessLevel = dbRes.user.accessLevel;
                                    req.session.username = dbRes.user.username;
                                    res.status(200).json(dbRes.user);
                                }
                            }
                        }
                    }
                    else if (username) {
                        // login by username here
                        console.log(`| Handling LOGIN-request for user: ${username} |`);
                        logSave(`| LOGIN | USERNAME: ${username} |`);
                        const dbRes = await database.getUserByUsername(username);
                        if (dbRes.errorMessage) {
                            // error time
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(404).send(`Could not find user with username ${username}`);
                        }
                        else {
                            // go further
                            const user = dbRes.user;
                            const pass = await comparePass(password, user.password);
                            // const pass = (password == user.password);
                            if (!pass) {
                                const errorMessage = 'Passwords do not match';
                                errorLog(400, errorMessage);
                                res.status(400).send(errorMessage);
                            }
                            else {
                                const dbRes = await database.getUser(user.id);
                                if (dbRes.user.accessLevel < 1) {
                                    res.status(400).send('ERROR! You have been hit by the MIGHTY BANHAMMER!');
                                }
                                else {
                                    req.session.userId = user.id;
                                    req.session.accessLevel = dbRes.user.accessLevel;
                                    req.session.username = dbRes.user.username;
                                    res.status(200).json(dbRes.user);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

//#############################################################
//########################## LOGOUT ###########################
routes.delete('/logout/', async (req, res) => {
    if (!req.session) {
        res.status(400).send('ERROR! You do not have a session');
    }
    else {
        if (!req.session.userId) {
            res.status(400).send('ERROR! You must login first to logoff');
        }
        else {
            console.log(`| User ${req.session.username} Logging off |`);
            logSave(`| LOGOFF | USERID: ${req.session.userId} |`);
            req.session.destroy();
            res.status(200).send('bye bye!');
        }
    }
});
//#############################################################
//############################ GET ############################

routes.get('/users/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (req.session.accessLevel < 3) {
            res.status(400).send('ERROR! You do not have permission to access this');
        }
        else {
            console.log('| Handling GET-request for all users |');
            logSave('| GET | all users |');
            const dbRes = await database.getUsers();
            if (dbRes.errorMessage) {
                errorLog(dbRes.status, dbRes.errorMessage);
                res.status(dbRes.status).send(dbRes.errorMessage);
            }
            else {
                res.status(dbRes.status).json(dbRes.users);
            }
        }
    }
});

routes.get('/queries/', async (req, res) => {
    console.log(`| Handling GET-request for all queries |`);
    logSave("| GET | all queries |");
    const dbRes = await database.getQueries();
    if (dbRes.errorMessage) {
        errorLog(dbRes.status, dbRes.errorMessage);
        res.status(dbRes.status).send(dbRes.errorMessage);
    }
    else {
        res.status(dbRes.status).json(dbRes.queries);
    }
});
routes.get('/queries/user/', async (req, res) => {
    if (!req.session.userId) {
        // bye bye, login first
        res.status(400).send('Please login first');
    }
    else {
        console.log(`| Handling GET-request for User queries | User ID: ${req.session.userId}`);
        logSave(`| GET | UserId: ${req.session.userId} | queries |`);
        const dbRes = await database.getQueriesByUserId(req.session.userId);
        if (dbRes.errorMessage) {
            errorLog(dbRes.status, dbRes.errorMessage);
            res.status(dbRes.status).send(dbRes.errorMessage);
        }
        else {
            res.status(dbRes.status).json(dbRes.queries);
        }
    }
});
routes.get('/frequentlyasked/:category', async (req, res) => {
    if (req.params.category == "All") {
        // get all
        console.log(`| Handling GET-request for frequently asked queries |`);
        logSave("| GET | frequently asked queries |");
        const dbRes = await database.getFrequentQueries();
        if (dbRes.errorMessage) {
            errorLog(dbRes.status, dbRes.errorMessage);
            res.status(dbRes.status).send(dbRes.errorMessage);
        }
        else {
            res.status(dbRes.status).json(dbRes.queries);
        }
    }
    else {
        // get specific category
        const category = await dataValidation.validName(req.params.category);
        if (!category) {
            // bye bye
            res.status(400).send('ERROR! Invalid category sent to server');
        }
        else {
            console.log(`| Handling GET-request for frequently asked queries BY CATEGORY |`);
            logSave("| GET | frequently asked queries | CATEGORY |");
            const dbRes = await database.getFrequentQueriesByCategory(category);
            if (dbRes.errorMessage) {
                errorLog(dbRes.status, dbRes.errorMessage);
                res.status(dbRes.status).send(dbRes.errorMessage);
            }
            else {
                res.status(dbRes.status).json(dbRes.queries);
            }
        }
    }
});
routes.get('/lastasked/:category', async (req, res) => {
    if (req.params.category == "All") {
        // get all
        console.log(`| Handling GET-request for last asked queries |`);
        logSave("| GET | last asked queries |");
        const dbRes = await database.getLastQueries();
        if (dbRes.errorMessage) {
            errorLog(dbRes.status, dbRes.errorMessage);
            res.status(dbRes.status).send(dbRes.errorMessage);
        }
        else {
            res.status(dbRes.status).json(dbRes.queries);
        }
    }
    else {
        // get specific category
        const category = await dataValidation.validName(req.params.category);
        if (!category) {
            // bye bye
            res.status(400).send('ERROR! Invalid category sent to server');
        }
        else {
            console.log(`| Handling GET-request for last asked queries BY CATEGORY |`);
            logSave("| GET | last asked queries | CATEGORY |");
            const dbRes = await database.getLastQueriesByCategory(category);
            if (dbRes.errorMessage) {
                errorLog(dbRes.status, dbRes.errorMessage);
                res.status(dbRes.status).send(dbRes.errorMessage);
            }
            else {
                res.status(dbRes.status).json(dbRes.queries);
            }
        }
    }
});
routes.get('/answers/:id', async (req, res) => {
    if (!req.params.id) {
        res.status(400).send('ERROR! No id sent to server');
    }
    else {
        const id = await dataValidation.validId(req.params.id);
        if (!id) {
            // bye bye
            res.status(400).send('ERROR! Invalid id sent to server');
        }
        else {
            console.log(`| Handling GET-request for answers to query |`);
            logSave("| GET | answers to query |");
            const dbRes = await database.getAnswersToQuery(id);
            if (dbRes.errorMessage) {
                errorLog(dbRes.status, dbRes.errorMessage);
                res.status(dbRes.status).send(dbRes.errorMessage);
            }
            else {
                res.status(dbRes.status).json(dbRes.answers);
            }
        }
    }
});

//##############################################################
//############################ POST ############################
routes.post('/user/', async (req, res) => {
    if (!req.body.username || !req.body.accessLevel || !req.body.password || !req.body.fname || !req.body.lname || !req.body.email) {
        res.status(400).send('ERROR! Incomplete data sent to server');
    }
    else {
        const username = await dataValidation.validUsername(req.body.username);
        const accessLevel = await dataValidation.validAccessLevel(req.body.accessLevel);
        const passwordIn = await dataValidation.validPassword(req.body.password);
        const fname = await dataValidation.validName(req.body.fname);
        const lname = await dataValidation.validName(req.body.lname);
        const email = await dataValidation.validEmail(req.body.email);
        if (!username || !accessLevel || !passwordIn || !fname || !lname || !email) {
            // bye bye
            res.status(400).send('ERROR! Invalid data sent to server');
        }
        else {
            if (accessLevel > 1 && (!req.session.accessLevel || req.session.accessLevel < 3)) {
                res.status(400).send('ERROR! You do not have access to create an elevated user');
            }
            else {
                console.log(`| Handling POST-request for NEW USER | username: ${username} |`);
                logSave(`| POST | USERCREATION | Username: ${username} |`);
                const password = await generatePass(passwordIn);
                const user = {
                    accessLevel: accessLevel,
                    username: username,
                    password: password,
                    fname: fname,
                    lname: lname,
                    email: email
                }
                const dbRes = await database.addUser(user);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    res.status(dbRes.status).send(dbRes.message);
                }
            }
        }
    }
});

routes.post('/query/', async (req, res) => {
    if (!req.session.userId || !req.session.username) {
        res.status(400).send('ERROR! You should log in first');
    }
    else {
        if (!req.body.title || !req.body.category || !req.body.description) {
            res.status(400).send('ERROR! Missing data for query');
        }
        else {
            const title = await dataValidation.validTitle(req.body.title);
            const description = await dataValidation.validDescription(req.body.description);
            if (!title || !description) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                const validCategory = await dataValidation.validTitle(req.body.category);
                if (!validCategory) {
                    res.status(400).send('ERROR! Invalid category name sent to server');
                }
                else {
                    const dbRes = await database.getCategoryByName(validCategory);
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status).send(dbRes.errorMessage);
                    }
                    else {
                        // this shit does not work for some inane reason. So i am just going to bypass it...
                        // const category = dbRes.categories.category;
                        console.log(`| Handling POST-request for query: ${title} |`);
                        logSave(`| POST | QUERY: ${title} |`);
                        const dbRes = await database.addQuery({
                            'title': title,
                            'category': validCategory,
                            'userId': req.session.userId,
                            'username': req.session.username,
                            'description': description
                        });
                        if (!dbRes) {
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(dbRes.status).send(dbRes.errorMessage);
                        }
                        else {
                            res.status(dbRes.status).json(dbRes.query);
                        }
                    }
                }
            }
        }
    }
});
routes.post('/answer/', async (req, res) => {
    if (!req.session.userId || !req.session.username) {
        // bye bye
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (req.session.accessLevel < 2) {
            // bye bye
            res.status(400).send('ERROR! You do not have access to this');
        }
        else {
            if (!req.body.queryId || !req.body.answer) {
                // bye bye
                res.status(400).send('ERROR! Missing data for query');
            }
            else {
                const queryId = await dataValidation.validId(req.body.queryId);
                const answerText = await dataValidation.validDescription(req.body.answer);
                if (!queryId || !answerText) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    console.log(`| Handling POST-request for answer for query id: ${queryId} |`);
                    logSave(`| POST | ANSWER for query id: ${queryId} |`);
                    const answer = {
                        queryId: queryId,
                        userId: req.session.userId,
                        answer: answerText
                    }
                    const dbRes = await database.addAnswer(answer);
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status).send(dbRes.errorMessage);
                    }
                    else {
                        res.status(dbRes.status).json(dbRes.answer);
                    }
                }
            }
        }
    }
});



//################################################################
//############################ UPDATE ############################
routes.put('/user/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (!req.body.username || !req.body.fname || !req.body.lname || !req.body.email) {
            res.status(400).send('ERROR! Invalid update data sent to server');
        }
        else {
            const username = await dataValidation.validUsername(req.body.username);
            const fname = await dataValidation.validName(req.body.fname);
            const lname = await dataValidation.validName(req.body.lname);
            const email = await dataValidation.validEmail(req.body.email);
            if (!username || !fname || !lname || !email) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            console.log(`| Handling UPDATE-request for user id: ${req.session.userId} |`);
            logSave(`| UPDATE | USER ID: ${req.session.userId} |`);
            const user = {
                accessLevel: req.session.accessLevel,
                username: username,
                fname: fname,
                lname: lname,
                email: email,
                id: req.session.userId
            }
            const dbRes = await database.updateUser(user)
            if (dbRes.errorMessage) {
                errorLog(dbRes.status, dbRes.errorMessage);
                res.status(dbRes.status, dbRes.errorMessage);
            }
            else {
                res.status(dbRes.status).send(dbRes.message);
            }
        }
    }
});

routes.put('/user/admin/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (!req.body.fname || !req.body.lname || !req.body.email || !req.body.accessLevel || !req.body.id || !req.body.username) {
            res.status(400).send('ERROR! Invalid update data sent to server');
        }
        else {
            if (req.session.accessLevel < 3) {
                res.status(400).send('ERROR! You do not have access to this');
            }
            else {
                const fname = await dataValidation.validName(req.body.fname);
                const lname = await dataValidation.validName(req.body.lname);
                const email = await dataValidation.validEmail(req.body.email);
                const accessLevel = await dataValidation.validAccessLevel(req.body.accessLevel);
                const id = await dataValidation.validId(req.body.id);
                const username = await dataValidation.validUsername(req.body.username);
                if (!fname || !lname || !email || !accessLevel || !id || !username) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    console.log(`| Handling ADMIN-UPDATE-request for user id: ${id} |`);
                    logSave(`| ADMIN-UPDATE | USER ID: ${id} |`);
                    const user = {
                        accessLevel: accessLevel,
                        username: username,
                        fname: fname,
                        lname: lname,
                        email: email,
                        id: id
                    }
                    const dbRes = await database.updateUser(user)
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status, dbRes.errorMessage);
                    }
                    else {
                        res.status(dbRes.status).send(dbRes.message);
                    }
                }
            }
        }
    }
});

// updates queries, takes duplicateOf as an optional parameter if you're a contributor or admin
routes.put('/query/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (!req.body.title || !req.body.category || !req.body.description || !req.body.id) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            const title = await dataValidation.validTitle(req.body.title);
            const description = await dataValidation.validDescription(req.body.description);
            const id = await dataValidation.validId(req.body.id);
            if (!title || !description || !id) {
                res.status.send('ERROR! Invalid data sent to server');
            }
            else {
                const dbRes = await database.getCategoryByName(req.body.category);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    const category = dbRes.categories
                    console.log(`| Handling UPDATE-request for query id: ${id} |`);
                    logSave(`| UPDATE | QUERY ID: ${id} |`);
                    const dbRes = await database.getQuery(id);
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status).send(dbRes.errorMessage);
                    }
                    else {
                        const duplicateOf = dbRes.query.duplicateOf;
                        if ((dbRes.query.userId != req.session.userId) && (req.session.accessLevel < 3)) {
                            res.status(400).send('ERROR! You do not have access');
                        }
                        else {
                            const query = {
                                title: title,
                                category: category,
                                description: description,
                                id: id,
                                duplicateOf: duplicateOf
                            }
                            const dbRes = await database.updateQuery(query);
                            if (dbRes.errorMessage) {
                                errorLog(dbRes.status, dbRes.errorMessage);
                                res.status(dbRes.status).send(dbRes.errorMessage);
                            }
                            else {
                                res.status(dbRes.status).send(dbRes.message);
                            }
                        }
                    }
                }
            }
        }
    }
});

routes.put('/query/flagDupe/', async (req, res) => {
    if (!req.session.userId || req.session.accessLevel < 2) {
        res.status(400).send('ERROR! You do not have access');
    }
    else {
        if (!req.body.id || !req.body.duplicateOf) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            const id = await dataValidation.validId(req.body.id);
            const duplicateOf = await dataValidation.validId(req.body.duplicateOf);
            if (!id || !duplicateOf) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                const dbRes = await database.getQuery(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    const query = dbRes.query;
                    if (dbRes.query.duplicateOf > -1) {
                        const dbRes = await database.updateQueryDupeCount(query.id, -1);
                        if (dbRes.errorMessage) {
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(dbRes.status).send(dbRes.errorMessage);
                        }
                        else {
                            const updateQuery = {
                                title: query.title,
                                category: query.category,
                                description: query.description,
                                duplicateOf: duplicateOf,
                                id: query.id
                            }
                            const dbRes = await database.updateQuery(updateQuery);
                            if (dbRes.errorMessage) {
                                errorLog(dbRes.status, dbRes.errorMessage);
                                res.status(dbRes.status).send(dbRes.errorMessage);
                            }
                            else {
                                res.status(dbRes.status).send(dbRes.message);
                            }
                        }
                    }
                    else {
                        const updateQuery = {
                            title: query.title,
                            category: query.category,
                            description: query.description,
                            duplicateOf: duplicateOf,
                            id: query.id
                        }
                        const dbRes = await database.updateQuery(updateQuery);
                        if (dbRes.errorMessage) {
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(dbRes.status).send(dbRes.errorMessage);
                        }
                        else {
                            res.status(dbRes.status).send(dbRes.message);
                        }
                    }
                }
            }
        }
    }
});

routes.put('/answer/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to log in first');
    }
    else {
        if (req.session.accessLevel < 2) {
            res.status(400).send('ERROR! You do not have access to this');
        }
        else {
            if (!req.body.answer || !req.body.id) {
                res.status(400).send('ERROR! Incomplete data sent to server');
            }
            else {
                const id = await dataValidation.validId(req.body.id);
                if (!id) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    if (!req.body.vote) {
                        const answer = await dataValidation.validDescription(req.body.answer);
                        if (!answer) {
                            res.status(400).send('ERROR! Invalid data sent to server');
                        }
                        else {
                            const dbRes = await database.updateAnswer({answer: answer, id: id});
                            if (dbRes.errorMessage) {
                                errorLog(dbRes.status, dbRes.errorMessage);
                                res.status(dbRes.status).send(dbRes.errorMessage);
                            }
                            else {
                                res.status(dbRes.status).send(dbRes.message);
                            }
                        }
                    }
                    else {
                        const vote = await dataValidation.validVote(req.body.vote);
                        if (!vote) {
                            res.status(400).send('ERROR! Invalid data sent to server');
                        }
                        else {
                            const dbRes = await updateAnswer({vote: vote, id: id});
                            if (dbRes.errorMessage) {
                                errorLog(dbRes.status, dbRes.errorMessage);
                                res.status(dbRes.status).send(dbRes.errorMessage);
                            }
                            else {
                                res.status(dbRes.status).send(dbRes.message);
                            }
                        }
                    }
                }
            }
        }
    }
});

//################################################################
//############################ DELETE ############################
routes.delete('/user/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        if (!req.body.userId) {
            res.status(400).send('ERROR! No userId sent to server');
        }
        else {
            const id = await dataValidation.validId(req.body.userId);
            if (!id) {
                res.status(400).send('ERROR! Invalid id sent to server');
            }
            else {
                if (req.session.accessLevel < 3 || req.session.userId != id) {
                    res.status(400).send('ERROR! You do not have access to this');
                }
                else {
                    console.log(`| Handling DELETE-request for user id: ${id} | REQUESTED BY ADMIN ${req.session.userId} |`);
                    logSave(`| DELETE | USER ID: ${id} | ADMIN ID: ${req.session.userId} |`);
                    const dbRes = await database.deleteUser(id);
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status).send(dbRes.errorMessage);
                    }
                    else {
                        res.status(dbRes.status).send(dbRes.message);
                    }
                }
            }
        }
    }
});

routes.delete('/query/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to login first');
    }
    else {
        if (!req.body.id) {
            res.status(400).send('ERROR! No id sent to server');
        }
        else {
            const id = await dataValidation.validId(req.body.id);
            if (!id) {
                res.status(400).send('ERROR! Invalid id sent to server');
            }
            else {
                const dbRes = await database.getQuery(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    if (req.session.accessLevel < 3 && res.session.userId != dbRes.query.userId) {
                        res.status(400).send('ERROR! You do not have access to this query');
                    }
                    else {
                        const dbRes = await database.deleteQuery(id);
                        if (dbRes.errorMessage) {
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(dbRes.status).send(dbRes.errorMessage);
                        }
                        else {
                            res.status(dbRes.status).send(dbRes.message);
                        }
                    }
                }
            }
        }
    }
});

//#####################################################################
//############################ ERROR LOGGING ##########################
const errorLog = async (status, errorMessage) => {
    console.log(`| ERROR | ${status + ', bruh, ' + errorMessage} |`);
    logSave(`| ERROR | ${status + ', bruh, ' + errorMessage} |`);
};

//#####################################################################
//############################ LOG TO FILE ############################
async function logSave(entry) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth()+1);
    const day = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const millisec = now.getMilliseconds();
    const time = `${hours}:${minutes}:${seconds}:${millisec}`;
    const logdate = `${year}_${month}_${day}`;
    const path = `./logs/${logdate}.txt`;
    const logEntry = `LOG: [${time}] ${entry}\n`;
    try {
        fs.writeFile(path, logEntry, { flag: 'a+' }, (err) => {
            if (err) {
                throw err;
            }
            else (console.log("Successfully Logged to File."));
        });
        return 1;
    }
    catch (err) {
        try {
            fs.unlink(path);
            console.log(err);
            fs.writeFile(path, logEntry, {flag: 'a+'}, (err) => {
                if (err) {
                    throw err;
                }
                else (console.log("Successfully Logged to File."));
            });
            return 1;
        }
        catch (err) {
            fs.unlink(path);
            console.log(err);
            return 0;
        }
    }
};



//########################################################

module.exports = routes;