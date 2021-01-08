const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const database = (async () => {
    return open({
        filename: './database.db',
        driver: sqlite3.Database
    });
})();



//##############################################################
//############################ ADD ############################
const addUser = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO users (level, username, password, fname, lname, email, status) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.level, data.username, data.password, data.fname, data.lname, data.email, data.status]);
        return { status: '200' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addQuery = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO queries (userid, name, category, description) VALUES(?, ?, ?, ?)', [data.userid, data.name, data.category, data.description]);
        const query = await dbConnection.get('SELECT MAX(rowid) FROM queries');
        return { status: '200', content: query };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addAnswer = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO answers (queryid, userid, description) VALUES(?, ?, ?)', [data.queryid, data.userid, data.description]);
        const answer = await dbConnection.get('SELECT MAX(rowid) FROM answers');
        return { status: '200', content: answer };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addUserPic = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE users SET picture = (?) WHERE id = (?)', [data.path, data.id]);
        return { status: '200', content: 'User updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addQueryPic = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queries SET picture = (?) WHERE id = (?)', [data.path, data.id]);
        return { status: '200', content: 'Query updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};



//##############################################################
//############################ GET ############################
const getUserByEmail = async (email) => {
    try {
        const dbConnection = await database;
        const user = await dbConnection.get('SELECT id, password FROM users WHERE email = (?)', [email]);
        if (user) {
            return { status: '200', user: user };
        }
        else {
            return { status: '404', errorMessage: 'User not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUsers = async () => {
    try {
        const dbConnection = await database;
        const users = await dbConnection.all('SELECT id, accessLevel, username, fname, lname, email , lastLogin FROM users ORDER BY accessLevel DESC');
        if (users) {
            return { status: '200', content: users };
        }
        else
            throw error;
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUser = async (id) => {
    try {
        const dbConnection = await database;
        const user = await dbConnection.get('SELECT accessLevel, username, fname, lname, email, picture FROM users WHERE id = (?)', [id]);
        if (user) {
            return { status: '200', user: user };
        }
        else {
            return { status: '404', errorMessage: 'User not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUserByUsername = async (username) => {
    try {
        const dbConnection = await database;
        const user = await dbConnection.get('SELECT id, password FROM users WHERE username = (?)', [username]);
        if (user) {
            return { status: '200', user: user };
        }
        else {
            return { status: '404', errorMessage: 'User not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUserLevel = async (data) => {
    try {
        const dbConnection = await database;
        const category = await dbConnection.all('SELECT level, description FROM userlevel WHERE id = (?)', [data]);
        if (category.length > 0) {
            return { status: '200', content: category };
        }
        else {
            return { status: '404', content: 'Userlevel not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUserStatus = async (data) => {
    try {
        const dbConnection = await database;
        const category = await dbConnection.all('SELECT status, description FROM userstatus WHERE id = (?)', [data]);
        if (category.length > 0) {
            return { status: '200', content: category };
        }
        else {
            return { status: '404', content: 'Userstatus not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};

const getQueries = async () => {
    try {
        const dbConnection = await database;
        const queries = await dbConnection.all('SELECT id, userid, name, category, description, picture FROM queries ORDER BY id ASC');
        if (queries) {
            return { status: '200', content: queries };
        }
        else
            throw error;
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getQuery = async (id) => {
    try {
        const dbConnection = await database;
        const query = await dbConnection.all('SELECT id, userid, name, category, description, picture FROM queries WHERE id = (?)', [id]);
        if (query.length > 0) {
            return { status: '200', content: query };
        }
        else {
            return { status: '404', content: 'Query not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getCategory = async (data) => {
    try {
        const dbConnection = await database;
        const category = await dbConnection.all('SELECT category, description FROM querycat WHERE category = (?)', [data]);
        if (category.length > 0) {
            return { status: '200', content: category };
        }
        else {
            return { status: '404', content: 'Category not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};



//##############################################################
//############################ UPDATE ############################
const updateUser = async (id, data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE users SET level = (?), username = (?), fname = (?), lname = (?), email = (?) WHERE id = (?)', [data.level, data.username, data.fname, data.lname, data.email, id]);
        return { status: '200', content: 'User updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

};

const updateQuery = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queries SET name = (?), category = (?), price = (?), description = (?), picture = (?) WHERE id = (?)', [data.name, data.category, data.price, data.description, data.picture, data.id]);
        return { status: '200', content: 'Query updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

};



//##############################################################
//############################ DELETE ############################
const deleteUser = async (id) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('DELETE FROM users WHERE id = (?)', [id]);
        return { status: '200', content: 'User deleted' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

}
const deleteQuery = async (id) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('DELETE FROM queries WHERE id = (?)', [id]);
        return { status: '200', content: 'Query deleted' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

}


//#####################################################################
//############################ LOG TO FILE ############################
async function logSave(entry) {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1);
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
            fs.writeFile(path, logEntry, { flag: 'a+' }, (err) => {
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


//##############################################################
//############################ EXPORT ############################
module.exports = {
    getUserByEmail: getUserByEmail,
    getUsers : getUsers,
    getUser : getUser,
    getUserByUsername : getUserByUsername,
    getUserLevel : getUserLevel,
    getUserStatus : getUserStatus,
    getQueries : getQueries,
    getQuery : getQuery,
    getCategory: getCategory,
    addUser : addUser,
    addQuery : addQuery,
    addAnswer : addAnswer,
    addUserPic: addUserPic,
    addQueryPic: addQueryPic,
    updateUser : updateUser,
    updateQuery : updateQuery,
    deleteUser : deleteUser,
    deleteQuery : deleteQuery
}