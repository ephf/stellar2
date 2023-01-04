import { IncomingMessage, ServerResponse } from "http";

Object.assign(IncomingMessage.prototype, {
  async data() {
    return new Promise((resolve) => {
      this.on("data", (data) => resolve(data));
    });
  },
  async json() {
    return JSON.stringify((await this.data()).toString());
  },
  async text() {
    return (await this.data()).toString();
  },
});

export const WEBSOCKET_SYMBOL = Symbol("websocket");

Object.assign(ServerResponse.prototype, {
  addedHeaders: {},
  setStatus: 200,
  status(status) {
    this.setStatus = status;
    return this;
  },
  headers(headers) {
    Object.assign(this.addedHeaders, headers);
    return this;
  },
  send(text) {
    this.writeHead(this.setStatus, this.addedHeaders);
    this.end(text);
  },
  json(json) {
    this.headers({ "Content-Type": "application/json" }).send(
      JSON.stringify(json)
    );
  },
  html(html) {
    this.headers({ "Content-Type": "text/html" }).send(html);
  },
  ws(listener) {
    return Object.assign(WEBSOCKET_SYMBOL, { listener });
  },
});
