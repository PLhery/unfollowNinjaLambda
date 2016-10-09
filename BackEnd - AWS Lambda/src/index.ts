import {NinjaAccount, Account} from './ninjaAccount';
import {Promise} from 'es6-promise';
import * as AWS from 'aws-sdk';

const config = require('./UNconfig.json');

AWS.config.update({
    region: 'eu-west-1'
});

const d = (d0: number): number => new Date().getTime() - d0;

export function getRequestToken (event, context, callback) {
}

export function checkUnfollow (event, context, callback) {
    const d0 = new Date().getTime();
    if (!config.app_key || !config.app_secret)
        return callback(new Error('Please fill app_key and app_secret in UNconfig.json'));

    const ID = event.params.path.id;
    const q = new NinjaAccount(config, ID);
    q.checkUnfollow()
        .then((recap) => callback(null, {status: 'OK', recap: recap, duration: d(d0)}))
        .catch((err: Error) => callback(null, {status: 'error', message: err.message, duration: d(d0)}));
}

export function checkAll (event, context, cb) {
    const callback = (err, data?) => {
        if (err) console.log('error - ', err);
        console.log(data);
        cb(err, data);
    };
    const d0 = new Date().getTime();
    if (!config.app_key || !config.app_secret)
        return callback(new Error('Please fill app_key and app_secret in UNconfig.json'));
    scanAll().then((accounts) => {

        const checkUnfollowPromises: Promise<{username: string, id: string, recap?: any, error?: string, duration: number}>[] = accounts.map((account: Account) => {
            const q = new NinjaAccount(config, account);
            let bigRecap = {};
            return q.checkUnfollow()
                .then((recap) => bigRecap = ({username: account.twitterAccount.username, id: account.ID, recap: recap, duration: d(d0)}))
                .catch((err: Error) => bigRecap = ({username: account.twitterAccount.username, id: account.ID, error: err.message, duration: d(d0)}))
                .then(() => bigRecap);
        });
        return Promise.all(checkUnfollowPromises)
            .then((recaps) => callback(null, {status: 'OK', size: recaps.length, recaps: recaps, duration: d(d0)}))
            .catch((err) => callback(err));
    });
}

function scanAll(): Promise<Account[]> {
    return new Promise((resolve, reject) => {
        const docClient = new AWS.DynamoDB.DocumentClient();
        const params = {TableName: 'UnfollowNinja', ExclusiveStartKey: null};
        let accounts = [];

        function onScan(err, data) {
            if (err) {
                reject(err);
            } else {
                accounts = accounts.concat(data.Items);

                if (typeof data.LastEvaluatedKey !== 'undefined') {
                    params.ExclusiveStartKey = data.LastEvaluatedKey;
                    docClient.scan(params, onScan);
                } else {
                    resolve(accounts);
                }
            }
        }

        docClient.scan(params, onScan);
    });
}