import { open } from 'node:fs/promises'

export async function openHistory() {
    const historyFile = await open('./history.txt', 'a+');
    var history = [];
    for await (const line of historyFile.readLines()) {
        history.push(line);
    }
    console.log(chalk.cyan('Read ' + history.size + ' lines from history file.'));

    return history;
}

//module.exports = { openHistory };





