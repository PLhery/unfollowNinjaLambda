import {NinjaAccount} from './ninjaAccount';
import * as config from './UNconfig.json';


export function checkUnfollow (event, context, callback) {
    if (!config.app_key || !config.app_secret)
        return callback(new Error('Please fill app_key and app_secret in UNconfig.json'));

    const q = new NinjaAccount(config, '290981389');
    q.checkUnfollow()
        .then(() => callback(null, {status: 'OK'}))
        .catch((err) => callback(err));
}