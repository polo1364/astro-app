import { Fragment, type ReactNode } from "react";
import { AstroTerm } from "@/components/ui/AstroTerm";
import { GLOSSARY_TERMS } from "@/lib/data/glossary";
import {
  aspectColorByName,
  colors,
  planetColorByName,
  signColorByName,
  signElementColor,
} from "@/lib/tokens/colors";

const HOUSE_PATTERN = /第\s*(10|11|12|[1-9])\s*宮/g;
const ORB_PATTERN = /(?:orb|容許)\s*[\d.]+°/gi;
const CJK_CHAR = /[\u4e00-\u9fff]/;

/** 單字元素僅在獨立出現時高亮，避免誤匹配「風險」「火爆」等日常用語 */
const STANDALONE_ONLY_TERMS = new Set(["火", "土", "風", "水"]);

const PLANET_NAMES = Object.keys(planetColorByName).sort((a, b) => b.length - a.length);

/** 個人每日：行運/本命前綴片語，長詞優先 */
function buildPersonalCompoundTerms(): string[] {
  const terms: string[] = [];
  for (const prefix of ["行運", "本命"]) {
    for (const planet of PLANET_NAMES) {
      terms.push(`${prefix}${planet}`);
    }
  }
  return terms.sort((a, b) => b.length - a.length);
}

const PERSONAL_COMPOUND_TERMS = buildPersonalCompoundTerms();

/** 全名星座，長度降序以優先匹配 */
const SIGN_FULL_NAMES = Object.keys(signColorByName)
  .filter((name) => name.endsWith("座"))
  .sort((a, b) => b.length - a.length);

type TermMatch = {
  idx: number;
  len: number;
  term: string;
  color?: string;
  glossaryKey?: string;
};

function normalizeHouseTerm(raw: string): string {
  const m = raw.match(/第\s*(10|11|12|[1-9])\s*宮/);
  return m ? `第${m[1]}宮` : raw;
}

function isValidGlossaryMatch(text: string, idx: number, term: string): boolean {
  if (/^第\d{1,2}宮$/.test(term)) {
    const after = text[idx + term.length];
    if (after !== undefined && /\d/.test(after)) return false;
  }
  if (STANDALONE_ONLY_TERMS.has(term)) {
    const before = text[idx - 1];
    const after = text[idx + term.length];
    if (before !== undefined && CJK_CHAR.test(before)) return false;
    if (after !== undefined && CJK_CHAR.test(after)) return false;
  }
  return true;
}

function considerTermOccurrences(
  text: string,
  term: string,
  consider: (idx: number, len: number, term: string, color?: string, glossaryKey?: string) => void,
  color?: string,
  glossaryKey?: string,
) {
  let start = 0;
  while (start < text.length) {
    const idx = text.indexOf(term, start);
    if (idx === -1) break;
    if (!glossaryKey || isValidGlossaryMatch(text, idx, glossaryKey)) {
      consider(idx, term.length, term, color, glossaryKey);
    }
    start = idx + 1;
  }
}

function findEarliestTermMatch(text: string, personal = false): TermMatch | null {
  let earliest: TermMatch | null = null;

  const consider = (idx: number, len: number, term: string, color?: string, glossaryKey?: string) => {
    if (idx === -1) return;
    if (glossaryKey && !isValidGlossaryMatch(text, idx, glossaryKey)) return;
    if (!earliest || idx < earliest.idx) {
      earliest = { idx, len, term, color, glossaryKey };
    }
  };

  if (personal) {
    for (const term of PERSONAL_COMPOUND_TERMS) {
      const planet = term.replace(/^(行運|本命)/, "");
      consider(
        text.indexOf(term),
        term.length,
        term,
        planetColorByName[planet],
        planet,
      );
    }
  }

  for (const term of GLOSSARY_TERMS) {
    considerTermOccurrences(text, term, consider, getTermColor(term), term);
  }

  for (const name of SIGN_FULL_NAMES) {
    consider(text.indexOf(name), name.length, name, signColorByName[name], name);
  }

  HOUSE_PATTERN.lastIndex = 0;
  let houseMatch: RegExpExecArray | null;
  while ((houseMatch = HOUSE_PATTERN.exec(text)) !== null) {
    const raw = houseMatch[0];
    consider(
      houseMatch.index,
      raw.length,
      raw,
      colors.report.evidence,
      normalizeHouseTerm(raw),
    );
  }

  if (personal) {
    ORB_PATTERN.lastIndex = 0;
    let orbMatch: RegExpExecArray | null;
    while ((orbMatch = ORB_PATTERN.exec(text)) !== null) {
      consider(
        orbMatch.index,
        orbMatch[0].length,
        orbMatch[0],
        colors.text.gold,
      );
    }
  }

  return earliest;
}

