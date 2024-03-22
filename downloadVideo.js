import { cleanFileName } from './utils.js';
import fetch from 'node-fetch';
import chalk from 'chalk';
import fs from 'fs';
import { pipeline } from 'stream/promises';

export async function downloadVideo(dlFolder, responseData, date) {

  let vidURL = responseData.data.hdplay;
  let author = cleanFileName(responseData.data.author.unique_id);
  let createTime = responseData.data.create_time;
  let videoID = responseData.data.id;

  //START video download
  // parameters: dlFolder, responseData,
  let videoFile;
  try {
    //fetch the video .MP4 from CDN
    videoFile = await fetch(vidURL);
  } catch (error) {
    console.log(chalk.redBright('Error downloading video:'));
    console.log(chalk.red(error));
    return -1;
  }

  try {
    //set filename and create a WriteStream
    // ${vidDate}
    let filename = `${dlFolder}/${date}_${author}_${videoID}.mp4`;
    let file = fs.createWriteStream(filename);
    //write the response body to a file
    file.on('finish', () => {
      file.close();
      return 0;
    });
    await pipeline(videoFile.body, file);
  } catch (error) {
    console.log(chalk.redBright('Error writing file to disk.'));
    console.log(error);
  }
}