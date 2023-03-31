# tikfav
### Archive all your favorited Tiktoks using the data download files from TikTok. Downloads videos with no watermarks and in 1080p.

This tool uses a third-party API to get direct MP4 links to TikTok videos. It currently supports [this RapidAPI service](https://rapidapi.com/yi005/api/tiktok-video-no-watermark2) which returns metadata with watermark-free, 1080p MP4 links. The downside is that this API only allows 150 requests per month and 1 request per second unless you pay $12/month for a premium plan with 600k requests/month.  
If there's another API that you'd like me to integrate pls create an issue.

## Prerequisites 

### Tiktok Data Download
To use this tool you'll need to download your user data from Tiktok by going to Settings -> Account -> Download your data and requesting a JSON download. This request will take a few days to process before you can download the data.

### Video Download API Key

Sign up for either a free or paid plan here: https://rapidapi.com/yi005/api/tiktok-video-no-watermark2  
You'll need to set this key as an environment variable named `RAPIDAPIKEY`:  
`export RAPIDAPIKEY='yourKey'`

## Installation  
`npm install -g tiksave`

## Usage  
Run `tiksave`. It will look for a data file called user_data.json by default. If yours has a different name, or resides in a different directroy, specify the path with the `-u` option.

Make sure you have set the RAPIDAPIKEY env variable to your key. TikSave will create a folder called `tiktok-downloads` in the current directory.

TikFav saves the url's of videos you download to a file called `history.txt`. This is useful if you periodically request a data download from tiktok and only want to download videos you don't already have.

# Todo

- add option to pass a user data JSON file at runtime
- improve video file naming scheme
