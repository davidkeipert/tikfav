import fetch from "node-fetch";
import chalk from "chalk";
import { openHistory } from "./history.js";
import fs from 'fs';
import { program } from "commander";
import { getSoundData } from "./videoInfo.js";
import { pipeline } from "stream/promises";
import { setTimeout } from "timers/promises";

export async function downloadSounds(list, apiKey) {
    let history = await openHistory();

    let dlFolder = './tiktok-downloads/sounds';
    //create the download foler if it doesn't exist
    try {
        if (!fs.existsSync(dlFolder)) {
            fs.mkdirSync(dlFolder, { recursive: true }, (err) => {
                if (err) throw err;
            });
        }
    } catch (error) {
        console.log(error);
        program.error(
            "Couldn't create download directories. Please make sure you have permission to write to this folder."
        );
    }

    var writeHistory = fs.createWriteStream('history.txt', { flags: 'a' });

    let DLCount = 0;

    for (let i = 0; i < list.length; i++) {
        let qLength = list.length;
        let sound = list[i];

        let soundURL = sound.Link;
        let og_Date = sound.Date;
        let soundDate = og_Date.replace(/:/g, '');
        if (history.indexOf(soundURL) != -1) {
            console.log(chalk.magenta('Sound was found in history file, skipping.'));
            continue;
        }

        console.log(chalk.green('Getting sound metadata for: ' + soundURL));

        var responseData = await getSoundData(soundURL, apiKey);

        await setTimeout(250);

        if (responseData.code != 0) {
            if ((responseData.code = -1)) {
                console.log(
                    chalk.red("Couldn't get data for this URL, sound may be deleted")
                );
            } else {
                console.log(
                    chalk.red('Error getting sound metadata for URL ' + favoriteURL)
                );
            }
            continue;
        }

        //extract info from the API response data
        let soundMP3 = responseData.data.play;
        let author = responseData.data.author;
        let title = responseData.data.title;
        let soundID = responseData.data.id;

        // fetch MP3 file
        let soundFile = await fetch(soundMP3);

        // FILENAMING SCHEME
        let filename = `${dlFolder}/${soundDate}_${title}_${author}_${soundID}.mp3`;
        let file = fs.createWriteStream(filename);

        file.on('finish', () => {
            console.log(chalk.greenBright(`Finished downloading sound ` + soundURL));
            file.close();
        });
        console.log(chalk.blue(`Downloading sound ${i}/${qLength}...`));
        await pipeline(soundFile.body, file);

        writeHistory.write('\n' + soundURL);
        DLCount++;

    }

    console.log(chalk.greenBright('Saved ' + DLCount + ' sounds. Goodbye.'));
}