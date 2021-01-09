-- SQLite

-- CREATE TABLE IF NOT EXISTS userlevel (
--     id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
--     level VARCHAR(32) NOT NULL,
--     description VARCHAR(512));

-- CREATE TABLE IF NOT EXISTS userstatus (
--     id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
--     status VARCHAR(32) NOT NULL,
--     description VARCHAR(512));

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    accessLevel INTEGER(1) NOT NULL,
    username VARCHAR(32) UNIQUE NOT NULL,
    password VARCHAR(256) NOT NULL,
    fname VARCHAR(32) NOT NULL,
    lname VARCHAR(32) NOT NULL,
    email VARCHAR(64) UNIQUE NOT NULL,
    lastLogin DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    picture VARCHAR(256));

CREATE TABLE IF NOT EXISTS queryCategory (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    category VARCHAR(32) NOT NULL,
    description VARCHAR(512));

CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    userId INTEGER NOT NULL,
    username VARCHAR(32),
    title VARCHAR(32) NOT NULL,
    category INTEGER(16) NOT NULL,
    description VARCHAR(512) NOT NULL,
    picture VARCHAR(256) NULL,
    answers INTEGER DEFAULT 0,
    duplicate INTEGER DEFAULT 0, -- points to the id of the query it is a duplicate of
    FOREIGN KEY (category) REFERENCES queryCategory(id),
    FOREIGN KEY (userId) REFERENCES users(id));

CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queryId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    answer VARCHAR(512) NOT NULL,
    FOREIGN KEY (queryId) REFERENCES queries(id),
    FOREIGN KEY (userId) REFERENCES users(id));

CREATE TABLE IF NOT EXISTS tokens (
    userId INTEGER UNIQUE NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,  -- remember to check if the token was saved
    validUntil DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id));

INSERT INTO queryCategory (category) VALUES("Computer");
INSERT INTO queryCategory (category) VALUES("Cellphone");
INSERT INTO queryCategory (category) VALUES("Broadband");
INSERT INTO queryCategory (category) VALUES("Telephony");

-- DELETE FROM users WHERE id = 2;
-- DELETE FROM queries WHERE id = 1;
-- DELETE FROM answers WHERE id = 1;
-- DELETE FROM categories WHERE id = 1;

-- DROP TABLE tokens;
-- DROP TABLE answers;
-- DROP TABLE queries;
-- DROP TABLE queryCategory;
-- DROP TABLE users;
-- DROP TABLE userstatus;
-- DROP TABLE userlevel;