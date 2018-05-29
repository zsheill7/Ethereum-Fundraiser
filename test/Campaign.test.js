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

  it('requires a minimum amount of ether to contribute', async () => {
    try {
      await lottery.methods.contribute().send({
        from: accounts[1],
        value: 50
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it('allows a manager to make a payment request', async () => {
    await campaign.methods
      .createRequest('Buy batteries', '100', accounts[1])
      .send({ from: accounts[0], gas: '1000000' });
    const request = await campaign.methods.requests(0).call();

    assert.equal('Buy batteries', request.description);
  });

  it('processes requests', async () => {
    await campaign.methods.contribute().send({
      from: accounts[0],
      value: web3.utils.toWei('10', 'ether')
    });

    await campaign.methods
      .createRequest('A', web3.utils.toWei('5', 'ether'), accounts[1])
      .send({ from: accounts[0], gas: '1000000' });

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: '1000000'
    });

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: '1000000'
    });

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);

    console.log(balance);
    assert(balance > 103);
  });

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
  //   const approvers = await campaign.methods.approvers(accounts[0]).call();
  //
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(accounts[0], approvers[0]);
  //   assert.equal(3, players.length);
  // });

  it('only manager can call finalize request', async () => {
    try {
      await lottery.methods.finalizeRequest(0).send({
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });
});
