// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
//@ts-nocheck
const { ethers, keccak256, toUtf8Bytes } = require("ethers");

const { gzip, ungzip } = require("node-gzip");
var { v4: uuidv4 } = require("uuid");
var viem = require("viem");
const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

var erc20abi = require("./contract");
var erc721abi = require("./erc721.json");
const { Wallet } = require("./wallet");
const erc20_contract_address = viem.getAddress(
  "0x2797a6a6D9D94633BA700b52Ad99337DdaFA3f52"
);
import { Ads, Router } from "./router";
import deployments from "./rollups.json";
import { Auctioneer } from "./auction";

const erc721_contract_address = viem.getAddress(
  "0x68E3Ee84Bcb7543268D361Bb92D3bBB17e90b838"
);
const DAPP_ADDRESS_REALY = "0xF5DE34d6BbC0446E2a45719E718efEbaaE179daE";
let DAPP_ADDRESS = "null";
let compressedData = new Map();
const toBinString = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, "0"), "");

const wallet = new Wallet(new Map());
const auctioneer = new Auctioneer(wallet);
const admap = new Map<string, Ads>();
const router = new Router(auctioneer, wallet, admap);

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const payload = data.payload;
  let JSONpayload = {};
  const msg_sender = data.metadata.msg_sender;

  try {
    if (
      String(data.metadata.msg_sender).toLowerCase() ===
      DAPP_ADDRESS_REALY.toLowerCase()
    ) {
      console.log("setting Dapp address:", payload);
      DAPP_ADDRESS = payload;
    }

    const payloadStr = viem.hexToString(payload);
    JSONpayload = JSON.parse(payloadStr);
    console.log(`received request ${JSON.stringify(JSONpayload)}`);
  } catch (e) {
    console.log(`Adding notice with binary value "${payload}"`);
    await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ payload: payload }),
    });
    return "reject";
  }
  let advance_req;
  try {
    if (
      msg_sender.toLowerCase() ===
      deployments.contracts.EtherPortal.address.toLowerCase()
    ) {
      try {
        return router.process("ether_deposit", payload);
      } catch (e) {
        return new Error_out(`failed to process ether deposit ${payload} ${e}`);
      }
    }

    if (JSONpayload.method === "create_asset") {
      console.log("minting ownership nft.....");

      // console.log("abi is", erc20abi);
      const call = viem.encodeFunctionData({
        abi: erc721abi,
        functionName: "mintTo",
        args: [data.metadata.msg_sender],
      });

      let voucher = {
        destination: erc721_contract_address, // dapp Address
        payload: call,
      };

      console.log(voucher);

      await fetch(rollup_server + "/voucher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voucher),
      });

      console.log("registering asset....");

      const id = uuidv4();

      const result = JSON.stringify({
        id,
        data: { ...JSONpayload.data, owner: data.metadata.msg_sender, voucher },
      });

      const hexresult = viem.stringToHex(result);

      advance_req = await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: hexresult }),
      });
    } else if (JSONpayload.method === "purchase_asset") {
      const wallet = new Wallet();

      wallet.ether_transfer(
        data.metadata.msg_sender,
        "0xFfdbe43d4c855BF7e0f105c400A50857f53AB044",
        "2"
      );
    } else if (JSONpayload.method === "decompress") {
      console.log("decompressing....");
      const dataArr = compressedData.get(JSONpayload.id);
      var datbuf = await ungzip(dataArr);
      var originalDat = datbuf.toString();
      console.log("the original data is:", originalDat);
      const result = JSON.stringify({ originaldata: originalDat });
      const hexresult = viem.stringToHex(result);
      advance_req = await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: hexresult }),
      });

      //{"method":"decompress","id":"000c7899-96bb-498b-8820-691d5e04ba33"}
    } else if (JSONpayload.method === "hash") {
      console.log("hashing....");
      const hash = keccak256(toUtf8Bytes(JSONpayload.data));
      console.log("hash is:", hash);

      advance_req = await fetch(rollup_server + "/notice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: hash }),
      });

      //{"method":"hash","data":"5447416f-98ab-4c3f-944b-f66ea3d3c261"}
    } else if (JSONpayload.method === "mint") {
      console.log("minting erc721 token.....");

      // console.log("abi is", erc20abi);
      const call = viem.encodeFunctionData({
        abi: erc721abi,
        functionName: "mintTo",
        args: [data.metadata.msg_sender],
      });
      let voucher = {
        destination: erc721_contract_address, // dapp Address
        payload: call,
      };
      console.log(voucher);
      advance_req = await fetch(rollup_server + "/voucher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voucher),
      });
      console.log("starting a voucher");
      //{"method":"mint"}
    } else {
      console.log("method undefined");
      const result = JSON.stringify({
        error: String("method undefined:" + JSONpayload.method),
      });
      const hexresult = viem.stringToHex(result);
      await fetch(rollup_server + "/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          payload: hexresult,
        }),
      });
    }
  } catch (e) {
    console.log("error is:", e);
    await fetch(rollup_server + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payload: viem.stringToHex(JSON.stringify({ error: e })),
      }),
    });
    return "reject";
  }
  const json = await advance_req.json();
  console.log(
    "Received  status " +
      advance_req.status +
      " with body " +
      JSON.stringify(json)
  );
  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  const payload = data.payload;
  let inspect_req;
  try {
    const payloadStr = viem.hexToString(data.payload);
    console.log("received inspect request with payload", payloadStr);
    const payloadArr = payloadStr.split("/");
    console.log(payloadArr);

    const result = JSON.stringify({
      value: toBinString(compressedData.get(payloadArr[1])),
    });
    const hexresult = viem.stringToHex(result);
    if (payloadArr[0] === "storage") {
      console.log(
        "fetching the stored value result",
        compressedData.get(payloadArr[1])
      );
      inspect_req = await fetch(rollup_server + "/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload: hexresult }),
      });
      console.log("Adding report with" + inspect_req.status);
      return "accept";
    }
  } catch (e) {
    console.log(`Adding report with binary value "${payload}",${e}`);
  }
  inspect_req = await fetch(rollup_server + "/report", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
  console.log("Adding report with" + inspect_req.status);
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: finish["status"] }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();
