require('dotenv').config();
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { Web3 } = require('web3');
const OpenAI = require('openai');

// Validate .env file and required environment variables
if (!fs.existsSync('.env')) {
    console.error('.env file is missing');
    process.exit(1);
}

const requiredEnvVars = ['INFURA_PROJECT_ID', 'CONTRACT_ADDRESS', 'PRIVATE_KEY', 'OPENAI_API'];
requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
        console.error(`Missing required environment variable: ${key}`);
        process.exit(1);
    }
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Environment variables
const infuraProjectId = process.env.INFURA_PROJECT_ID;
const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const openaiApiKey = process.env.OPENAI_API;

// Web3 and contract setup
const web3 = new Web3(`https://sepolia.infura.io/v3/${infuraProjectId}`);
const contractABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_name", "type": "string" },
            { "internalType": "uint256", "name": "_age", "type": "uint256" },
            { "internalType": "string", "name": "_medicalHistory", "type": "string" }
        ],
        "name": "registerPatient",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_patient", "type": "address" }
        ],
        "name": "getPatientDetails",
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "string", "name": "", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const contract = new web3.eth.Contract(contractABI, contractAddress);

const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

console.log("Web3 and contract setup complete");

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/balance', async (req, res) => {
    try {
        const balance = await web3.eth.getBalance(contractAddress);
        res.json({ success: true, balance: web3.utils.fromWei(balance, 'ether') + " ETH" });
    } catch (error) {
        console.error("Error fetching balance:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/register', async (req, res) => {
    const { name, age, medicalHistory } = req.body;

    if (!name || !age || !medicalHistory) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    try {
        const tx = contract.methods.registerPatient(name, age, medicalHistory);
        const gas = await tx.estimateGas({ from: account.address });
        const gasPrice = await web3.eth.getGasPrice();

        const signedTx = await account.signTransaction({
            to: contractAddress,
            data: tx.encodeABI(),
            gas,
            gasPrice
        });

        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        res.json({ success: true, transactionHash: receipt.transactionHash });
    } catch (error) {
        console.error("Error registering patient:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/patient/:address', async (req, res) => {
    const patientAddress = req.params.address;

    try {
        const data = await contract.methods.getPatientDetails(patientAddress).call({ from: account.address });
        res.json({ success: true, data });
    } catch (error) {
        console.error("Error fetching patient details:", error);
        res.status(500).json({ success: false, error: "Not authorized to view patient details." });
    }
});

const openai = new OpenAI({
    apiKey: openaiApiKey,
});

app.post('/generate-insight', async (req, res) => {
    const { patientAddress } = req.body;

    if (!patientAddress) {
        return res.status(400).json({ success: false, error: "Patient address is required" });
    }

    try {
        const patientDetails = await contract.methods.getPatientDetails(patientAddress).call({ from: account.address });

        const name = patientDetails[0];
        const age = patientDetails[1];
        const medicalHistory = patientDetails[2];

        const prompt = `Provide medical advice for a patient named ${name}, aged ${age}, with the following medical history: ${medicalHistory}.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
        });

        res.json({ success: true, insight: response.choices[0].message.content.trim() });
    } catch (error) {
        console.error("Error generating insight:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.response?.data?.error?.message || error.message });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ success: false, error: "Internal server error" });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));