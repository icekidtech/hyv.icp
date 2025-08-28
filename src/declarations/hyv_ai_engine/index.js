import { Actor, HttpAgent } from "@dfinity/agent";

// Imports and re-exports candid interface
import { idlFactory } from "./hyv_ai_engine.did.js";
export { idlFactory } from "./hyv_ai_engine.did.js";

/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
export const canisterId =
  process.env.CANISTER_ID_HYV_AI_ENGINE;

export const createActor = (canisterId, options = {}) => {
  const agent = options.agent || new HttpAgent({ ...options.agentOptions });

  if (options.agent && options.agentOptions) {
    console.warn(
      "Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent."
    );
  }

  // Fetch root key for certificate validation during development.
  // Prefer runtime detection in browser: if running on localhost (replica), fetch root key.
  try {
    if (typeof window !== "undefined" && window.location && window.location.hostname) {
      const hn = window.location.hostname;
      if (hn === "localhost" || hn === "127.0.0.1" || hn.endsWith(".localhost")) {
        agent.fetchRootKey().catch((err) => {
          console.warn("Unable to fetch root key for local replica (non-fatal):", err);
        });
      }
    } else if (process.env.DFX_NETWORK !== "ic") {
      agent.fetchRootKey().catch((err) => {
        console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
        console.error(err);
      });
    }
  } catch (e) {
    // Non-fatal: keep going if runtime checks fail
    console.warn("Runtime root-key check skipped:", e);
  }

  // Creates an actor with using the candid interface and the HttpAgent
  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions,
  });
};

export const hyv_ai_engine = canisterId ? createActor(canisterId) : undefined;
