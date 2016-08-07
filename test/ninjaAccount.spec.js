const expect = require('chai').expect;
const Promise = require('es6-promise').Promise;
const NinjaAccount = require('../dist/ninjaAccount').NinjaAccount;
const _ = require('lodash');

describe('NinjaAccount', function() {
    describe('#getUnfollowers()', function() {
        it('should return empty arrays if followers are the same', function(done) {
            q = new NinjaAccount('');
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
            q = new NinjaAccount('');
            // mock
            q._account = {followers: { '01': {}, '02': {}, '04': {}, '03': {} }};
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
            q = new NinjaAccount('');
            // mock
            q.get = function() {
                return Promise.resolve({followers: { '01': {}, '02': {}, '04': {}, '03': {} }, unfollowers: {}});
            };
            q.getFollowers = function() {
                return Promise.resolve(['04', '02', '05', '03']);
            };
            // test
            q.checkUnfollow()
                .then(function(data) {
                    expect(_.keys(q._account.followers)).to.deep.equal(['02', '04', '03', '05']);
                    expect(q._account.followers['05'].from).to.be.a('string');
                    expect(q._account.unfollowers['01'].to).to.be.a('string');
                    // TODO sendUnfollow should be called once
                    // TODO check that when dynamodb is updated
                    done();
                }).catch(done);
        });
    });
});