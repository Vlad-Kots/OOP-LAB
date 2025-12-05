function invokeAfterDelay(callback, delay) {
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                const result = callback();
                resolve(result);
            } catch (error) {
                console.error("Callback error:", error);
                resolve(null);
            }
        }, delay);
    });
}

const getRandomNumber = () => Math.floor(Math.random() * 11);

invokeAfterDelay(getRandomNumber, 500)
    .then(result => {
        console.log("1. Random number after delay:", result);
    });

const produceRandomAfterDelay = () => {
    const callback = () => Math.floor(Math.random() * 11);
    return invokeAfterDelay(callback, 1000);
};

Promise.all([
    produceRandomAfterDelay(),
    produceRandomAfterDelay()
])
.then(([num1, num2]) => {
    const sum = num1 + num2;
    console.log(`\n2. Sum after two parallel promises: ${num1} + ${num2} = ${sum}`);
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function demoSleep() {
    console.log("\n3. Sleep: Start (Will wait 1 second)...");
    const startTime = Date.now();

    await sleep(1000);

    const endTime = Date.now();
    console.log(`3. Sleep: Done after ~${endTime - startTime}ms.`);
}

demoSleep();

const userDatabase = [
    { id: 0, name: 'Vladyslav', age: 23, city: 'Kyiv' },
    { id: 1, name: 'Sophia', age: 30, city: 'Lviv' },
    { id: 2, name: 'Andrii', age: 25, city: 'Odesa' },
    { id: 3, name: 'Nestor', age: 28, city: 'Dnipro' }
];

function getUser(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = userDatabase.find(u => u.id === id);
            if (user) {
                resolve(user);
            } else {
                reject(new Error('User not found'));
            }
        }, 1000);
    });
}

getUser(1).then(user => {
    console.log(`\n4. Success: User ${user.id} is ${user.name}.`);
});

getUser(99).catch(error => {
    console.log(`4. Error: ${error.message}`);
});

function loadUsers(ids) {
    const promises = ids.map(id => getUser(id));

    return Promise.allSettled(promises)
        .then(results => {
            const loadedUsers = [];

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    loadedUsers.push(result.value);
                } else {
                    console.error(`5. Warning: Failed to load user. Reason: ${result.reason.message}`);
                }
            });

            return loadedUsers;
        });
}

const idsToLoad = [0, 2, 99, 3];

loadUsers(idsToLoad)
    .then(users => {
        console.log("\n5. Successfully loaded users (errors handled):");
        users.forEach(u => console.log(` - ${u.name} (ID: ${u.id})`));
    });

function logCall(callback) {
    return new Promise(resolve => {
        setTimeout(() => {
            const timestamp = new Date().toLocaleTimeString('uk-UA');
            console.log(`6. Log Call: Function '${callback.name}' called at ${timestamp}`);

            const result = callback();
            resolve(result);
        }, 1000);
    });
}

const stepA = () => console.log('   -> Step A completed.');
stepA.name = 'stepA';
const stepB = () => console.log('   -> Step B completed.');
stepB.name = 'stepB';
const stepC = () => console.log('   -> Step C completed.');
stepC.name = 'stepC';
const stepD = () => console.log('   -> Step D completed.');
stepD.name = 'stepD';

logCall(stepA)
    .then(() => logCall(stepB))
    .then(() => logCall(stepC))
    .then(() => logCall(stepD))
    .then(() => console.log("6. Sequential chain finished."));

async function showUsers(ids) {
    console.log('\n7. [ASYNC/AWAIT]: loading...');

    try {
        const users = await loadUsers(ids);

        console.log('   Loaded users:');
        users.forEach(u => console.log(`   - ${u.name} (ID: ${u.id})`));

    } catch (error) {
        console.error('   An unexpected error occurred:', error.message);

    } finally {
        console.log('7. [ASYNC/AWAIT]: loading finished.');
    }
}

const finalIds = [1, 3, 404];
showUsers(finalIds);