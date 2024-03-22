import { cleanFileName } from './utils.js';
import chalk from 'chalk';
import { pipeline } from 'stream/promises';
import fs from 'fs';

export async function downloadSlideshow(dlFolder, responseData, date) {
  let soundURL = responseData.data.music;
  let photoURLs = responseData.data.images; //array of photo urls
  let author = cleanFileName(responseData.data.author.unique_id);
  let path = `${dlFolder}/${date}_${author}_${responseData.data.id}/`;

  //download photos
  let photos = [];
  try {
    for (let url of photoURLs) {
      let p = await fetch(url);
      photos.push(p);
    }
  } catch (error) {
    console.log(chalk.redBright('Error downloading photos:'));
    console.log(chalk.red(error));
    return -1;
  }
  //create subfolder
  try {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  } catch (error) {
    console.log(chalk.red('Error creating slideshow download folder'));
    console.log(error);
  }

  //save downloaded photos
  try {
    for (let i = 0; i < photos.length; i++) {
      let filename = path + `${i + 1}.jpg`;
      let file = fs.createWriteStream(filename);
      //close file when finished writing
      file.on('finish', () => {
        console.log(
          chalk.greenBright(`Saved Photo!`)
        );
        file.close();
      });
      //write data to file
      console.log(chalk.blue(`Downloading photo ${i}/${photos.length}`));
      await pipeline(photos[i].body, file);
    }
  } catch (error) {
    console.log(chalk.red('Error writing photos to disk:'));
    console.log(error);
    return -1;
  }

  //Download and save slideshow audio
  let sound;
  try {
    sound = await fetch(soundURL);
  } catch (e) {
    console.log(chalk.red('Error downloading slideshow music:'));
    console.log(e);
  }
  try {
    let filename = path + 'music.mp3';
    let file = fs.createWriteStream(filename);
    file.on('finish', () => {
      console.log(chalk.greenBright('Saved Slideshow Music!'));
      file.close();
      return 0;
    });
    await pipeline(sound.body, file);
  } catch (e) {
    console.log(chalk.red('Error saving music to disk: '));
    console.log(e);
    return -1;
  }
}