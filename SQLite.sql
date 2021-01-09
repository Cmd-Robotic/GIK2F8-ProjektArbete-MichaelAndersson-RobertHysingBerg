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
    email VARCHAR(64) UNIQUE NOT NULL);

CREATE TABLE IF NOT EXISTS queryCategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    category VARCHAR(32) UNIQUE NOT NULL,
    description VARCHAR(512));

CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    userId INTEGER NOT NULL,
    username VARCHAR(32),
    title VARCHAR(32) NOT NULL,
    category VARCHAR(32) NOT NULL,
    description VARCHAR(512) NOT NULL,
    answers INTEGER DEFAULT 0,
    duplicateOf INTEGER DEFAULT -1, -- points to the id of the query it is a duplicate of
    duplicates INTEGER DEFAULT 0, -- how many duplicates a query has
    FOREIGN KEY (category) REFERENCES queryCategories(category),
    FOREIGN KEY (userId) REFERENCES users(id));

CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queryId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    answer VARCHAR(512) NOT NULL,
    vote INTEGER NOT NULL DEFAULT 0, -- 0 by default, -1 for downvote, 1 for upvote
    FOREIGN KEY (queryId) REFERENCES queries(id),
    FOREIGN KEY (userId) REFERENCES users(id));

INSERT INTO queryCategories (category) VALUES("Computer");
INSERT INTO queryCategories (category) VALUES("Cellphone");
INSERT INTO queryCategories (category) VALUES("Broadband");
INSERT INTO queryCategories (category) VALUES("Telephony");

-- DELETE FROM users WHERE id = 2;
-- DELETE FROM queries WHERE id = 1;
-- DELETE FROM answers WHERE id = 1;
-- DELETE FROM categories WHERE id = 1;

-- DROP TABLE tokens;
-- DROP TABLE answers;
-- DROP TABLE queries;
-- DROP TABLE queryCategories;
-- DROP TABLE users;
-- DROP TABLE userstatus;
-- DROP TABLE userlevel;