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



//###############################################################
//############################ LOGIN ############################
routes.post('/login/', async (req, res) => {
    if (!req.body.emailUsername) {
        res.status(400).json({errorMessage:'No email or username sent to server'});
    }
    else {
        if (!req.body.password) {
            res.status(400).json({errorMessage:'No password sent to server'});
        }
        else {
            const email = await dv.validEmail(req.body.emailUsername);
            const username = await dv.validUsername(req.body.emailUsername);
            if (!email && !username) {
                res.status(400).json({errorMessage:'Invalid username or email sent to server'});
            }
            else {
                const password = await dv.validPassword(req.body.password);
                if (!password) {
                    res.status(400).json({errorMessage:'Invalid password sent to server'});
                }
                else {
                    if (email) {
                        console.log(`| Handling LOGIN-request for user email: ${email} |`);
                        logSave(`| LOGIN | EMAIL: ${email} |`);
                        const dbRes = await database.getUserByEmail(email);
                        if (dbRes.errorMessage) {
                            // error time
                            dbErrorLog(dbRes);
                            res.status(404).json({errorMessage:`Could not find a user with email ${email}`});
                        }
                        else {
                            // go further
                            const user = dbRes.user;
                            // const pass = await comparePass(password, user.password);
                            const pass = (password == user.password);
                            if (!pass) {
                                res.status(400).json({errorMessage:'Passwords do not match'});
                            }
                            else {
                                const dbRes = await database.getUser(user.id);
                                res.status(200).json(dbRes.user);
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
                            dbErrorLog(dbRes);
                            res.status(400).json({errorMessage:`Could not find user with username ${username}`});
                        }
                        else {
                            // go further
                            const user = dbRes.user;
                            // const pass = await comparePass(password, user.password);
                            const pass = (password == user.password);
                            if (!pass) {
                                res.status(400).json({errorMessage:'Passwords do not match'});
                            }
                            else {
                                const dbRes = await database.getUser(user.id);
                                res.status(200).json(dbRes.user);
                            }
                        }
                    }
                }
            }
        }
    }

    /*
    try {
        const data = req.body;
        console.log(`| Handling LOGIN-request for user email: ${data.email} |`);
        logSave(`| LOGIN | EMAIL: ${data.email} |`);
        let dbRes = await database.getLogin(data.email);
        let id = dbRes.content[0].id;
        if (dbRes.status == '200') {
            const userPass = data.password;
            const hash = dbRes.content[0].password;
            pass = await comparePass(userPass, hash);
            if (pass) {
                console.log(`| SUCCESS | ID: ${dbRes.content[0].id} logged in |`);
                logSave(`| SUCCESS | ID: ${dbRes.content[0].id} logged in |`);
                dbRes = await database.getUser(id);
                res.status(200).json(dbRes.content);
            }
            else {
                console.log('| ERROR | Wrong password |');
                logSave('| ERROR | Wrong password |');
                res.status(404).json('Wrong password');
            }
        }
        else {
            console.log('| ERROR | Email not found |');
            logSave('| ERROR | Email not found |');
            res.status(404).json(`User with email ${data.email} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json('ERROR! Could not handle request');
    }
*/
});


//#############################################################
//############################ GET ############################

routes.get('/users/', async (req, res) => {
    try {
        console.log('| Handling GET-request for all users |');
        logSave('| GET | all users |');
        let dbRes = await database.getUsers();
        if (dbRes.status=='200') {
            for (i of dbRes.content) {
                i.password = 'xxxx';
            }
            res.json(dbRes.content);
        }
        else {
            res.status(400).json(dbRes.content);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.get('/queries/', async (req, res) => {
    try {
        console.log(`| Handling GET-request for all queries |`);
        logSave("| GET | all queries |");
        const dbRes = await database.getQueries();
        if (dbRes.status=='200') {
            res.status(200).json(dbRes.content);
        }
        else {
            res.status(400).json(dbRes.content);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.get('/user/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling GET-request for user id: ${data} |`);
        logSave(`| GET | ID: ${data} |`);
        if (isNaN(data)) {
            console.log(`| ERROR | Id is NAN |`);
            logSave(`| ERROR | Id is NAN |`);
            inputControl = true;
            res.status(400).json(`ERROR! Could not handle request\n-Id must be a number`);
        }
        let dbRes = await database.getUser(data);
        if (dbRes.status=='200') {
            for (i of dbRes.content) {
                i.password = 'xxxx';
            }
            res.json(dbRes.content);
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(404).json(`User with id ${data} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.get('/query/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling GET-request for query id ${data} |`);
        logSave(`| GET | ID: ${data} |`);
        if (isNaN(data)) {
            console.log(`| ERROR | Id is NAN |`);
            logSave(`| ERROR | Id is NAN |`);
            inputControl = true;
            res.status(400).json(`ERROR! Could not handle request\n-Id must be a number`);
        }
        const dbRes = await database.getQuery(data);
        if (dbRes.status=='200') {
            res.json(dbRes.content);
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(404).json(`Query with id ${data} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});



//##############################################################
//############################ POST ############################
routes.post('/user/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling POST-request for username: ${data.username} |`);
        logSave(`| POST | NAME: ${data.username} |`);
        let userInput = await inputControl('user', data);
        if (userInput[0]) {
            console.log(`| ERROR | ${userInput[1]} |`);
            logSave(`| ERROR | ${userInput[1]} |`);
            res.status(400).json(userInput[1]);
        }
        else {
            data.password = await generatePass(data.password);
            //console.log("Hash password: ", data.password);
            let dbRes = await database.getUsername(data.username);
            if (dbRes.status=='200') {
                if (dbRes.content[0].status == 'banned') {
                    console.log(`| ERROR | Banned user |`);
                    logSave(`| ERROR | Banned user |`);
                    res.status(400).json(`User is banned`);
                }
                else {
                    console.log(`| ERROR | Duplicate username |`);
                    logSave(`| ERROR | Duplicate username |`);
                    res.status(400).json(`User with username | ${data.username} | already exist`);
                }
            }
            else {
                dbRes = await database.addUser(data);
                if (dbRes.status == "200") {
                    dbRes = await database.getUsername(data.username);
                    const user = dbRes.content[0];
                    console.log(`| SUCCESS | User saved |`);
                    logSave(`| SUCCESS | User saved | ID: ${user.id}|`);
                    res.status(200).json(`User with username ${user.username} saved`);
                }
                else {
                    console.log(`| ERROR | ${dbRes.content} |`);
                    logSave(`| ERROR | ${dbRes.content} |`);
                    res.status(400).json(`ERROR! Could not save user`);
                }
            }
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.post('/query/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling POST-request for query: ${data.name} |`);
        logSave(`| POST | QUERY: ${data.name} |`);
        let userInput = await inputControl('query', data);
        if (userInput[0]) {
            console.log(`| ERROR | ${userInput[1]} |`);
            logSave(`| ERROR | ${userInput[1]} |`);
            res.status(400).json(userInput[1]);
        }
        else {
            try {
                data.category = parseInt(data.category);
                let dbRes = await database.addQuery(data);
                if (dbRes.status == '200') {
                    const id = dbRes.content[0].id;
                    console.log(`| SUCCESS | Query saved |`);
                    logSave(`| SUCCESS | Query saved | ID: ${id}|`);
                    res.status(200).json(`Query with id ${id} saved`);
                }
                else {
                    console.log(`| ERROR | ${dbRes.content} |`);
                    logSave(`| ERROR | ${dbRes.content} |`);
                    res.status(400).json(`ERROR! Could not save query`);
                }
            }
            catch (err) {
                console.log(`| ERROR | ${err} |`);
                logSave(`| ERROR | ${err} |`);
                res.status(400).json(`ERROR! Could not handle request`);
            }
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});
routes.post('/answer/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling POST-request for answer for query id: ${data.queryid} |`);
        logSave(`| POST | ANSWER for query id: ${data.queryid} |`);
        let userInput = await inputControl('answer', data);
        if (userInput[0]) {
            console.log(`| ERROR | ${userInput[1]} |`);
            logSave(`| ERROR | ${userInput[1]} |`);
            res.status(400).json(userInput[1]);
        }
        else {
            try {
                data.queryid = parseInt(data.queryid);
                data.userid = parseInt(data.userid);
                let dbRes = await database.addAnswer(data);
                if (dbRes.status == '200') {
                    const id = dbRes.content[0].id;
                    console.log(`| SUCCESS | Answer saved |`);
                    logSave(`| SUCCESS | Answer saved | ID: ${id}|`);
                    res.status(200).json(`Answer with id ${id} saved`);
                }
                else {
                    console.log(`| ERROR | ${dbRes.content} |`);
                    logSave(`| ERROR | ${dbRes.content} |`);
                    res.status(400).json(`ERROR! Could not save answer`);
                }
            }
            catch (err) {
                console.log(`| ERROR | ${err} |`);
                logSave(`| ERROR | ${err} |`);
                res.status(400).json(`ERROR! Could not handle request`);
            }
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});



//################################################################
//############################ UPDATE ############################
routes.put('/user/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling UPDATE-request for user id: ${data.id} |`);
        logSave(`| UPDATE | USER ID: ${data.id} |`);
        let err = false;
        let pass = false;
        let noUser = false;
        let dbRes = await database.getUser(data.id);
        if (dbRes.status=='200') {
            //const inPass = prompt("Please enter password");
            const user = dbRes.content[0];
            const inPass = data.password;
            const hash = user.password;
            pass = await comparePass(inPass, hash);
            if (pass) {
                const userInput = await inputControl('user', data);
                if (userInput[0]) {
                    console.log(`| ERROR | ${userInput[1]} |`);
                    logSave(`| ERROR | ${userInput[1]} |`);
                    res.status(400).json(userInput[1]);
                }
                dbRes = await database.updateUser(user.id, data);
                if (dbRes.status=='200') {
                    console.log(`| SUCCESS | User updated |`);
                    logSave(`| SUCCESS | User updated |`);
                    res.status(200).json(`User with id ${user.id} and username ${user.username} updated`);
                }
                else {
                    throw error;
                }
            }
            else {
                //alert("Incorrect password!");
                err = true;
            }
        }
        else {
            err = true;
            noUser = true;
        }
        if (err) {
            if (!noUser) {
                console.log(`| ERROR | Wrong password |`);
                logSave(`| ERROR | Wrong password |`);
                res.status(400).json(`Wrong password`);
            }
            else {
                console.log(`| ERROR | Id not found |`);
                logSave(`| ERROR | Id not found |`);
                res.status(400).json(`User with id ${data.id} not found`);
            }
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.put('/query/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling UPDATE-request for query id: ${data.id} |`);
        logSave(`| UPDATE | QUERY ID: ${data.id} |`);
        let dbRes = await database.getQuery(data.id);
        if (dbRes.status == '200') {
            const userInput = await inputControl('query', data);
            if (userInput[0]) {
                console.log(`| ERROR | ${userInput[1]} |`);
                logSave(`| ERROR | ${userInput[1]} |`);
                res.status(400).json(userInput[1]);
            }
            dbRes = await database.updateQuery(data);
            if (dbRes.status == '200') {
                console.log(`| SUCCESS | Query updated |`);
                logSave(`| SUCCESS | Query updated |`);
                res.status(200).json(`Query with id ${data.id} updated`);
            }
            else {
                throw error;
            }
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(400).json(`Query with id ${data.id} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});



//################################################################
//############################ DELETE ############################
routes.delete('/user/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling DELETE-request for user id: ${data.id} |`);
        logSave(`| DELETE | USER ID: ${data.id} |`);
        let dbRes = await database.getUser(data.id);
        let username = dbRes.content[0].username;
        let err = false;
        let pass = false;
        let noUser = false;
        if (dbRes.status=='200') {
            dbRes = await database.getLogin(dbRes.content[0].email)
            const user = dbRes.content[0];
            //const inPass = prompt("Please enter password");
            const userPass = data.password;
            const hash = dbRes.content[0].password;
            pass = await comparePass(userPass, hash);
            if (pass) {
                dbRes = await database.deleteUser(data.id);
                if (dbRes.status=='200') {
                    console.log(`| SUCCESS | User deleted |`);
                    logSave(`| SUCCESS | User deleted |`);
                    res.status(200).json(`User with id ${user.id} and username ${username} deleted`);
                }
                else {
                    throw error;
                }
            }
            else {
                //alert("Incorrect password!");
                err = true;
            }
        }
        else {
            err = true;
            noUser = true;
        }
        if (err) {
            if (!noUser) {
                console.log(`| ERROR | Wrong password |`);
                logSave(`| ERROR | Wrong password |`);
                res.status(400).json(`Wrong password`);
            }
            else {
                console.log(`| ERROR | Id not found |`);
                logSave(`| ERROR | Id not found |`);
                res.status(400).json(`User with id ${data.id} not found`);
            }
        }
    }
    catch (error){
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});

routes.delete('/query/', async (req, res) => {
    try {
        const data = req.body;
        console.log(`| Handling DELETE-request for query id: ${data.id} |`);
        logSave(`| DELETE | QUERY ID: ${data.id} |`);
        let dbRes = await database.getQuery(data.id);
        if (dbRes.status=='200') {
            const query = dbRes.content[0];
            dbRes = await database.deleteQuery(data.id);
            if (dbRes.status=='200') {
                console.log(`| SUCCESS | Query deleted |`);
                logSave(`| SUCCESS | Query deleted |`);
                res.status(200).json(`Query with id ${query.id} deleted`);
            }
            else {
                throw error;
            }
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(400).json(`query with id ${data.id} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not handle request`);
    }
});



//#######################################################################
//############################ INPUT CONTROL ############################
async function inputControl(scope, data) {
    let errorLog = [];
    errorLog.push("ERROR! Could not save product");
    errorLog.push("Following fields contain faults:");
    let inputTest = false;
    if (scope == 'user') {
        let dbRes = await database.getUserLevel(data.level);
        if (dbRes.status != '200') {
            console.log(`| ERROR | Userlevel not found |`);
            logSave(`| ERROR | Userlevel not found |`);
            inputTest = true;
            errorLog.push("-Userlevel not found");
        }
        if (data.username.length > 16 || data.username.length == 0) {
            console.log(`| ERROR | Username length |`);
            logSave(`| ERROR | Username length |`);
            inputTest = true;
            errorLog.push("-Username too long or empty");
        }
        if (data.password.length > 16 || data.password.length == 0) {
            console.log(`| ERROR | Password length |`);
            logSave(`| ERROR | Password length |`);
            inputTest = true;
            errorLog.push("-Password too long or empty");
        }
        if (data.fname.match(/[^a-zA-Zå-åÅ-Åä-äÄ-Äö-öÖ-Ö]+/)) {
            console.log(`| ERROR | Fname invalid char |`);
            logSave(`| ERROR | Fname invalid char |`);
            inputTest = true;
            errorLog.push("-Firstname contains invalid characters");
        }
        if (data.fname.length > 32 || data.fname.length == 0) {
            console.log(`| ERROR | Fname length |`);
            logSave(`| ERROR | Fname length |`);
            inputTest = true;
            errorLog.push("-Firstname too long or empty");
        }
        if (data.lname.match(/[^a-zA-Zå-åÅ-Åä-äÄ-Äö-öÖ-Ö]+/)) {
            console.log(`| ERROR | Lname invalid char |`);
            logSave(`| ERROR | Lname invalid char |`);
            inputTest = true;
            errorLog.push("-Lastname contains invalid characters");
        }
        if (data.lname.length > 32 || data.lname.length == 0) {
            console.log(`| ERROR | Lname length |`);
            logSave(`| ERROR | Lname length |`);
            inputTest = true;
            errorLog.push("-Lastname too long or empty");
        }
        if (!data.email.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+$/)) {
            console.log(`| ERROR | Invalid email |`);
            logSave(`| ERROR | Invalid email |`);
            inputTest = true;
            errorLog.push("-Invalid email adress");
        }
        dbRes = await database.getUserStatus(data.status);
        if (dbRes.status != '200') {
            console.log(`| ERROR | Userstatus not found |`);
            logSave(`| ERROR | Userstatus not found |`);
            inputTest = true;
            errorLog.push("-Userstatus not found");
        }
    }
    else if (scope == 'query') {
        if (data.name.length > 32 || data.name.length == 0) {
            console.log(`| ERROR | Name length |`);
            logSave(`| ERROR | Name length |`);
            inputTest = true;
            errorLog.push("-Name too long or empty");
        }
        let dbRes = await database.getCategory(data.category);
        if (dbRes.status != '200') {
            console.log(`| ERROR | Category not found |`);
            logSave(`| ERROR | Category not found |`);
            inputTest = true;
            errorLog.push("-Category not found");
        }
        if (isNaN(data.userid)) {
            console.log(`| ERROR | UserId is NAN |`);
            logSave(`| ERROR | UserId is NAN |`);
            inputTest = true;
            errorLog.push("-UserId must be a number");
        }
        dbRes = await database.getUser(data.userid)
        if (dbRes.status != '200') {
            console.log(`| ERROR | User not found |`);
            logSave(`| ERROR | User not found |`);
            inputTest = true;
            errorLog.push("-User not found");
        }
        if (data.description.length > 512) {
            console.log(`| ERROR | Description length |`);
            logSave(`| ERROR | Description length |`);
            inputTest = true;
            errorLog.push("-Description too long");
        }
    }
    else if (scope == 'answer') {
        let dbRes = await database.getQuery(data.queryid);
        if (dbRes.status != '200') {
            console.log(`| ERROR | Query not found |`);
            logSave(`| ERROR | Query not found |`);
            inputTest = true;
            errorLog.push("-Query not found");
        }
        if (isNaN(data.userid)) {
            console.log(`| ERROR | UserId is NAN |`);
            logSave(`| ERROR | UserId is NAN |`);
            inputTest = true;
            errorLog.push("-UserId must be a number");
        }
        dbRes = await database.getUser(data.userid)
        if (dbRes.status != '200') {
            console.log(`| ERROR | User not found |`);
            logSave(`| ERROR | User not found |`);
            inputTest = true;
            errorLog.push("-User not found");
        }
        if (data.description.length > 512) {
            console.log(`| ERROR | Description length |`);
            logSave(`| ERROR | Description length |`);
            inputTest = true;
            errorLog.push("-Description too long");
        }
    }
    else {
        console.log(`| ERROR | Failed to evaluate request |`);
        logSave(`| ERROR | Failed to evaluate request |`);
        inputTest = true;
        errorLog.push("Error! Failed to evaluate request")
    }
    let test = [];
    test.push(inputTest);
    test.push(errorLog);
    return test;
};



//##########################################################################
//############################ SAVE FILE UPLOAD ############################
routes.post('/user/file/:id', upload.array('file'), async (req, res) => {
    try {
        let dbRes = await database.getUser(req.params.id);
        if (dbRes.status == '200') {
            console.log(`| Handling POST-request for user filesave |`);
            logSave(`| POST FILE | USER ID: ${req.params.id} |`);
            const uploadFile = req.files;
            const id = req.params.id;
            const writeOk = true;
            for (let i = 0; i < uploadFile.length; i++) {
                const f = uploadFile[i];
                const ext = f.originalname.split('.');
                const fileEnd = ext[ext.length - 1];
                const userId = id + '_' + i;
                const filePath = './upload/users/' + 'u' + userId + '.' + fileEnd;
                const fileName = 'u' + userId + '.' + fileEnd;

                try {
                    const fileWrite = await file.rename(f.path, filePath);
                    if (fileWrite) {
                        writeOk = false;
                    }
                }
                catch (error) {
                    await file.unlink(f.path);
                    throw error;
                }
                try {
                    const data = { 'path': fileName, 'id': req.params.id };
                    dbRes = await database.addUserPic(data);
                    if (dbRes.status != '200') {
                        throw error;
                    }
                }
                catch {
                    throw error;
                }
            }
            if (!writeOk) {
                console.log(error);
                logSave(`| ERROR | ${error} |`);
                res.status(400).json('ERROR! Could not save file');
            }
            else {
                console.log(`| SUCCESS | File saved |`);
                logSave(`| SUCCESS | File saved |`);
                res.status(200).json('File saved');
            }
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(404).json(`User with id ${req.params.id} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not save file`);
    }
});

routes.post('/query/file/:id', upload.array('file'), async (req, res) => {
    try {
        let dbRes = await database.getQuery(req.params.id);
        if (dbRes.status=='200') {
            console.log(`| Handling POST-request for query filesave |`);
            logSave(`| POST FILE | QUERY ID: ${req.params.id} |`);
            const uploadFile = req.files;
            const id = req.params.id;
            const writeOk = true;
            for (let i=0; i < uploadFile.length; i++) {
                const f = uploadFile[i];
                const ext = f.originalname.split('.');
                const fileEnd = ext[ext.length-1];
                const queryId = id + '_' + i;
                const filePath = './upload/queries/' + 'p' + queryId + '.' + fileEnd;
                const fileName = 'p' + queryId + '.' + fileEnd;

                try {
                    const fileWrite = await file.rename(f.path, filePath);
                    if(fileWrite) {
                        writeOk = false;
                    }
                }
                catch(error) {
                    await file.unlink(f.path);
                    throw error;
                }
                try {
                    const data = { 'path': fileName, 'id': req.params.id };
                    dbRes = await database.addQueryPic(data);
                    if(dbRes.status!='200') {
                        throw error;
                    }
                }
                catch {
                    throw error;
                }
            }
            if (!writeOk) {
                console.log(`| ERROR | ${error} |`);
                logSave(`| ERROR | ${error} |`);
                res.status(400).json('ERROR! Could not save file');
            }
            else {
                console.log(`| SUCCESS | File saved |`);
                logSave(`| SUCCESS | File saved |`);
                res.status(200).json({ info: 'File saved' });
            }
        }
        else {
            console.log(`| ERROR | Id not found |`);
            logSave(`| ERROR | Id not found |`);
            res.status(404).json(`Query with id ${req.params.id} not found`);
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        res.status(400).json(`ERROR! Could not save file`);
    }
});


//#####################################################################
//############################ ERROR LOGGING ##########################
const dbErrorLog = async (dbRes) => {
    console.log(`| ERROR | ${dbRes.status + ', bruh, ' + dbRes.errorMessage} |`);
    logSave(`| ERROR | ${dbRes.status + ', bruh, ' + dbRes.errorMessage} |`);
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