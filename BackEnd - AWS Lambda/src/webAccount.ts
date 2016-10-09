import {Promise} from 'es6-promise';
import * as request from 'request';

// -- Begin Interfaces --


// -- End Interfaces --

export class WebAccount {

    public static getAuthToken(config): Promise<string> {
        // WORK IN PROGRESS
        return new Promise((resolve, reject) => {
            request({
                url: 'https://api.twitter.com/oauth/request_token',
                method: 'POST',
                oauth: {
                    consumer_key: config.app_key,
                    consumer_secret: config.app_secret
                }
            }, function(err, res) {
                resolve(res);
            });
        });
    }
}