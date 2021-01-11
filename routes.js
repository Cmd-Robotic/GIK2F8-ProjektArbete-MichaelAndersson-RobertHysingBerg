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
const { validTitle } = require('./dataValidation');
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
    // check if data
    if (!req.body.emailUsername) {
        res.status(400).send('No email or username sent to server');
    }
    else {
        if (!req.body.password) {
            res.status(400).send('No password sent to server');
        }
        else {
            // check if login by username or email
            const email = await dv.validEmail(req.body.emailUsername);
            const username = await dv.validUsername(req.body.emailUsername);
            if (!email && !username) {
                res.status(400).send('Invalid username or email sent to server');
            }
            else {
                // check if password is valid
                const password = await dv.validPassword(req.body.password);
                if (!password) {
                    res.status(400).send('Invalid password sent to server');
                }
                else {
                    // split, if email handle login as email, else handle as username login
                    if (email) {
                        // logging
                        console.log(`| Handling LOGIN-request for user email: ${email} |`);
                        logSave(`| LOGIN | EMAIL: ${email} |`);
                        // get the users id and password
                        const dbRes = await database.getUserByEmail(email);
                        if (dbRes.errorMessage) {
                            // error time
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(404).send(`Could not find a user with email ${email}`);
                        }
                        else {
                            // check if the passwords match
                            const user = dbRes.user;
                            const pass = await comparePass(password, user.password);
                            if (!pass) {
                                const errorMessage = 'Passwords do not match';
                                errorLog(400, errorMessage);
                                res.status(400).send(errorMessage);
                            }
                            else {
                                // login and check for ban, ban is if accessLevel has sunken below a common user (<0)
                                const userRes = await database.getUser(user.id);
                                if (userRes.user.accessLevel < 1) {
                                    res.status(400).send('ERROR! You have been hit by the MIGHTY BANHAMMER!');
                                }
                                else {
                                    // set the session parameters
                                    req.session.userId = user.id;
                                    req.session.accessLevel = userRes.user.accessLevel;
                                    req.session.username = userRes.user.username;
                                    res.status(200).json(userRes.user);
                                }
                            }
                        }
                    }
                    else if (username) {
                        // login by username here
                        // logging
                        console.log(`| Handling LOGIN-request for user: ${username} |`);
                        logSave(`| LOGIN | USERNAME: ${username} |`);
                        // getting the users id and password
                        const dbRes = await database.getUserByUsername(username);
                        if (dbRes.errorMessage) {
                            // error time
                            errorLog(dbRes.status, dbRes.errorMessage);
                            res.status(404).send(`Could not find user with username ${username}`);
                        }
                        else {
                            // check if the passwords match
                            const user = dbRes.user;
                            const pass = await comparePass(password, user.password);
                            // const pass = (password == user.password);
                            if (!pass) {
                                const errorMessage = 'Passwords do not match';
                                errorLog(400, errorMessage);
                                res.status(400).send(errorMessage);
                            }
                            else {
                                // check if the user is banned (accessLevel<0)
                                const userRes = await database.getUser(user.id);
                                if (userRes.user.accessLevel < 1) {
                                    res.status(400).send('ERROR! You have been hit by the MIGHTY BANHAMMER!');
                                }
                                else {
                                    // set the session parameters
                                    req.session.userId = user.id;
                                    req.session.accessLevel = userRes.user.accessLevel;
                                    req.session.username = userRes.user.username;
                                    res.status(200).json(userRes.user);
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
    // check if session
    if (!req.session) {
        res.status(400).send('ERROR! You do not have a session');
    }
    else {
        // check if logged in
        if (!req.session.userId) {
            res.status(400).send('ERROR! You must login first to logoff');
        }
        else {
            // logging
            console.log(`| User ${req.session.username} Logging off |`);
            logSave(`| LOGOFF | USERID: ${req.session.userId} |`);
            // destroy session
            req.session.destroy();
            res.status(200).send('bye bye!');
        }
    }
});
//#############################################################
//############################ GET ############################
// get route for all users, only super admin access (lvl 3+)
routes.get('/users/', async (req, res) => {
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // accesslevel check
        if (req.session.accessLevel < 3) {
            res.status(400).send('ERROR! You do not have permission to access this');
        }
        else {
            // logging
            console.log('| Handling GET-request for all users |');
            logSave('| GET | all users |');
            // getting the users
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
// get route for all queries
routes.get('/queries/', async (req, res) => {
    // logging
    console.log(`| Handling GET-request for all queries |`);
    logSave("| GET | all queries |");
    // getting the queries
    const dbRes = await database.getQueries();
    if (dbRes.errorMessage) {
        errorLog(dbRes.status, dbRes.errorMessage);
        res.status(dbRes.status).send(dbRes.errorMessage);
    }
    else {
        res.status(dbRes.status).json(dbRes.queries);
    }
});
// get the current user's queries
routes.get('/queries/user/', async (req, res) => {
    if (!req.session.userId) {
        // bye bye, login first
        res.status(400).send('Please login first');
    }
    else {
        // logging
        console.log(`| Handling GET-request for User queries | User ID: ${req.session.userId}`);
        logSave(`| GET | UserId: ${req.session.userId} | queries |`);
        // getting the queries
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
// search by title route
routes.get('/queries/:search', async (req, res) => {
    if (!req.params.search) {
        res.status(400).send('ERROR! Incomplete data sent to server');
    }
    else {
        // data validation
        const validSearch = await dataValidation.validTitle(req.params.search);
        if (!validSearch) {
            res.status(400).send('ERROR! Invalid data sent to server');
        }
        else {
            // logging
            console.log(`| Handling GET-request for title search | Search: ${validSearch}`);
            logSave(`| GET | UserId: ${validSearch} | search title queries |`);
            // getting the data
            const dbRes = await database.getQueriesByTitle(validSearch);
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
// get all by category
routes.get('/queries/category/:category', async (req, res) => {
    if (!req.params.category) {
        res.status(400).send('ERROR! No category sent to server');
    }
    else {
        // get specific category
        const category = await dataValidation.validName(req.params.category);
        if (!category) {
            // bye bye
            res.status(400).send('ERROR! Invalid category sent to server');
        }
        else {
            // logging
            console.log(`| Handling GET-request for queries BY CATEGORY |`);
            logSave("| GET | frequently asked queries | CATEGORY |");
            // get queries
            const dbRes = await database.getQueriesByCategory(category);
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
routes.get('/frequentlyasked/:category', async (req, res) => {
    if (req.params.category == "All") {
        // get all
        // logging
        console.log(`| Handling GET-request for frequently asked queries |`);
        logSave("| GET | frequently asked queries |");
        // get queries
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
            // logging
            console.log(`| Handling GET-request for frequently asked queries BY CATEGORY |`);
            logSave("| GET | frequently asked queries | CATEGORY |");
            // get queries
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
        // logging
        console.log(`| Handling GET-request for last asked queries |`);
        logSave("| GET | last asked queries |");
        // getting the queries
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
        // check if valid category
        const category = await dataValidation.validName(req.params.category);
        if (!category) {
            // bye bye
            res.status(400).send('ERROR! Invalid category sent to server');
        }
        else {
            // logging
            console.log(`| Handling GET-request for last asked queries BY CATEGORY |`);
            logSave("| GET | last asked queries | CATEGORY |");
            // getting the queries
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
        // check if valid id
        const id = await dataValidation.validId(req.params.id);
        if (!id) {
            // bye bye
            res.status(400).send('ERROR! Invalid id sent to server');
        }
        else {
            // logging
            console.log(`| Handling GET-request for answers to query |`);
            logSave("| GET | answers to query |");
            // getting the answers
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
    // check if data recieved is complete
    if (!req.body.username || !req.body.accessLevel || !req.body.password || !req.body.fname || !req.body.lname || !req.body.email) {
        res.status(400).send('ERROR! Incomplete data sent to server');
    }
    else {
        // check if the data is valid
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
            // check if the user is to be created at an elevated accesslevel and if they have the permission to do so
            if (accessLevel > 1 && (!req.session.accessLevel || req.session.accessLevel < 3)) {
                res.status(400).send('ERROR! You do not have access to create an elevated user');
            }
            else {
                // logging
                console.log(`| Handling POST-request for NEW USER | username: ${username} |`);
                logSave(`| POST | USERCREATION | Username: ${username} |`);
                // encrypt password
                const password = await generatePass(passwordIn);
                // create the user object and send to database
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
    // check if logged in
    if (!req.session.userId || !req.session.username) {
        res.status(400).send('ERROR! You should log in first');
    }
    else {
        // check if complete data
        if (!req.body.title || !req.body.category || !req.body.description) {
            res.status(400).send('ERROR! Missing data for query');
        }
        else {
            // check if valid data
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
                        // logging
                        console.log(`| Handling POST-request for query: ${title} |`);
                        logSave(`| POST | QUERY: ${title} |`);
                        // creating the query and passing it to the database
                        const queryRes = await database.addQuery({
                            'title': title,
                            'category': validCategory,
                            'userId': req.session.userId,
                            'username': req.session.username,
                            'description': description
                        });
                        if (!queryRes) {
                            errorLog(queryRes.status, queryRes.errorMessage);
                            res.status(queryRes.status).send(queryRes.errorMessage);
                        }
                        else {
                            res.status(queryRes.status).json(queryRes.query);
                        }
                    }
                }
            }
        }
    }
});
routes.post('/answer/', async (req, res) => {
    // check if logged in
    if (!req.session.userId || !req.session.username) {
        // bye bye
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // check permission
        if (req.session.accessLevel < 2) {
            // bye bye
            res.status(400).send('ERROR! You do not have access to this');
        }
        else {
            // check if data
            if (!req.body.queryId || !req.body.answer) {
                // bye bye
                res.status(400).send('ERROR! Missing data for query');
            }
            else {
                // check if valid data
                const queryId = await dataValidation.validId(req.body.queryId);
                const answerText = await dataValidation.validDescription(req.body.answer);
                if (!queryId || !answerText) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    // logging
                    console.log(`| Handling POST-request for answer for query id: ${queryId} |`);
                    logSave(`| POST | ANSWER for query id: ${queryId} |`);
                    // create answer object and pass to database
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
// this route only allows modifying the currently logged in user
routes.put('/user/', async (req, res) => {
    // check if logged in
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // check if data
        if (!req.body.username || !req.body.fname || !req.body.lname || !req.body.email) {
            res.status(400).send('ERROR! Invalid update data sent to server');
        }
        else {
            // check if valid data
            const username = await dataValidation.validUsername(req.body.username);
            const fname = await dataValidation.validName(req.body.fname);
            const lname = await dataValidation.validName(req.body.lname);
            const email = await dataValidation.validEmail(req.body.email);
            if (!username || !fname || !lname || !email) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            // logging
            console.log(`| Handling UPDATE-request for user id: ${req.session.userId} |`);
            logSave(`| UPDATE | USER ID: ${req.session.userId} |`);
            // create user object and pass to database for updating
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
// admin user modification, for example banning
routes.put('/user/admin/', async (req, res) => {
    // check if logged in
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // check if data
        if (!req.body.fname || !req.body.lname || !req.body.email || !req.body.accessLevel || !req.body.id || !req.body.username) {
            res.status(400).send('ERROR! Invalid update data sent to server');
        }
        else {
            // check accesslevel
            if (req.session.accessLevel < 3) {
                res.status(400).send('ERROR! You do not have access to this');
            }
            else {
                // check if valid data
                const fname = await dataValidation.validName(req.body.fname);
                const lname = await dataValidation.validName(req.body.lname);
                const email = await dataValidation.validEmail(req.body.email);
                const accessLevel = await dataValidation.validAccessLevel(req.body.accessLevel);
                const id = await dataValidation.validId(req.body.id);
                const username = await dataValidation.validUsername(req.body.username);
                if (!fname || !lname || !email || accessLevel<0 || accessLevel>3 || !id || !username) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    // logging
                    console.log(`| Handling ADMIN-UPDATE-request for user id: ${id} |`);
                    logSave(`| ADMIN-UPDATE | USER ID: ${id} |`);
                    // create user object and pass to databse for updating
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
    // check if logged in
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // check if data
        if (!req.body.title || !req.body.category || !req.body.description || !req.body.id) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            // check if valid data
            const title = await dataValidation.validTitle(req.body.title);
            const description = await dataValidation.validDescription(req.body.description);
            const id = await dataValidation.validId(req.body.id);
            if (!title || !description || !id) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                const validCategory = await dataValidation.validTitle(req.body.category);
                if (!validCategory) {
                    res.status(400).send('ERROR! Invalid data sent to server');
                }
                else {
                    const dbRes = await database.getCategoryByName(validCategory);
                    if (dbRes.errorMessage) {
                        errorLog(dbRes.status, dbRes.errorMessage);
                        res.status(dbRes.status).send(dbRes.errorMessage);
                    }
                    else {
                        // const category = dbRes.categories
                        // logging
                        console.log(`| Handling UPDATE-request for query id: ${id} |`);
                        logSave(`| UPDATE | QUERY ID: ${id} |`);
                        // get the query to check it
                        const queryRes = await database.getQuery(id);
                        if (queryRes.errorMessage) {
                            errorLog(queryRes.status, queryRes.errorMessage);
                            res.status(queryRes.status).send(queryRes.errorMessage);
                        }
                        else {
                            // get what query it's a duplicate of, if any
                            const duplicateOf = queryRes.query.duplicateOf;
                            // check access to modifying the query
                            if ((queryRes.query.userId != req.session.userId) && (req.session.accessLevel < 3)) {
                                res.status(400).send('ERROR! You do not have access');
                            }
                            else {
                                // update the query
                                const query = {
                                    title: title,
                                    category: validCategory,
                                    description: description,
                                    id: id,
                                    duplicateOf: duplicateOf
                                }
                                const updateQueryRes = await database.updateQuery(query);
                                if (updateQueryRes.errorMessage) {
                                    errorLog(updateQueryRes.status, updateQueryRes.errorMessage);
                                    res.status(updateQueryRes.status).send(updateQueryRes.errorMessage);
                                }
                                else {
                                    res.status(updateQueryRes.status).send(updateQueryRes.message);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
});

// mark a query as duplicate
routes.put('/query/flagDupe/', async (req, res) => {
    // check if logged in and access
    if (!req.session.userId || req.session.accessLevel < 2) {
        res.status(400).send('ERROR! You do not have access');
    }
    else {
        // check if data
        if (!req.body.id || !req.body.duplicateOf) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            // check if valid data
            const id = await dataValidation.validId(req.body.id);
            const duplicateOf = await dataValidation.validId(req.body.duplicateOf);
            if (!id || !duplicateOf) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                // get the query for checking
                const dbRes = await database.getQuery(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    const query = dbRes.query;
                    // check if already marked as duplicate
                    if (dbRes.query.duplicateOf > -1) {
                        // change dupe count if already marked as duplicate
                        const updateQueryRes = await database.updateQueryDupeCount(dbRes.query.duplicateOf, -1);
                        if (updateQueryRes.errorMessage) {
                            errorLog(updateQueryRes.status, updateQueryRes.errorMessage);
                            res.status(updateQueryRes.status).send(updateQueryRes.errorMessage);
                        }
                        else {
                            // update the dupe count of the query it's being marked as a duplicate of
                            const dupeRes = await database.updateQueryDupeCount(duplicateOf, 1);
                            if (dupeRes.errorMessage) {
                                errorLog(dupeRes.status, dupeRes.errorMessage);
                                res.status(dupeRes.status).send(dupeRes.errorMessage);
                            }
                            else {
                                // finally update the query
                                const updateQuery = {
                                    title: query.title,
                                    category: query.category,
                                    description: query.description,
                                    duplicateOf: duplicateOf,
                                    id: query.id
                                }
                                const queryRes = await database.updateQuery(updateQuery);
                                if (queryRes.errorMessage) {
                                    errorLog(queryRes.status, queryRes.errorMessage);
                                    res.status(queryRes.status).send(queryRes.errorMessage);
                                }
                                else {
                                    res.status(queryRes.status).send(queryRes.message);
                                }
                            }
                        }
                    }
                    else {
                        // update the query
                        const updateQuery = {
                            title: query.title,
                            category: query.category,
                            description: query.description,
                            duplicateOf: duplicateOf,
                            id: query.id
                        }
                        const queryRes = await database.updateQuery(updateQuery);
                        if (queryRes.errorMessage) {
                            errorLog(queryRes.status, queryRes.errorMessage);
                            res.status(queryRes.status).send(queryRes.errorMessage);
                        }
                        else {
                            // update the dupecount
                            const finalRes = await database.updateQueryDupeCount(duplicateOf, 1);
                            if (finalRes.errorMessage) {
                                errorLog(finalRes.status, finalRes.errorMessage);
                                res.status(finalRes.status).send(finalRes.errorMessage);
                            }
                            else {
                                res.status(finalRes.status).send(finalRes.message);
                            }
                        }
                    }
                }
            }
        }
    }
});

// update answer toure
routes.put('/answer/', async (req, res) => {
    // check if logged in
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to log in first');
    }
    else {
        // check if data
        if (!req.body.id) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            // check if valid data
            const id = await dataValidation.validId(req.body.id);
            if (!id) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                // get the answer's userId and queryId for comparison
                const dbRes = await database.getAnswerUser(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    // check if user has permission change the answer and if user is super admin
                    if (req.session.userId != dbRes.answer.userId && req.session.accessLevel < 3) {
                        // up/down vote path for non admins
                        if (!req.body.vote) {
                            res.status(400).send('ERROR! You do not have access to this');
                        }
                        else {
                            // check the query owner for permission
                            const queryId = dbRes.answer.queryId;
                            const queryRes = await database.getQuery(queryId);
                            if (queryRes.errorMessage) {
                                errorLog(queryRes.status, queryRes.errorMessage);
                                res.status(queryRes.status).send(queryRes.errorMessage);
                            }
                            else {
                                // check if the user up/down voting owns the query
                                if (queryRes.query.userId != req.session.userId) {
                                    res.status(400).send('ERROR! You do not have access to this');
                                }
                                else {
                                    // validate the vote
                                    const vote = await dataValidation.validVote(req.body.vote);
                                    if (!vote) {
                                        res.status(400).send('ERROR! Invalid data sent to server');
                                    }
                                    else {
                                        // up/down vote
                                        const answerRes = await updateAnswer({vote: vote, id: id});
                                        if (answerRes.errorMessage) {
                                            errorLog(answerRes.status, answerRes.errorMessage);
                                            res.status(answerRes.status).send(answerRes.errorMessage);
                                        }
                                        else {
                                            res.status(answerRes.status).send(answerRes.message);
                                        }
                                    }   
                                }
                            }
                        }
                    }
                    else {
                        // we get here if the user owns the answer or the user is a super admin
                        // check if vote
                        if (!req.body.vote) {
                            // check if answer
                            if (!req.body.answer) {
                                res.status(400).send('ERROR! Incomplete data sent to server');
                            }
                            else {
                                // check if valid answer
                                const answer = await dataValidation.validDescription(req.body.answer);
                                if (!answer) {
                                    res.status(400).send('ERROR! Invalid data sent to server');
                                }
                                else {
                                    // update the answer
                                    const answerRes = await database.updateAnswer({answer: answer, id: id});
                                    if (answerRes.errorMessage) {
                                        errorLog(answerRes.status, answerRes.errorMessage);
                                        res.status(answerRes.status).send(answerRes.errorMessage);
                                    }
                                    else {
                                        res.status(answerRes.status).send(answerRes.message);
                                    }
                                }
                            }
                        }
                        else {
                            // check if the vote is valid
                            const vote = await dataValidation.validVote(req.body.vote);
                            if (!vote) {
                                res.status(400).send('ERROR! Invalid data sent to server');
                            }
                            else {
                                // update the answer vote
                                const answerRes = await updateAnswer({vote: vote, id: id});
                                if (answerRes.errorMessage) {
                                    errorLog(answerRes.status, answerRes.errorMessage);
                                    res.status(answerRes.status).send(answerRes.errorMessage);
                                }
                                else {
                                    res.status(answerRes.status).send(answerRes.message);
                                }
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
    // check login
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to be logged in');
    }
    else {
        // check data
        if (!req.body.userId) {
            res.status(400).send('ERROR! No userId sent to server');
        }
        else {
            // check if valid data
            const id = await dataValidation.validId(req.body.userId);
            if (!id) {
                res.status(400).send('ERROR! Invalid id sent to server');
            }
            else {
                // check permission
                if (req.session.accessLevel < 3 && req.session.userId != id) {
                    res.status(400).send('ERROR! You do not have access to this');
                }
                else {
                    // logging
                    console.log(`| Handling DELETE-request for user id: ${id} | REQUESTED BY ADMIN ${req.session.userId} |`);
                    logSave(`| DELETE | USER ID: ${id} | ADMIN ID: ${req.session.userId} |`);
                    // delete user
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
    // check login
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to login first');
    }
    else {
        // check data
        if (!req.body.id) {
            res.status(400).send('ERROR! No id sent to server');
        }
        else {
            // check if valid data
            const id = await dataValidation.validId(req.body.id);
            if (!id) {
                res.status(400).send('ERROR! Invalid id sent to server');
            }
            else {
                // get the query for comparison
                const dbRes = await database.getQuery(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    // check access
                    if (req.session.accessLevel < 3 && req.session.userId != dbRes.query.userId) {
                        res.status(400).send('ERROR! You do not have access to this query');
                    }
                    else {
                        // delete the query
                        const queryRes = await database.deleteQuery(id);
                        if (queryRes.errorMessage) {
                            errorLog(queryRes.status, queryRes.errorMessage);
                            res.status(queryRes.status).send(queryRes.errorMessage);
                        }
                        else {
                            res.status(queryRes.status).send(queryRes.message);
                        }
                    }
                }
            }
        }
    }
});

routes.delete('/answer/', async (req, res) => {
    // check login
    if (!req.session.userId) {
        res.status(400).send('ERROR! You need to log in first');
    }
    else {
        // check data
        if (!req.body.id) {
            res.status(400).send('ERROR! Incomplete data sent to server');
        }
        else {
            // check if valid data
            const id = await dataValidation.validId(req.body.id);
            if (!id) {
                res.status(400).send('ERROR! Invalid data sent to server');
            }
            else {
                // get answer for comparison
                const dbRes = await database.getAnswerUser(id);
                if (dbRes.errorMessage) {
                    errorLog(dbRes.status, dbRes.errorMessage);
                    res.status(dbRes.status).send(dbRes.errorMessage);
                }
                else {
                    // check access
                    if (req.session.userId != dbRes.answer.userId && req.session.accessLevel < 3) {
                        res.status(400).send('ERROR! You do not have access');
                    }
                    else {
                        // delete answer
                        const answerRes = await database.deleteAnswer(id);
                        if (answerRes.errorMessage) {
                            errorLog(answerRes.status, answerRes.errorMessage);
                            res.status(answerRes.status).send(answerRes.errorMessage);
                        }
                        else {
                            res.status(answerRes.status).send(answerRes.message);
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