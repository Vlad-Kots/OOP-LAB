console.log("--- PART 1: Classical Approach ---");

function Book(title, author, year) {
    this.title = title;
    this.author = author;
    this.year = year;
}

Book.prototype.getSummary = function() {
    return `Book '${this.title}' was written by ${this.author} in ${this.year}.`;
};

const book1 = new Book("Kobzar", "Taras Shevchenko", 1840);
const book2 = new Book("Shadows of Forgotten Ancestors", "Mykhailo Kotsiubynsky", 1911);

console.log("1.3. book1 summary:", book1.getSummary());
console.log("1.3. book2 summary:", book2.getSummary());

console.log("1.3. Does __proto__ of book1 point to Book.prototype?", book1.__proto__ === Book.prototype);

Array.prototype.getLastElement = function() {
    return this[this.length - 1];
};

const numbers = [10, 20, 30, 40, 50];
console.log("1.4. Last element of array [10, 20, 30, 40, 50]:", numbers.getLastElement());


console.log("\n--- PART 2: Modern Approach (ES6 Class Syntax) ---");

class Publication {
    constructor(title, year) {
        this.title = title;
        this.year = year;
    }

    static type = 'General Publication';

    static isRecent(publicationYear) {
        return publicationYear > 2020;
    }
}

console.log("2.1. Publication.type:", Publication.type);
console.log("2.1. Publication.isRecent(2022):", Publication.isRecent(2022));

class Magazine extends Publication {
    #isDigital;

    constructor(title, year, issue) {
        super(title, year);
        this.issue = issue;
        this.#isDigital = false;
    }

    get digitalStatus() {
        return this.#isDigital;
    }

    set setDigital(value) {
        this.#isDigital = value;
    }

    getYearInfo() {
        return `Year: ${this.year}`;
    }
}

const myMagazine = new Magazine("Forbes", 2023, 5);
console.log("2.3. Initial digitalStatus:", myMagazine.digitalStatus);
myMagazine.setDigital = true;
console.log("2.3. Updated digitalStatus:", myMagazine.digitalStatus);
console.log("2.4. Magazine getYearInfo:", myMagazine.getYearInfo());

class Newspaper extends Magazine {
    constructor(title, year, issue) {
        super(title, year, issue);
    }

    getYearInfo() {
        const baseInfo = super.getYearInfo();
        return baseInfo + " (published daily).";
    }
}

const myNewspaper = new Newspaper("The New York Times", 2024, 120);
console.log("2.4. Newspaper getYearInfo (overridden):", myNewspaper.getYearInfo());


console.log("\n--- PART 3: Prototype Chain and Checks ---");

const objA = new Publication("Generic Paper", 1990);
const objB = new Magazine("Vogue", 2021, 9);

console.log("3.1. objA instanceof Publication:", objA instanceof Publication);
console.log("3.1. objB instanceof Magazine:", objB instanceof Magazine);
console.log("3.1. objB instanceof Publication:", objB instanceof Publication);

console.log("%cExplanation:", "color: blue; font-weight: bold;");
console.log("The expression 'objB instanceof Publication' returns true because the Magazine class inherits from the Publication class.");
console.log("This means that the Publication prototype is in the prototype chain of the objB object.");