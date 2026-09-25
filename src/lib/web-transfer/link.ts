/**
 * Connection links carry a locale-aware page path and `#c=<address>&k=<token>`.
 *
 * Both values are secrets. The tailcat address embeds a WireGuard pre-shared
 * key and the token authorises the pull, so they travel only in the URL
 * fragment (never sent to a server), are removed from the address bar as soon
 * as the page reads them, and must never be logged or sent to analytics.
 */

import { randomId } from "./payload";
import { isWellFormedTailcatAddress } from "./tailcat-address";

export type ConnectionTicket = { addr: string; token: string };

const ADDR_PATTERN = /^tc[A-Za-z0-9_-]{16,2048}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

/** A fresh 128-bit base64url token. */
export const newToken = (): string => randomId(16);

export function buildLink(
  origin: string,
  localePrefix: string,
  ticket: ConnectionTicket,
  path = "/try",
): string {
  return `${origin}${localePrefix}${path || (localePrefix ? "" : "/")}#c=${ticket.addr}&k=${ticket.token}`;
}

/**
 * Checks an address and token from outside the page (a link or a code
 * lookup). Only a ticket that passes may be dialled: see tailcat-address.ts.
 */
export function toConnectionTicket(
  addr: unknown,
  token: unknown,
): ConnectionTicket | null {
  if (typeof addr !== "string" || typeof token !== "string") return null;
  if (!ADDR_PATTERN.test(addr) || !TOKEN_PATTERN.test(token)) return null;
  if (!isWellFormedTailcatAddress(addr)) return null;
  return { addr, token };
}

/** Parses a fragment (with or without the leading `#`). */
export function parseFragment(fragment: string): ConnectionTicket | null {
  const params = new URLSearchParams(fragment.replace(/^#/, ""));
  return toConnectionTicket(params.get("c"), params.get("k"));
}

/** True when the fragment looks like a connection link, valid or not. */
export const isConnectionFragment = (fragment: string): boolean =>
  /(?:^#?|&)c=/.test(fragment);

declare global {
  interface Window {
    /** Set by the inline capture script on /try; see `FRAGMENT_CAPTURE_SCRIPT`. */
    __ucTryFragment?: string;
  }
}

/**
 * Runs inline, during HTML parsing and before any analytics script: moves a
 * connection fragment into memory and strips it from the address bar. It
 * also strips fragments that arrive later (a link pasted into this tab):
 * its capture-phase popstate/hashchange listeners are registered before
 * gtag's history listeners, so they run first. Runs on /try in the marketing
 * site, or on the dedicated transfer site (marked on its html element).
 * Marketing page anchors keep working after client-side navigation away.
 */
export const FRAGMENT_CAPTURE_SCRIPT = `(function(){function take(first){try{if(!document.documentElement.hasAttribute("data-try-site")&&!/\\/try\\/?$/.test(location.pathname))return;var h=location.hash;if(!h)return;if(/(?:^#|&)c=/.test(h)){window.__ucTryFragment=h;if(first)document.documentElement.setAttribute("data-try-incoming","")}history.replaceState(history.state,"",location.pathname+location.search)}catch(e){}}take(true);addEventListener("popstate",function(){take(false)},true);addEventListener("hashchange",function(){take(false)},true)})();`;

/** Takes the captured fragment (or the live one), then strips it. */
export function takeFragment(): string | null {
  const captured = window.__ucTryFragment;
  delete window.__ucTryFragment;
  const live = window.location.hash;
  if (live) {
    history.replaceState(
      history.state,
      "",
      window.location.pathname + window.location.search,
    );
  }
  const fragment = captured || live;
  return fragment && isConnectionFragment(fragment) ? fragment : null;
}
