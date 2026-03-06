import type {
  FigmaUser,
  FigmaNodesResponse,
  FigmaVariablesResponse,
  FigmaComment,
  FigmaImageResponse,
  ImageFormat,
} from "./types.js";

const BASE = "https://api.figma.com";

async function figmaFetch<T>(
  path: string,
  token: string
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Figma-Token": token },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "(no body)");
    throw new Error(`Figma API ${res.status}: ${res.statusText} — ${path}\n  Response: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function getMe(token: string): Promise<FigmaUser> {
  return figmaFetch<FigmaUser>("/v1/me", token);
}

export async function getNodes(
  fileKey: string,
  nodeIds: string[],
  token: string
): Promise<FigmaNodesResponse> {
  const ids = nodeIds.map((id) => encodeURIComponent(id)).join(",");
  return figmaFetch<FigmaNodesResponse>(
    `/v1/files/${fileKey}/nodes?ids=${ids}`,
    token
  );
}

export async function getVariables(
  fileKey: string,
  token: string
): Promise<FigmaVariablesResponse | null> {
  try {
    return await figmaFetch<FigmaVariablesResponse>(
      `/v1/files/${fileKey}/variables/local`,
      token
    );
  } catch (e) {
    // 403 = no variables access (e.g. free plan), graceful fallback
    if (e instanceof Error && e.message.includes("403")) {
      return null;
    }
    throw e;
  }
}

export async function getComments(
  fileKey: string,
  token: string
): Promise<FigmaComment[]> {
  const resp = await figmaFetch<{ comments: FigmaComment[] }>(
    `/v1/files/${fileKey}/comments`,
    token
  );
  return resp.comments;
}

export async function getImageUrl(
  fileKey: string,
  nodeId: string,
  token: string,
  options?: { format?: ImageFormat; scale?: number }
): Promise<string> {
  const format = options?.format ?? "png";
  const scale = options?.scale ?? 1;
  const id = encodeURIComponent(nodeId);
  const resp = await figmaFetch<FigmaImageResponse>(
    `/v1/images/${fileKey}?ids=${id}&format=${format}&scale=${scale}`,
    token
  );
  if (resp.err) {
    throw new Error(`Figma image error: ${resp.err}`);
  }
  const url = resp.images[nodeId];
  if (!url) {
    throw new Error(`No image URL returned for node ${nodeId}`);
  }
  return url;
}
