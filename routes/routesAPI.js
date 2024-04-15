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
	getTopUsers,
	getUserById,
	getUserByEmail,
	addRewardPoints,
	createLog,
	getTips,
	getTotalPoints,
	subtractRewardPoints,
	helpTicket,
} from "../data/users.js";
import {
	serialNumAlreadyExists,
	registerDevice,
	getDevice,
	removeDevice,
	editDeviceGoal,
	addPointsToGoal,
	updateDeviceLog,
} from "../data/devices.js";
import { getAllGoalsInfo, getPointsByGoal } from "../utils/goals.js";
import { getEmissionsFacts } from "../utils/emissionsFacts.js";
const routes = Router();

routes.use((req, res, next) => {
	let userFullName;
	let userEmail;
	if (req.session.user) {
		const {
			firstName,
			lastName,
			email
		} = req.session.user;
		userFullName = `${firstName} ${lastName}`;
		userEmail = email;
	} else {
		userFullName = "Guest User";
		userEmail = "N/A";
	}

	const options = {
		timeStyle: {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			timeZoneName: "short",
		},
		dateStyle: {
			weekday: "short",
			month: "short",
			day: "numeric",
			year: "numeric",
		}
	};
	const dt = new Date();
	const date = dt.toLocaleDateString(
		undefined,
		options.dateStyle
	);
	const time = dt.toLocaleTimeString(
		undefined,
		options.timeStyle
	);

	// Print the information about the current request to the console
	console.group(`Request Timestamp: ${ date } ${ time }`);
	console.info(`Current Request: ${req.method} ${req.originalUrl}`);
	console.info(`Current User: ${userFullName}`);
	console.info(`User's Email: ${userEmail}`);
	console.groupEnd();
	next();
});

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
				phoneSys: user.phoneSys,
				devices: [],
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

		if (typeof email === "undefined") errors.push("No email provided.");
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
				phoneSys,
			} = user;
			const currDeviceName = user.devices[0]
				? user.devices[0].deviceName
				: "";
			const deviceGoals = user.devices[0]
				? user.devices[0].deviceGoals
				: [];
			const currentGoal = deviceGoals ? deviceGoals[0] : "";
			const devices =
				user.devices.length > 0
					? user.devices.map((dev) => dev._id)
					: [];
			console.log(deviceGoals.length == 0);
			const totalGoalPoints = deviceGoals.length > 0 ? deviceGoals[0].totalPoints : 0;
			const currentUserPoints = deviceGoals.length > 0 ? deviceGoals[0].userPoints : 0;
			req.session.user = {
				id: id,
				firstName: firstName,
				lastName: lastName,
				email: email,
				devices: devices,
				deviceGoals: deviceGoals,
				currentDevice: devices[0],
				currentDeviceName: currDeviceName,
				currentGoal: currentGoal,
				totalGoalPoints: totalGoalPoints,
				currentUserPoints: currentUserPoints,
				ageInput: age,
				occupation: occupation,
				geography: geography,
				numberDevices: numberDevices,
				os: os,
				phoneSys: phoneSys,
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
	if (req.session.user) {
		const { id: userId } = req.session.user;
		const user = await getUserById(userId);
		try {
			for (let device of user.devices) {
				console.log(`Current Device Name: ${device.deviceName}`);

				// grab the current and previous log
				const prevLog = device.prevLog;
				const currentLog = device.log;
				// console.log(`${device.deviceName} prev log [before]:`, device.prevLog);
				// console.log(`${device.deviceName} current log [before]:`, device.log);

				// calculate the carbon emission savings
				let CarbonEmissionDifference= 
				( (currentLog.normal - prevLog.normal) * 0.25 ) +
				( (currentLog.performance - prevLog.performance) * 0.33 ) +
				( (currentLog.energySaver - prevLog.energySaver) * 0.25 * 0.9 ) -
				( currentLog.streamTime - prevLog.streamTime ) * 0.27 -
				( currentLog.downloaded - prevLog.downloaded ) * 1.5 -
				( currentLog.idleTime - prevLog.idleTime ) * 0.05 +
				// ( currentLog.lastCycle - prevLog.lastCycle ) * 65 * 0.8 +
				( (currentLog.chargingTime - prevLog.chargingTime) * 0.8) +
				( (currentLog.averageBrightness - prevLog.averageBrightness) * 0.5)
				let carbonEmissionSavings =   (CarbonEmissionDifference/60) * 0.39
			
				// Baseline: 520 watt/hours
				
				// for each goal...
				for (let goal of device.deviceGoals) {
					const percentage = (carbonEmissionSavings/520 * 100);

					// use the percentage to determine the points
					let powOfTwo = 6, pointsGained = 0;
					if (percentage < 0) {
						console.log(`Percentage is negative: ${percentage}`);
						// take away some points since they failed to reduce their emissions
						await subtractRewardPoints(
							userId, Math.round(goal.totalPoints / (Math.pow(2, powOfTwo)))
						);
						continue;
					} else if (percentage > 0 && percentage < 10) {
						powOfTwo = 5;
						pointsGained = Math.round(goal.totalPoints / Math.pow(2, powOfTwo));
					} else if (percentage >= 10 && percentage < 20) {
						powOfTwo = 4;
						pointsGained += Math.round(goal.totalPoints / Math.pow(2, powOfTwo));
					} else if (percentage >= 20 && percentage < 30) {
						powOfTwo = 3;
						pointsGained += Math.round(goal.totalPoints / Math.pow(2, powOfTwo));
					} else if (percentage >= 30 && percentage < 40) {
						powOfTwo = 2;
						pointsGained = Math.round(goal.totalPoints / Math.pow(2, powOfTwo));
					} else if (percentage >= 40 && percentage < 50) {
						powOfTwo = 1;
						pointsGained = Math.round(goal.totalPoints / Math.pow(2, powOfTwo));
					} else { // user can't gain more than the max points if % >= 50
						powOfTwo = 0;
						pointsGained = goal.totalPoints - goal.userPoints;
					}
					console.log(`Points gained for "${goal.info}":`, pointsGained);
					await addRewardPoints(userId, pointsGained);
					if (goal.userPoints + pointsGained < goal.totalPoints)
						await addPointsToGoal(userId, device._id.toString(), goal.info, pointsGained);
				}

				// update the current and previous logs
				await updateDeviceLog(userId, device._id.toString(), currentLog);
				// let tempDevice = await getDevice(userId, device._id.toString());
				// console.log(`${device.deviceName} prev log [after]:`, tempDevice.prevLog);
				// console.log(`${device.deviceName} new log [after]:`, tempDevice.log);
			}
		} catch (e) {
			console.log(e);
		}

		res.render("logout", {
			firstName: req.session.user.firstName,
		});
		req.session.destroy();
	} else res.redirect("/login");
});