function renderColoredTerm(
  display: string,
  glossaryKey: string | undefined,
  color: string | undefined,
  nextKey: KeyGen,
  mode: HighlightMode,
): ReactNode {
  if (mode === "share") {
    return (
      <span
        key={nextKey()}
        style={{
          color: color ?? colors.text.primary,
          fontWeight: color ? 600 : 400,
        }}
      >
        {display}
      </span>
    );
  }

  const key = glossaryKey ?? display;
  if (color) {
    return (
      <AstroTerm key={nextKey()} term={key} className="font-medium" style={{ color }}>
        {display}
      </AstroTerm>
    );
  }
  return (
    <AstroTerm key={nextKey()} term={key}>
      {display}
    </AstroTerm>
  );
}

const STATUS_PATTERNS: { pattern: RegExp; className: string; shareColor: string }[] = [
  { pattern: /已提供/g, className: "text-status-ok font-medium", shareColor: colors.status.ok },
  { pattern: /未提供/g, className: "text-status-blocked font-medium", shareColor: colors.status.blocked },
  { pattern: /已確認/g, className: "text-status-ok font-medium", shareColor: colors.status.ok },
  { pattern: /未確認/g, className: "text-status-blocked font-medium", shareColor: colors.status.blocked },
  { pattern: /可能不準/g, className: "text-status-warn font-medium", shareColor: colors.status.warn },
  { pattern: /可能略有誤差/g, className: "text-status-warn font-medium", shareColor: colors.status.warn },
  { pattern: /無法分析/g, className: "text-status-blocked font-medium", shareColor: colors.status.blocked },
  { pattern: /不做分析/g, className: "text-status-blocked font-medium", shareColor: colors.status.blocked },
  { pattern: /入相/g, className: "text-status-ok font-medium", shareColor: colors.status.ok },
  { pattern: /出相/g, className: "text-text-secondary font-medium", shareColor: colors.text.secondary },
  { pattern: /還在加強/g, className: "text-status-ok font-medium", shareColor: colors.status.ok },
  { pattern: /高峰可能已過/g, className: "text-text-secondary font-medium", shareColor: colors.text.secondary },
];

export type HighlightMode = "screen" | "share";

type KeyGen = () => string;

function createKeyGen(prefix = "hr"): KeyGen {
  let n = 0;
  return () => `${prefix}-${n++}`;
}

function getTermColor(term: string): string | undefined {
  if (planetColorByName[term]) return planetColorByName[term];
  if (signColorByName[term]) return signColorByName[term];
  if (signElementColor[term]) return signElementColor[term];
  if (aspectColorByName[term]) return aspectColorByName[term];
  if (term === "火" || term === "土" || term === "風" || term === "水") {
    return colors.element[
      { 火: "fire", 土: "earth", 風: "air", 水: "water" }[term] as keyof typeof colors.element
    ];
  }
  return undefined;
}

function renderPlainText(text: string, key: string, mode: HighlightMode): ReactNode {
  if (mode === "share") {
    return (
      <span key={key} style={{ color: colors.text.primary }}>
        {text}
      </span>
    );
  }
  return <Fragment key={key}>{text}</Fragment>;
}

function applyStatusColors(text: string, nextKey: KeyGen, mode: HighlightMode): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    let earliest: { idx: number; len: number; className: string; shareColor: string } | null = null;

    for (const { pattern, className, shareColor } of STATUS_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(remaining);
      if (match && match.index !== undefined) {
        if (!earliest || match.index < earliest.idx) {
          earliest = { idx: match.index, len: match[0].length, className, shareColor };
        }
      }
    }

    if (!earliest) {
      if (remaining) nodes.push(renderPlainText(remaining, nextKey(), mode));
      break;
    }

    if (earliest.idx > 0) {
      nodes.push(renderPlainText(remaining.slice(0, earliest.idx), nextKey(), mode));
    }
    nodes.push(
      mode === "share" ? (
        <span
          key={nextKey()}
          style={{ color: earliest.shareColor, fontWeight: 600 }}
        >
          {remaining.slice(earliest.idx, earliest.idx + earliest.len)}
        </span>
      ) : (
        <span key={nextKey()} className={earliest.className}>
          {remaining.slice(earliest.idx, earliest.idx + earliest.len)}
        </span>
      ),
    );
    remaining = remaining.slice(earliest.idx + earliest.len);
  }

  return nodes;
}

function enrichPlainSegment(text: string, nextKey: KeyGen, personal = false, mode: HighlightMode = "screen"): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const match = findEarliestTermMatch(remaining, personal);
    if (!match) {
      nodes.push(...applyStatusColors(remaining, nextKey, mode));
      break;
    }

    if (match.idx > 0) {
      nodes.push(...applyStatusColors(remaining.slice(0, match.idx), nextKey, mode));
    }

    nodes.push(
      renderColoredTerm(match.term, match.glossaryKey, match.color, nextKey, mode),
    );
    remaining = remaining.slice(match.idx + match.len);
  }

  return nodes;
}

