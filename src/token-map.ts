import type {
  Color,
  FigmaNode,
  FigmaVariablesResponse,
  Paint,
  TokenEntry,
  TokenMap,
} from "./types.js";

function colorToHex(c: Color): string {
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  const a = c.a;
  if (a < 1) {
    const aHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${aHex}`;
  }
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export { colorToHex };

export function buildTokenMap(data: FigmaVariablesResponse): TokenMap {
  const map: TokenMap = new Map();
  const { variables, variableCollections } = data.meta;

  for (const [varId, variable] of Object.entries(variables)) {
    const collection = variableCollections[variable.variableCollectionId];
    if (!collection) continue;

    const defaultModeId = collection.defaultModeId;
    const value = variable.valuesByMode[defaultModeId];
    if (value === undefined) continue;

    map.set(varId, {
      name: variable.name,
      resolvedType: variable.resolvedType,
      collectionName: collection.name,
      value,
    });
  }

  return map;
}

export function buildColorIndex(tokenMap: TokenMap): Map<string, string> {
  const index = new Map<string, string>();

  for (const [varId, entry] of tokenMap) {
    if (entry.resolvedType !== "COLOR") continue;
    const hex = colorToHex(entry.value as Color);
    // First match wins; boundVariables ID-based lookup is preferred anyway
    if (!index.has(hex)) {
      index.set(hex, varId);
    }
  }

  return index;
}

export function resolveColor(
  paint: Paint,
  tokenMap: TokenMap,
  colorIndex: Map<string, string>,
  boundVarId?: string
): string {
  if (boundVarId) {
    const entry = tokenMap.get(boundVarId);
    if (entry) {
      const hex = paint.color ? colorToHex(paint.color) : "";
      return hex ? `${entry.name} (${hex})` : entry.name;
    }
  }

  if (paint.color) {
    const hex = colorToHex(paint.color);
    const varId = colorIndex.get(hex);
    if (varId) {
      const entry = tokenMap.get(varId);
      if (entry) return `${entry.name} (${hex})`;
    }
    return hex;
  }

  return paint.type;
}

export interface ResolvedTypographyTokens {
  fontFamily?: { value: string; tokenName?: string };
  fontSize?: { value: string; tokenName?: string };
  fontWeight?: { value: string; tokenName?: string };
  lineHeight?: { value: string; tokenName?: string };
  letterSpacing?: { value: string; tokenName?: string };
}

export function resolveTypographyTokens(
  node: FigmaNode,
  tokenMap: TokenMap
): ResolvedTypographyTokens {
  const result: ResolvedTypographyTokens = {};
  const style = node.style;
  if (!style) return result;

  const bv = node.boundVariables;

  const resolve = (
    property: string,
    rawValue: string | number | undefined
  ): { value: string; tokenName?: string } | undefined => {
    if (rawValue === undefined) return undefined;
    const val = String(rawValue);
    if (!bv) return { value: val };

    const binding = bv[property];
    if (!binding) return { value: val };

    const alias = Array.isArray(binding) ? binding[0] : binding;
    if (!alias) return { value: val };

    const entry = tokenMap.get(alias.id);
    return entry ? { value: val, tokenName: entry.name } : { value: val };
  };

  result.fontFamily = resolve("fontFamily", style.fontFamily);
  result.fontSize = resolve("fontSize", style.fontSize);
  result.fontWeight = resolve("fontWeight", style.fontWeight);
  result.lineHeight = resolve("lineHeight", style.lineHeightPx);
  result.letterSpacing = resolve("letterSpacing", style.letterSpacing);

  return result;
}

export function resolveNodeTokens(
  node: FigmaNode,
  tokenMap: TokenMap
): Record<string, string> | undefined {
  const bv = node.boundVariables;
  if (!bv || tokenMap.size === 0) return undefined;

  const resolved: Record<string, string> = {};

  for (const [prop, binding] of Object.entries(bv)) {
    if (!binding) continue;
    if (Array.isArray(binding)) {
      binding.forEach((alias, i) => {
        const entry = tokenMap.get(alias.id);
        if (entry) {
          resolved[`${prop}.${i}`] = entry.name;
        }
      });
    } else {
      const entry = tokenMap.get(binding.id);
      if (entry) {
        resolved[prop] = entry.name;
      }
    }
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}
