import { HmRequest, LoginRequest, MessageType, PublishResponse, SubscribeRequest, TriggerRequest } from "https://deno.land/x/hmsys_connector@0.9.0/mod.ts";
import { API } from "shared";
import { asPointer, lazyInit, State } from "webgen/mod.ts";
import { Server, ServerDetails } from "../../spec/music.ts";
import { activeUser, tokens } from "../manager/helper.ts";
import { state } from "./data.ts";

export async function refreshState() {
    state.servers = State((await API.hosting(API.getToken()).servers()).map(x => State(x)));
    state.meta = State(await API.hosting(API.getToken()).meta());
}

/**
 * me waiting for hmsys_connector@0.10 to fix this bloat code down under
 *
 * TODO: Move this the the pool down below
 */
export function listener() {
    const ws = new WebSocket(API.WS_URL);
    let firstTime = true;
    console.log("Starting Update Listener...");
    ws.onmessage = ({ data }) => {
        const json = JSON.parse(data);
        if (json.login === "require authentication") {
            tokens.$accessToken.listen((val) => val && ws.send(JSON.stringify(<LoginRequest>{
                action: MessageType.Login,
                type: "client",
                token: API.getToken(),
                id: activeUser.id
            })));
        }
        if (json.login === true && firstTime === true) {
            firstTime = false;
            ws.send(JSON.stringify(<SubscribeRequest>{
                action: "sub",
                id: "@bbn/hosting/sync",
                auth: {
                    token: API.getToken(),
                    id: activeUser.id
                }
            }));
        }
        if (json.type == "pub") {
            const { data: { id, server: _server } } = <PublishResponse>json;
            const server = JSON.parse(_server) as Server;
            console.log(id, server);
            const index = state.servers.findIndex(x => x._id == server._id);
            if (index === -1) return; // handle this state
            for (const [ key, value ] of Object.entries(server)) {
                // @ts-ignore unsafe af
                state.servers[ index ][ key ] = value;
            }
        }
    };
    // my fancy reconnect
    ws.onclose = () => setTimeout(() => listener(), 1000);
}

export const currentDetailsTarget = asPointer(<string | undefined>undefined);
export const currentDetailsSource = asPointer((data: ServerDetails) => { data; });

export const messageQueue = <HmRequest[]>[];
// deno-lint-ignore require-await
export const streamingPool = lazyInit(async () => {
    function connect() {
        const ws = new WebSocket(API.WS_URL);
        console.log("Starting Streaming Pool");
        let firstTime = true;
        ws.onmessage = ({ data }) => {
            const json = JSON.parse(data);

            if (json.login === "require authentication") {
                if (tokens.accessToken)
                    ws.send(JSON.stringify(<LoginRequest>{
                        action: MessageType.Login,
                        type: "client",
                        token: API.getToken(),
                        id: activeUser.id
                    }));
            }

            if (json.login === true && firstTime === true) {
                firstTime = false;
                currentDetailsTarget.listen((id, _oldId) => {
                    if (id)
                        ws.send(JSON.stringify(<TriggerRequest>{
                            action: MessageType.Trigger,
                            type: "@bbn/hosting/details",
                            data: {
                                id
                            },
                            auth: {
                                token: API.getToken(),
                                id: activeUser.id
                            }
                        }));
                    else if (_oldId != undefined) {
                        console.log(_oldId);
                        // Else somehow unregister the oldId
                        // Can't current unregister the conversation. Thats why we just restart the pool.
                        ws.close();
                    }

                });
            }
            if (json.type == "sync" && json.data.type == "@bbn/hosting/details") {
                currentDetailsSource.getValue()?.(json.data.data);
            }
        };
        ws.onerror = () => {

        };
        setInterval(() => {
            if (ws.readyState != ws.OPEN) return;
            if (messageQueue.length == 0) return;

            ws.send(JSON.stringify(messageQueue.shift()));
        }, 100);
        ws.onclose = () => setTimeout(() => connect(), 1000);
    }
    connect();
});