process.loadEnvFile();
import express from "express";
import bodyParser from "body-parser";
import {
  getBlockchain,
  Block,
  generateNextBlock,
  generatenextBlockWithTransaction,
} from "./blockchain";
import { getSockets, connectToPeers, initP2PServer } from "./p2p";

const httpPort: number = parseInt(process.env.HTTP_PORT as string) || 3001;
const p2pPort: number = parseInt(process.env.P2P_PORT as string) || 6001;

const initHttpServer = (myHttpPort: number) => {
  const app = express();
  app.use(bodyParser.json());

  app.get("/blocks", (req, res) => {
    res.send(getBlockchain());
  });

  app.post("/mineBlock", (req, res) => {
    const newBlock: Block = generateNextBlock(req.body.data);
    res.send(newBlock);
  });
  app.get("/peers", (req, res) => {
    res.send(
      getSockets().map(
        (s: any) => s._socket.remoteAddress + ":" + s._socket.remotePort,
      ),
    );
  });
  app.post("/addPeer", (req, res) => {
    connectToPeers(req.body.peer);
    res.send();
  });

  app.listen(myHttpPort, () => {
    console.log("Listening http on port: " + myHttpPort);
  });
  app.post("/mineTransaction", (req, res) => {
    const address = req.body.address;
    const amount = req.body.amount;
    const resp = generatenextBlockWithTransaction(address, amount);
    res.send(resp);
  });
};

initHttpServer(httpPort);
initP2PServer(p2pPort);
