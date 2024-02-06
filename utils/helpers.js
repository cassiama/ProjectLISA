import { ObjectId } from "mongodb";

export const checkDeviceGoals = (goals) => {
    return goals;
}

export const checkString = (str, stringName) => {
    if (typeof str !== 'string' || str.trim().length === 0) {
        throw `${stringName} must be a valid string`;
    }
    return str.trim();
}

export const checkName = (name, stringName) => {
    name = checkString(name, "Name");
    if (!/^[a-zA-Z]+/.test(name)) {
        throw `Error: ${stringName} cannot contain any spaces or numbers`
    }
    if (name.split(" ").length > 1) {
        throw `Error: ${stringName} cannot contain spaces`;
    }
    if (name.length < 2 || name.length > 25) {
        throw `Error: ${stringName} cannot be less than 2 or greater than 25 characters`;
    }
    return name;
}

export const checkEmail = (email) => {
    email = checkString(email, "Email");
    if (email.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) === false) {
        throw "Error: You must provide a valid email";
    }
    return email.toLowerCase();
}

export const checkPassword = (password) => {
    password = checkString(password, "Password");

    if (password.split(" ").length > 1) {
        throw `Error: Password cannot contain spaces`;
    }
    if (password.length < 8) {
        throw `Error: Password length must be at least 8`;
    }
    if (!/[A-Z]/.test(password)) {
        throw `Error: Password must contain at least one uppercase character`;
    }
    if (!/\d/.test(password)) {
        throw `Error: Password must contain at least one number`;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw `Error: Password must contain at least one special character`;
    }
    return password;
}

export const checkUsername = (username) => {
    username = checkString(username, "Username");
    if (username.length < 2 || username.length > 25) {
        throw `Error: ${username} cannot be less than 2 or greater than 25 characters`;
    }
    if (username.split(" ").length > 1) {
        throw `Error: Username cannot contain spaces`;
    }
    if (!/[a-zA-Z]/.test(username)) {
        throw `Error: Username must contain at least one letter`;
    }
    return username.toLowerCase();
}

export const checkId = (id) => {
    id = checkString(id, "Id");
    if (!ObjectId.isValid(id)) {
        throw 'Error: Invalid Object Id';
    }
    return id;
}

