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
import packageInfo from './package.json' with { type: 'json' };
import { downloadSounds } from './downloadSounds.js';
import { cleanFileName } from './utils.js';
import 'dotenv/config';
import { downloadSlideshow } from './downloadSlideshow.js';
import { downloadVideo } from './downloadVideo.js';
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
    try {
      const task = await readData('liked');
      let list = task[0];
      let apiKey = task[2];
      await downloader(list, 'liked', apiKey);
    } catch (error) {
      console.error('getVideo failed', error);
    }
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

program.command('messages')
  .description('download shared videos from dms')
  .action(async () => {
    const task = await readData('messages');
    console.log(chalk.blue('Success: Read DM history list.'));
    for (const chat of task[0]) {
      let user = chat[0]['user'];
      console.log('history for user ' + user);
      await downloader(chat, 'messages', task[2], user);
    }

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
    program.error(chalk.red('Couldn\'t read user data file, does it exist?'));
  }
  try {
    const info = JSON.parse(data);
    var list = [];
    if (category === 'favorites') {
      list = info['Activity']['Favorite Videos']['FavoriteVideoList'];
    } else if (category === 'liked') {
      list = info['Activity']['Like List']['ItemFavoriteList'];
    } else if (category === 'sounds') {
      list = info['Activity']['Favorite Sounds']['FavoriteSoundList'];
    } else if (category === 'shared') {
      let rawList = info['Activity']['Share History']['ShareHistoryList'];
      list = rawList.filter((value, index, array) => {
        return value.SharedContent == 'video';
      });
    } else if (category === 'history') {
      list = info['Activity']['Video Browsing History']['VideoList'];
    } else if (category === 'messages') {
      //get list of chat history, append each item from each chat to LIST and make sure it specifies the folder to save to
      let messages = info['Direct Messages']['Chat History']['ChatHistory'];
      Object.keys(messages).forEach(value => {
        let chat = messages[value];
        let name = value.split(/\s+/).pop();
        chat[0].user = cleanFileName(name);
        list.push(chat);
      });
    }

  } catch (error) {
    console.log(error);
    program.error(
      chalk.red(
        'Couldn\'t parse JSON data. Make sure you have chosen an unmodified TikTok data JSON file.'
      )
    );
  }

  return [list, category, apiKey];
}

async function downloader(list, category, apiKey, subFolder = '') {
  // openHistory returns an array of strings containing all the URL's in the history file
  let history = await openHistory();

  // Create download folder if it doesn't exist
  let dlFolder = './tiktok-downloads/' + category;
  if (subFolder.length > 0) {
    dlFolder += '/' + subFolder;
  }
  try {
    if (!fs.existsSync(dlFolder)) {
      fs.mkdirSync(dlFolder, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  } catch (error) {
    console.log(error);
    program.error(
      'Couldn\'t create download directories. Please make sure you have permission to write to this folder.'
    );
  }

  // open writeStream for history file
  var writeHistory = fs.createWriteStream('history.txt', { flags: 'a' });
  //count successfully downloaded videos
  let DLCount = 0;


  for (let i = 0; i < list.length; i++) {
    //set the property names for the video items in the list bc dm lists have a different naming scheme
    let link = '';
    let date = 'Date';
    if (category === 'messages') {
      link = 'Content';
    } else {
      link = 'Link';
    }

    let qLength = list.length;
    let video = list[i];
    //get data from an entry in the Favorites list
    let favoriteURL = video[link];
    // replace colons in date field for Windows filename compatability
    let og_Date = video[date];
    let vidDate = og_Date.replace(/:/g, '');
    //check if url contains valid tiktok url
    if (!favoriteURL.startsWith('https://')) {
      continue;
    }
    if (history.indexOf(favoriteURL) != -1) {
      console.log(chalk.magenta('Video was found in history file, skipping.'));
      continue;
    }
//___METADATA FETCHING
    console.log(chalk.green('Getting video metadata for: ' + favoriteURL));

    // get the video information from API and check for errors.
    // if the tiktok has been deleted, or there's another issue with the URL, it's logged and skipped
    var responseData = await getVideoData(favoriteURL, apiKey);
    // very mid way to avoid API rate limits by setting a 1 sec timeout after every metadata API call
    await setTimeout(250);

    if (responseData.code != 0) {
      if (responseData.code == -1) {
        console.log(
          chalk.red('Couldn\'t get data for this URL, video may be deleted')
        );
      } else {
        console.log(
          chalk.red('Error getting video metadata for URL ' + favoriteURL)
        );
      }
      continue;
    }
    //debug logging
    if (process.env.NODE_ENV === 'dev') {
      console.log(chalk.blueBright(JSON.stringify(responseData.data)));
    }
    let success = -1;
    //call slideshow downloader for slideshows
    if (responseData.data.duration === 0) {
      success = await downloadSlideshow(dlFolder, responseData, vidDate);
      continue;
    } else {
      console.log(chalk.blue(`Downloading video ${i}/${qLength}...`));
      success = await downloadVideo(dlFolder, responseData, vidDate);
    }

    if (success === 0) {
      console.log(
        chalk.greenBright(`Finished downloading video ` + favoriteURL)
      );
      // write URL to history file after download is finished
      writeHistory.write('\n' + favoriteURL);
      DLCount++;
    }
  }

  console.log(chalk.greenBright('Saved ' + DLCount + ' videos. Goodbye.'));
}
