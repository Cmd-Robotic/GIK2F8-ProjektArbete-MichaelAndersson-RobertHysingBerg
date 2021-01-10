/* Putting the regex I use here for easy access
Email addresses:
/(?:([a-zA-Z0-9])+\@(?:[a-zA-Z0-9])+\.(?:[a-zA-Z]+))/
Names:
/(?:[a-zåäöA-ZÅÄÖ]{1,32})/
Usernames:
/(?:[a-zåäöA-ZÅÄÖ0-9_-]{1,32})/
Titles:
/(?:[a-zåäöA-ZÅÄÖ0-9_\- ?!.,]{1,32})/
Passwords:
/(?:[a-zA-Z0-9_-]{8,64})/
Descriptions:
/(?:[a-zåäöA-ZÅÄÖ0-9 _\-.,\\\/!?]{32,512})/
Id:
/(?:[0-9]{1,15})/
Token:
/(?:[A-Za-z0-9$\/.]{60})/
*/

const validEmail = async (email) => {
    if (email.length && typeof(email) == 'string' && email.length < 65) {
        const match = email.match(/(?:([a-zA-Z0-9])+\@(?:[a-zA-Z0-9])+\.(?:[a-zA-Z]+))/);
        if (match && match[0] === match['input']) {
            return email;
        }
    }
    return;
}

const validName = async (name) => {
    if (name.length) {
        if (typeof(name) == 'string') {
            const match = name.match(/(?:[a-zåäöA-ZÅÄÖ]{1,32})/);
            if (match && match[0] === match['input']) {
                return name;
            }
        }
    }
    return;
}

const validUsername = async (name) => {
    if (name.length) {
        if (typeof(name) == 'string') {
            const match = name.match(/(?:[a-zåäöA-ZÅÄÖ0-9_-]{1,32})/);
            if (match && match[0] === match['input']) {
                return name;
            }
        }
    }
    return;
}

const validTitle = async (name) => {
    if (name.length) {
        if (typeof(name) == 'string') {
            const match = name.match(/(?:[a-zåäöA-ZÅÄÖ0-9_\- ?!.,]{1,32})/);
            if (match && match[0] === match['input']) {
                return name;
            }
        }
    }
    return;
}

const validPassword = async (pwd) => {
    if (pwd.length) {
        if (typeof(pwd) == 'string') {
            const match = pwd.match(/(?:[a-zA-Z0-9_-]{8,64})/);
            if (match) {
                if (match[0] === match['input']) {
                    return pwd;
                }
            }
        }
    }
    return;
}

// quotation marks handling to be implemented
const validDescription = async (desc) => {
    if (desc.length && typeof(desc) == 'string' && desc.length < 513) {
        const match = desc.match(/(?:[a-zåäöA-ZÅÄÖ0-9 _\-.,\\\/!?]{1,512})/);
        if (match && match[0] === match['input']) {
            return desc;
        }
    }
    return;
}

const validId = async (id) => {
    if (typeof(id) == 'number') {
        if (id > -1 && Number.isInteger(id)) {
            return id;
        }
    }
    if (typeof(id) == 'string') {
        const match = id.match(/(?:[0-9]{1,15})/);
        if (match && match[0] === match['input']) {
            return parseInt(id);
        }
    }
    return;
}

// allways returns nothing or an int between -1 and 4
const validAccessLevel = async (al) => {
    if (typeof(al) == 'number') {
        if (al > -1 && al < 4 && Number.isInteger(al)) {
            return al;
        }
    }
    if (typeof(al) == 'string') {
        const match = al.match(/(?:[0123]{1})/);
        if (match && match[0] === match['input']) {
            const validAL = parseInt(al);
            return validAL;
        }
    }
    return;
}

const validFileExtension = async (ext) => {
    if (ext.length) {
        if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
            return ext;
        }
    }
    return;
}

// should only be used to verify tokens recieved externally
const validToken = async (tok) => {
    if (tok.length && typeof(tok) == 'string') {
        // the match is based on bcrypt
        const match = tok.match(/(?:[A-Za-z0-9$\/.]{60})/);
        if (match && match[0] === match['input']) {
            return tok;
        }
    }
    return;
}

const validVote = async (vote) => {
    if (vote == 1 || vote == -1) {
        return vote;
    }
    return;
}

module.exports = {
    validName: validName,
    validEmail: validEmail,
    validTitle: validTitle,
    validPassword: validPassword,
    validDescription: validDescription,
    validId: validId,
    validFileExtension: validFileExtension,
    validToken: validToken,
    validAccessLevel: validAccessLevel,
    validUsername: validUsername,
    validVote: validVote
}