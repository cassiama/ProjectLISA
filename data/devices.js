import {
	checkName,
	checkEmail,
	checkPassword,
	checkString,
	checkId,
	checkDeviceGoals,
} from "../utils/helpers.js";
import { users } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

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
	let newDevice = {
		_id: new ObjectId(),
		deviceOwner: userId,
		serialNum: serialNum,
		deviceGoals: deviceGoals,
		deviceName: deviceName,
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
		throw `Error: No userId and/or deviceId given (getDevice)`;
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
	return updated;
};
