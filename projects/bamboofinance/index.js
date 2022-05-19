const sdk = require("@defillama/sdk");
const { unwrapUniswapLPs } = require("../helper/unwrapLPs");
const { staking } = require("../helper/staking");

const bamTokenAddress = "0x5cc339Aa2A582D857F38B85F662Ea3513706a1E7";
const bdaoTokenAddress = "0x83c7412931398502922a35911E5Fab221822f4B6";
const bamRewardPoolAddress = "0x29B115599C648fE97b65E02951e7f038816ed25c";
//const bdaoRewardPoolAddress = "0x80eC36d02815d58186DC6f430d24a2309e308450";
const boardroomAddress = "0x1A86B4f3b34E8e5B1d0b612912f795eFe475B996";
const treasuryAddress = "0x5212989FC97ABBA4913743327796a63D09b4Da13";

const ftmLPs = [
  "0xbe7C737FCC2D6EBA0e4e73A073a0120171287769 ", // BamUSDCLpAddress
  "0x0774F0acC4DD1CA84BC8521FEe6dC2f7D22f133f ", //BdaoUSDCFtmLpAddress
];

async function calcPool2(masterchef, lps, block, chain) {
  let balances = {};
  const lpBalances = (
    await sdk.api.abi.multiCall({
      calls: lps.map((p) => ({
        target: p,
        params: masterchef,
      })),
      abi: "erc20:balanceOf",
      block,
      chain,
    })
  ).output;
  let lpPositions = [];
  lpBalances.forEach((p) => {
    lpPositions.push({
      balance: p.output,
      token: p.input.target,
    });
  });
  await unwrapUniswapLPs(
    balances,
    lpPositions,
    block,
    chain,
    (addr) => `${chain}:${addr}`
  );
  return balances;
}

async function ftmPool2(timestamp, block, chainBlocks) {
  return await calcPool2(bamRewardPoolAddress, ftmLPs, chainBlocks.fantom, "fantom");
}

async function treasury(timestamp, block, chainBlocks) {
  let balance = (await sdk.api.erc20.balanceOf({
    target: bamTokenAddress,
    owner: treasuryAddress, 
    block: chainBlocks.fantom,
    chain: 'fantom'
  })).output;

  return { [`fantom:${bamTokenAddress}`] : balance }
}
module.exports = {
  methodology: "Pool 2 deposits consist of bam/USDC and bdao/USDC LP tokens deposits while the staking TVL consists of the bdao tokens locked within the boardroom contract(0x1A86B4f3b34E8e5B1d0b612912f795eFe475B996).",
  fantom: {
    tvl: async () => ({}),
    pool2: ftmPool2,
    staking: staking(boardroomAddress, bdaoTokenAddress, "fantom"),
    treasury
  },
};