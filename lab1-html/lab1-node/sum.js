const args = process.argv.slice(2);

const sum = args.reduce((accumulator, currentArg) => {
    const number = Number(currentArg);
    if (!isNaN(number)) {
        return accumulator + number;
    }
    return accumulator;
}, 0);

console.log(`Sum = ${sum}`);