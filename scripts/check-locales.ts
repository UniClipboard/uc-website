/** Message contract audit, not a translation-quality score. */
import { readFileSync } from "node:fs";

import {
  type MessageFormatElement,
  parse,
  TYPE,
} from "@formatjs/icu-messageformat-parser";

import { routing } from "../src/i18n/routing";

function flatten(
  value: unknown,
  path = "",
  result: Record<string, string> = {},
) {
  if (typeof value === "string") result[path] = value;
  else if (value && typeof value === "object")
    for (const [key, child] of Object.entries(value))
      flatten(child, path ? `${path}.${key}` : key, result);
  return result;
}
function argumentsOf(nodes: MessageFormatElement[], names = new Set<string>()) {
  for (const node of nodes) {
    if (node.type !== TYPE.literal && node.type !== TYPE.pound)
      names.add(`${node.type === TYPE.tag ? "tag" : "argument"}:${node.value}`);
    if (node.type === TYPE.plural || node.type === TYPE.select)
      for (const option of Object.values(node.options))
        argumentsOf(option.value, names);
    if (node.type === TYPE.tag) argumentsOf(node.children, names);
  }
  return [...names].sort().join(",");
}
const read = (locale: string) =>
  flatten(JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")));
const source = read("en");
const errors: string[] = [];
const summaries: unknown[] = [];
for (const locale of routing.locales) {
  const messages = read(locale);
  for (const key of new Set([
    ...Object.keys(source),
    ...Object.keys(messages),
  ])) {
    if (!(key in source) || !(key in messages)) {
      errors.push(`${locale}:${key}: missing or extra key`);
      continue;
    }
    if (!messages[key].trim()) errors.push(`${locale}:${key}: empty`);
    try {
      if (argumentsOf(parse(source[key])) !== argumentsOf(parse(messages[key])))
        errors.push(`${locale}:${key}: ICU argument/tag mismatch`);
    } catch (error) {
      errors.push(`${locale}:${key}: ${String(error)}`);
    }
    const urls = (s: string) =>
      s
        .match(/https?:\/\/[^\s)]+/g)
        ?.sort()
        .join("|") ?? "";
    if (urls(source[key]) !== urls(messages[key]))
      errors.push(`${locale}:${key}: URL changed`);
    if (
      (key.endsWith("Command") ||
        key.endsWith("SourceUrl") ||
        key === "seo.titleTemplate") &&
      source[key] !== messages[key]
    )
      errors.push(`${locale}:${key}: immutable value changed`);
  }
  summaries.push({
    locale,
    keys: Object.keys(messages).length,
    identicalToEnglish: Object.keys(source).filter(
      (key) => source[key] === messages[key],
    ).length,
    nativeReviewed: false,
  });
}
console.log(JSON.stringify({ summaries, errors }, null, 2));
if (errors.length) process.exitCode = 1;