/** 括號內白話補充用次要色 */
function splitParenthetical(
  text: string,
  nextKey: KeyGen,
  personal = false,
  mode: HighlightMode = "screen",
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /（[^）]*）|\([^)]*\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...enrichPlainSegment(text.slice(lastIndex, match.index), nextKey, personal, mode));
    }
    nodes.push(
      mode === "share" ? (
        <span key={nextKey()} style={{ color: colors.text.secondary }}>
          {match[0]}
        </span>
      ) : (
        <span key={nextKey()} className="text-text-secondary">
          {match[0]}
        </span>
      ),
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(...enrichPlainSegment(text.slice(lastIndex), nextKey, personal, mode));
  }

  return nodes.length > 0 ? nodes : enrichPlainSegment(text, nextKey, personal, mode);
}

export function enrichTerms(text: string, mode: HighlightMode = "screen"): ReactNode[] {
  if (!text) return [];
  return splitParenthetical(text, createKeyGen("term"), false, mode);
}

/** 報告全文高亮（含盤面／配置依據段落） */
export function highlightReport(
  text: string,
  personal = false,
  mode: HighlightMode = "screen",
): ReactNode[] {
  if (!text) return [];

  const nextKey = createKeyGen("report");

  const evidenceIdx = findEvidenceMarkerIndex(text);
  if (evidenceIdx === -1) {
    return splitParenthetical(text, nextKey, personal, mode);
  }

  const before = text.slice(0, evidenceIdx);
  const after = text.slice(evidenceIdx);

  return [
    ...splitParenthetical(before, nextKey, personal, mode),
    mode === "share" ? (
      <span key={nextKey()} style={{ color: colors.report.evidence, fontWeight: 600 }}>
        {splitParenthetical(after, nextKey, personal, mode)}
      </span>
    ) : (
      <span key={nextKey()} className="text-report-evidence font-medium">
        {splitParenthetical(after, nextKey, personal, mode)}
      </span>
    ),
  ];
}

function findEvidenceMarkerIndex(text: string): number {
  const markers = ["盤面依據：", "配置依據："];
  let earliest = -1;
  for (const marker of markers) {
    const idx = text.indexOf(marker);
    if (idx !== -1 && (earliest === -1 || idx < earliest)) {
      earliest = idx;
    }
  }
  return earliest;
}

function renderInlineBold(text: string, keyPrefix: string, mode: HighlightMode = "screen"): ReactNode[] {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      mode === "share" ? (
        <strong
          key={`${keyPrefix}-b-${i}`}
          style={{ fontWeight: 600, color: colors.text.primary }}
        >
          {part}
        </strong>
      ) : (
        <strong key={`${keyPrefix}-b-${i}`} className="font-semibold text-text-primary">
          {part}
        </strong>
      )
    ) : (
      <Fragment key={`${keyPrefix}-t-${i}`}>{highlightReport(part, false, mode)}</Fragment>
    ),
  );
}

const SHARE_BODY_STYLE = {
  fontSize: 22,
  lineHeight: 1.55,
  color: colors.text.primary,
} as const;

/** AI 報告正文輕量排版（粗體、列表） */
export function renderAiReportBody(
  text: string,
  bodyClassName = "text-body-lg leading-7 text-text-primary",
  mode: HighlightMode = "screen",
): ReactNode {
  if (!text) return null;
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  const isShare = mode === "share";

  return (
    <div style={isShare ? { display: "flex", flexDirection: "column", gap: 16 } : undefined} className={isShare ? undefined : "space-y-4"}>
      {paragraphs.map((para, pi) => {
        const lines = para.split("\n").filter(Boolean);
        const isNumberedList = lines.every((ln) => /^\d+\.\s/.test(ln.trim()));
        const isBulletList = lines.every((ln) => /^[-*]\s/.test(ln.trim()));

        if (isNumberedList) {
          return (
            <ol
              key={pi}
              className={isShare ? undefined : `list-decimal pl-5 space-y-3 ${bodyClassName}`}
              style={isShare ? { ...SHARE_BODY_STYLE, margin: 0, paddingLeft: 20 } : undefined}
            >
              {lines.map((ln, li) => (
                <li key={li} style={isShare ? { marginBottom: 12 } : undefined}>
                  {renderInlineBold(ln.replace(/^\d+\.\s*/, ""), `ol-${pi}-${li}`, mode)}
                </li>
              ))}
            </ol>
          );
        }
        if (isBulletList) {
          return (
            <ul
              key={pi}
              className={isShare ? undefined : `list-disc pl-5 space-y-2 ${bodyClassName}`}
              style={isShare ? { ...SHARE_BODY_STYLE, margin: 0, paddingLeft: 20 } : undefined}
            >
              {lines.map((ln, li) => (
                <li key={li} style={isShare ? { marginBottom: 8 } : undefined}>
                  {renderInlineBold(ln.replace(/^[-*]\s*/, ""), `ul-${pi}-${li}`, mode)}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={pi}
            className={isShare ? undefined : `whitespace-pre-wrap ${bodyClassName}`}
            style={isShare ? { ...SHARE_BODY_STYLE, margin: 0, whiteSpace: "pre-wrap" } : undefined}
          >
            {renderInlineBold(para, `p-${pi}`, mode)}
          </p>
        );
      })}
    </div>
  );
}
