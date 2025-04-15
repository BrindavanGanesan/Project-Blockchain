let web3;
let account;

// Shared ABIs and Contract Addresses
const healthcareABI = [
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

const paymentsABI = [
    {
        "inputs": [],
        "name": "deposit",
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address payable", "name": "_to", "type": "address" },
            { "internalType": "uint256", "name": "_amount", "type": "uint256" }
        ],
        "name": "withdraw",
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    }
];

const healthcareAddress = "0xc589794a729e6c75943de3e86f231aeab10f9a63";
const paymentsAddress = "0xa06c3453d444551513ea83c4c1ac032f57b5dd6f";

// Connect to MetaMask
const connectToMetaMask = async () => {
    const userWalletAddressInput = document.getElementById("userWalletAddress");
    const userWalletAddress = userWalletAddressInput ? userWalletAddressInput.value : null;

    if (userWalletAddressInput && !userWalletAddress) {
        alert("Please enter your MetaMask wallet address!");
        return;
    }

    if (window.ethereum) {
        try {
            // Request accounts from MetaMask
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

            // If the input field exists, validate the entered wallet address
            if (userWalletAddressInput && accounts[0].toLowerCase() !== userWalletAddress.toLowerCase()) {
                alert("The entered wallet address does not match the connected MetaMask account!");
                return;
            }

            // Store the connected account in localStorage
            account = accounts[0];
            localStorage.setItem('account', account);

            // Update the connection status if the element exists
            const connectionStatus = document.getElementById("userStatus");
            if (connectionStatus) {
                connectionStatus.innerHTML = `Connected: ${account}`;
            }

            alert("MetaMask connected successfully!");

            // Redirect to index.html
            window.location.href = "index.html";
        } catch (error) {
            console.error("Error connecting to MetaMask:", error);
            alert("Failed to connect to MetaMask.");
        }
    } else {
        alert("MetaMask is not installed. Please install it to use this feature.");
    }
};

// Check if the user is logged in
window.onload = async () => {
    const currentPage = window.location.pathname.split("/").pop(); // Get the current page name

    if (currentPage === "login.html") {
        // Do nothing on the login page
        return;
    }

    // Check if the user is logged in
    account = localStorage.getItem('account'); // Check if the account is stored in localStorage
    if (!account) {
        // Redirect to login page if no account is found
        window.location.href = "login.html";
        return;
    }

    if (window.ethereum) {
        try {
            web3 = new Web3(window.ethereum); // Initialize web3 with MetaMask's provider
            console.log("Web3 initialized with account:", account);

            // Check if the connected MetaMask account matches the stored account
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts[0].toLowerCase() !== account.toLowerCase()) {
                alert("The connected MetaMask account does not match the logged-in account!");
                window.location.href = "login.html"; // Redirect to login page
                return;
            }
        } catch (error) {
            console.error("Error initializing web3:", error);
            alert("Failed to initialize web3. Please try logging in again.");
            window.location.href = "login.html"; // Redirect to login page
        }
    } else {
        alert("MetaMask is not installed. Please install it to use this DApp.");
        window.location.href = "login.html"; // Redirect to login page if MetaMask is not installed
    }
};

// Register a new patient
const registerPatient = async () => {
    if (!web3) {
        alert("Web3 is not initialized. Please connect to MetaMask first.");
        await connectToMetaMask(); // Attempt to reconnect MetaMask
        return;
    }

    const name = document.getElementById("nameInput").value;
    const age = document.getElementById("ageInput").value;
    const medicalHistory = document.getElementById("historyInput").value;

    if (!name || !age || !medicalHistory) {
        alert("Please fill in all fields!");
        return;
    }

    try {
        const contract = new web3.eth.Contract(healthcareABI, healthcareAddress);

        await contract.methods.registerPatient(name, age, medicalHistory).send({
            from: account,
            gas: 300000
        });

        alert("Patient successfully registered!");
    } catch (error) {
        console.error("Error registering patient:", error);
        alert("Failed to register patient. Check the console for details.");
    }
};

