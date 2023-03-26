import { open } from 'node:fs/promises'

export async function openHistory() {
    const historyFile = await open('./history.txt', 'a+');
    var history = [];
    for await (const line of historyFile.readLines()) {
        console.log(history.push(line));
    }

    return history;
}

//module.exports = { openHistory };





