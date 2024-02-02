// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License. You may obtain a copy
// of the license at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useWallets, useConnectWallet } from "@web3-onboard/react";
import { useNoticesQuery } from "../../generated/graphql";
import { Button } from "../../components";
import styles from "./notices.module.css";

type Notice = {
  id: string;
  index: number;
  input: any; //{index: number; epoch: {index: number; }
  payload: any;
  data: any;
};

export const Notices = ({
  depositEtherToPortal,
  rollups,
  reexecuteQuery,
}: any) => {
  const [result] = useNoticesQuery();
  const { data, fetching, error } = result;
  const [{ wallet }] = useConnectWallet();

  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;

  if (!data || !data.notices) return <p>No notices</p>;

  const notices: any[] = data.notices.edges
    .map((node: any) => {
      const n = node.node;
      let inputPayload = n?.input.payload;
      if (inputPayload) {
        try {
          inputPayload = ethers.utils.toUtf8String(inputPayload);
        } catch (e) {
          inputPayload = inputPayload + " (hex)";
        }
      } else {
        inputPayload = "(empty)";
      }
      let payload = n?.payload;
      if (payload) {
        try {
          payload = ethers.utils.toUtf8String(payload);
        } catch (e) {
          payload = payload + " (hex)";
        }
      } else {
        payload = "(empty)";
      }
      return {
        id: `${n?.id}`,
        index: parseInt(n?.index),
        payload: payload,
        input: n ? { index: n.input.index, payload: inputPayload } : {},
        data: JSON.parse(payload),
      };
    })
    .sort((b: any, a: any) => {
      if (a.input.index === b.input.index) {
        return b.index - a.index;
      } else {
        return b.input.index - a.input.index;
      }
    });

  // const forceUpdate = useForceUpdate();
  return (
    <div className={styles["notices-page"]}>
      <h3 className={styles["page-title"]}>Assets for sale</h3>
      <button onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}>
        Reload
      </button>
      <table className={styles.table}>
        <thead>
          <tr>
            {/* <th>Input Index</th> */}
            <th> Index</th>
            {/* <th>Input Payload</th> */}
            {/* <th>Payload</th> */}
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Owner</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {notices.length === 0 && (
            <tr>
              <td colSpan={4}>no notices</td>
            </tr>
          )}
          {notices.map((n: any) => (
            <tr key={`${n.input.index}-${n.index}`}>
              {/* <td>{n.input.index}</td> */}
              <td>{n.index}</td>
              {/* <td>{n.input.payload}</td> */}
              {/* <td>{n.payload}</td> */}
              <td>{JSON.parse(n.payload).data.title}</td>
              <td>{JSON.parse(n.payload).data.description}</td>
              <td>{JSON.parse(n.payload).data.price} ETH</td>
              <td>
                {JSON.parse(n.payload).data.owner ===
                wallet?.accounts[0].address
                  ? "You"
                  : JSON.parse(n.payload).data.owner}
              </td>
              <td>
                {wallet?.accounts[0].address !==
                  JSON.parse(n.payload).data.owner && (
                  <div>
                    <Button
                      onClick={() =>
                        depositEtherToPortal(JSON.parse(n.payload).data.price)
                      }
                      disabled={!rollups}
                    >
                      Purchase Asset (Deposit)
                    </Button>
                    <br />
                    <br />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
