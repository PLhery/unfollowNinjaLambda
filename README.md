# unfollowNinjaLambda
https://unfollowninja.fr v2 backend - node.JS web service which detects when you are unfollowed on twitter and notify you.

[![CircleCI](https://circleci.com/gh/PLhery/unfollowNinjaLambda.svg?style=svg)](https://circleci.com/gh/PLhery/unfollowNinjaLambda) [![Dependency Status](https://david-dm.org/PLhery/unfollowNinjaLambda.svg)](https://david-dm.org/PLhery/unfollowNinjaLambda)

## Motivation

https://unfollowninja.fr had more and more users, and because unfollows are checked every 3 minutes, the old backend was too CPU-consuming. With AWS lambda, scalability problems are gone.

## License
Code released under [GPL V3 license](https://www.gnu.org/licenses/gpl-3.0.en.html)
## Installation


1 - Clone the repository
2 - `npm install`

## Usage

The project is not yet ready-to-use.

You have rename UNconfig-defaults.json => UNconfig.json and fill it with your twitter app tokens.

To deploy on aws lambda, create a shared credential file with your aws tokens (see http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html )
then type `gulp deploy`

To run lambda's CheckUnfollow function locally, first compile with `gulp deploy`, and then run it with `gulp checkUnfollow`

## Contribution

TODO

## History
0.0.x - Initial version