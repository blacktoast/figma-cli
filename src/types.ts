// Figma API response types

export interface FigmaUser {
  id: string;
  handle: string;
  img_url: string;
  email: string;
}

// Node types
export type NodeType =
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "STAR"
  | "LINE"
  | "ELLIPSE"
  | "REGULAR_POLYGON"
  | "RECTANGLE"
  | "TEXT"
  | "SLICE"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "SECTION";

// Color
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

// Paint
export interface Paint {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND" | "IMAGE" | "EMOJI";
  visible?: boolean;
  opacity?: number;
  color?: Color;
  blendMode?: string;
  imageRef?: string;
}

// Effect
export interface Effect {
  type: "INNER_SHADOW" | "DROP_SHADOW" | "LAYER_BLUR" | "BACKGROUND_BLUR";
  visible: boolean;
  radius: number;
  color?: Color;
  offset?: { x: number; y: number };
  spread?: number;
}

// TypeStyle
export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  textAlignHorizontal?: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
  letterSpacing: number;
  lineHeightPx: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: "PIXELS" | "FONT_SIZE_%" | "INTRINSIC";
  textDecoration?: "NONE" | "STRIKETHROUGH" | "UNDERLINE";
  textCase?: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" | "SMALL_CAPS" | "SMALL_CAPS_FORCED";
}

// Component property
export interface ComponentProperty {
  type: "BOOLEAN" | "INSTANCE_SWAP" | "TEXT" | "VARIANT";
  value: string | boolean;
  defaultValue?: string | boolean;
  preferredValues?: Array<{ type: string; key: string }>;
}

// Bound variables
export interface BoundVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export interface BoundVariables {
  fills?: BoundVariableAlias[];
  strokes?: BoundVariableAlias[];
  fontFamily?: BoundVariableAlias[];
  fontSize?: BoundVariableAlias[];
  fontWeight?: BoundVariableAlias[];
  lineHeight?: BoundVariableAlias[];
  letterSpacing?: BoundVariableAlias[];
  itemSpacing?: BoundVariableAlias;
  paddingTop?: BoundVariableAlias;
  paddingRight?: BoundVariableAlias;
  paddingBottom?: BoundVariableAlias;
  paddingLeft?: BoundVariableAlias;
  [key: string]: BoundVariableAlias | BoundVariableAlias[] | undefined;
}

// Figma node
export interface FigmaNode {
  id: string;
  name: string;
  type: NodeType;
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fills?: Paint[];
  strokes?: Paint[];
  strokeWeight?: number;
  cornerRadius?: number;
  rectangleCornerRadii?: [number, number, number, number];
  opacity?: number;
  effects?: Effect[];
  style?: TypeStyle;
  characters?: string;
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  primaryAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "MAX" | "CENTER" | "BASELINE";
  itemSpacing?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  componentProperties?: Record<string, ComponentProperty>;
  boundVariables?: BoundVariables;
  clipsContent?: boolean;
  constraints?: {
    vertical: "TOP" | "BOTTOM" | "CENTER" | "TOP_BOTTOM" | "SCALE";
    horizontal: "LEFT" | "RIGHT" | "CENTER" | "LEFT_RIGHT" | "SCALE";
  };
}

// API responses
export interface FigmaNodesResponse {
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  nodes: Record<string, { document: FigmaNode; components: Record<string, unknown> }>;
}

// Variables
export interface FigmaVariable {
  id: string;
  name: string;
  key: string;
  variableCollectionId: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<string, Color | number | string | boolean>;
  remote: boolean;
  description: string;
  hiddenFromPublishing: boolean;
  scopes: string[];
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  key: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  remote: boolean;
  hiddenFromPublishing: boolean;
  variableIds: string[];
}

export interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

// Comments
export interface FigmaComment {
  id: string;
  message: string;
  created_at: string;
  resolved_at: string | null;
  user: FigmaUser;
  client_meta?: { node_id?: string; node_offset?: { x: number; y: number } };
  order_id?: string;
}

// Images
export type ImageFormat = "png" | "jpg" | "svg" | "pdf";

export interface FigmaImageResponse {
  err: string | null;
  images: Record<string, string | null>;
}

// Token mapping
export interface TokenEntry {
  name: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  collectionName: string;
  value: Color | number | string | boolean;
}

export type TokenMap = Map<string, TokenEntry>;