routes.route("/account").get(async (req, res) => {
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
	.route("/editProfile")
	.get(async (req, res) => {
		if (req.session.user) res.render("editProfile");
		else res.redirect("/login");
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

		if (typeof userId === "undefined") errors.push("No user ID provided.");
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
		else if (typeof os === "undefined") errors.push("No OS provided.");
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
			if (password !== confirmPassword) throw "Passwords do not match.";
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
				message: errors[0],
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
			phoneSys: updatedUser.phoneSys,
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
        let errors = [];
        let email = req.body.email;
        let user;
        try {
            user = await getUserByEmail(email);
        } catch (e) {
            errors.push("User with that email does not exist");
            console.log(errors);
            res.status(400).render("forgetpassword", {
                error: true,
                message: errors[0],
            });
            return;
        }
        req.session.user = user;
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
                xss(req.session.user._id),
                null,
                null,
                null,
                xss(validPassword)
            );
        } catch (e) {
            errors.push(e);
            res.status(400).render("newpassword", {
                error: true,
                message: errors[0],
            });
            return;
        }
        req.session.destroy();
        res.redirect("/login");
    });

routes
	.route("/rewards")
	.get(async (req, res) => {
		let id = req.session.user.id;
		const totalPoints = await getTotalPoints(id); //user's total points currently
		if (req.session.user) res.render("redeem", { points: totalPoints });
		else res.redirect("/login");
	})
	.post(async (req, res) => {
		let id = req.session.user.id;
		const totalPoints = await getTotalPoints(id); //user's total points currently
		let errors = [];
		let rewardPoints = Number.parseInt(req.body.points); //rewardpoints = whats getting added or subtracted after clicking redeem
		if (totalPoints < rewardPoints) {
			errors.push("Sorry! You do not enough points to redeem!");
			res.status(400).render("redeem", {
				points: totalPoints,
				error: true,
				message: errors[0],
			});
			return;
		}
		await subtractRewardPoints(id, rewardPoints);
		res.redirect("/rewards/redeem");
	});

