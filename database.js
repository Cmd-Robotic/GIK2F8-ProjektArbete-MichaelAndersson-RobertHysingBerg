const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');

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
        await dbConnection.run('INSERT INTO users (accessLevel, username, password, fname, lname, email) VALUES(?, ?, ?, ?, ?, ?)', [data.accessLevel, data.username, data.password, data.fname, data.lname, data.email]);
        return { status: '200', message: 'User created succesfully' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addQuery = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO queries (title, category, userId, username, description) VALUES(?, ?, ?, ?, ?)', [data.title, data.category, data.userId, data.username, data.description]);
        const query = await dbConnection.get('SELECT id, time, username, title, category, description FROM queries ORDER BY id DESC LIMIT 1');
        if (!query) {
            return {status: '404', errorMessage: 'ERROR! Could not find Query'};
        }
        return { status: '200', query: query };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addAnswer = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO answers (queryId, userId, answer) VALUES(?, ?, ?)', [data.queryId, data.userId, data.answer]);
        await dbConnection.run('UPDATE queries SET answers = (answers + 1) WHERE id = ?', [data.queryId]);
        const answer = await dbConnection.get('SELECT MAX(rowid) FROM answers');
        if (!answer) {
            return {status: '404', errorMessage: 'ERROR! Could not find answer'};
        }
        return { status: '200', answer: answer };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
/*
const addUserPic = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE users SET picture = (?) WHERE id = (?)', [data.path, data.id]);
        return { status: '200', message: 'User updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const addQueryPic = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queries SET picture = (?) WHERE id = (?)', [data.path, data.id]);
        return { status: '200', message: 'Query updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
*/
const addCategory = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('INSERT INTO queryCategories (category, description) VALUES(?, ?)', [data.category,data.description]);
        const answer = await dbConnection.get('SELECT MAX(rowid) FROM queryCategories');
        if (!answer) {
            return {status: '404', errorMessage: 'ERROR! Could not find answer'};
        }
        return { status: '200', answer: answer };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
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
        return { status: '400', errorMessage: 'ERROR! Database failure' };
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
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUsers = async () => {
    try {
        const dbConnection = await database;
        const users = await dbConnection.all('SELECT id, accessLevel, username, fname, lname, email FROM users ORDER BY accessLevel DESC');
        if (users.length > 0) {
            return { status: '200', users: users };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find any users'};
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getUser = async (id) => {
    try {
        const dbConnection = await database;
        const user = await dbConnection.get('SELECT id, accessLevel, username, fname, lname, email FROM users WHERE id = (?)', [id]);
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
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
/*  is this code needed? it's not used anywhere
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
*/
const getQueries = async () => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries ORDER BY time DESC');
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find any Queries'};
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getQueriesByUserId = async (id) => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries WHERE userId = (?) ORDER BY id ASC', [id]);
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else
            return { status: '404', errorMessage: 'ERROR! Could not find any Queries' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getQueriesByCategory = async (category) => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries WHERE category = (?) ORDER BY id ASC', [category]);
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else
            return { status: '404', errorMessage: 'ERROR! Could not find any Queries' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getFrequentQueries = async () => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries ORDER BY duplicates DESC LIMIT 6');
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else
            return { status: '404', errorMessage: 'ERROR! Could not find Queries' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getFrequentQueriesByCategory = async (category) => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries WHERE category = ? ORDER BY duplicates DESC LIMIT 6', [category]);
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find Queries' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getLastQueries = async () => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries ORDER BY time DESC LIMIT 6');
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find queries' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getLastQueriesByCategory = async (category) => {
    try {
        let queries = []
        const dbConnection = await database;
        queries = await dbConnection.all('SELECT id, time, userId, username, title, category, description, answers, duplicates FROM queries WHERE category = ? ORDER BY time DESC LIMIT 6', [category]);
        if (queries.length > 0) {
            return { status: '200', queries: queries };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find queries' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', content: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getAnswersToQuery = async (id) => {
    try {
        let answers = []
        const dbConnection = await database;
        answers = await dbConnection.all('SELECT id, time, userId, queryId, answer, vote FROM answers WHERE queryId = (?) ORDER BY time DESC', [id]);
        if (answers.length > 0) {
            return { status: '200', answers: answers };
        }
        else
            return { status: '404', errorMessage: 'ERROR! Could not find Answers' };
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
const getQuery = async (id) => {
    try {
        const dbConnection = await database;
        const query = await dbConnection.all('SELECT id, userId, title, category, description FROM queries WHERE id = (?)', [id]);
        if (query.length > 0) {
            return { status: '200', query: query };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Query not found' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};
/* uhm, isn't this useless? like, you need the category to get the category?
const getCategory = async (data) => {
    try {
        const dbConnection = await database;
        const category = await dbConnection.all('SELECT category, description FROM queryCategories WHERE category = (?)', [data]);
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
*/
const getCategories = async () => {
    try {
        const dbConnection = await database;
        const categories = await dbConnection.all('SELECT category, description FROM queryCategories');
        if (category.length > 0) {
            return { status: '200', categories: categories };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find categories' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
    }
}
const getCategory = async (id) => {
    try {
        const dbConnection = await database;
        const categories = await dbConnection.get('SELECT category, description FROM queryCategories WHERE id=?', [id]);
        if (category) {
            return { status: '200', categories: categories };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find categories' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
    }
}
const getCategoryByName = async (category) => {
    try {
        const dbConnection = await database;
        const categories = await dbConnection.get('SELECT id, category, description FROM queryCategories WHERE category=?', [category]);
        if (category) {
            return { status: '200', categories: categories };
        }
        else {
            return { status: '404', errorMessage: 'ERROR! Could not find category' };
        }
    }
    catch (error) {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
    }
}

//##############################################################
//############################ UPDATE ############################
const updateUser = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE users SET accessLevel = (?), username = (?), fname = (?), lname = (?), email = (?) WHERE id = (?)', [data.accessLevel, data.username, data.fname, data.lname, data.email, data.id]);
        return { status: '200', message: 'User updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

};

const updateQuery = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queries SET title = ?, category = ?, description = ?, duplicateOf = ? WHERE id = ?', [data.title, data.category, data.description, data.duplicateOf, data.id]);
        if (data.duplicateOf > -1) {
            await dbConnection.run('UPDATE queries SET duplicates = (duplicates + 1) WHERE id=?',[data.id]);
        }
        return { status: '200', message: 'Query updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};

const updateQueryDupeCount = async (id, amount) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queries SET duplicates = (duplicates + ?) WHERE id = ?', [amount, id]);
        if (data.duplicateOf > -1) {
            await dbConnection.run('UPDATE queries SET duplicates = (duplicates + 1) WHERE id=?',[data.id]);
        }
        return { status: '200', message: 'Query updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
}

const updateAnswer = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE answers SET answer = ? WHERE id = ?', [data.answer, data.id]);
        return { status: '200', message: 'Answer updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};

const updateCategory = async (data) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('UPDATE queryCategories SET category = ?, description = ? WHERE id = ?', [data.category, data.description, data.id]);
        return { status: '200', message: 'Category updated' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
};

//##############################################################
//############################ DELETE ############################
const deleteUser = async (id) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('DELETE FROM users WHERE id = (?)', [id]);
        return { status: '200', message: `User ${id} deleted` };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }

}
const deleteQuery = async (id) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('DELETE FROM queries WHERE id = (?)', [id]);
        return { status: '200', message: `Query ${id} deleted` };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
}
const deleteAnswer = async (id) => {
    try {
        const dbConnection = await database;
        const query = dbConnection.get('SELECT queryId FROM answers WHERE id = ?', [id])
        if (!query) {
            return { status: '404', errorMessage: 'ERROR! Could not find query'}
        }
        await dbConnection.run('DELETE FROM answers WHERE id = (?)', [id]);
        await dbConnection.run('UPDATE queries SET answers = (answers - 1) WHERE id = ?', [query.queryId])
        return { status: '200', message: 'answer deleted' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
        //throw new Error('Något gick fel vid kommunikation med databasen');
    }
}
const deleteCategory = async (id) => {
    try {
        const dbConnection = await database;
        await dbConnection.run('DELETE FROM queryCategories WHERE id = (?)', [id]);
        return { status: '200', message: 'Category deleted' };
    }
    catch {
        console.log(`| ERROR | ${error} |`);
        logSave(`| ERROR | ${error} |`);
        return { status: '400', errorMessage: 'ERROR! Database failure' };
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
    // User stuff
    getUserByEmail: getUserByEmail,
    getUserByUsername : getUserByUsername,
    getUsers : getUsers,
    getUser : getUser,
    addUser : addUser,
    // addUserPic : addUserPic,
    updateUser : updateUser,
    deleteUser : deleteUser,
    // getUserLevel : getUserLevel,
    // getUserStatus : getUserStatus,
    // Query stuff
    getQueries : getQueries,
    getQuery : getQuery,
    addQuery : addQuery,
    // addQueryPic : addQueryPic,
    updateQuery : updateQuery,
    updateQueryDupeCount: updateQueryDupeCount,
    deleteQuery : deleteQuery,
    getFrequentQueries : getFrequentQueries,
    getFrequentQueriesByCategory : getFrequentQueriesByCategory,
    getLastQueries : getLastQueries,
    getLastQueriesByCategory : getLastQueriesByCategory,
    getQueriesByUserId : getQueriesByUserId,
    getQueriesByCategory : getQueriesByCategory,
    // answers
    getAnswersToQuery : getAnswersToQuery,
    addAnswer : addAnswer,
    updateAnswer : updateAnswer,
    deleteAnswer : deleteAnswer,
    // categories
    getCategories : getCategories,
    getCategory : getCategory,
    getCategoryByName : getCategoryByName,
    addCategory : addCategory,
    updateCategory : updateCategory,
    deleteCategory : deleteCategory
}