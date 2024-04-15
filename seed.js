import { addRewardPoints, registerUser } from './data/users.js';
import { addPointsToGoal, registerDevice } from './data/devices.js';
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import { getAllGoalsInfo } from './utils/goals.js';

//lets drop the database each time this is run
const db = await dbConnection();
await db.dropDatabase();

// grab all possible goals
const allGoals = await getAllGoalsInfo();

async function main() {
    let user1, user2, user3, device1, device2, device3;
    try {
        user1 = await registerUser(
            "Areeb",
            "Chaudhry",
            "areeb@gmail.com",
            "Qwertyuiop@123",
            '21',
            'student',
            'urban',
            '3',
            'windows',
            'ios'
        );
        user2 = await registerUser(
            "Shailaja",
            "Vyas",
            "svyaslol@gmail.com",
            "Hello!123",
            '22',
            'student',
            'suburban',
            '2',
            'windows',
            'android'

        );
        user3 = await registerUser(
            "Mariam",
            "Dardir", 
            "mariamd@gmail.com", 
            "Happy123!",
            '21',
            'student',
            'suburban',
            '1',
            'windows',
            'ios'
        );
        await addRewardPoints(user1._id, 100);
        await addRewardPoints(user2._id, 250);
        await addRewardPoints(user3._id, 1150);
    } catch (e) {
        console.log("User: " + e);
    }

    try {
        device1 = await registerDevice(
            user1._id.toString(),
            "fh938hr0rq0irih0rjrjs",
            "Lenovo ThinkPad X1 Carbon Gen 11",
            [allGoals[0], allGoals[3]]
        )
        // assume that user1 completed 50% of their goal for the day
        await addPointsToGoal(
            user1._id.toString(),
            device1._id.toString(),
            allGoals[0],
            50
        )
        await addPointsToGoal(
            user1._id.toString(),
            device1._id.toString(),
            allGoals[3],
            100
        )
        device2 = await registerDevice(
            user1._id.toString(),
            "qhw4hr9iasdhsi0rjqwrw",
            "Legion Pro 7i Gen 9",
            [allGoals[1], allGoals[0], allGoals[2]]
        )
    } catch (e) {
        console.log("Device" + e);
    }
}

await main();
await closeConnection();
