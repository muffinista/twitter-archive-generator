# twitter-archive-generator

This is some code to two do things:
- scrape a twitter account to generate an archive of tweets

- a script that uses the Twitter streaming API to maintain an archive of tweets

It also has code to upload archives to the Internet Archive, which I'm
using to update an archive at
https://archive.org/download/twitterArchiveDumps



How to run this code
====================


- You need to setup a Twitter account and API keys at
  https://apps.twitter.com/

- Under that account, you need to setup a Twitter list of accounts you
  want to monitor. The list can be private. You also need to get the
  ID of the list -- this can be a pain! Twitter hides it from you. I
  usually go to the list on Twitter and look at the HTML for the edit
  button, which will have it as the attribute 'data-list-id'

- Put the list id and Twitter API keys into conf.json

- Setup node, run `npm i` and then run `npm run index.js` to start the
  archiver.
  
