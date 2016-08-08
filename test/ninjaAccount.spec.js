const expect = require('chai').expect;
const Promise = require('es6-promise').Promise;
const NinjaAccount = require('../dist/ninjaAccount').NinjaAccount;
const _ = require('lodash');

describe('NinjaAccount', function() {
    describe('#getUnfollowers()', function() {
        it('should return empty arrays if followers are the same', function(done) {
            q = new NinjaAccount({}, 'twitterID');
            // mock
            q._account = {followers: { '01': {}, '02': {}, '04': {}, '03': {} }};
            q.getFollowers = function() {
                return Promise.resolve(['04', '02', '01', '03']);
            };
            // test
            q.getUnfollowers()
                .then(function(data) {
                    expect(data).to.deep.equal({
                        newFollowers: [],
                        unfollowers: []
                    });
                    done();
                }).catch(done);
        });

        it('should not return empty arrays if the followers changed', function(done) {
            q = new NinjaAccount({}, {followers: { '01': {}, '02': {}, '04': {}, '03': {} }});
            // mock
            q.getFollowers = function() {
                return Promise.resolve(['05', '06', '01', '03']);
            };
            // test
            q.getUnfollowers()
                .then(function(data) {
                    expect(data).to.deep.equal({
                        newFollowers: ['05', '06'],
                        unfollowers: ['02', '04']
                    });
                    done();
                }).catch(done);
        });
    });

    describe('#checkUnfollow()', function() {
        it('should change account infos in the DB', function(done) {
            q = new NinjaAccount({}, '');
            // mock
            q.get = function() {
                return Promise.resolve({followers: { '01': {}, '02': {}, '04': {}, '03': {} }, unfollowers: {}});
            };
            q.getFollowers = function() {
                return Promise.resolve(['04', '02', '05', '03']);
            };
            // test
            var updated = false;
            q.docClient.update = function(param, cb) {
                expect(_.keys(param.ExpressionAttributeValues[':f'])).to.deep.equal(['02', '04', '03', '05']);
                expect(param.ExpressionAttributeValues[':f']['05'].from).to.be.a('string');
                expect(param.ExpressionAttributeValues[':u']['01'].to).to.be.a('string');
                updated = true;
                cb(null, {});
            };
            q.checkUnfollow()
                .then(function(data) {
                    expect(updated).to.be.true;
                    done();
                }).catch(done);
        });
    });
});