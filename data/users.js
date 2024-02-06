import { checkName, checkEmail, checkPassword, checkString, checkId } from "../utils/helpers";
import { users } from "../config/mongoCollections";
import { ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
const saltRounds = 8;


export const registerUser = async (firstName, lastName, email, password) => {
    if (!firstName || !lastName || !email || !password) {
        throw 'All input fields must be provided (registerUser)';
    }
    firstName = checkName(firstName, "First name");
    lastName = checkName(lastName, "Last name");
    emailAddress = checkEmail(emailAddress);
    password = checkPassword(password);
    let emailExists = await emailAlreadyExists(emailAddress);
    if (emailExists) {
        throw `emailAddress already exists (createUser)`;
    }
    const hashed = await bcrypt.hash(password, saltRounds);
    let newUser = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hashed,
		devices: [],
		points: 0
    };
    const userCollection = await users();
    const newInsertInformation = await userCollection.insertOne(newUser);
    if (!newInsertInformation.insertedId) {
        throw 'Insert failed!';
    }
    return await getUserById(newInsertInformation.insertedId.toString());
};

export const emailAlreadyExists = async (email) => {
    if (!email) {
      throw `Error: email must be inputed`;
    }
    email = checkEmail(email);
  
    const userCollection = await users();
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return false;
    } else {
      return true;
    }
};

export const checkUser = async (email, password) => {
    if (!email || !password) {
        throw "All input fields must be provided";
    }
    
    email = checkEmail(email);
    password = checkString(password, "Password");

    const userCollection = await users();

    const user = await userCollection.findOne({email: email});
    let validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
        let firstName = user.firstName;
        let lastName = user.lastName;
        let emailAddress = user.email;
        let _id = user._id.toString();
        return {_id, firstName, lastName, emailAddress};
    } else {
        throw "Either the email address or password is invalid";
    }
};

export const updateUser = async (id, firstName, lastName, email, password) => {
	let hashed1;
	if (id) {
		id = checkId(id);
	} else {
		throw `Error: No id given`;
	}
	if (firstName) {
		firstName = checkName(firstName);
	}
	if (lastName) {
		lastName = checkName(lastName);
	}
	if (email) {
		email = checkEmail(email);
	}
	if (password) {
		password = checkPassword(password);
		hashed1 = await bcrypt.hash(password, saltRounds);
	}

	let oldUser = await getUserById(id);
	let emailExists = false;

	if (oldUser.email !== email && email) {
		emailExists = await emailAlreadyExists(emailAddress);
		if (emailExists) {
			throw `Email already exists (updateUser)`
		}
	}

	const userUpdate = {
		firstName: firstName ? firstName : oldUser.firstName,
		lastName: lastName ? lastName : oldUser.lastName,
		email: email ? email : oldUser.email,
		password: hashed1 ? hashed1 : oldUser.password,
		username: username ? username : oldUser.username,
		age: age ? age : oldUser.age,
		devices: oldUser.devices,
		points: oldUser.points
	};

	const userCollection = await users();

	const updateInfo = await userCollection.replaceOne({_id: new ObjectId(id)}, userUpdate);

	if (updateInfo.modifiedCount === 0) {
		throw `At least one field must be different to successfully update user`;
	}
	let newInfo = await getUserById(id);
	return newInfo;
};

export const deleteUser = async (id) => {
	if (!id) {
		throw `Error: Id must be inputed`;
	  }
	  id = checkId(id);
	
	  const userCollection = await users();
	  const user = await userCollection.findOneAndDelete({ _id: new ObjectId(id) });
	  if (deletionInfo.lastErrorObject.n === 0) {
		throw `Error: Could not delete user with id of ${id}`;
	  }
	
	  return { ...deletionInfo.value, deleted: true };
};

export const getAllUsers = async () => {
	const userCollection = await users();
	const userList = await userCollection.find({}).toArray();
	return userList;
};

export const getUserById = async (id) => {
	if (!id) {
		throw "Error: Id must be inputed";
	}
	if (typeof id != "string") {
		throw "Error: Id must be a string";
	}
	if (id.length == 0 || id.trim().length == 0) {
		throw "Error: Id must not be an empty string or only include empty spaces";
	}
	id = id.trim();
	if (!ObjectId.isValid(id)) {
		throw "Error: Invalid Object Id";
	}
	const userCollection = await users();
	const user = await userCollection.findOne({ _id: new ObjectId(id) });
	if (!user) throw "Error: User not found";
	user._id = user._id.toString();
	return user;
};

export const helpTicket = async (email, message) => {
	if (!email) {
		throw "Error: Email must be inputed";
	}
	if (typeof email != "string") {
		throw "Error: Email must be a string";
	}
	if (email.length == 0 || email.trim().length == 0) {
		throw "Error: Email cannot be an empty string";
	}
	email = email.trim();
	if (!message) {
		throw "Error: Message must be inputed";
	}
	if (typeof message != "string") {
		throw "Error: Message must be a string";
	}
	if (message.length == 0 || message.trim().length == 0) {
		throw "Error: Message cannot be an empty string";
	}
	message = message.trim();
	const ticketCollection = await tickets();
	const newTicket = {
		email: email,
		message: message,
	};
	const insertInfo = await ticketCollection.insertOne(newTicket);
	if (insertInfo.insertedCount === 0) throw "Error: Could not add ticket";
	return newTicket;
};

export const subtractPoints = async (userId, rewardPoints) => {
	const userCollection = await users();
	const user = await getUserById(userId);
	// check if the user has enough points to subtract
	if (user.rewardPoints < rewardPoints) {
		throw "Error: User does not have enough points to subtract";
	}
	// subtract the points
	const newPoints = user.rewardPoints - rewardPoints;
	const updatedUser = await userCollection.updateOne(
		{ _id: new ObjectId(userId) },
		{ $set: { points: newPoints } }
	);
	if (updatedUser.modifiedCount === 0) throw "Error: Could not update user";
	return true;
};

export const addPoints = async (userId, rewardPoints) => {
	const userCollection = await users();
	const user = await getUserById(userId);
	// add the points
	const newPoints = user.rewardPoints + rewardPoints;
	const updatedUser = await userCollection.updateOne(
		{ _id: new ObjectId(userId) },
		{ $set: { points: newPoints } }
	);
	if (updatedUser.modifiedCount === 0) throw "Error: Could not update user";
	return true;
};

export const getTips = async () => {
	// array of tips as a string
	let tipArray = [
		"Ask suppliers to email you a receipt instead of printing it out",
		"Use natural light during the day instead of overhead lighting or lamps",
		"Organize carpool to work/events",
		"Tip 4",
		"Tip 5",
		"Tip 6",
		"Tip 7",
		"Tip 8",
		"Tip 9",
		"Tip 10",
	];
	let randomTips = [];
	// randomizes through the array and generates an array of 3 tips
	for (let i = 0; i < 3; i++) {
		let randomIndex = Math.floor(Math.random() * tipArray.length);
		randomTips.push(tipArray[randomIndex]);
		tipArray.splice(randomIndex, 1);
	}
	// returns the array of 3 tips
	return randomTips;
};

