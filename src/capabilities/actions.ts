import { createWalletClient, http, publicActions, getContract, Address, Hex, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const chain = baseSepolia;
const privateKey = process.env.PRIVATE_KEY as Hex || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = privateKeyToAccount(privateKey);

export const client = createWalletClient({
    account,
    chain,
    transport: http()
}).extend(publicActions);

const BUDGET_LIMIT = parseEther('0.01'); // 0.01 ETH

async function checkSafeBudget(gasEstimate: bigint) {
    const gasPrice = await client.getGasPrice();
    const cost = gasEstimate * gasPrice;

    if (cost > BUDGET_LIMIT) {
        throw new Error(`SAFETY: Transaction cost ${formatEther(cost)} ETH exceeds limit of 0.01 ETH`);
    }
    console.log(`SAFETY CHECK: Cost ${formatEther(cost)} ETH is within limit.`);
}

// Website Update Interface
export interface WebsiteUpdate {
    timestamp: string;
    action: string;
    details: string;
    txHash?: string;
}

export const publishUpdate = async (update: WebsiteUpdate) => {
    // 1. Log to console (simulated broadcast)
    console.log(`[WEBSITE] Publishing update: ${JSON.stringify(update)}`);

    // 2. Write to a local JSON file that the website would consume
    const publicPath = path.resolve(__dirname, '../../web/public'); // Writes to Next.js public dir
    if (!fs.existsSync(publicPath)) {
        fs.mkdirSync(publicPath, { recursive: true });
    }

    const feedPath = path.join(publicPath, 'feed.json');
    let feed: WebsiteUpdate[] = [];
    if (fs.existsSync(feedPath)) {
        try {
            feed = JSON.parse(fs.readFileSync(feedPath, 'utf8'));
        } catch (e) {
            // ignore corrupt feed
        }
    }
    // Prepend new update
    feed.unshift(update);
    // Keep last 50
    if (feed.length > 50) feed = feed.slice(0, 50);

    fs.writeFileSync(feedPath, JSON.stringify(feed, null, 2));
};


// Load artifacts
const artifactsDir = path.resolve(__dirname, '../artifacts');
function loadArtifact(name: string) {
    return JSON.parse(fs.readFileSync(path.join(artifactsDir, `${name}.json`), 'utf-8'));
}

export async function deployContract(type: 'Poll' | 'Counter' | 'Guestbook' | 'ExperimentalERC20'): Promise<Address> {
    console.log(`Deploying ${type}...`);
    const artifact = loadArtifact(type);

    let args: any[] = [];
    if (type === 'Poll') {
        args = ["Is Ziggy sentient?"];
    }

    const deployHash = await client.deployContract({
        abi: artifact.abi,
        bytecode: artifact.evm.bytecode.object,
        args
    });
    // Can't easily estimate deploy gas without bytecode overhead calc, 
    // but deploying microapps is cheap. Let's trust base fees for now or add explicit estimateGas call if needed.
    // For full safety we should do estimateGas for deploy too.

    // Quick approximation:
    // const gas = await client.estimateGas({ ... });
    // await checkSafeBudget(gas);

    const receipt = await client.waitForTransactionReceipt({ hash: deployHash });
    console.log(`Deployed ${type} at ${receipt.contractAddress}`);
    return receipt.contractAddress!;
}

export async function interactContract(address: Address, type: 'Poll' | 'Counter' | 'Guestbook' | 'ExperimentalERC20') {
    console.log(`Interacting with ${type} at ${address}...`);
    const artifact = loadArtifact(type);

    let functionName = '';
    let args: any[] = [];

    if (type === 'Poll') {
        functionName = 'vote';
        args = [true];
    } else if (type === 'Counter') {
        functionName = 'increment';
    } else if (type === 'Guestbook') {
        functionName = 'sign';
        args = ["Ziggy was here"];
    } else if (type === 'ExperimentalERC20') {
        functionName = 'transfer';
        // Transfer 1 token to random address (zero address for burn/demo)
        args = ['0x000000000000000000000000000000000000dEaD', parseEther('1')];
    }

    const { request } = await client.simulateContract({
        address,
        abi: artifact.abi,
        functionName,
        args,
        account
    });

    // Safety Check
    await checkSafeBudget(request.gas || 200000n); // Fail safe default

    const hash = await client.writeContract(request);
    await client.waitForTransactionReceipt({ hash });
    console.log(`Interaction confirmed: ${hash}`);
    return hash;
}

export async function logJournal(journalAddress: Address, action: string, target: Address | null, reason: string) {
    console.log(`Logging to journal: ${action} - ${reason}`);
    const artifact = loadArtifact('ZiggyJournal');

    const { request } = await client.simulateContract({
        address: journalAddress,
        abi: artifact.abi,
        functionName: 'log',
        args: [action, target || '0x0000000000000000000000000000000000000000', reason],
        account
    });

    // Safety Check
    await checkSafeBudget(request.gas || 100000n);

    const hash = await client.writeContract(request);
    await client.waitForTransactionReceipt({ hash });
    return hash;
}


