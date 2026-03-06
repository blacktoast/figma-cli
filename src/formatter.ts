import type {
  FigmaNode,
  FigmaComment,
  TokenMap,
  Paint,
} from "./types.js";
import {
  resolveColor,
  resolveTypographyTokens,
  colorToHex,
} from "./token-map.js";

interface FormatOptions {
  tokenMap: TokenMap;
  colorIndex: Map<string, string>;
  comments?: FigmaComment[];
}

function indent(depth: number, isLast: boolean, prefixes: string[]): string {
  if (depth === 0) return "";
  const parts = prefixes.slice(1);
  return parts.join("") + (isLast ? "\u2514\u2500 " : "\u251C\u2500 ");
}

function nextPrefix(isLast: boolean): string {
  return isLast ? "   " : "\u2502  ";
}

function formatSize(node: FigmaNode): string {
  const bb = node.absoluteBoundingBox;
  if (!bb) return "";
  return `${Math.round(bb.width)}x${Math.round(bb.height)}`;
}

function formatFills(
  fills: Paint[] | undefined,
  tokenMap: TokenMap,
  colorIndex: Map<string, string>,
  boundFills?: Array<{ id: string }> | undefined
): string {
  if (!fills || fills.length === 0) return "";
  const visible = fills.filter((f) => f.visible !== false);
  if (visible.length === 0) return "";

  return visible
    .map((f, i) => {
      const boundId = boundFills?.[i]?.id;
      return resolveColor(f, tokenMap, colorIndex, boundId);
    })
    .join(", ");
}

function formatEffects(effects?: Array<{ type: string; radius: number; color?: { r: number; g: number; b: number; a: number }; offset?: { x: number; y: number }; visible: boolean }>): string {
  if (!effects || effects.length === 0) return "";
  const visible = effects.filter((e) => e.visible);
  if (visible.length === 0) return "";

  return visible
    .map((e) => {
      const parts = [e.type.toLowerCase().replace(/_/g, "-")];
      if (e.offset) parts.push(`${e.offset.x},${e.offset.y}`);
      parts.push(`r:${e.radius}`);
      if (e.color) parts.push(colorToHex(e.color));
      return parts.join(" ");
    })
    .join("; ");
}

function formatLayout(node: FigmaNode): string {
  if (!node.layoutMode || node.layoutMode === "NONE") return "";
  const parts: string[] = [node.layoutMode];
  if (node.itemSpacing) parts.push(`gap:${node.itemSpacing}`);
  if (node.primaryAxisAlignItems) parts.push(`main:${node.primaryAxisAlignItems}`);
  if (node.counterAxisAlignItems) parts.push(`cross:${node.counterAxisAlignItems}`);

  const pad = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  if (pad.some((p) => p && p > 0)) {
    parts.push(`pad:${pad.map((p) => p ?? 0).join(",")}`);
  }
  return parts.join(" ");
}

function formatBorderRadius(node: FigmaNode): string {
  if (node.rectangleCornerRadii) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    if (tl === tr && tr === br && br === bl) {
      return tl > 0 ? `r:${tl}` : "";
    }
    return `r:${tl},${tr},${br},${bl}`;
  }
  if (node.cornerRadius && node.cornerRadius > 0) {
    return `r:${node.cornerRadius}`;
  }
  return "";
}

function formatComponentProps(node: FigmaNode): string[] {
  if (!node.componentProperties) return [];
  const lines: string[] = [];
  for (const [key, prop] of Object.entries(node.componentProperties)) {
    if (prop.type === "VARIANT") {
      lines.push(`variant ${key}=${String(prop.value)}`);
    } else if (prop.type === "BOOLEAN") {
      lines.push(`bool ${key}=${String(prop.value)}`);
    }
  }
  return lines;
}

