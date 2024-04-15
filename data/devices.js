import {
	checkName,
	checkEmail,
	checkPassword,
	checkString,
	checkId,
	checkDeviceGoals,
} from "../utils/helpers.js";
import {createLog, createPrevLog} from './users.js'
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { getPointsByGoal } from "../utils/goals.js";

//May need to be changed
export const serialNumAlreadyExists = async (serialNum) => {
	if (!serialNum) {
		throw `Error: Serial number must be inputed`;
	}
	serialNum = checkString(serialNum);

	const userCollection = await users();
	const user = await userCollection.findOne({
		"devices.serialNum": serialNum,
	});
	if (!user) {
		return false;
	} else {
		return true;
	}
};

export const registerDevice = async (
	userId,
	serialNum,
	deviceName,
	deviceGoals
) => {
	if (!userId || !serialNum || !deviceGoals || !deviceName) {
		throw `Error: All inputs must be provided (registerDevice)`;
	}
	userId = checkId(userId);
	serialNum = checkString(serialNum, "Serial Number");
	deviceGoals = checkDeviceGoals(deviceGoals);
	deviceName = checkString(deviceName, "Device Name");
	let serialAlreadyExists = await serialNumAlreadyExists(serialNum);
	if (serialAlreadyExists) {
		throw `Error: Device already registered`;
	}
	for (let i = 0; i < deviceGoals.length; i++) {
		let goal = {
			info: deviceGoals[i],
			totalPoints: await getPointsByGoal(deviceGoals[i]),
			userPoints: 0
		};
		deviceGoals[i] = goal;
	}
	// console.log(deviceGoals);
	let prevLog = createPrevLog();
	let devLog = createLog(prevLog);
	let newDevice = {
		_id: new ObjectId(),
		deviceOwner: userId,
		serialNum: serialNum,
		deviceGoals: deviceGoals,
		deviceName: deviceName,
		prevLog: prevLog,
		log: devLog
	};
	const userCollection = await users();
	let device = await userCollection.findOneAndUpdate(
		{ _id: new ObjectId(userId) },
		{ $push: { devices: newDevice } },
		{ returnDocument: "after" }
	);
	if (!device) {
		throw `Error: Could not register device`;
	}
	return newDevice;
};

export const getDevice = async (userId, deviceId) => {
	if (!deviceId || !userId) {
		throw `Error: No userId and/or deviceId given (getDevice)`;
	}
	userId = checkId(userId);
	deviceId = checkId(deviceId);
	const userCollection = await users();
	let device = await userCollection.findOne(
		{ _id: new ObjectId(userId), "devices._id": new ObjectId(deviceId) },
		{
			projection: {
				_id: 0,
				devices: { $elemMatch: { _id: new ObjectId(deviceId) } },
			},
		}
	);
	if (!device) {
		throw `Error: Device not found`;
	}
	device.devices[0]._id = device.devices[0]._id.toString();
	return device.devices[0];
};

export const removeDevice = async (userId, deviceId) => {
	if (!deviceId || !userId) {
		throw `Error: No userId and/or deviceId given (removeDevice)`;
	}
	userId = checkId(userId);
	deviceId = checkId(deviceId);
	let old = await getDevice(userId, deviceId);
	if (old.deviceOwner.toString() !== userId) {
		throw `Error: Cannot delete a device that does not belong to you`;
	}
	const userCollection = await users();
	let deleted = await userCollection.findOneAndUpdate(
		{ _id: new ObjectId(deviceId) },
		{ $pull: { devices: { _id: new ObjectId(deviceId) } } },
		{ returnDocument: "after" }
	);
	if (!deleted.value) {
		throw `Error: Unable to delete device`;
	}
	return deleted.value;
};

//May also need to be changed
export const editDeviceGoal = async (userId, deviceId, deviceGoals) => {
	if (!userId || !deviceId || !deviceGoals) {
		throw `Error: All inputs must be provided (editDeviceGoal)`;
	}
	userId = checkId(userId);
	deviceId = checkId(deviceId);
	deviceGoals = checkDeviceGoals(deviceGoals);
	let old = await getDevice(userId, deviceId);
	if (old.deviceOwner.toString() !== userId) {
		throw `Error: Cannot edit a device that does not belong to you`;
	}
	const userCollection = await users();
	let updated = await userCollection.updateOne(
		{ _id: new ObjectId(userId), "devices._id": new ObjectId(deviceId) },
		{ $set: { "devices.$.deviceGoals": deviceGoals } }
	);
	if (!updated.acknowledged) {
		throw `Error: Unable to update device goals`;
	}
	let updatedDevice = getDevice(userId, deviceId);
	return updatedDevice;
};

/** 
 * Finds the goal for the given user and adds userPointsGained to the found goal's userPoints.
 * @param {String} userId A valid ObjectId string
 * @param {String} deviceId A valid ObjectId string
 * @param {String} goalInfo A valid string that matches one of the descriptions of the goals
 * @param {Number} userPointsGained A whole number representing the amount of points gained by the user
 * @returns true iff all given parameters are valid
 */
