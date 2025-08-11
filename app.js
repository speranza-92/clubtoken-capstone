// Contract Addresses
const CLUB_TOKEN_ADDRESS = "0x4FDE1673eC5a06f390284611Ea3B600132c41f5a";
const MEMBERSHIP_NFT_ADDRESS = "0x941B9E7dA15A6Cb4b486A035c1FBa54E178efF42";
const ADMIN_PRIVATE_KEY = "6154929aed0dec9e92ed4668edcfb3dbbf9aa693775e98a391aa92cfb08e9872";

// Simplified ABIs
const clubTokenABI = [
    "function balanceOf(address) view returns (uint256)",
    "function claimTokens()",
    "function lastClaimed(address) view returns (uint256)",
    "function verifiedWithWorldID(address) view returns (bool)",
    "function verifyWithWorldID(address)",
    "function transfer(address, uint256)"
];

const membershipNFTABI = [
    "function hasMinted(address) view returns (bool)",
    "function mint(string, uint8, string, uint8, uint8, string, string)"
];

// Global variables
let userAddress;
let provider;
let signer;
let clubToken;
let membershipNFT;

// Connect Wallet
document.getElementById('connectWallet').onclick = async () => {
    if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
    }
    
    try {
        // Request account access
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        userAddress = accounts[0];
        
        // Setup provider and signer
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        
        // Check network
        const network = await provider.getNetwork();
        if (network.chainId !== 11155111) {
            alert('Please switch to Sepolia network in MetaMask');
            return;
        }
        
        // Initialize contracts
        clubToken = new ethers.Contract(CLUB_TOKEN_ADDRESS, clubTokenABI, signer);
        membershipNFT = new ethers.Contract(MEMBERSHIP_NFT_ADDRESS, membershipNFTABI, signer);
        
        // Update UI
        document.getElementById('walletAddress').textContent = 
            `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        document.getElementById('memberSection').style.display = 'block';
        document.getElementById('tokenSection').style.display = 'block';
        
        // Check member status and balance
        await checkMemberStatus();
        await updateBalance();
        
        showStatus('Wallet connected!', 'success');
        
    } catch (error) {
        console.error(error);
        alert('Failed to connect wallet');
    }
};

// Check if user has minted NFT
async function checkMemberStatus() {
    try {
        const hasMinted = await membershipNFT.hasMinted(userAddress);
        
        if (hasMinted) {
            document.getElementById('profileStatus').textContent = '✅ Profile NFT Active';
            document.getElementById('mintForm').style.display = 'none';
        } else {
            document.getElementById('profileStatus').textContent = 'No profile yet';
            document.getElementById('mintForm').style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking member status:', error);
    }
}

// Update token balance
async function updateBalance() {
    try {
        const balance = await clubToken.balanceOf(userAddress);
        const formatted = ethers.utils.formatEther(balance);
        document.getElementById('tokenBalance').textContent = formatted;
        
        // Enable/disable spend button
        document.getElementById('spendButton').disabled = (parseFloat(formatted) === 0);
    } catch (error) {
        console.error('Error updating balance:', error);
    }
}

// Mint NFT
document.getElementById('mintButton').onclick = async () => {
    const name = document.getElementById('playerName').value;
    const age = parseInt(document.getElementById('playerAge').value);
    const position = document.getElementById('playerPosition').value;
    const height = parseInt(document.getElementById('playerHeight').value);
    const weight = parseInt(document.getElementById('playerWeight').value);
    
    // Validate inputs
    if (!name || !age || !position || !height || !weight) {
        alert('Please fill all fields');
        return;
    }
    
    if (age > 255 || height > 255 || weight > 255) {
        alert('Age, height, and weight must be less than 256');
        return;
    }
    
    try {
        showStatus('Minting NFT...', 'info');
        const tx = await membershipNFT.mint(
            name, 
            age, 
            position, 
            height, 
            weight, 
            "", // empty image URL for POC
            ""  // empty metadata URI for POC
        );
        
        await tx.wait();
        showStatus('NFT minted successfully!', 'success');
        await checkMemberStatus();
    } catch (error) {
        console.error(error);
        showStatus('Failed to mint NFT', 'error');
    }
};

// Initialize World ID
IDKit.init({
    app_id: 'app_staging_0b67b4352eeec24c4395598a141f467e',
    action: 'claim_monthly_token',
    verification_level: 'device',
    
    handleVerify: async (response) => {
        try {
            showStatus('Verifying with World ID...', 'info');
            
            // Use admin wallet to verify (POC workaround)
            const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
            const adminClubToken = new ethers.Contract(CLUB_TOKEN_ADDRESS, clubTokenABI, adminWallet);
            
            const verifyTx = await adminClubToken.verifyWithWorldID(userAddress);
            await verifyTx.wait();
            
            // Now user can claim
            showStatus('Claiming token...', 'info');
            const claimTx = await clubToken.claimTokens();
            await claimTx.wait();
            
            showStatus('Token claimed successfully!', 'success');
            await updateBalance();
        } catch (error) {
            console.error(error);
            if (error.message.includes('Claim not available')) {
                showStatus('Please wait 30 days between claims', 'error');
            } else {
                showStatus('Claim failed', 'error');
            }
        }
    },
    
    onSuccess: () => {
        console.log('World ID verification successful');
    }
});

// Claim tokens
document.getElementById('claimButton').onclick = () => {
    IDKit.open();
};

// Spend token at bar
document.getElementById('spendButton').onclick = async () => {
    try {
        showStatus('Processing payment...', 'info');
        const clubWallet = "0xE2E26a3B3cf8fEa1092FE3ab80cA7e8788268F77";
        const amount = ethers.utils.parseEther("1");
        
        const tx = await clubToken.transfer(clubWallet, amount);
        await tx.wait();
        
        showStatus('Payment successful! Show this to bartender', 'success');
        await updateBalance();
    } catch (error) {
        console.error(error);
        showStatus('Payment failed', 'error');
    }
};

// Show status messages
function showStatus(message, type) {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusDiv.textContent = '';
        }, 5000);
    }
}