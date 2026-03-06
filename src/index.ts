#!/usr/bin/env node
import * as fs from "node:fs";
import { parseUrl } from "./parse-url.js";
import { initToken, loadToken } from "./init.js";
import { getNodes, getVariables, getComments, getImageUrl } from "./api.js";
import { buildTokenMap, buildColorIndex, resolveNodeTokens } from "./token-map.js";
import { formatTree } from "./formatter.js";
import type { FigmaNode, ImageFormat, TokenMap } from "./types.js";

function spinner(message: string): { stop: (final: string) => void } {
  const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r${frames[i++ % frames.length]} ${message}`);
  }, 80);
  return {
    stop(final: string) {
      clearInterval(id);
      process.stdout.write(`\r${final}\n`);
    },
  };
}

function printUsage(): void {
  console.log(`figma-cli — Figma design inspector

Usage:
  figma-cli init                           Set up Figma API token
  figma-cli inspect <url> [options]        Inspect a Figma node
  figma-cli screenshot <url> [options]     Get a screenshot URL or save image

Inspect options:
  --plain          Tree text output (default: JSON)
  --comments       Include comments

Screenshot options:
  --format <fmt>   png | jpg | svg | pdf (default: png)
  --scale <n>      0.01–4 (default: 1)
  --save <path>    Save image to file`);
}

function parseArgs(argv: string[]): {
  command: string;
  url?: string;
  plain: boolean;
  comments: boolean;
  format: ImageFormat;
  scale: number;
  save?: string;
} {
  const args = argv.slice(2);
  const command = args[0] ?? "help";

  let url: string | undefined;
  let plain = false;
  let comments = false;
  let format: ImageFormat = "png";
  let scale = 1;
  let save: string | undefined;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--plain") {
      plain = true;
    } else if (arg === "--comments") {
      comments = true;
    } else if (arg === "--format" && args[i + 1]) {
      format = args[++i] as ImageFormat;
    } else if (arg === "--scale" && args[i + 1]) {
      scale = Number(args[++i]);
    } else if (arg === "--save" && args[i + 1]) {
      save = args[++i];
    } else if (!url && arg && !arg.startsWith("--")) {
      url = arg;
    }
  }

  return { command, url, plain, comments, format, scale, save };
}

function enrichNodesWithTokens(
  node: FigmaNode,
  tokenMap: TokenMap
): FigmaNode & { resolvedTokens?: Record<string, string> } {
  const resolvedTokens = resolveNodeTokens(node, tokenMap);
  const enriched: FigmaNode & { resolvedTokens?: Record<string, string> } = {
    ...node,
  };
  if (resolvedTokens) {
    enriched.resolvedTokens = resolvedTokens;
  }
  if (node.children) {
    enriched.children = node.children.map((child) =>
      enrichNodesWithTokens(child, tokenMap)
    );
  }
  return enriched;
}

async function runInspect(opts: ReturnType<typeof parseArgs>): Promise<void> {
  if (!opts.url) {
    console.error("Error: URL is required. Usage: figma-cli inspect <url>");
    process.exit(1);
  }

  const { fileKey, nodeId } = parseUrl(opts.url);
  if (!nodeId) {
    console.error("Error: URL must contain a node-id parameter.");
    process.exit(1);
  }

  const token = loadToken();

  const s = spinner("Fetching design data...");

  const [nodesResp, variablesResp, commentsResp] = await Promise.all([
    getNodes(fileKey, [nodeId], token),
    getVariables(fileKey, token),
    opts.comments ? getComments(fileKey, token) : Promise.resolve(null),
  ]);

  s.stop("Design data fetched.");

  const nodeData = nodesResp.nodes[nodeId];
  if (!nodeData) {
    console.error(`Error: Node ${nodeId} not found in file.`);
    process.exit(1);
  }

  const tokenMap = variablesResp ? buildTokenMap(variablesResp) : new Map();
  const colorIndex = buildColorIndex(tokenMap);

  if (opts.plain) {
    const tree = formatTree(
      nodeData.document,
      tokenMap,
      colorIndex,
      commentsResp ?? undefined
    );
    console.log(tree);
  } else {
    const enriched = enrichNodesWithTokens(nodeData.document, tokenMap);
    const output: Record<string, unknown> = {
      fileName: nodesResp.name,
      lastModified: nodesResp.lastModified,
      node: enriched,
    };
    if (commentsResp && commentsResp.length > 0) {
      output["comments"] = commentsResp;
    }
    if (tokenMap.size > 0) {
      output["tokenCount"] = tokenMap.size;
    }
    console.log(JSON.stringify(output, null, 2));
  }
}

async function runScreenshot(opts: ReturnType<typeof parseArgs>): Promise<void> {
  if (!opts.url) {
    console.error("Error: URL is required. Usage: figma-cli screenshot <url>");
    process.exit(1);
  }

  const { fileKey, nodeId } = parseUrl(opts.url);
  if (!nodeId) {
    console.error("Error: URL must contain a node-id parameter.");
    process.exit(1);
  }

  const token = loadToken();

  const s = spinner("Getting image URL...");
  const cdnUrl = await getImageUrl(fileKey, nodeId, token, {
    format: opts.format,
    scale: opts.scale,
  });
  s.stop("Image URL ready.");

  if (opts.save) {
    const dl = spinner(`Downloading ${opts.format}...`);
    const resp = await fetch(cdnUrl);
    if (!resp.ok) {
      dl.stop("Download failed.");
      console.error(`Error: Failed to download image: ${resp.status}`);
      process.exit(1);
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    fs.writeFileSync(opts.save, buffer);
    dl.stop(`Saved to ${opts.save} (${buffer.length} bytes)`);
  } else {
    console.log(cdnUrl);
  }
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  switch (opts.command) {
    case "init":
      await initToken();
      break;
    case "inspect":
      await runInspect(opts);
      break;
    case "screenshot":
      await runScreenshot(opts);
      break;
    case "help":
    case "--help":
    case "-h":
      printUsage();
      break;
    default:
      console.error(`Unknown command: ${opts.command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? `Error: ${err.message}` : err);
  process.exit(1);
});
