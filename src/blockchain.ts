import { broadcastLatest } from "./p2p";
import { hexToBinary } from "./util";

class Block {
  public index: number;
  public hash: string;
  public previousHash: string | null;
  public timestamp: number;
  public data: string;
  public difficulty: number;
  public nonce: number;

  constructor(
    index: number,
    hash: string,
    previousHash: string | null,
    timestamp: number,
    data: string,
    difficulty: number,
    nonce: number,
  ) {
    this.index = index;
    this.hash = hash;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
    this.difficulty = difficulty;
    this.nonce = nonce;
  }
}

const calculteHash = (
  index: number,
  previousHash: string,
  timestamp: number,
  data: string,
  difficulty: number,
): string =>
  CryptoJS.SHA256(
    index + previousHash + timestamp + data + difficulty,
  ).toString();

const genesisBlock: Block = new Block(
  0,
  "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7",
  null,
  1465154705,
  "genesis block",
  0,
  0,
);

const blockGenerationInterval = 10;
const difficultyAdjustmentInterval = 10;

const getDifficulty = (blockchain: Block[]): number => {
  const latestBlock: Block = blockchain[blockchain.length - 1];
  if (
    latestBlock.index % difficultyAdjustmentInterval === 0 &&
    latestBlock.index !== 0
  ) {
    return getAdjustedDifficulty(latestBlock, blockchain);
  } else {
    return latestBlock.difficulty;
  }
};

const getAdjustedDifficulty = (latestBlock: Block, aBlockchain: Block[]) => {
  const prevAdjustmentBlock: Block =
    aBlockchain[blockchain.length - difficultyAdjustmentInterval];
  const timeExpected: number =
    blockGenerationInterval * difficultyAdjustmentInterval;
  const timeTaken: number =
    latestBlock.timestamp - prevAdjustmentBlock.timestamp;
  if (timeTaken < timeExpected / 2) {
    return prevAdjustmentBlock.difficulty + 1;
  } else if (timeTaken > timeExpected * 2) {
    return prevAdjustmentBlock.difficulty - 1;
  } else {
    return prevAdjustmentBlock.difficulty;
  }
};

const generateNextBlock = (blockData: string): Block => {
  const previousBlock: Block = getLatestBlock();
  const nextIndex: number = previousBlock.index++;
  const nextTimestamp: number = Date.now() / 1000;
  const difficulty: number = getDifficulty(getBlockchain());

  const newBlock: Block = findBlock(
    nextIndex,
    previousBlock.hash,
    nextTimestamp,
    blockData,
    difficulty,
  );
  return newBlock;
};

let blockchain: Block[] = [genesisBlock];

const getBlockchain = (): Block[] => blockchain;

const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

const calculateHashForBlock = (block: Block) => {
  return calculteHash(
    block.index,
    block.previousHash as string,
    block.timestamp,
    block.data,
    block.difficulty,
  );
};

const isValidTimestamp = (newBlock: Block, previousBlock: Block): boolean => {
  return (
    previousBlock.timestamp - 60 < newBlock.timestamp &&
    newBlock.timestamp - 60 < getCurrentTimestamp()
  );
};

const getCurrentTimestamp = (): number => {
  return Math.round(Date.now() / 1000);
};

const isValidNewBlock = (newBlock: Block, previousBlock: Block): boolean => {
  if (previousBlock.index + 1 !== newBlock.index) return false;
  if (previousBlock.hash !== newBlock.previousHash) return false;
  if (!isValidTimestamp(newBlock, previousBlock)) return false;
  if (calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(
      typeof newBlock.hash + " " + typeof calculateHashForBlock(newBlock),
    );
    console.log(
      "invalid hash: " + calculateHashForBlock(newBlock) + " " + newBlock.hash,
    );
    return false;
  }
  return true;
};

const isValidBlockStructure = (block: Block): boolean => {
  return (
    typeof block.index === "number" &&
    typeof block.hash === "string" &&
    typeof block.previousHash === "string" &&
    typeof block.timestamp === "number" &&
    typeof block.data === "string"
  );
};

const isValidChain = (blockchain: Block[]): boolean => {
  const isValidGenesis = (testedGenesisBlock: Block): boolean => {
    return JSON.stringify(testedGenesisBlock) === JSON.stringify(genesisBlock);
  };
  if (!isValidGenesis(blockchain[0])) return false;

  for (let i = 0; i < blockchain.length; i++) {
    if (!isValidNewBlock(blockchain[i], blockchain[i - 1])) return false;
  }
  return true;
};

const addBlocktoChain = (block: Block): boolean => {
  if (isValidNewBlock(block, getLatestBlock())) {
    blockchain.push(block);
    return true;
  }
  return false;
};

const getCumulativeDifficulty = (blockchain: Block[]): number => {
  let result = 0;
  for (let i = 0; i < blockchain.length; i++) {
    result += Math.pow(2, blockchain[i].difficulty);
  }
  return result;
};

const replaceChain = (newBlocks: Block[]) => {
  if (
    isValidChain(newBlocks) &&
    getCumulativeDifficulty(newBlocks) >
      getCumulativeDifficulty(getBlockchain())
  ) {
    console.log("Valid Blockchain, replacing the existing one");
    blockchain = newBlocks;
    broadcastLatest(); //TODO - MAKE THIS FUNCTION
  } else {
    console.log("Recieved blockchain invalid");
  }
};

const hashMatchesDifficulty = (hash: string, difficulty: number): boolean => {
  const hashInBinary: string = hexToBinary(hash)!;
  const requiredPrefix: string = "0".repeat(difficulty);
  return hashInBinary.startsWith(requiredPrefix);
};

const findBlock = (
  index: number,
  previousHash: string,
  timestamp: number,
  data: string,
  difficulty: number,
): Block => {
  let nonce = 0;
  while (true) {
    const hash: string = calculteHash(
      index,
      previousHash,
      timestamp,
      data,
      difficulty,
    );
    if (hashMatchesDifficulty(hash, difficulty)) {
      return new Block(
        index,
        hash,
        previousHash,
        timestamp,
        data,
        difficulty,
        nonce,
      );
    }
    nonce++;
  }
};

export {
  Block,
  getBlockchain,
  getLatestBlock,
  generateNextBlock,
  isValidBlockStructure,
  replaceChain,
  addBlocktoChain,
};
