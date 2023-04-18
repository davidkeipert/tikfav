import chalk from 'chalk';
import fetch from 'node-fetch';

//fetch video info from API
export async function getVideoData(url, apiKey) {
    const options = {
        method: 'POST',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
    };

    // add the url to the query parameters
    const encodedParams = new URLSearchParams();
    encodedParams.append('url', url);
    encodedParams.append('hd', '1');
    // copy the options object with our API key and add the parameters as the body
    let fetchOptions = options;
    fetchOptions.body = encodedParams;

    // Make POST request using fetch, get JSON from response, and return the data
    const response = await fetch(
        'https://tiktok-video-no-watermark2.p.rapidapi.com/',
        fetchOptions
    );
    try {
        var responseData = await response.json();
    } catch (error) {
        console.error('fetch error')
    }

    // Log response status, calling function will handle errors
    if (process.env.NODE_ENV === 'development') {
        console.log(responseData);
        console.log(
            chalk.white('Got metadata with HTTP response ' + response.status)
        );
    }
    return responseData;
}

//fetch sound info from API
export async function getSoundData(url, apiKey) {
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com',
        },
    };

    let searchURL = 'https://tiktok-video-no-watermark2.p.rapidapi.com/music/info?url=' + url;
    const response = await fetch(searchURL, options);
    try {
        var responseData = await response.json();
    } catch (error) {
        console.error("Couldn't parse response data")
    }

    try {
        console.log(responseData);
    } catch (error) {
        console.error("Couldn't get sound metadata")
    }

    // Log response status
    if (process.env.NODE_ENV === 'development') {
        console.log(responseData);
        console.log(
            chalk.white('Got metadata with HTTP response ' + response.status)
        );
    }

    return responseData;

}