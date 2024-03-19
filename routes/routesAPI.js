import { Router } from "express";
import xss from "xss";
import {
	checkEmail,
	checkId,
	checkName,
	checkPassword,
	checkString,
} from "../utils/helpers.js";
import {
	registerUser,
	updateUser,
	checkUser,
	getAllUsers,
	getUserById,
	addPoints,
	getTotalPoints,
} from "../data/users.js";
import {
	serialNumAlreadyExists,
	registerDevice,
	getDevice,
	removeDevice,
} from "../data/devices.js";
import { allGoals } from "../utils/goals.js";
const routes = Router();

routes.get("/", (req, res) => {
	if (req.session.user) res.redirect("/dashboard");
	else res.redirect("/login");
});

routes
	.route("/register")
	// Render the register page if the user is logged out; else, redirect to profile page.
	.get(async (req, res) => {
		// console.log(req.session.user);
		if (req.session.user) res.redirect("/account");
		else res.render("register");
	})
	.post(async (req, res) => {
		// console.log(req.body);
		let errors = [];
		let email = req.body.email;
		let firstName = req.body.firstName;
		let lastName = req.body.lastName;
		let password = req.body.password;
		let confirmPassword = req.body.confirmPassword;
		let ageInput = req.body.ageInput;
		let occupation = req.body.occupation;
		let numberDevices = req.body.numberDevices;
		let geography = req.body.geography;
		let os = req.body.os;
		let phoneSys = req.body.phoneSys;

		if (typeof email === "undefined") errors.push("No email provided.");
		else if (typeof firstName === "undefined")
			errors.push("No first name provided.");
		else if (typeof lastName === "undefined")
			errors.push("No last name provided.");
		else if (typeof password === "undefined")
			errors.push("No password provided.");

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("register", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let validEmail;
		try {
			validEmail = checkEmail(email);
		} catch (e) {
			errors.push(e);
		}

		let validFirstName;
		try {
			validFirstName = checkName(firstName, "First Name");
		} catch (e) {
			errors.push(e);
		}

		let validLastName;
		try {
			validLastName = checkName(lastName, "Last Name");
		} catch (e) {
			errors.push(e);
		}

		let validPassword;
		try {
			if (password !== confirmPassword) throw `Passwords do not match.`;
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push(e);
		}

		let validAge;
		try {
			// validAge = Number.parseInt(ageInput);
			// if (!Number.isInteger(validAge) || isNaN(validAge)) throw 'Age is not a valid number.';
			validAge = checkString(ageInput, "Age");
		} catch (e) {
			errors.push(e);
		}

		let validNumDevices;
		try {
			// validNumDevices = Number.parseInt(numberDevices);
			// if (!Number.isInteger(validNumDevices) || isNaN(validNumDevices))
			// 	throw 'The number of devices is not a valid number.';
			validNumDevices = checkString(numberDevices, "Number of Devices");
		} catch (e) {
			errors.push(e);
		}

		let validGeography;
		try {
			validGeography = checkString(geography, "Geography");
		} catch (e) {
			errors.push(e);
		}

		let validOccupation;
		try {
			validOccupation = checkString(occupation, "Occupation");
		} catch (e) {
			errors.push(e);
		}

		let validOs;
		try {
			validOs = checkString(os, "OS");
		} catch (e) {
			errors.push(e);
		}

		let validPhoneSys;
		try {
			validPhoneSys = checkString(phoneSys, "Phone System");
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("register", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let user;
		try {
			user = await registerUser(
				xss(validFirstName),
				xss(validLastName),
				xss(validEmail),
				xss(validPassword),
				// validAge,
				xss(validAge),
				xss(validOccupation),
				xss(validGeography),
				// validNumDevices,
				xss(validNumDevices),
				xss(validOs),
				xss(validPhoneSys)
			);
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("register", {
				error: true,
				message: errors,
			});
			return;
		}

		if (user) {
			req.session.user = {
				id: user._id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				ageInput: user.ageInput, 
				occupation: user.occupation,
				geography: user.geography, 
				numberDevices: user.numberDevices, 
				os: user.os, 
				phoneSys: user.phoneSys
			};
			console.log(req.session.user);
			res.redirect("/account");
		} else {
			errors.push("Internal Server Error");
			console.log(errors);
			res.status(500).render("register", {
				error: true,
				message: errors[0],
			});
			return;
		}
	});

routes
	.route("/login")
	.get(async (req, res) => {
		if (req.session.user) res.redirect("/dashboard");
		else res.render("login");
	})
	.post(async (req, res) => {
		// console.log(req.body);
		let errors = [];
		let email = req.body.email;
		let password = req.body.password;

		if (typeof email === "undefined")
			errors.push("No email provided.");
		else if (typeof password === "undefined")
			errors.push("No password provided.");

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("login", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let validEmail;
		try {
			validEmail = checkEmail(email);
		} catch (e) {
			errors.push("EMAIL NOT VALID!");
		}

		let validPassword;
		try {
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push("PASSWORD NOT VALID!");
		}

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("login", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let user;
		try {
			user = await checkUser(xss(validEmail), xss(validPassword));
			const {
				_id: id,
				firstName,
				lastName,
				emailAddress: email,
				ageInput: age,
				occupation,
				geography,
				numberDevices,
				os,
				phoneSys
			} = user;
			const deviceGoals = user.devices[0].deviceGoals;
			const currentGoal = deviceGoals[0];
			const devices =
				user.devices.length > 0
					? user.devices.map((dev) => dev._id)
					: [];
			req.session.user = {
				id: id,
				firstName: firstName,
				lastName: lastName,
				email: email,
				devices: devices,
				deviceGoals: deviceGoals,
				currentDevice: devices[0],
				currentGoal: currentGoal,
				ageInput: age, 
				occupation: occupation,
				geography: geography, 
				numberDevices: numberDevices, 
				os: os, 
				phoneSys: phoneSys
			};
			// console.log(req.session);
			// console.log(user);
			res.redirect("/dashboard");
		} catch (e) {
			errors.push(e);
			console.log(errors);
			res.status(400).render("login", {
				error: true,
				message: errors[0],
			});
			return;
		}
	});

routes.get("/logout", async (req, res) => {
	res.render("logout", {
		firstName: req.session.user.firstName,
	});
	req.session.destroy();
});

routes
	.route("/account")
	.get(async (req, res) => {
		if (!req.session.user) res.redirect("/login");
		else {
			console.log(req.session.user);
			let errors = [];
			const {
				id: userId,
				firstName,
				lastName,
				email,
				devices: deviceIds,
			} = req.session.user;
			// console.log(userId, firstName, lastName, email, deviceIds);
			let devices = [];
			try {
				for (let devId of deviceIds) {
					// console.log(devId);
					let device = await getDevice(userId, devId);
					// console.log(device);
					devices.push(device);
				}
				// console.log(devices);
			} catch (e) {
				errors.push("Internal Server Error");
				res.status(500).render("profile", {
					firstName: firstName,
					lastName: lastName,
					email: email,
					devices: devices,
					error: true,
					message: errors[0],
				});
				return;
			}

			res.render("profile", {
				firstName: firstName,
				lastName: lastName,
				email: email,
				devices: devices,
			});
		}
	});

routes
	.route('/editProfile')
	.get(async (req, res) => {
		if (req.session.user) res.render('editProfile');
		else res.redirect('/login');
	})
	.post(async (req, res) => {
		let errors = [];
		let userId = req.body.id ?? req.session.user.id;
		let email = req.body.email;
		let firstName = req.body.firstName;
		let lastName = req.body.lastName;
		let password = req.body.password;
		let confirmPassword = req.body.confirmPassword;
		let ageInput = req.body.ageInput;
		let occupation = req.body.occupation;
		let numberDevices = req.body.numberDevices;
		let geography = req.body.devices;
		let os = req.body.os;
		let phoneSys = req.body.phoneSys;
		// console.log(req.body);
		// console.log(req.session.user);
		// console.log(req.body.id);

		if (typeof userId === "undefined")
			errors.push("No user ID provided.");
		else if (typeof email === "undefined")
			errors.push("No email provided.");
		else if (typeof firstName === "undefined")
			errors.push("No first name provided.");
		else if (typeof lastName === "undefined")
			errors.push("No last name provided.");
		else if (typeof password === "undefined")
			errors.push("No password provided.");
		else if (typeof ageInput === "undefined")
			errors.push("No age provided.");
		else if (typeof occupation === "undefined")
			errors.push("No occupation provided.");
		else if (typeof numberDevices === "undefined")
			errors.push("Number of devices not provided.");
		else if (typeof geography === "undefined")
			errors.push("No geography provided.");
		else if (typeof os === "undefined")
			errors.push("No OS provided.");
		else if (typeof phoneSys === "undefined")
			errors.push("No phone system provided.");

		if (errors.length > 0) {
			res.status(400).render("editProfile", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let validUserId;
		try {
			validUserId = checkId(userId);
		} catch (e) {
			errors.push(e);
		}

		let validEmail;
		try {
			validEmail = checkEmail(email);
		} catch (e) {
			errors.push(e);
		}

		let validFirstName;
		try {
			validFirstName = checkName(firstName, "First Name");
		} catch (e) {
			errors.push(e);
		}

		let validLastName;
		try {
			validLastName = checkName(lastName, "Last Name");
		} catch (e) {
			errors.push(e);
		}

		let validPassword;
		try {
			if (password !== confirmPassword) throw 'Passwords do not match.';
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push(e);
		}

		let validAge;
		try {
			// validAge = Number.parseInt(ageInput);
			// if (!Number.isInteger(validAge) || isNaN(validAge)) throw 'Age is not a valid number.';
			validAge = checkString(ageInput, "Age");
		} catch (e) {
			errors.push(e);
		}

		let validNumDevices;
		try {
			// validNumDevices = Number.parseInt(numberDevices);
			// if (!Number.isInteger(validNumDevices) || isNaN(validNumDevices))
			// 	throw 'The number of devices is not a valid number.';
			validNumDevices = checkString(numberDevices, "Number of Devices");
		} catch (e) {
			errors.push(e);
		}

		let validGeography;
		try {
			validGeography = checkString(geography, "Geography");
		} catch (e) {
			errors.push(e);
		}

		let validOccupation;
		try {
			validOccupation = checkString(occupation, "Occupation");
		} catch (e) {
			errors.push(e);
		}

		let validOs;
		try {
			validOs = checkString(os, "OS");
		} catch (e) {
			errors.push(e);
		}

		let validPhoneSys;
		try {
			validPhoneSys = checkString(phoneSys, "Phone System");
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			res.status(400).render("editProfile", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let updatedUser;
		try {
			updatedUser = await updateUser(
				xss(validUserId),
				xss(validFirstName),
				xss(validLastName),
				xss(validEmail),
				xss(validPassword),
				// validAge,
				xss(validAge),
				xss(validOccupation),
				xss(validGeography),
				// validNumDevices,
				xss(validNumDevices),
				xss(validOs),
				xss(validPhoneSys)
			);
		} catch (e) {
			errors.push(e);
			res.status(400).render("editProfile", {
				error: true,
				message: errors[0]
			});
			return;
		}

		// Update the current user's information in the cookie
		req.session.user = {
			id: updatedUser.id,
			firstName: updatedUser.firstName,
			lastName: updatedUser.lastName,
			email: updatedUser.email,
			ageInput: updatedUser.ageInput, 
			occupation: updatedUser.occupation,
			geography: updatedUser.geography, 
			numberDevices: updatedUser.numberDevices, 
			os: updatedUser.os, 
			phoneSys: updatedUser.phoneSys
		};
		console.log(req.session.user);

		let deviceIds = req.session.user.devices;
		let devices = [];
		try {
			for (let devId of deviceIds) {
				// console.log(devId);
				let device = await getDevice(validUserId, devId);
				// console.log(device);
				devices.push(device);
			}
			// console.log(devices);
			res.render("profile", {
				firstName: req.session.user.firstName,
				lastName: req.session.user.lastName,
				email: req.session.user.email,
				devices: devices,
			});
		} catch (e) {
			errors.push("Internal Server Error");
			res.status(500).render("editProfile", {
				error: true,
				message: errors[0],
			});
			return;
		}
	});

routes
	.route("/forgetpassword")
	.get(async (req, res) => {
		res.render("forgetpassword");
	})
	.post(async (req, res) => {
		// should send an email to req.body.emailAddress
		res.redirect("/newpassword");
	});

routes
	.route("/newpassword")
	.get(async (req, res) => {
		res.render("newpassword");
	})
	.post(async (req, res) => {
		// console.log(req.body);
		let errors = [];
		let newPassword = req.body.newPassword;
		let newPasswordInput = req.body.newPasswordInput;

		if (
			typeof newPassword === "undefined" ||
			typeof newPasswordInput === "undefined"
		) {
			errors.push("New password must be provided.");
			console.log(errors);
			res.status(400).render("newpassword", {
				error: true,
				message: errors[0],
			});
			return;
		}

		if (newPassword !== newPasswordInput) {
			errors.push("Passwords do not match.");
			console.log(errors);
			res.status(400).render("newpassword", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let validPassword;
		try {
			validPassword = checkPassword(newPassword);
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("newpassword", {
				error: true,
				message: errors[0],
			});
			return;
		}

		try {
			await updateUser(
				xss(req.session.user.id),
				xss(req.session.user.firstName),
				xss(req.session.user.lastName),
				xss(req.session.user.email),
				xss(validPassword)
			);
			res.redirect("/dashboard");
		} catch (e) {
			errors.push(e);
			res.status(400).render("newpassword", {
				error: true,
				message: errors[0],
			});
			return;
		}
	});

routes
	.route("/rewards")
	.get(async (req, res) => {
		let id = req.session.user.id;
		const totalPoints = await getTotalPoints(id);
		if (req.session.user) res.render("redeem", {points: totalPoints});
		else res.redirect("/login");
	})
	.post(async (req, res) => {
		let errors = []
		let rewardPoints = req.body.points;
		let id = req.session.user.id;
		if (rewardPoints === 0){
			errors.push("Sorry! You do not have any points!")
		}
		await addPoints(id, rewardPoints);
		res.redirect('/rewards/redeem');
	});

	// you redeemed your rewards
routes
	.route("/rewards/redeem")
	.get(async (req, res) => {
		if (req.session.user) res.render("redeemed");
		else res.redirect("/login");
	});

routes
	.route("/devices")
	.get(async (req, res) => {
		if (req.session.user) res.render("registerDevice", { goals: allGoals });
		else res.redirect("/login");
	})
	.post(async (req, res) => {
		let errors = [];
		let serialNum = req.body.serialNumber;
		let devName = req.body.deviceName;
		let devGoals = Array.isArray(req.body.deviceGoals) 
			? req.body.deviceGoals
			: [req.body.deviceGoals];
		// console.log(req.body);
		if (typeof serialNum === "undefined" || serialNum.trim().length === 0) {
			errors.push("Invalid Serial Number");
			res.status(400).render("registerDevice", {
				error: true,
				message: errors[0],
				goals: allGoals
			});
			return;
		}
		try {
			const { _id: deviceId, deviceGoals } = await registerDevice(
				xss(req.session.user.id),
				xss(serialNum),
				xss(devName),
				devGoals
			);

			// Add the new device information to the logged user.
			req.session.user.devices.push(deviceId.toString());
			req.session.user.numberDevices = req.session.user.numberDevices
				? req.session.user.numberDevices + 1 
				: 1;
			req.session.user.deviceGoals = deviceGoals;
			req.session.user.currentDevice = deviceId.toString();
			req.session.user.currentGoal = devGoals[0];

			// Redirect to the user's profile page.
			res.redirect("/account");
		} catch (e) {
			errors.push(e);
			res.status(400).render("registerDevice", {
				error: true,
				message: errors[0],
				goals: allGoals,
			});
			return;
		}
	});

routes.route("/devices/:id").get(async (req, res) => {});

routes //sustainability facts
	.route("/facts")
	.get(async (req, res) => {
		res.render("facts", {
			firstName: req.session.user.firstName,
		});
	});

routes //sustainable goals
	.route("/goals")
	.get(async (req, res) => {
		res.render("goals");
	});

routes 
	.route("/help")
	.get(async (req, res) => {
		res.render("help");
	})
	.post(async (req, res) => {
		let errors = [];
		let email = req.body.email;
		let issue = req.body.issue;

		if (typeof email === "undefined") {
			errors.push("Enter Email!");
			res.status(400).render("help", {
				error: true,
				message: errors[0],
			});
			return;
		}

		if (typeof issue === "undefined" || issue.trim().length === 0) {
			errors.push("Please describe your issue!");
			res.status(400).render("help", {
				error: true,
				message: errors[0],
			});
			return;
		}
		let validEmail;
		try {
			validEmail = checkEmail(email);
		} catch (e) {
			errors.push(e);
		}
	});

routes
	.route("/dashboard")
	.get(async (req, res) => {
		if (req.session.user) {
			const { id: userId, firstName, devices: devIds, currentDevice, currentGoal } = req.session.user;

			// Get all of the device goals for the current device.
			let deviceGoals = [];
			let devices = [];
			try {
				for (let devId of devIds) {
					let device = await getDevice(userId, devId);
					devices.push(device);
					if (currentDevice && currentDevice !== devId) continue;
					else deviceGoals.push(...device.deviceGoals);
				}
				
				// console.log(deviceGoals);
				console.log(currentGoal);
			} catch (e) {
				res.render("dashboard", {
					firstName: firstName,
					deviceGoals: ["No goals available"],
					currentGoal: "Recharge before device reaches 20%",
					error: true,
					message: "Internal Server Error",
				});
			}

			// Render dashboard page
			deviceGoals = deviceGoals.filter(goal => goal !== currentGoal);
			console.log(deviceGoals);
			res.render('dashboard', {
				firstName: firstName,
				devices: devices,
				currentDevice: currentDevice,
				currentGoal: currentGoal,
				deviceGoals: deviceGoals
			});
		} else res.redirect("/login");
	})
	.post(async (req, res) => {
		// update current goal
		if (req.body.type == 'goals') {
			console.log(req.body);
			let newGoal = req.body.goals;
			console.log(newGoal);
			req.session.user.currentGoal = newGoal;
			const { id: userId, firstName, devices: devIds, currentDevice, currentGoal } = req.session.user;
			console.log(req.session.user);

			// Get every goal associated with the current device
			let allDeviceGoals = [];
			let devices = [];
			for (let devId of devIds) {
				let device = await getDevice(userId, devId);
				devices.push(device);
				if (currentDevice && currentDevice !== devId) continue;
				else allDeviceGoals.push(...device.deviceGoals);
			}
			console.log(allDeviceGoals);
			// const currentGoal = req.session.user.currentGoal ?? 'N/A';

			// get every goal except the current goal
			const deviceGoals = (req.session.user.currentGoal) ?
				allDeviceGoals.filter(goal => goal !== currentGoal) :
				[...allDeviceGoals];

			console.log(deviceGoals);

			// re-render the page with the new other goals
			res.render('dashboard', {
				firstName: firstName,
				devices: devices,
				currentDevice: currentDevice,
				currentGoal: currentGoal,
				deviceGoals: deviceGoals
			});
		}
		// update current device
		else if (req.body.type == 'devices') {
			console.log(req.body);
			let newDevId = req.body.deviceId;
			const {
				id: userId,
				firstName,
				devices: devIds,
				currentDevice: currentDevId,
				currentGoal,
				deviceGoals
			} = req.session.user;

			// if the user selected the same device, then do nothing
			if (currentDevId == newDevId) {
				console.log(deviceGoals);
				console.log(currentGoal);
				let devices = [];
				for (let devId of devIds) devices.push(await getDevice(userId, devId));
				let otherGoals = deviceGoals.filter((goal) => goal !== currentGoal);
				res.render('dashboard', {
					firstName: firstName,
					devices: devices,
					currentDevice: currentDevId,
					currentGoal: currentGoal,
					deviceGoals: otherGoals
				});
			} else {
				let newDevice = await getDevice(userId, newDevId);
				let devices = [];
				devices.push(newDevice);
				for (let devId of devIds) { 
					if (newDevice._id.toString() === devId) continue;
					devices.push(await getDevice(userId, devId));
				}
				let newGoals = newDevice.deviceGoals;
				console.log(newDevice);
		
				req.session.user.currentDevice = newDevId;
				req.session.user.currentGoal = newGoals[0];
				req.session.user.deviceGoals = newGoals.slice(1);
				// re-render the page with the info from the new current device
				console.log(req.session.user);
				res.render('dashboard', {
					firstName: firstName,
					devices: devices,
					currentDevice: newDevId,
					currentGoal: newGoals[0],
					deviceGoals: newGoals.slice(1)
				});
			}
		}
	});


// Finish the redeem portal
routes.route("/leaderboard").get(async (req, res) => {
	let errors = [];
	try {
		const allUsers = await getAllUsers();
		res.render("leaderboard", {
			users: allUsers,
		});
	} catch (e) {
		errors.push("Internal Server Error");
		res.status(500).render("leaderboard", {
			error: true,
			message: errors[0],
		});
		return;
	}
});

export default routes;
