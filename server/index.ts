import { createServer } from "node:http";
import { Readable } from "node:stream";
import { pathToFileURL } from "node:url";
import { createImportHandler, importPlan, type ImportDraft } from "./import.ts";
export { validateImportedDraft, importPlan, createImportHandler, type ImportDraft } from "./import.ts";

export function createImportServer(importer: (text: string) => Promise<ImportDraft> = importPlan) {
  const handle = createImportHandler(importer);
  return createServer(async (req, res) => {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    }
    const request = new Request(`http://${req.headers.host || "localhost"}${req.url || "/"}`, {
      method: req.method,
      headers,
      ...(req.method !== "GET" && req.method !== "HEAD"
        ? { body: Readable.toWeb(req) as ReadableStream<Uint8Array>, duplex: "half" }
        : {}),
    });
    const response = await handle(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const server = createImportServer();
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.listen(3002, "127.0.0.1", () =>
    console.log("Every Hand optional importer ready at http://127.0.0.1:3002"),
  );
}
