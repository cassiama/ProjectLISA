import { registerUser } from './data/users.js';
import { registerDevice } from './data/devices.js';
import { dbConnection, closeConnection } from './config/mongoConnection.js';

//lets drop the database each time this is run
const db = await dbConnection();
await db.dropDatabase();

async function main() {
    let user1, user2, user3, device1, device2, device3;
    try {
        user1 = await registerUser(
            "Areeb",
            "Chaudhry",
            "areeb@gmail.com",
            "Qwertyuiop@123"
        );
        user2 = await registerUser(
            "Shailaja",
            "Vyas",
            "svyaslol@gmail.com",
            "Hello!123"
        );
        user3 = await registerUser(
            "Mariam",
            "Dardir", 
            "mariamd@gmail.com", 
            "Happy123!"
        );
    } catch (e) {
        console.log("User: " + e);
    }

    try {
        device1 = await registerDevice(
            user1._id.toString(),
            "fh938hr0rq0irih0rjrjs",
            "Lenovo ThinkPad X1 Carbon Gen 11",
            ["Unplug charger from device before bedtime", "Download content instead of streaming"]
        )
        device2 = await registerDevice(
            user1._id.toString(),
            "qhw4hr9iasdhsi0rjqwrw",
            "Legion Pro 7i Gen 9",
            ["Clean out inbox", "Recharge before device reaches 20%", "Turn off wifi at night"]
        )
    } catch (e) {
        console.log("Device" + e);
    }
}

await main();
await closeConnection();
