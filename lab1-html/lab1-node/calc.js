const [operation, a, b] = process.argv.slice(2);
const numA = Number(a);
const numB = Number(b);
let result;

switch (operation) {
    case 'add':
        result = numA + numB;
        break;
    case 'sub':
        result = numA - numB;
        break;
    case 'mul':
        result = numA * numB;
        break;
    case 'div':
        result = numA / numB;
        break;
    default:
        result = "Error: Unknown operation";
}

console.log(`Result = ${result}`);