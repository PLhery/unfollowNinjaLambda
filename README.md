# unfollowNinjaLambda
https://unfollowninja.fr v2 - node.JS web service which detects when you are unfollowed on twitter and notify you.

[![CircleCI](https://circleci.com/gh/PLhery/unfollowNinjaLambda.svg?style=svg)](https://circleci.com/gh/PLhery/unfollowNinjaV2) [![Dependency Status](https://david-dm.org/PLhery/unfollowNinjaV2.svg)](https://david-dm.org/PLhery/unfollowNinjaV2)

## Motivation

I could not find a good service which sends me a DM in 3 minutes, tells me exactly how long has the unfollower followed me, without ads / links in the message.

Migrating UnfollowNinja to AWS Lambda provides easy scalability : The AWS lambda function is called once every 3 minutes, and last 10sec. If my user base doubles, it will last 20 sec, and I will pay twice the price.

With a VM, I had to carefully chose my ressources so the operation of checking unfollows should last 2 - 3 minutes, not more, not less because it would cost me more.


## Installation

### Front-End

1 - Clone the repository
2 - `cd FrontEnd - React`
3 - `npm install`
4 - `npm run build`
5 - the web application is built in the dist folder, just open index.html.

### Back-End

1 - Clone the repository
2 - `cd BackEnd - AWS Lambda`
3 - `npm install`

#### Usage

4 - rename UNconfig-defaults.json => UNconfig.json and fill it with your twitter app tokens.

##### Run locally

5 - compile with `gulp deploy`
6 - `gulp checkUnfollow`

##### Deploy on lambda

7 - create a shared credential file with your aws tokens (see http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html )
8 - `gulp deploy`

## Contribution

TODO

## History
0.0.x - Initial version

## License
Code released under [GPL V3 license](https://www.gnu.org/licenses/gpl-3.0.en.html)