function average(...args) {
    if (args.length === 0) {
        return 0;
    }
    const sum = args.reduce((acc, val) => acc + val, 0);
    return sum / args.length;
}

console.log("1. Average (2, 4, 6, 8) =", average(2, 4, 6, 8));
console.log("-------------------");
function values(f, low, high) {
    const result = [];
    for (let i = low; i <= high; i++) {
        result.push(f(i));
    }
    return result;
}

const square = x => x * x;

console.log("2. Values [square(2) to square(5)]:", values(square, 2, 5));
console.log("-------------------");
function callWithContext(obj, callback) {
    const date = new Date().toLocaleDateString('uk-UA');
    callback.call(obj, date);
}

const person = { name: 'Aaron', age: 20 };

function happyBirthday(date) {
    console.log(`3. Today is ${date}! Happy birthday ${this.name}. (You are ${this.age})`);
}

callWithContext(person, happyBirthday);
console.log("-------------------");
function createCounter() {
    let count = 0;

    return {
        increment: function() {
            count++;
        },
        getValue: function() {
            return count;
        }
    };
}

const counter = createCounter();
counter.increment();
counter.increment();

console.log("4. Counter value (after 2 increments):", counter.getValue());
console.log("-------------------");
function createMemoizedGreeting() {
    let lastArg = null;
    let lastResult = null;
    let cacheHits = 0;

    return function getGreeting(name) {
        if (name === lastArg) {
            cacheHits++;
            return `5. Hello ${name} (Cached, hits: ${cacheHits})`;
        }

        lastArg = name;
        lastResult = `5. Hello ${name}`;
        cacheHits = 0;
        return lastResult;
    };
}

const memoizedGreeting = createMemoizedGreeting();

console.log(memoizedGreeting('Alice'));
console.log(memoizedGreeting('Bob'));
console.log(memoizedGreeting('Alice'));
console.log(memoizedGreeting('Alice'));
console.log("-------------------");
function add(a) {
    return function(b) {
        return a + b;
    };
}

const addFive = add(5);
const addTen = add(10);

console.log("6. 5 + 3 =", addFive(3));
console.log("6. 10 + 7 =", addTen(7));
console.log("-------------------");
function createChecker(originalArray) {
    return function(textFragment) {
        return originalArray.includes(textFragment);
    };
}

const dictionary = ['apple', 'banana', 'orange', 'kiwi'];
const isFruitAvailable = createChecker(dictionary);

console.log("7. Is 'banana' available?", isFruitAvailable('banana'));
console.log("7. Is 'grape' available?", isFruitAvailable('grape'));
console.log("-------------------");
const people = [
    { name: 'andrii', role: 'developer' },
    { name: 'olena', role: 'manager' }
];

const capitalizeProperty = (arr, prop) => {
    return arr.map(item => ({
        ...item,
        [prop]: item[prop].toUpperCase()
    }));
};

const capitalizedPeople = capitalizeProperty(people, 'role');

console.log("8. Capitalized roles:", capitalizedPeople);
console.log("-------------------");
const car = {
    brand: 'Tesla',
    showDetails: function(year, color) {
        console.log(`9. Car: ${this.brand}, Year: ${year}, Color: ${color}`);
    }
};

const boat = {
    brand: 'Yamaha'
};

console.log("Call example:");
car.showDetails.call(boat, 2022, 'Blue');

console.log("Apply example:");
car.showDetails.apply(boat, [2024, 'White']);

const showBoatDetails = car.showDetails.bind(boat, 2020);
console.log("Bind example:");
showBoatDetails('Black');
console.log("-------------------");
function logCall(callback, ...args) {
    const timestamp = new Date().toLocaleTimeString('uk-UA');

    console.log(`10. Call Log [${timestamp}]`);
    console.log(`   - Function Name: ${callback.name || 'Anonymous'}`);
    console.log(`   - Arguments: ${JSON.stringify(args)}`);

    const result = callback(...args);

    return result;
}

const multiply = (a, b) => a * b;

logCall(multiply, 5, 4);
console.log("-------------------");
function cacheLastCall(callback) {
    let lastResult = null;
    let lastArgs = null;
    let lastCalledTime = 0;
    const CACHE_DURATION = 10000;

    return function(...args) {
        const now = Date.now();

        const argsMatch = JSON.stringify(args) === JSON.stringify(lastArgs);

        if (now - lastCalledTime < CACHE_DURATION && argsMatch) {
            console.log("11. Returning CACHED result (Time left: ~", Math.floor((CACHE_DURATION - (now - lastCalledTime)) / 1000), "s)");
            return lastResult;
        }

        console.log("11. Executing FRESH function...");
        lastResult = callback(...args);
        lastArgs = args;
        lastCalledTime = now;

        return lastResult;
    };
}

const getCurrentTime = (id) => `Result for ${id} at ${new Date().toLocaleTimeString()}`;

const cachedTime = cacheLastCall(getCurrentTime);

console.log(cachedTime(1));
console.log(cachedTime(1));
console.log(cachedTime(2));
console.log("-------------------");