#! /usr/bin/env node

import { Command, Option } from 'commander';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import fs from 'fs';
import { pipeline } from 'stream/promises';
import { openHistory } from './history.js';
import { setTimeout } from 'timers/promises';
import { getVideoData, getSoundData } from './videoInfo.js';
import packageInfo from './package.json' assert { type: 'json' };
import { downloadSounds } from './downloadSounds.js';

//get version info from package.json
const version = packageInfo.version;
//commander setup
const program = new Command();
program
  .version(version)
  .name('tikfav')
  .description(
    'Downloader utility that downloads your favorite videos from your TikTok user data file.'
  )
  .option('-u <json file>', 'choose user data file', 'user_data.json')
  .requiredOption('-k <key>', 'your RapidAPI key');

program
  .command('favorites')
  .description('download your favorite videos')
  .action(async () => {
    try {
      const task = await readData('favorites');
      let list = task[0];
      let apiKey = task[2];
      await downloader(list, 'favorites', apiKey);
    } catch (error) {
      console.error('getVideo failed', error);
    }
  });

program
  .command('liked')
  .description('download your liked videos')
  .action(async () => {
    const task = await readData('liked');
    let list = task[0];
    let apiKey = task[2];
    await downloader(list, 'liked', apiKey);
  });

program
  .command('sounds')
  .description('download your favorite sounds')
  .action(async () => {
    const task = await readData('sounds');
    let list = task[0];
    let apiKey = task[2];
    console.log(chalk.blue('Success: Read favorite sounds list.'));
    await downloadSounds(list, apiKey);
  });

program
  .command('shared')
  .description('download videos you shared')
  .action(async () => {
    const task = await readData('shared');
    console.log(chalk.blue('Success: Read shared videos list.'));
    await downloader(task[0], 'shared', task[2]);
  });

program
  .command('history')
  .description('download video browsing history')
  .action(async () => {
    const task = await readData('history');
    console.log(chalk.blue('Success: Read browsing history list.'));
    await downloader(task[0], 'history', task[2]);
  });

program.parse(process.argv);

async function readData(category) {
  // Initialize variables from CLI args
  const opts = program.opts();
  const userDataFile = opts.u;
  var apiKey = opts.k;
  if (apiKey != undefined) {
    console.log(chalk.green.bold('Using RapidAPI key ' + apiKey));
  }
  console.log(chalk.green('Reading from user data file ' + opts.u));

  //read and parse user data file JSON and gets the list of Favorite Videos
  try {
    var data = readFileSync(`./${userDataFile}`);
  } catch (error) {
    //console.log("Error reading userdata file:", error);
    program.error(chalk.red("Couldn't read user data file, does it exist?"));
  }
  try {
    const info = JSON.parse(data);

    if (category === 'favorites') {
      var list = info['Activity']['Favorite Videos']['FavoriteVideoList'];
    } else if (category === 'liked') {
      var list = info['Activity']['Like List']['ItemFavoriteList'];
    } else if (category === 'sounds') {
      var list = info['Activity']['Favorite Sounds']['FavoriteSoundList'];
    } else if (category === 'shared') {
      var rawList = info['Activity']['Share History']['ShareHistoryList'];
      var list = rawList.filter((value, index, array) => {
        return value.SharedContent == 'video';
      });
    } else if (category === 'history') {
      var list = info['Activity']['Video Browsing History']['VideoList'];
    }
  } catch (error) {
    program.error(
      chalk.red(
        "Couldn't parse JSON data. Make sure you have chosen an unmodified TikTok data JSON file."
      )
    );
  }

  return [list, category, apiKey];
}

async function downloader(list, category, apiKey) {
  // openHistory returns an array of strings containing all the URL's in the history file
  let history = await openHistory();

  // Create download folder if it doesn't exist
  let dlFolder = './tiktok-downloads/' + category;
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

  // open writeStream for history file
  var writeHistory = fs.createWriteStream('history.txt', { flags: 'a' });
  //count successfully downloaded videos
  let DLCount = 0;

  for (let i = 0; i < list.length; i++) {
    let qLength = list.length;
    let video = list[i];
    //get data from an entry in the Favorites list
    let favoriteURL = video.Link;
    // replace colons in date field for Windows filename compatability
    let og_Date = video.Date;
    let vidDate = og_Date.replace(/:/g, '');
    if (history.indexOf(favoriteURL) != -1) {
      console.log(chalk.magenta('Video was found in history file, skipping.'));
      continue;
    }

    console.log(chalk.green('Getting video metadata for: ' + favoriteURL));

    // get the video information from API and check for errors.
    // if the tiktok has been deleted, or there's another issue with the URL, it's logged and skipped
    var responseData = await getVideoData(favoriteURL, apiKey);
    // very mid way to avoid API rate limits by setting a 1 sec timeout after every metadata API call
    await setTimeout(250);

    if (responseData.code != 0) {
      if ((responseData.code = -1)) {
        console.log(
          chalk.red("Couldn't get data for this URL, video may be deleted")
        );
      } else {
        console.log(
          chalk.red('Error getting video metadata for URL ' + favoriteURL)
        );
      }
      continue;
    }
    // get the mp4 URL and metadata from the API response
    let vidURL = responseData.data.hdplay;
    let author = responseData.data.author.unique_id;
    let createTime = responseData.data.create_time;
    let videoID = responseData.data.id;

    let videoFile;
    try {
      //fetch the video .MP4 from CDN
      videoFile = await fetch(vidURL);
    } catch (error) {
      console.log(chalk.redBright('Error downloading video:'));
      console.log(chalk.red(error));
      continue;
    }

    try {
      //set filename and create a WriteStream
      // ${vidDate}
      let filename = `${dlFolder}/${vidDate}_${author}_${videoID}.mp4`;
      let file = fs.createWriteStream(filename);
      //write the response body to a file
      file.on('finish', () => {
        console.log(
          chalk.greenBright(`Finished downloading video ` + favoriteURL)
        );
        file.close();
      });
      console.log(chalk.blue(`Downloading video ${i}/${qLength}...`));
      await pipeline(videoFile.body, file);
    } catch (error) {
      console.log(chalk.redBright('Error writing file to disk.'));
      console.log(error);
    }

    // write URL to history file after download is finished
    writeHistory.write('\n' + favoriteURL);
    DLCount++;
  }

  console.log(chalk.greenBright('Saved ' + DLCount + ' videos. Goodbye.'));
}