function formatNode(
  node: FigmaNode,
  depth: number,
  isLast: boolean,
  prefixes: string[],
  opts: FormatOptions
): string[] {
  const lines: string[] = [];
  const pre = indent(depth, isLast, prefixes);
  const childPre = [...prefixes, nextPrefix(isLast)];

  // Header line
  const size = formatSize(node);
  const headerParts = [`${pre}${node.type} "${node.name}"`];
  if (size) headerParts.push(`[${size}]`);
  headerParts.push(`[${node.id}]`);
  if (node.visible === false) headerParts.push("[hidden]");
  lines.push(headerParts.join("  "));

  const detailPre = childPre.join("") + "  ";

  // Layout
  const layout = formatLayout(node);
  if (layout) lines.push(`${detailPre}layout: ${layout}`);

  // Fill
  const bvFills = node.boundVariables?.fills as Array<{ id: string }> | undefined;
  const fill = formatFills(node.fills, opts.tokenMap, opts.colorIndex, bvFills);
  if (fill) lines.push(`${detailPre}fill: ${fill}`);

  // Stroke
  if (node.strokes && node.strokes.length > 0) {
    const bvStrokes = node.boundVariables?.strokes as Array<{ id: string }> | undefined;
    const stroke = formatFills(node.strokes, opts.tokenMap, opts.colorIndex, bvStrokes);
    if (stroke) {
      const w = node.strokeWeight ? ` w:${node.strokeWeight}` : "";
      lines.push(`${detailPre}stroke: ${stroke}${w}`);
    }
  }

  // Border radius
  const radius = formatBorderRadius(node);
  if (radius) lines.push(`${detailPre}${radius}`);

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    lines.push(`${detailPre}opacity: ${node.opacity}`);
  }

  // Effects
  const effects = formatEffects(node.effects);
  if (effects) lines.push(`${detailPre}effects: ${effects}`);

  // Text node
  if (node.type === "TEXT" && node.style) {
    const s = node.style;
    const textLine = `font: ${s.fontFamily} ${s.fontWeight} ${s.fontSize}px`;
    const lh = s.lineHeightPercentFontSize
      ? `lh:${Math.round(s.lineHeightPercentFontSize)}%`
      : `lh:${Math.round(s.lineHeightPx)}px`;
    const ls = s.letterSpacing !== 0 ? `ls:${s.letterSpacing}` : "";
    lines.push(`${detailPre}${[textLine, lh, ls].filter(Boolean).join("  ")}`);

    // Typography tokens
    const typoTokens = resolveTypographyTokens(node, opts.tokenMap);
    for (const [prop, info] of Object.entries(typoTokens)) {
      if (info?.tokenName) {
        lines.push(`${detailPre}  -> ${prop}: var(--${info.tokenName.replace(/\//g, "-")})`);
      }
    }

    if (node.characters) {
      const text = node.characters.length > 80
        ? node.characters.slice(0, 77) + "..."
        : node.characters;
      lines.push(`${detailPre}text: "${text}"`);
    }
    if (s.textAlignHorizontal) {
      lines.push(`${detailPre}textAlign: ${s.textAlignHorizontal}`);
    }
  }

  // Component properties
  const props = formatComponentProps(node);
  for (const p of props) {
    lines.push(`${detailPre}${p}`);
  }

  // Comments for this node
  if (opts.comments) {
    const nodeComments = opts.comments.filter(
      (c) => c.client_meta?.node_id === node.id
    );
    for (const c of nodeComments) {
      const date = new Date(c.created_at).toLocaleDateString();
      const resolved = c.resolved_at ? " [resolved]" : "";
      lines.push(
        `${detailPre}\uD83D\uDCAC ${c.user.handle} (${date})${resolved}: ${c.message}`
      );
    }
  }

  // Recurse children
  if (node.children) {
    node.children.forEach((child, i) => {
      const last = i === node.children!.length - 1;
      lines.push(
        ...formatNode(child, depth + 1, last, childPre, opts)
      );
    });
  }

  return lines;
}

export function formatTree(
  node: FigmaNode,
  tokenMap: TokenMap,
  colorIndex: Map<string, string>,
  comments?: FigmaComment[]
): string {
  const opts: FormatOptions = { tokenMap, colorIndex, comments };
  return formatNode(node, 0, true, [], opts).join("\n");
}
