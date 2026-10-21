import { createImportHandler } from "../server/import.ts";

// Shared Web API handler: importing this module never opens a listening socket.
export default { fetch: createImportHandler() };
