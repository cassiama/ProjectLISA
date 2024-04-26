const emissionsFacts = [
    {
        "action": "Charging Less Often",
        "stats": "Equivalent to charging 1,293 smartphones"
    },
    {
        "action": "Lessening Time Spent on Device Per Week",
        "stats": "Equivalent to driving 27 miles"
    },
    {
        "action": "Using Power Saving Mode",
        "stats": "Equivalent to consuming 9.8 gallons of diesel"
    },
    {
        "action": "Keeping Screen Brightness Below 70%",
        "stats": "Equivalent to consuming 1.1 gallons of gasoline"
    },
    {
        "action": "Deleting Unused Apps",
        "stats": "Equivalent to driving 25.6 miles"
    },
    {
        "action": "Updating Your Device",
        "stats": "Equivalent to burning 22 pounds of coal"
    },
    {
        "action": "Cleaning Out Emails from Trash",
        "stats": "Equivalent to consuming 0.012 barrels of oil"
    },
    {
        "action": "Unsubscribing from Unwanted Emails",
        "stats": "Equivalent to charging 330 smartphones"
    },
    {
        "action": "Reusing Your Searches on Search Engines",
        "stats": "Equivalent to driving 2.6 miles"
    },
    {
        "action": "Closing Unnecessary Background Apps",
        "stats": "Equivalent to burning 11 pounds of coal"
    }
];

export const getEmissionsFacts = async () => {
    let emissionsFactsArray = [];
    let prevRandomIndex = 0;
	// get random emissions facts and assign them to the device
	for (let i = 0; i < 2; i++) {
		let randomIndex = Math.floor(Math.random() * emissionsFacts.length);
        while (i > 0 && randomIndex == prevRandomIndex)
            randomIndex = Math.floor(Math.random() * emissionsFacts.length);
        prevRandomIndex = randomIndex;
		emissionsFactsArray.push(emissionsFacts[randomIndex]);
	}
    return emissionsFactsArray;
}