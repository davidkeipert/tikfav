import { open } from 'node:fs/promises'
import chalk from 'chalk';

export async function openHistory() {
    const historyFile = await open('./history.txt', 'a+');
    var history = [];
    for await (const line of historyFile.readLines()) {
        history.push(line);
    }
    if (history.length > 0)
        console.log(chalk.cyan('Read ' + history.length + ' lines from history file.'));

    return history;
}

//module.exports = { openHistory };