// Get Patient Details
const getPatientDetails = async () => {
    const patientAddress = document.getElementById("patientAddressInput").value;

    if (!patientAddress) {
        alert("Please enter the patient's Ethereum address!");
        return;
    }

    try {
        const contract = new web3.eth.Contract(healthcareABI, healthcareAddress);

        const data = await contract.methods.getPatientDetails(patientAddress).call({ from: patientAddress });
        document.getElementById("patientDetails").innerHTML = `
            <strong>Name:</strong> ${data[0]} <br>
            <strong>Age:</strong> ${data[1]} <br>
            <strong>Medical History:</strong> ${data[2]}
        `;
    } catch (error) {
        console.error("Error fetching patient details:", error);
        alert("Unable to fetch patient details. Ensure the address is authorized.");
    }
};

// Deposit Ether
const depositEther = async () => {
    const amountInEther = document.getElementById("depositAmount").value;

    if (!amountInEther) {
        alert("Please enter an amount to deposit!");
        return;
    }

    try {
        const contract = new web3.eth.Contract(paymentsABI, paymentsAddress);

        await contract.methods.deposit().send({
            from: account,
            value: web3.utils.toWei(amountInEther, "ether") // Convert Ether to Wei
        });

        alert("Payment successfully made!");
    } catch (error) {
        console.error("Error making payment:", error);
        alert("Failed to make payment. Check the console for details.");
    }
};

// Get Contract Balance
const getContractBalance = async () => {
    try {
        const contract = new web3.eth.Contract(paymentsABI, paymentsAddress);

        const balance = await contract.methods.getBalance().call();
        alert(`Payments Contract Balance: ${web3.utils.fromWei(balance, "ether")} ETH`);
    } catch (error) {
        console.error("Error fetching balance:", error);
        alert("Unable to fetch contract balance.");
    }
};

// Withdraw Funds
const withdrawFunds = async () => {
    const recipient = document.getElementById("withdrawRecipient").value;
    const amountInEther = document.getElementById("withdrawAmount").value;

    if (!recipient || !amountInEther) {
        alert("Please enter a recipient address and amount!");
        return;
    }

    try {
        const contract = new web3.eth.Contract(paymentsABI, paymentsAddress);

        await contract.methods.withdraw(recipient, web3.utils.toWei(amountInEther, "ether")).send({
            from: account
        });

        alert("Withdrawal successful!");
    } catch (error) {
        console.error("Error withdrawing funds:", error);
        alert("Failed to withdraw funds. Check the console for details.");
    }
};

// Admin Wallet Address
const adminWalletAddress = "0xe9A57EabCB19a7d59AbfAA0a19ECa27f3f540EFe";

// Function to Handle Patient Payment
const submitPatientPayment = async () => {
    const ethereumAddress = document.getElementById("patientEthereumAddress").value;
    const walletId = document.getElementById("patientWalletId").value;
    const amount = document.getElementById("transactionAmount").value;

    if (!ethereumAddress || !walletId || !amount) {
        alert("Please fill in all fields!");
        return;
    }

    try {
        // Ensure the patient's entered Ethereum address matches the connected MetaMask address
        if (ethereumAddress.toLowerCase() !== account.toLowerCase()) {
            alert("The entered Ethereum address does not match your connected wallet!");
            return;
        }

        // Send Ether to Admin Wallet
        await web3.eth.sendTransaction({
            from: account,
            to: adminWalletAddress,
            value: web3.utils.toWei(amount, "ether") // Convert Ether to Wei
        });

        // Notify the user and log the wallet ID for reference
        console.log(`Wallet ID: ${walletId}`);
        alert("Payment successfully sent to the admin wallet!");
    } catch (error) {
        console.error("Error processing payment:", error);
        alert("Failed to submit payment. Check the console for details.");
    }


};

const generateInsight = async () => {
    const patientAddress = document.getElementById("patientAddressInput").value;

    if (!patientAddress) {
        alert("Please enter the patient's Ethereum address!");
        return;
    }

    try {
        const response = await fetch('/generate-insight', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ patientAddress }),
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById("insightResult").innerHTML = `<strong>Insight:</strong> ${data.insight}`;
        } else {
            alert("Failed to generate insight: " + data.error);
        }
    } catch (error) {
        console.error("Error generating insight:", error);
        alert("An error occurred while generating insight.");
    }
};
const logout = () => {
    // Clear the account from localStorage
    localStorage.removeItem('account');

    // Redirect to the login page
    window.location.href = "login.html";
};

