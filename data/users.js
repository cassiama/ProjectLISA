import { users, tickets } from "./mongoCollections.js";
import { ObjectId } from "mongodb";


export const registerUser = async (firstName, lastName, email, password) => {};

export const checkUser = async (email, password) => {};

export const updateUser = async (id, firstName, lastName, email, password) => {};

export const deleteUser = async id => {};

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

zzconst subtractPoints = async (userId, rewardPoints) => {
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

const addPoints = async (userId, rewardPoints) => {
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

const getTips = async () => {
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

export {
	getAllUsers,
	getUserById,
	helpTicket,
	subtractPoints,
	addPoints,
	getTips,
};
