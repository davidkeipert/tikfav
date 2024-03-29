# TikFav

![npm](https://img.shields.io/npm/v/tikfav)

### Scared of losing your favorited TikToks? Switching accounts and want to archive videos you saved on your old one? Use this tool to save all your favorited Tiktoks using the data download file you can get from TikTok. Videos are downloaded in 1080p with no watermarks!

This tool uses a third-party API to get direct MP4 links to TikTok videos. It currently
supports [this RapidAPI service](https://rapidapi.com/yi005/api/tiktok-video-no-watermark2) which returns metadata with
watermark-free, 1080p MP4 links. The downside is that this API only allows 150 requests per month and 1 request per
second unless you pay $12/month for a premium plan with 600k requests/month.  
If there's another API that you'd like me to integrate pls create an issue.

# Prerequisites

### Tiktok Data Download

To use this tool you'll need to download your user data from Tiktok by going to Settings -> Account -> Download your
data and requesting a JSON download. This request will take a few days to process before you can download the data.

### Video Download API Key

Sign up for either a free or paid plan here: https://rapidapi.com/yi005/api/tiktok-video-no-watermark2  
You'll need to pass this key to the app with the -k option at runtime.

# Installation

`npm install -g tikfav`

# Usage

`tikfav -k xxxxxxxxxxxxx -u user_data.json favorites`

Run `tikfav` followed by the command you want to run. It will look for a data file called `user_data.json` by default.
If yours has a different name, or resides in a different directroy, specify the path with the `-u` option. You also need
to give it your RapidAPI key with the `-k` option. See above for instructions about the API.

### Commands

`favorites` download the videos in your Favorites list  
`liked` download the videos in your Liked list  
`sounds` download the sounds in your Favorites list  
`shared` download videos you shared  
`history` download videos from your browsing history

### Options

`-k` your RapidAPI key, REQUIRED  
`-u` path to user data file, default is ./user_data.json

TikFav saves the url's of videos you download to a file called `history.txt`. This is useful if you want to periodically
request a data download from tiktok and only download videos you don't already have.

Videos are downloaded to a subfolder called `tiktok-downloads` in whichever directory you run the app.

# Upcoming Features

- [x] download Tiktok sounds and videos from your share history
- [x] download shared videos from direct message history
- [ ] migrate to typescript
- [ ] release single file executable for easier installation

# Known Issues

- slow downloads and high RAM usage when running on WSL