// you redeemed your rewards
routes.route("/rewards/redeem").get(async (req, res) => {
	if (req.session.user) res.render("redeemed");
	else res.redirect("/login");
});

routes
	.route("/devices")
	.get(async (req, res) => {
		if (req.session.user) res.render("registerDevice", { goals: await getAllGoalsInfo() });
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
				goals: await getAllGoalsInfo(),
			});
			return;
		}
		try {
			const {
				_id: deviceId,
				deviceGoals,
				deviceName,
			} = await registerDevice(
				xss(req.session.user.id),
				xss(serialNum),
				xss(devName),
				devGoals
			);

			// Add the new device information to the logged user.
			req.session.user.devices.push(deviceId.toString());
			req.session.user.numberDevices =
				req.session.user.numberDevices > 0
					? req.session.user.numberDevices + 1
					: 1;
			req.session.user.deviceGoals = deviceGoals;
			req.session.user.currentDevice = deviceId.toString();
			req.session.user.currentDeviceName = deviceName;
			req.session.user.currentGoal = devGoals[0];

			// Redirect to the user's profile page.
			res.redirect("/account");
		} catch (e) {
			errors.push(e);
			res.status(400).render("registerDevice", {
				error: true,
				message: errors[0],
				goals: await getAllGoalsInfo(),
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
		console.group("GET /goals Debug:");
		const dailyGoals = await getAllGoalsInfo().slice(0, 4),
		      weeklyGoals = await getAllGoalsInfo().slice(4);
		res.render("goals", {dailyGoals: dailyGoals, weeklyGoals: weeklyGoals});
	});

routes
	.route("/help")
	// renders the help page
	.get(async (req, res) => {
		const { email } = req.session.user;
		console.log(email);
		res.render("help", { email: email });
	})
	.post(async (req, res) => {
		const { email, issue } = req.body;
		let validEmail;
		console.log(email);

		if (!email) {
			return res.render("help", {
				error: true,
				message: "Enter Email!",
			});
		}

		if (!issue || issue.trim().length === 0) {
			return res.render("help", {
				error: true,
				message: "Please describe your issue!",
			});
		}

		try {
			validEmail = checkEmail(email);
		} catch (e) {
			return res.render("help", {
				error: true,
				message: "Invalid email!",
			});
		}

		try {
            // Add the issue to the helpTicket field in the user's session
            await helpTicket(email, issue);
        } catch (e) {
            return res.render("help", {
                error: true,
                message: "Failed to submit your issue.",
            });
        }

		// If everything is valid, render the page with a success message
		return res.render("help", {
			email: validEmail,
			success: true,
			message: "Your issue has been submitted successfully!",
		});
	});

	routes
	.route("/dashboard")
	.get(async (req, res) => {
		if (req.session.user) {
			const {
				id: userId,
				firstName,
				devices: devIds,
				currentDevice,
				currentDeviceName: currDeviceName,
				currentGoal,
				totalGoalPoints,
				currentUserPoints,
			} = req.session.user;

			// if the user doesn't have any devices registered, render the page accordingly
			if (devIds.length === 0) {
				res.render("dashboard", {
					firstName: firstName,
					deviceGoals: [{"info": "No goals available"}],
					currentGoal: {"info": "N/A"},
					tips: await getTips(),
					percentage: "0.00",
					progressMessage: "",
					onlyOneGoal: false,
					emissionsFacts: await getEmissionsFacts(),
				});
				return;
			}

			//0.25: 0.25 watts/minute baseline for normal
			//0.33: 0.33 watts/minute for performance
			//0.9: usingh energySaver assumes 10% savings in power
			//0.27: 0.27 watts/minute streaming
			//65W battery
			//390g/kwh emission factor
			const currDev = await getDevice(userId,currentDevice);
			const prevLog = currDev.prevLog;
			const currentLog = currDev.log;

			let CarbonEmissionDifference= 
			( (currentLog.normal - prevLog.normal) * 0.25 ) +
			( (currentLog.performance - prevLog.performance) * 0.33 ) +
			( (currentLog.energySaver - prevLog.energySaver) * 0.25 * 0.9 ) -
			( currentLog.streamTime - prevLog.streamTime ) * 0.27 -
			( currentLog.downloaded - prevLog.downloaded ) * 1.5 -
			( currentLog.idleTime - prevLog.idleTime ) * 0.05 +
			// ( currentLog.lastCycle - prevLog.lastCycle ) * 65 * 0.8 +
			( (currentLog.chargingTime - prevLog.chargingTime)  * 0.8) +
			( (currentLog.averageBrightness - prevLog.averageBrightness) * 0.5)
			let carbonEmissionSavings =   (CarbonEmissionDifference/60) * 0.39

		
			// Baseline: 520 watt/hours
			
			let percentage = currentUserPoints >= totalGoalPoints 
				? "100.00"
				: (currentUserPoints + (carbonEmissionSavings/520 * 100)).toFixed(2);

			let progressMessage = ""
			if (currentGoal) {
				if (percentage >= 25 && percentage < 50)
					progressMessage = "Nice work!";
				else if (percentage >= 50 && percentage < 75)
					progressMessage = "Great job! Keep going!";
				else if (percentage >= 75 && percentage !== 100)
					progressMessage = "You're so close!";
				else if (percentage === 100) progressMessage = "You did it!";
			}

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
				console.log(`Current Goal: ${currentGoal.info}`);
			} catch (e) {
				res.render("dashboard", {
					firstName: firstName,
					deviceGoals: [{"info": "No goals available"}],
					currentGoal: {"info": "N/A"},
					tips: await getTips(),
					error: true,
					message: "Internal Server Error",
					percentage: percentage,
					progressMessage: progressMessage,
					emissionsFacts: await getEmissionsFacts(),
				});
				return;
			}

			// Render dashboard page
			deviceGoals = deviceGoals.filter((goal) => goal.info !== currentGoal.info);
			let onlyOneGoal = false;
			if (deviceGoals.length < 1) {
				onlyOneGoal = true;
			}
			console.log('deviceGoals:', deviceGoals);
			res.render("dashboard", {
				firstName: firstName,
				deviceName: currDeviceName,
				devices: devices,
				userId: userId,
				currentDevice: currentDevice,
				currentGoal: currentGoal,
				deviceGoals: deviceGoals,
				tips: await getTips(),
				percentage: percentage,
				progressMessage: progressMessage,
				onlyOneGoal: onlyOneGoal,
				currentDeviceInfo: JSON.stringify(currDev),
				emissionsFacts: await getEmissionsFacts(),
			});
			return;
		} else res.redirect("/login");
	})
	.post(async (req, res) => {
		// update current goal
		if (req.body.type == "goals") {
			console.log(req.body);
			let newGoal = req.body.goals;
			console.log(newGoal);

			const {
				id: userId,
				firstName,
				devices: devIds,
				currentDevice: currDeviceId,
				currentDeviceName: currDeviceName,
				totalGoalPoints,
			} = req.session.user;
			let { currentUserPoints } = req.session.user;

			// if the user doesn't have any devices registered, render the page accordingly
			if (!currDeviceId) {
				res.render("dashboard", {
					firstName: firstName,
					deviceGoals: [{"info": "No goals available"}],
					currentGoal: {"info": "N/A"},
					tips: await getTips(),
					percentage: "0.00",
					progressMessage: "",
					emissionsFacts: await getEmissionsFacts(),
				});
				return;
			}

			// if the user has no goals, then do nothing
			if (newGoal == "No goals available") {
				let currDev = await getDevice(userId, currDeviceId);
				res.render("dashboard", {
					firstName: firstName,
					deviceName: currDeviceName,
					devices: devices,
					currentGoal: {"info": newGoal},
					deviceGoals: [newGoal],
					tips: await getTips(),
					percentage: "0.00",
					progressMessage: "",
					currentDeviceInfo: JSON.stringify(currDev),
					emissionsFacts: await getEmissionsFacts(),
				});
			} else {
				const currDev = await getDevice(userId,currDeviceId);
				const prevLog = currDev.prevLog;
				const currentLog = currDev.log;

				let CarbonEmissionDifference= 
				( (currentLog.normal - prevLog.normal) * 0.25 ) +
				( (currentLog.performance - prevLog.performance) * 0.33 ) +
				( (currentLog.energySaver - prevLog.energySaver) * 0.25 * 0.9 ) -
				( currentLog.streamTime - prevLog.streamTime ) * 0.27 -
				( currentLog.downloaded - prevLog.downloaded ) * 1.5 -
				( currentLog.idleTime - prevLog.idleTime ) * 0.05 +
				// ( currentLog.lastCycle - prevLog.lastCycle ) * 65 * 0.8 +
				( (currentLog.chargingTime - prevLog.chargingTime) * 0.8) +
				( (currentLog.averageBrightness - prevLog.averageBrightness) * 0.5)
				let carbonEmissionSavings =   (CarbonEmissionDifference/60) * 0.39
			
				// Baseline: 520 watt/hours
				
				let allDeviceGoals = currDev.deviceGoals;
				console.log(`${currDeviceName} goals:`, allDeviceGoals);
				newGoal = allDeviceGoals.find(goal => goal.info === newGoal);
				currentUserPoints = newGoal.userPoints;
				if (currentUserPoints == 0)
					console.log(`Current goals' user points:`, currentUserPoints);
				let percentage = currentUserPoints >= totalGoalPoints 
					? "100.00"
					: (currentUserPoints + (carbonEmissionSavings/520 * 100)).toFixed(2);
				let progressMessage = ""
				if (percentage >= 25 && percentage < 50)
					progressMessage = "Nice work!";
				else if (percentage >= 50 && percentage < 75)
					progressMessage = "Great job! Keep going!";
				else if (percentage >= 75 && percentage !== 100)
					progressMessage = "You're so close!";
				else if (percentage === 100) progressMessage = "You did it!";

				req.session.user.currentGoal = newGoal;
				req.session.user.currentUserPoints = newGoal.userPoints;

				let devices = [];
				for (let devId of devIds) {
					let device = await getDevice(userId, devId);
					devices.push(device);
					if (currDeviceId && currDeviceId !== devId) continue;
				}

				// get every goal except the current goal
				const deviceGoals = allDeviceGoals.filter(
					(goal) => goal.info !== newGoal.info
				);
				console.log('New device goals:', deviceGoals);
				let onlyOneGoal = false;
				if (deviceGoals.length < 1) {
					onlyOneGoal = true;
				}
				// re-render the page with the new other goals
				res.render("dashboard", {
					firstName: firstName,
					deviceName: currDeviceName,
					devices: devices,
					currentGoal: newGoal,
					deviceGoals: deviceGoals,
					tips: await getTips(),
					percentage: percentage,
					progressMessage: progressMessage,
					currentUserPoints: currentUserPoints,
					totalGoalPoints: newGoal.totalPoints,
					onlyOneGoal: onlyOneGoal,
					currentDeviceInfo: JSON.stringify(currDev),
					emissionsFacts: await getEmissionsFacts(),
				});
			}
		}
		// update current device
		else if (req.body.type == "devices") {
			console.log(req.body);
			let newDevId = req.body.deviceId;
			const {
				id: userId,
				firstName,
				devices: devIds,
				currentDevice: currentDevId,
				currentGoal,
				deviceGoals,
				totalGoalPoints,
			} = req.session.user;
			let { currentUserPoints } = req.session.user;
			// if the user selected the same device, then do nothing
			if (currentDevId == newDevId) {
				console.log(`${currDeviceName} goals:`, deviceGoals);
				console.log('Current goal:', currentGoal);
				let currentDevice = await getDevice(userId, currentDevId);
				let currDeviceName = currentDevice.deviceName;
				let devices = [];
				devices.push(currentDevice);
				for (let devId of devIds) {
					if (currentDevId == devId) continue;
					devices.push(await getDevice(userId, devId));
				}
				let otherGoals = deviceGoals.filter(
					(goal) => goal.info !== currentGoal.info
				);
				let onlyOneGoal = false;
				if (deviceGoals.length < 1) {
					onlyOneGoal = true;
				}

				const currDev = await getDevice(userId, currentDevId);
				const prevLog = currDev.prevLog;
				const currentLog = currDev.log;

				let CarbonEmissionDifference= 
				( (currentLog.normal - prevLog.normal) * 0.25 ) +
				( (currentLog.performance - prevLog.performance) * 0.33 ) +
				( (currentLog.energySaver - prevLog.energySaver) * 0.25 * 0.9 ) -
				( currentLog.streamTime - prevLog.streamTime ) * 0.27 -
				( currentLog.downloaded - prevLog.downloaded ) * 1.5 -
				( currentLog.idleTime - prevLog.idleTime ) * 0.05 +
				// ( currentLog.lastCycle - prevLog.lastCycle ) * 65 * 0.8 +
				( (currentLog.chargingTime - prevLog.chargingTime) * 0.8) +
				( (currentLog.averageBrightness - prevLog.averageBrightness) * 0.5)
				let carbonEmissionSavings =   (CarbonEmissionDifference/60) * 0.39

			
				// Baseline: 520 watt/hours
				
				let percentage = currentUserPoints >= totalGoalPoints 
					? "100.00"
					: (currentUserPoints + (carbonEmissionSavings/520 * 100)).toFixed(2);
				let progressMessage = ""
				if (percentage >= 25 && percentage < 50)
					progressMessage = "Nice work!";
				else if (percentage >= 50 && percentage < 75)
					progressMessage = "Great job! Keep going!";
				else if (percentage >= 75 && percentage !== 100)
					progressMessage = "You're so close!";
				else if (percentage === 100) progressMessage = "You did it!";

				res.render("dashboard", {
					firstName: firstName,
					deviceName: currDeviceName,
					devices: devices,
					currentDevice: currentDevId,
					currentGoal: currentGoal,
					tips: await getTips(),
					deviceGoals: otherGoals,
					percentage: percentage,
					progressMessage: progressMessage,
					onlyOneGoal: onlyOneGoal,
					currentDeviceInfo: JSON.stringify(currDev),
					emissionsFacts: await getEmissionsFacts(),
				});
			} else {
				let newDevice = await getDevice(userId, newDevId);
				let newDeviceName = newDevice.deviceName;
				let devices = [];
				devices.push(newDevice);
				for (let devId of devIds) {
					if (newDevice._id.toString() === devId) continue;
					devices.push(await getDevice(userId, devId));
				}
				let newGoals = newDevice.deviceGoals;
				currentUserPoints = newGoals[0].userPoints;
				console.log('New device:', newDevice);

				req.session.user.currentDevice = newDevId;
				req.session.user.currentDeviceName = newDeviceName;
				req.session.user.currentGoal = newGoals[0];
				req.session.user.currentUserPoints = newGoals[0].userPoints;
				req.session.user.totalGoalPoints = newGoals[0].totalPoints;
				req.session.user.deviceGoals = newGoals.slice(1);
				let onlyOneGoal = false;
				if (req.session.user.deviceGoals.length < 1) {
					onlyOneGoal = true;
				}
				// const user = await getUserById(userId);
				const currDev = await getDevice(userId, currentDevId);
				const prevLog = currDev.prevLog;
				const currentLog = currDev.log;

				let CarbonEmissionDifference= 
				( (currentLog.normal - prevLog.normal) * 0.25 ) +
				( (currentLog.performance - prevLog.performance) * 0.33 ) +
				( (currentLog.energySaver - prevLog.energySaver) * 0.25 * 0.9 ) -
				( currentLog.streamTime - prevLog.streamTime ) * 0.27 -
				( currentLog.downloaded - prevLog.downloaded ) * 1.5 -
				( currentLog.idleTime - prevLog.idleTime ) * 0.05 +
				// ( currentLog.lastCycle - prevLog.lastCycle ) * 65 * 0.8 +
				( (currentLog.chargingTime - prevLog.chargingTime) * 0.8) +
				( (currentLog.averageBrightness - prevLog.averageBrightness) * 0.5)
				let carbonEmissionSavings =   (CarbonEmissionDifference/60) * 0.39
			
				// Baseline: 520 watt/hours
				
				let percentage = currentUserPoints >= totalGoalPoints 
					? "100.00"
					: (currentUserPoints + (carbonEmissionSavings/520 * 100)).toFixed(2);
				console.log(`Reduced emissions by ${percentage}%`);
				console.log(`Current goals' user points:`, currentUserPoints);
				let progressMessage = ""
				if (percentage >= 25 && percentage < 50)
					progressMessage = "Nice work!";
				else if (percentage >= 50 && percentage < 75)
					progressMessage = "Great job! Keep going!";
				else if (percentage >= 75 && percentage !== 100)
					progressMessage = "You're so close!";
				else if (percentage === 100) progressMessage = "You did it!";

				// re-render the page with the info from the new current device
				console.log(req.session.user);
				res.render("dashboard", {
					firstName: firstName,
					deviceName: newDeviceName,
					devices: devices,
					currentGoal: newGoals[0],
					deviceGoals: newGoals.slice(1),
					tips: await getTips(),
					percentage: percentage,
					progressMessage: progressMessage,
					onlyOneGoal: onlyOneGoal,
					currentDeviceInfo: JSON.stringify(currDev),
					emissionsFacts: await getEmissionsFacts(),
				});
			}
		}
	});

