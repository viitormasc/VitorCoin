import { broadcastLatest } from "./p2p";

class Block {
  public index: number;
  public hash: string;
  public previousHash: string | null;
  public timestamp: number;
  public data: string;

  constructor(index:number, hash:string , previousHash: string | null, timestamp: number, data: string){
    this.index = index;
    this.hash = hash
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.data = data;
  }
}

const calculteHash = (index:number, previousHash:string, timestamp:number, data:string) : string => CryptoJS.SHA256(index + previousHash + timestamp + data).toString()

const genesisBlock : Block = new Block(0,'816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7', null,  1465154705, 'genesis block')

const generateNextBlock  = (blockData : string): Block => {
  const previousBlock : Block = getLatestBlock()
  const nextIndex : number = previousBlock.index++
  const nextTimestamp : number = Date.now() / 1000
  const nextHash : string = calculteHash(nextIndex,previousBlock.hash,nextTimestamp,blockData)
  const newBlock : Block = new Block (nextIndex,nextHash,previousBlock.hash,nextTimestamp,blockData)
  return newBlock
}

let blockchain : Block[] = [genesisBlock]

const getBlockchain = (): Block[] => blockchain;

const getLatestBlock = (): Block => blockchain[blockchain.length - 1];

const calculateHashForBlock = (block : Block) => {
  return calculteHash(block.index,block.previousHash as string ,block.timestamp,block.data)
}

const isValidNewBlock = (newBlock : Block, previousBlock: Block) :boolean => {
  if (previousBlock.index + 1 !== newBlock.index) return false
  if(previousBlock.hash !== newBlock.previousHash) return false
  if(calculateHashForBlock(newBlock) !== newBlock.hash) {
    console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
  }
  return true 
} 

const isValidBlockStructure = (block: Block): boolean => {
  return typeof block.index === 'number' && typeof block.hash === 'string' && typeof block.previousHash === 'string' && typeof block.timestamp === 'number' && typeof block.data === 'string'
}

const isValidChain = (blockchain : Block[]) :boolean => {
  const isValidGenesis = (testedGenesisBlock : Block) : boolean => {
    return JSON.stringify(testedGenesisBlock) === JSON.stringify(genesisBlock)
  }
  if(!isValidGenesis(blockchain[0])) return false

for(let i = 0 ; i< blockchain.length ;i++) {
    if(!isValidNewBlock(blockchain[i], blockchain[i-1])) return false
  }
  return true
}

const addBlocktoChain = (block: Block): boolean => {
  if(isValidNewBlock(block,getLatestBlock())){
    blockchain.push(block)
    return true
  }
  return false
}

const replaceChain = (newBlocks: Block[]) => {
  if(isValidChain(newBlocks) && newBlocks.length > getBlockchain().length){
    console.log('Valid Blockchain, replacing the existing one')
    blockchain = newBlocks
    broadcastLatest() //TODO - MAKE THIS FUNCTION
  }else{
    console.log('Recieved blockchain invalid')
  }
}

export {Block, getBlockchain, getLatestBlock, generateNextBlock, isValidBlockStructure, replaceChain,addBlocktoChain };
