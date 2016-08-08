import * as AWS from 'aws-sdk';
import {Promise} from 'es6-promise';
import * as Twit from 'twit';
import * as _ from 'lodash';

AWS.config.update({
    region: 'eu-west-1'
});

// -- Begin Interfaces --
export interface TwitterAccount {
    id: string;
    username: string;
    photo: string;
    token: string;
    secret: string;
}
export interface Account {
    ID: string;
    twitterAccount: TwitterAccount;
    actions: {
        twitterDM: {
            enabled: boolean
            twitterAccount?: TwitterAccount
        };
        mail: {
            enabled: boolean;
            mailAdress?: string;
        };
    };
    followers: {
        [id: string]: {
            from?: string; // ISO date
        }
    };
    unfollowers: {
        [id: string]: {
            from?: string; // ISO date
            to: string; // ISO date
        }
    };
    inscription_date: string; // ISO date
    lang: 'fr' | 'en';
}
export interface Follower {
    from?: string; // ISO date
    username: string;
}
export interface Unfollower extends Follower {
    to: string; // ISO date
}
// -- End Interfaces --

export class NinjaAccount {
    private _account: Account;
    private _config;
    private _userId: string;
    private docClient = new AWS.DynamoDB.DocumentClient();

    constructor(config, user: string | Account) {
        this._config = config;
        if (typeof user === 'string') { // userId
            this._userId = user;
        } else { // Account
            this._userId = user.ID;
            this._account = user;
        }
    }

    /**
     * Load account data from dynamoDB
     * @param userId twitter ID
     * @return Promise<account data>
     */
    public get(userId: string): Promise<Account> {
        return new Promise((resolve, reject) => {
            const params = {
                TableName: 'UnfollowNinja',
                Key: { 'ID': userId }
            };

            this.docClient.get(params, (err, data: {Item: Account}) => {
                if (err) return reject(err);
                if (!data.Item) return reject(new Error('ID not found'));
                if (data.Item.twitterAccount.id !== userId) return reject(new Error('An error occured while loading user from DB'));
                resolve(data.Item);
            });
        });
    }

    /**
     * Add a new twitter account to unfollowNinja
     * @return Promise<>
     */
    public set(twitterToken: string, twitterSecret: string, lang: 'fr' | 'en') {
        return this.getTwitterProfile(twitterToken, twitterSecret) // 1 - We get twitter account
            .then((twitterAccount) => {
                this._account = {
                    ID: twitterAccount.id,
                    twitterAccount: twitterAccount,
                    actions: {
                        twitterDM: {enabled: false},
                        mail: {enabled: false},
                    },
                    followers: {},
                    unfollowers: {},
                    inscription_date: new Date().toISOString(), // ISO date
                    lang: lang
                };
                return this.getFollowers(); // 2 - we get his followers
            })
            .then((result) => {
                this._account.followers = _.zipObject(result, _.map(result, () => ({}))) as { [id: string]: { from?: string; }; };

                const params = { // 3 - We add account to db
                    TableName: 'UnfollowNinja',
                    Item: this._account
                };

                return new Promise((resolve, reject) => {
                    this.docClient.put(params, function (err, data) {
                        if (err) return reject(err);
                        resolve();
                    });
                });
            });
    }

    /**
     * Compare DB followers and twitter follower's, update DB and call sendUnfollow() for each unfollowers.
     * @returns Promise with no data
     */
    public checkUnfollow(): Promise<void> {
        // TODO : after 5 unfollows the same day, we should stop sending unfollowers and a recap should be sent at the end of the day

        return Promise.resolve().then(() => {
            if (!this._account) {
                return this.get(this._userId) // 1 - get account data from dynamoDB
                    .then((data: Account) => {
                        this._account = data;
                    });
            }
        })  .then(() => this.getUnfollowers()) // 2 - compare DB with twitter followers
            .then((result) => {
                if (!result.newFollowers.length && !result.unfollowers.length) return;

                result.newFollowers.forEach((id: string) => { // 3 - Add new followers to the DB
                    this._account.followers[id] = {
                        from: new Date().toISOString()
                    };
                });

                const manageUnfollows = _.take(result.unfollowers, 3) // max 3 unfollows / 3 minutes
                    .map((id) => Promise.resolve().then(() => { // 4 - remove unfollowers from DB and warn user
                        this._account.unfollowers[id] = <Unfollower>_.defaults(this._account.followers[id], { to: new Date().toISOString()});
                        delete this._account.followers[id];
                        return this.sendUnfollow(id);
                    }));

                return Promise.all(manageUnfollows) // Manage all unfollows in parallel
                    .then(() => this.saveToDB()); // 5 - update the DB
            });
    }

