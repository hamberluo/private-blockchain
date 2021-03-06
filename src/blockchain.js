/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

import SHA256 from 'crypto-js';
import { Block } from './block.js';
import bitcoinMessage from 'bitcoinjs-message';

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            let block = new Block({ data: 'Genesis Block' });
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        let self = this;
        // Must return a Promise that will resolve with the block added OR reject if an error happen during the execution.
        return new Promise(async (resolve, reject) => {
            let pendingBlock = block;
            let height = await self.getChainHeight();
            // Assign the timestamp & the correct height
            pendingBlock.time = new Date().getTime().toString().slice(0, -3);
            pendingBlock.height = height + 1;
            // Create the block hash and push the block into the chain array.
            pendingBlock.hash = SHA256.SHA256(JSON.stringify(pendingBlock)).toString();
            if (height >= 0) {
                // Not Genesis Block
                let previousBlock = self.chain[self.height];
                // Height must be checked to assign the previousBlockHash
                pendingBlock.previousBlockHash = previousBlock.hash;
            }

            // Execute the validateChain() function every time a block is added
            // Create an endpoint that will trigger the execution of validateChain()
            let errors = await self.validateChain();
            if (errors.length === 0) {
                self.chain.push(pendingBlock);
                // Don't for get to update the this.height
                self.height = self.chain.length - 1;
                resolve(pendingBlock);
            } else {
                reject(errors);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        // Must return a Promise that will resolve with the message to be signed
        return new Promise((resolve) => {
            let message = `${address}:${new Date().getTime().toString().slice(0, -3)}:starRegistry`;
            resolve(message);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    submitStar(address, message, signature, star) {
        let self = this;
        // Must resolve with the Block added or reject with an error.
        return new Promise(async (resolve, reject) => {
            let time = parseInt(message.split(':')[1]);
            // Represented in seconds
            let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));

            // Time elapsed between when the message was sent and the current time must be less that 5 minutes
            const five = 5;
            let fiveMinsInSec = five * 60;
            if ((time + fiveMinsInSec) >= currentTime) {
                // Must verify the message with wallet address and signature: bitcoinMessage.verify(message, address, signature)
                let isValid = bitcoinMessage.verify(message, address, signature);
                if (isValid) {
                    // Must create the block and add it to the chain if verification is valid
                    let block = new BlockClass.Block({ owner: address, star: star });
                    let addedBlock = await self._addBlock(block);
                    resolve(addedBlock);
                } else {
                    reject('Signature is invalid');
                }
            } else {
                reject(`Should submit the star before ${five} minutes`);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        let self = this;
        // Must return a Promise that will resolve with the Block
        return new Promise((resolve, reject) => {
            let block = self.chain.find(p => p.hash === hash);
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        let self = this;
        // Must return a Promise that will resolve with the Block
        return new Promise((resolve, reject) => {
            let block = self.chain.find(p => p.height === height);
            if (block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        let self = this;
        let stars = [];
        // Must return a Promise that will resolve with an array of the owner address' Stars from the chain
        return new Promise((resolve, reject) => {
            self.chain.forEach((b) => {
                let bData = b.getBData();
                if (bData) {
                    if (bData.owner === address) {
                        stars.push(bData);
                    }
                }
            });
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using validate() method from each of the blocks in the chain.
     * 2. Each Block should check the with the previousBlockHash to make sure the chain isn't broken.
     */
    validateChain() {
        let self = this;
        let errors = [];
        // Must return a Promise that will resolve with the list of errors when validating the chain
        return new Promise(async (resolve, reject) => {
            let promises = [];
            let chainIndex = 0;
            self.chain.forEach(block => {
                // Must validate each block using validate()
                promises.push(block.validate());
                if (block.height > 0) {
                    // Each Block should check with the previousBlockHash
                    let previousBlockHash = block.previousBlockHash;
                    let blockHash = chain[chainIndex - 1].hash;
                    if (blockHash != previousBlockHash) {
                        errors.push(`Error - Block Height: ${block.height} - Previous Hash don't match.`);
                    }
                }
                chainIndex++;
            });
            Promise.all(promises).then((results) => {
                chainIndex = 0;
                results.forEach(valid => {
                    if (!valid) {
                        errors.push(`Error - Block Height: ${self.chain[chainIndex].height} - Has been Tampered.`);
                    }
                    chainIndex++;
                });
                resolve(errors);
            }).catch((err) => {
                console.log(err);
                reject(err);
            });
        });
    }

}

const _Blockchain = Blockchain;
export { _Blockchain as Blockchain };   