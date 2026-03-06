export interface ParsedUrl {
  fileKey: string;
  nodeId: string | null;
}

export function parseUrl(url: string): ParsedUrl {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsed.hostname !== "www.figma.com" && parsed.hostname !== "figma.com") {
    throw new Error(`Not a Figma URL: ${url}`);
  }

  const segments = parsed.pathname.split("/").filter(Boolean);

  // figma.com/design/:fileKey/branch/:branchKey/:fileName
  // figma.com/design/:fileKey/:fileName
  // figma.com/board/:fileKey/:fileName
  const kind = segments[0];
  if (kind !== "design" && kind !== "board" && kind !== "file") {
    throw new Error(`Unsupported Figma URL type: ${kind}. Expected design, board, or file.`);
  }

  const fileKey = segments[1];
  if (!fileKey) {
    throw new Error(`Missing file key in URL: ${url}`);
  }

  // Branch URL: use branchKey as fileKey
  let resolvedFileKey = fileKey;
  if (segments[2] === "branch" && segments[3]) {
    resolvedFileKey = segments[3];
  }

  // node-id param: convert "-" to ":"
  const rawNodeId = parsed.searchParams.get("node-id");
  const nodeId = rawNodeId ? rawNodeId.replace(/-/g, ":") : null;

  return { fileKey: resolvedFileKey, nodeId };
}