// Finish the redeem portal
routes.route("/leaderboard").get(async (req, res) => {
	let errors = [];
	try {
		const topUsers = await getTopUsers();
		res.render("leaderboard", {
			users: topUsers,
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

routes
    .route("/editGoals")
    .get(async (req, res) => {
        res.render("editGoals", {
			currentDevice: req.session.user.currentDevice,
			currentDeviceName: req.session.user.currentDeviceName,
			goals: await getAllGoalsInfo()
		});
    })
	.post(async (req, res) => {
		let errors = [];
		let devId = req.session.user.currentDevice;
		let devGoals = Array.isArray(req.body.deviceGoals)
			? req.body.deviceGoals
			: [req.body.deviceGoals];
		// console.log(req.body);
		if (typeof devId === "undefined" || devId.trim().length === 0) {
			errors.push("Invalid Device ID");
			res.status(400).render("editGoals", {
				error: true,
				message: errors[0],
				goals: await getAllGoalsInfo(),
			});
			return;
		}
		try {
			const {
				deviceGoals
			} = await editDeviceGoal(
				xss(req.session.user.id),
				xss(devId),
				devGoals
			);

			// Add the new device information to the logged user.
			req.session.user.deviceGoals = deviceGoals;
			req.session.user.currentGoal = devGoals[0];

			// Redirect to the user's profile page.
			res.redirect("/dashboard");
		} catch (e) {
			errors.push(e);
			res.status(400).render("editGoals", {
				error: true,
				message: errors[0],
				goals: await getAllGoalsInfo(),
			});
			return;
		}
	});

export default routes;