    /**
     * When an unfollower is detected, this method is called. It should send the DM / warn the user about this unfollower.
     * @param id ID of the unfollower
     * @returns Promise with no data
     */
    private sendUnfollow(id: string): Promise<void> {
        // TODO
        // 1 - Ask twitter if username changed
        // 2 - Send a DM if twitterDM is enabled
        // 3 - Send a mail if mail is enabled
        console.log('You have been unfollowed :(');
        return Promise.resolve();
    }

    /**
     * Save account data (followers and unfollowers) to DB
     * @return Promise<>
     */
    private saveToDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const params = {
                TableName: 'UnfollowNinja',
                Key: {'ID': this._userId},
                UpdateExpression: 'set followers = :f, unfollowers = :u',
                ExpressionAttributeValues: {
                    ':f': this._account.followers,
                    ':u': this._account.unfollowers
                }
            };

            this.docClient.update(<any>params, function (err, data) {
                if (err) return reject(err);
                resolve();
            });
        }).then(() => {});
    }


    /**
     * Get all followers IDs from twitter
     * @returns {Promise<string[]>} A promise to get all followers IDs
     */
    private getFollowers(): Promise<string[]> {
        const T = new Twit({
            consumer_key: this._config.app_key,
            consumer_secret: this._config.app_secret,
            access_token: this._account.twitterAccount.token,
            access_token_secret: this._account.twitterAccount.secret
        });
        return this.recursiveGetFollowers(T, []);
    }

    /**
     * Get all followers IDs from twitter, page per page
     * @param T Twit object
     * @param ids already found IDs
     * @param cursor (optional) current cursor
     * @returns {Promise<string[]>} A promise to get all followers IDs
     */
    private recursiveGetFollowers(T: Twit, ids: string[], cursor?: string): Promise<string[]> {
        return T.get('followers/ids', <Twit.Params>{stringify_ids: true, cursor: cursor || undefined}).then((result) => {
            if (!result.data.next_cursor) { // next_cursor = 0, next_cursor_str = '0'
                return ids.concat(result.data.ids);
            }
            else {
                return this.recursiveGetFollowers(T, ids.concat(result.data.ids), result.data.next_cursor_str);
            }
        });
    }

    /**
     * Get twitter profile from tokens
     * @returns {Promise<TwitterAccount>} A promise to get twitter infos
     */
    private getTwitterProfile(twitterToken: string, twitterSecret: string): Promise<TwitterAccount> {
        const T = new Twit({
            consumer_key: this._config.app_key,
            consumer_secret: this._config.app_secret,
            access_token: twitterToken,
            access_token_secret: twitterSecret
        });
        return T.get('account/verify_credentials', <Twit.Params>{include_entities: false, skip_status: true}).then((response) => {
            const profile = response.data;
            if (profile.errors) throw new Error(profile.errors[0].message);
            return {
                id: profile.id_str,
                username: profile.screen_name,
                photo: profile.profile_image_url_https,
                token: twitterToken,
                secret: twitterSecret
            };
        });
    }

    /**
     * Get followers from twitter and compare them with followers from DB
     * @returns {Promise<U>} {newFollowers: array of new followers's id, unfollowers: array of unfollower's ID}
     */
    private getUnfollowers(): Promise<{newFollowers: string[], unfollowers: string[]}> {
        const oldFollowers = _.keys(this._account.followers);
        return this.getFollowers()
            .then((twitterFollowers) => {
                return {
                    newFollowers: _.difference(twitterFollowers, oldFollowers),
                    unfollowers: _.difference(oldFollowers, twitterFollowers)
                };
            });
    }
}