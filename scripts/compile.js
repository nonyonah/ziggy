const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contractsPath = path.resolve(__dirname, '../contracts');
const buildPath = path.resolve(__dirname, '../src/artifacts');

if (!fs.existsSync(buildPath)) {
    fs.mkdirSync(buildPath, { recursive: true });
}

function compile(fileName) {
    const filePath = path.join(contractsPath, fileName);
    const source = fs.readFileSync(filePath, 'utf8');

    const input = {
        language: 'Solidity',
        sources: {
            [fileName]: {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };

    console.log(`Compiling ${fileName}...`);
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach((err) => {
            console.error(err.formattedMessage);
        });
        if (output.errors.some(e => e.severity === 'error')) {
            process.exit(1);
        }
    }

    for (const contract in output.contracts[fileName]) {
        fs.writeFileSync(
            path.resolve(buildPath, `${contract}.json`),
            JSON.stringify(output.contracts[fileName][contract], null, 2)
        );
        console.log(`Saved artifact for ${contract}`);
    }
}

const files = fs.readdirSync(contractsPath);
files.forEach(file => {
    if (file.endsWith('.sol')) {
        compile(file);
    }
});
