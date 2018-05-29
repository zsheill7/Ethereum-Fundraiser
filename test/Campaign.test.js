const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledCampaign = require('../ethereum/build/Campaign.json');

let campaign;
let factory;
let campaignAddress;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
    .deploy({ data: compiledFactory.bytecode })
    .send({ from: accounts[0], gas: '1000000' });

  await factory.methods
    .createCampaign('100')
    .send({ from: accounts[0], gas: '1000000' });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  campaign = await new web3.eth.Contract(
    JSON.parse(compiledCampaign.interface),
    campaignAddress
  );

  /* )
    .deploy({ data: compiledCampaign.bytecode })
    .send({ from: accounts[0], gas: '1000000' } */
});

describe('Campaign Contract', () => {
  it('deploys a factory and campaign', () => {
    assert.ok(campaign.options.address);
    assert.ok(factory.options.address);
  });

  it('marks caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();

    assert.equal(accounts[0], manager);
  });

  it('allows one account to contribute and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });
  //
  // it('allows multiple accounts to contribute', async () => {
  //   await campaign.methods.contribute().send({
  //     from: accounts[0],
  //     value: web3.utils.toWei('0.02', 'ether')
  //   });
  //   await campaign.methods.contribute().send({
  //     from: accounts[1],
  //     value: web3.utils.toWei('0.02', 'ether')
  //   });
  //   await campaign.methods.contribute().send({
  //     from: accounts[2],
  //     value: web3.utils.toWei('0.02', 'ether')
  //   });
  //
  //   const approvers = await campaign.function.approvers().call({
  //     from: accounts[0]
  //   });
  //
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(3, players.length);
  // });
  //
  // it('requires a minimum amount of ether to execute', async () => {
  //   try {
  //     await lottery.methods.contribute().send({
  //       from: accounts[0],
  //       value: 200
  //     });
  //     assert(false);
  //   } catch (err) {
  //     assert(err);
  //   }
  // });
  //
  // it('only manager can call finalize request', async () => {
  //   try {
  //     await lottery.methods.finalizeRequest().send({
  //       from: accounts[1]
  //     });
  //     assert(false);
  //   } catch (err) {
  //     assert(err);
  //   }
  // });
});
