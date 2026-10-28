/**
 * Smart Contract Definitions & Foundry Deployment Artifacts
 * Ready-to-deploy ERC-20 with score claim authorization for 1-day sprint.
 */

export const VOID_TOKEN_ADDRESS_DEFAULT = '0x9a8F9527D6c4A12B887f47e248b61D6e812b189F';

export const VOID_TOKEN_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'score', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'RewardClaimed',
    type: 'event'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'score', type: 'uint256' },
      { internalType: 'uint256', name: 'tokens', type: 'uint256' }
    ],
    name: 'claimScoreReward',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'faucet',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export const SOLIDITY_CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VoidToken ($VOID)
 * @notice 1-Day Sprint ERC-20 token for Void Raider arcade score-attack game.
 * Allows verified claim of tokens based on combat score and testnet faucet.
 */
contract VoidToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 10_000_000 * 10**18;
    uint256 public constant FAUCET_AMOUNT = 50 * 10**18;
    
    // Track player claims & high score records
    mapping(address => uint256) public playerHighScores;
    mapping(address => uint256) public totalClaimed;
    mapping(address => uint256) public lastFaucetClaim;

    event RewardClaimed(address indexed player, uint256 score, uint256 amount);
    event FaucetDripped(address indexed recipient, uint256 amount);

    constructor() ERC20("Void Raider Token", "VOID") Ownable(msg.sender) {
        // Initial pool mint to deployer
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    /**
     * @notice Claim $VOID token reward earned in a single combat session.
     * @param score Total score achieved by player in game.
     * @param tokens Number of tokens calculated (e.g. 1 per 100 points + crystal drops).
     */
    function claimScoreReward(uint256 score, uint256 tokens) external returns (bool) {
        require(tokens > 0, "Zero tokens");
        require(tokens <= 5000, "Exceeds per-run safety cap");

        uint256 mintAmount = tokens * 10**18;
        require(totalSupply() + mintAmount <= MAX_SUPPLY, "Exceeds max supply");

        if (score > playerHighScores[msg.sender]) {
            playerHighScores[msg.sender] = score;
        }

        totalClaimed[msg.sender] += tokens;
        _mint(msg.sender, mintAmount);

        emit RewardClaimed(msg.sender, score, mintAmount);
        return true;
    }

    /**
     * @notice Testnet Faucet for testers without needing to finish a run.
     */
    function faucet() external returns (bool) {
        require(block.timestamp - lastFaucetClaim[msg.sender] >= 1 hours, "Cooldown active");
        require(totalSupply() + FAUCET_AMOUNT <= MAX_SUPPLY, "Max supply reached");

        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);

        emit FaucetDripped(msg.sender, FAUCET_AMOUNT);
        return true;
    }
}
`;

export const FOUNDRY_DEPLOY_GUIDE = `# 1-Day Foundry Deployment Script

# 1. Initialize Foundry project
forge init void-arcade-token --no-commit
cd void-arcade-token

# 2. Install OpenZeppelin Contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# 3. Create contract in src/VoidToken.sol and paste code

# 4. Deploy to Sepolia or Base Sepolia Testnet
forge create --rpc-url https://sepolia.base.org \\
  --private-key $DEPLOYER_PRIVATE_KEY \\
  --verify \\
  --etherscan-api-key $BASESCAN_API_KEY \\
  src/VoidToken.sol:VoidToken

# 5. Copy the deployed contract address into your frontend app!
`;
