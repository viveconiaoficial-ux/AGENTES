import * as cheerio from "cheerio";

export type ExtractedBrief = {
  sourceUrl: string;
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  headings: string[];
  listItems: string[];
  bodyExcerpt: string;
  contactSnippets: string[];
};

function cleanText(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function uniquePush(arr: string[], val: string, max: number) {
  const t = cleanText(val);
  if (t.length < 2 || arr.includes(t)) return;
  if (arr.length >= max) return;
  arr.push(t);
}

function findContacts(text: string): string[] {
  const out: string[] = [];
  const emailRe = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
  const phoneRe =
    /(?:\+34\s?|0034\s?)?[6-9]\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/g;
  for (const m of text.matchAll(emailRe)) {
    if (!out.includes(m[0])) out.push(m[0]);
  }
  for (const m of text.matchAll(phoneRe)) {
    if (!out.includes(m[0])) out.push(m[0]);
  }
  return out.slice(0, 12);
}

export function extractBriefFromHtml(html: string, sourceUrl: string, finalUrl: string): ExtractedBrief {
  const $ = cheerio.load(html);

  $("script, style, noscript, iframe, svg, template").remove();

  const title = cleanText($("title").first().text()) || null;

  const metaDescription =
    cleanText($('meta[name="description"]').attr("content") || "") || null;

  const ogTitle = cleanText($('meta[property="og:title"]').attr("content") || "") || null;
  const ogDescription =
    cleanText($('meta[property="og:description"]').attr("content") || "") || null;

  const headings: string[] = [];
  $("h1, h2, h3").each((_, el) => {
    uniquePush(headings, $(el).text(), 24);
  });

  const listItems: string[] = [];
  $("main li, article li, body li").each((_, el) => {
    uniquePush(listItems, $(el).text(), 40);
  });

  const root = $("main, article, #main, .main, body").first();
  root.find("nav, footer, header").remove();
  const paragraphs: string[] = [];
  root.find("p").each((_, el) => {
    const t = cleanText($(el).text());
    if (t.length > 40) uniquePush(paragraphs, t, 18);
  });

  let bodyExcerpt = paragraphs.join("\n\n");
  if (bodyExcerpt.length < 200) {
    bodyExcerpt = cleanText(root.text()).slice(0, 12_000);
  } else {
    bodyExcerpt = bodyExcerpt.slice(0, 12_000);
  }

  const contactSnippets = findContacts(
    `${title || ""} ${metaDescription || ""} ${bodyExcerpt} ${listItems.join(" ")}`
  );

  return {
    sourceUrl,
    finalUrl,
    title,
    metaDescription,
    ogTitle,
    ogDescription,
    headings,
    listItems,
    bodyExcerpt,
    contactSnippets,
  };
}

export function briefToMarkdownSummary(b: ExtractedBrief): string {
  const lines: string[] = [];
  lines.push(`**URL analizada:** ${b.finalUrl}`);
  if (b.title) lines.push(`**Título:** ${b.title}`);
  if (b.metaDescription) lines.push(`**Descripción:** ${b.metaDescription}`);
  if (b.ogTitle && b.ogTitle !== b.title) lines.push(`**OpenGraph título:** ${b.ogTitle}`);
  if (b.ogDescription && b.ogDescription !== b.metaDescription) {
    lines.push(`**OpenGraph descripción:** ${b.ogDescription}`);
  }
  if (b.headings.length) {
    lines.push("");
    lines.push("**Titulares detectados:**");
    b.headings.forEach((h) => lines.push(`- ${h}`));
  }
  if (b.listItems.length) {
    lines.push("");
    lines.push("**Viñetas / servicios (extracto):**");
    b.listItems.slice(0, 25).forEach((x) => lines.push(`- ${x}`));
  }
  if (b.contactSnippets.length) {
    lines.push("");
    lines.push("**Contacto detectado en texto:** " + b.contactSnippets.join(", "));
  }
  if (b.bodyExcerpt.length > 80) {
    lines.push("");
    lines.push("**Texto principal (extracto):**");
    lines.push(b.bodyExcerpt.slice(0, 4_500) + (b.bodyExcerpt.length > 4_500 ? "…" : ""));
  }
  return lines.join("\n");
}
