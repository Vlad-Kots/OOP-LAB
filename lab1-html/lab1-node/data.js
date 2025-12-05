console.log("--- PART 3: Data Structures (Ukrainian Context) ---");

// 1. Array persons (Ukrainian names & cities)
const persons = [
    { name: 'Vladyslav', age: 23, city: 'Kyiv'},
    { name: 'Oksana', age: 20, city: 'Lviv'},
    { name: 'Andrii', age: 25, city: 'Odesa'},
    { name: 'Maksym', age: 19, city: 'Kharkiv'},
    { name: 'Yulia', age: 30, city: 'Vinnytsia'}
];

persons.groupName = 'IPZ-21';
persons.teacher = 'Karkhut V.Ya.'; // Updated to Volodymyr Yaroslavovych Karkhut
persons.year = '2023';

console.log("- Array elements:");
for (const p of persons) console.log(p.name);

console.log("- Array properties:");
for (const key in persons) console.log(`${key}: ${persons[key]}`);

// 2. Merging objects
const defaults = { mode: 'test', debugLevel: 'error', logFolder: 'root' };
const userSetting = { mode: 'production', debugLevel: 'trace' };
const merged = { ...defaults, ...userSetting };
console.log("\n2. Merged object:", merged);

// 3. Read-only property (Birth Year)
// We use persons[0] which is Vladyslav now
Object.defineProperty(persons[0], 'birthYear', {
    get() { return 2023 - this.age; },
    configurable: false
});
console.log(`\n3. Birth year of ${persons[0].name}: ${persons[0].birthYear}`);

// 4. Merging arrays
const arr1 = [1, 2], arr2 = [3, 4];
console.log(`\n4. Merged arrays: ${[...arr1, ...arr2]}`);

// 5. Text fragments (map)
console.log("\n5. Text fragments:");
console.log(persons.map(p => `${p.name} from ${p.city} born in ${2023 - p.age}`));

// 6. Older than 20 (filter)
console.log("\n6. Older than 20:");
console.log(persons.filter(p => p.age > 20));

// 7. Destructuring
const { name, city } = persons[0]; // Vladyslav
const [first] = persons;
console.log(`\n7. Destructuring: Name is ${name}, City is ${city}`);

// 8. Functions getUserData & Error handling
console.log("\n8. User Search:");
function getUserData(userName) {
    const u = persons.find(p => p.name === userName);
    if (!u) throw new Error('Unable to find user');
    return u;
}

function showUserInfo(userName) {
    console.log('Loading...');
    try {
        const user = getUserData(userName);
        console.log(`User found: ${user.name}, Age: ${user.age}, City: ${user.city}`);
    } catch (e) {
        console.log(`Error: ${e.message}`);
    } finally {
        console.log('Loading finished');
    }
}

// Search for an existing user
showUserInfo('Vladyslav'); 
// Search for a non-existing user (to test error)
showUserInfo('Petro');

// 9-13. String manipulations
console.log("\n9. Array of letters:", "Ukraina".split(''));
console.log("10. Reverse word:", "Kyiv".split('').reverse().join(''));
console.log("11. Check .js extension:", "lab1.js".endsWith('.js'));
console.log("12. Words from sentence:", "Glory to Ukraine".split(' '));
console.log("13. Replace word:", "I love Lviv".replace("Lviv", "Kyiv"));