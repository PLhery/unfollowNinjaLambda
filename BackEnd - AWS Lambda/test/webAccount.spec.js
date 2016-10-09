const expect = require('chai').expect;
const Promise = require('es6-promise').Promise;
const WebAccount = require('../dist/webAccount').WebAccount;
const _ = require('lodash');

describe('WebAccount', function() {
    describe('#getAuthToken()', function() {
        it('should return an auth token', function(done) {
            WebAccount.getAuthToken({
                "app_key": "key",
                "app_secret": "secret"
            }).then((e) => {
                console.log(e);
                done();
            }).catch((err) => done(err));
        });
    });
});