export const addPointsToGoal = async (userId, deviceId, goalInfo, userPointsGained) => {
	if (!userId) {
		throw "Error: User Id must be inputed";
	}
	if (typeof userId != "string") {
		throw "Error: User Id must be a string";
	}
	if (userId.length == 0 || userId.trim().length == 0) {
		throw "Error: User Id must not be an empty string or only include empty spaces";
	}
	if (!deviceId) {
		throw "Error: Device Id must be inputed";
	}
	if (typeof deviceId != "string") {
		throw "Error: Device Id must be a string";
	}
	if (deviceId.length == 0 || deviceId.trim().length == 0) {
		throw "Error: Device Id must not be an empty string or only include empty spaces";
	}
	if (!goalInfo) {
		throw "Error: Goal info must be inputed";
	}
	if (typeof goalInfo != "string") {
		throw "Error: Goal info must be a string";
	}
	if (goalInfo.length == 0 || goalInfo.trim().length == 0) {
		throw "Error: Goal info must not be an empty string or only include empty spaces";
	}
	if (!userPointsGained) {
		throw "Error: User points gained must be inputed";
	}
	if (typeof userPointsGained != "number") {
		throw "Error: User points gained must be a number";
	}
	if (userPointsGained <= 0) {
		throw "Error: User points gained must be greater than 0";
	}
	if (userPointsGained % 1 != 0) {
		throw "Error: User points gained must be an integer";
	}
	
	const device = await getDevice(userId, deviceId);
	// whichever goal matches the given goal description will become our current goal
	let currentGoal = device.deviceGoals.find(goal => goal.info == goalInfo);
	// increment the user's points by the highest possible points the user can gain for the given goal
	const pointsToAdd = Math.min(currentGoal.totalPoints, userPointsGained);
	currentGoal.userPoints += pointsToAdd;
	// add the points gained by user to their point total
	const userCollection = await users();
	const updateResult = await userCollection.updateOne(
		{
			"_id": new ObjectId(userId)
		},
		{
			$inc: {"devices.$[device].deviceGoals.$[goal].userPoints": userPointsGained}
		},
		{
			arrayFilters: [
				{ "device._id": new ObjectId(deviceId) }, // Replace with the actual device ObjectId
				{ "goal.info": goalInfo }
			]
		}
	);
	if (updateResult.modifiedCount == 0) {
		throw `Error: Internal Server Error`;
	}
	return true;
};

export const resetGoalPoints = async (userId, deviceId, goalInfo) => {
	if (!userId) {
		throw "Error: User Id must be inputed";
	}
	if (typeof userId != "string") {
		throw "Error: User Id must be a string";
	}
	if (userId.length == 0 || userId.trim().length == 0) {
		throw "Error: User Id must not be an empty string or only include empty spaces";
	}
	if (!deviceId) {
		throw "Error: Device Id must be inputed";
	}
	if (typeof deviceId != "string") {
		throw "Error: Device Id must be a string";
	}
	if (deviceId.length == 0 || deviceId.trim().length == 0) {
		throw "Error: Device Id must not be an empty string or only include empty spaces";
	}
	if (!goalInfo) {
		throw "Error: Goal info must be inputed";
	}
	if (typeof goalInfo != "string") {
		throw "Error: Goal info must be a string";
	}
	if (goalInfo.length == 0 || goalInfo.trim().length == 0) {
		throw "Error: Goal info must not be an empty string or only include empty spaces";
	}
	
	const device = await getDevice(userId, deviceId);
	// whichever goal matches the given goal description will become our current goal
	let currentGoal = device.deviceGoals.find(goal => goal.info == goalInfo);
	// reset the user's points for the given goal back to 0
	currentGoal.userPoints = 0;
	return true;
};

export const updateDeviceLog = async (userId, deviceId, log) => {
	if (!userId) {
		throw "Error: User Id must be inputed";
	}
	if (typeof userId != "string") {
		throw "Error: User Id must be a string";
	}
	if (userId.length == 0 || userId.trim().length == 0) {
		throw "Error: User Id must not be an empty string or only include empty spaces";
	}
	if (!deviceId) {
		throw "Error: Device Id must be inputed";
	}
	if (typeof deviceId != "string") {
		throw "Error: Device Id must be a string";
	}
	if (deviceId.length == 0 || deviceId.trim().length == 0) {
		throw "Error: Device Id must not be an empty string or only include empty spaces";
	}
	if (!log) {
		throw "Error: Log must be inputed";
	}
	if (typeof log != "object") {
		throw "Error: Log must be an object";
	}
	if (Object.keys(log).length == 0) {
		throw "Error: Log must not be an empty string or only include empty spaces";
	}

	const newLog = createLog(log);
	const userCollection = await users();
	let updated = await userCollection.updateOne(
		{ _id: new ObjectId(userId), "devices._id": new ObjectId(deviceId) },
		{ $set: { "devices.$.log": newLog, "devices.$.prevLog": log } }
	);
	if (!updated.acknowledged) {
		throw `Error: Unable to update device log`;
	}
	return true;
}