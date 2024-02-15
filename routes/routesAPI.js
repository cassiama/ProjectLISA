import { Router } from "express";
import xss from "xss";
import {
	checkEmail,
	checkId,
	checkName,
	checkPassword,
} from "../utils/helpers.js";
import {
	registerUser,
	updateUser,
	checkUser,
	getAllUsers,
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

		if (confirmPassword !== validPassword) {
			errors.push(`Password and Confirm Password do not match`);
		}

		if (typeof email === "undefined") errors.push("No email provided.");
		else if (typeof firstName === "undefined")
			errors.push("No first name provided.");
		else if (typeof lastName === "undefined")
			errors.push("No last name provided.");
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
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push(e);
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
			user = await registerUser(
				xss(validFirstName),
				xss(validLastName),
				xss(validEmail),
				xss(validPassword)
			);
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			console.log(errors);
			res.status(400).render("login", {
				error: true,
				message: errors,
			});
			return;
		}

		if (user) {
			req.session.user = {
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
			};
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
			errors.push(e);
		}

		let validPassword;
		try {
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push(e);
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
			const { _id: id, firstName, lastName, emailAddress: email } = user;
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
				res.render("profile", {
					firstName: firstName,
					lastName: lastName,
					email: email,
					devices: devices,
				});
			} catch (e) {
				errors.push("Internal Servor Error");
				res.render("profile", {
					error: true,
					message: errors[0],
				});
				return;
			}
		}
	})
	.patch(async (req, res) => {
		let errors = [];
		let id = req.body.id;
		let email = req.body.email;
		let firstName = req.body.firstName;
		let lastName = req.body.lastName;
		let password = req.body.password;

		if (typeof id === "undefined") errors.push("No user ID provided.");
		else if (typeof email === "undefined")
			errors.push("No email provided.");
		else if (typeof firstName === "undefined")
			errors.push("No first name provided.");
		else if (typeof lastName === "undefined")
			errors.push("No last name provided.");
		else if (typeof password === "undefined")
			errors.push("No password provided.");

		if (errors.length > 0) {
			res.status(400).render("profile", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let validId;
		try {
			validId = checkId(req.body.id);
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
			validPassword = checkPassword(password);
		} catch (e) {
			errors.push(e);
		}

		if (errors.length > 0) {
			res.status(400).render("profile", {
				error: true,
				message: errors[0],
			});
			return;
		}

		let updatedUser;
		try {
			updatedUser = await updateUser(
				xss(validId),
				xss(validFirstName),
				xss(validLastName),
				xss(validEmail),
				xss(validPassword)
			);
		} catch (e) {
			errors.push(e);
			res.status(400).render("profile", {
				error: true,
				message: errors[0],
			});
			return;
		}

		req.session.user = {
			id: updatedUser.id,
			firstName: updatedUser.firstName,
			lastName: updatedUser.lastName,
			email: updatedUser.emailAddress,
		};
		res.render("profile", {
			firstName: req.session.user.firstName,
			lastName: req.session.user.lastName,
			email: req.session.user.email,
			devices: req.session.user.devices,
		});
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

routes.route("/rewards").get(async (req, res) => {});

routes.route("/rewards/redeem").get(async (req, res) => {});

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
		let devGoals = req.body.deviceGoals;
		// console.log(req.body);
		if (typeof serialNum === "undefined" || serialNum.trim().length === 0) {
			errors.push("Invalid Serial Number");
			res.status(400).render("registerDevice", {
				error: true,
				message: errors[0],
				goals: allGoals,
			});
			return;
		}
		try {
			let device = await registerDevice(
				xss(req.session.user.id),
				xss(serialNum),
				xss(devName),
				devGoals
			);
			// console.log(device);
			req.session.user.devices.push(device._id.toString());
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

routes //help -- incomplete
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

routes.route("/dashboard").get(async (req, res) => {
	if (req.session.user) {
		const { id: userId, firstName, devices: devIds } = req.session.user;

		let deviceGoals = [];
		try {
			for (let devId of devIds) {
				let device = await getDevice(userId, devId);
				deviceGoals.push(...device.deviceGoals);
			}
			// console.log(deviceGoals);
		} catch (e) {
			res.render("dashboard", {
				firstName: firstName,
				deviceGoals: ["No goals available"],
				error: true,
				message: "Internal Server Error",
			});
		}

		// // get current device from cookie or get the first device's id
		// const currentDevice = req.session.user.currentDevice ?? req.session.user.devices[0].id;
		// // get current device goals and other goals
		// const allDeviceGoals = req.session.user.devices.goals;
		// const currentGoal = req.session.user.currentGoal ?? 'N/A';
		// const otherGoals = [
		//     (req.session.user.currentGoal) ?
		//     allDeviceGoals.filter(goal !== currentGoal) :
		//     [...allDeviceGoals]
		// ];

		// render dashboard page
		// res.render('dashboard', {
		//     firstName: firstName,
		//     devices: devices,
		//     currentDevice: currentDevice,
		//     currentGoal: currentGoal,
		//     otherGoals: otherGoals
		// });
		res.render("dashboard", {
			firstName: firstName,
			deviceGoals: deviceGoals.length
				? deviceGoals
				: ["No goals available."],
		});
	} else res.redirect("/login");
});

// update current goal
routes.post("/dashboard/goals", async (req, res) => {
	let currentGoal = req.body.goal;
	req.session.user.currentGoal = currentGoal;
});

// update current device
routes.post("/dashbord/devices", async (req, res) => {});

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
