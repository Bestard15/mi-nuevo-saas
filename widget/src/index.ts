/**
 * Echoboard embeddable widget (vanilla TS, zero dependencies).
 *
 * Usage — auto-init via data attributes:
 *   <script src="https://tu-echoboard.com/widget.js" data-project="mi-producto" defer></script>
 *
 * Usage — programmatic:
 *   Echoboard.init({ project: "mi-producto", mode: "popup" });
 *   Echoboard.identify("<jwt firmado con el ssoSecret>"); // opcional
 *
 * The widget renders the project's board inside an iframe pointing at
 * /embed/{project}. identify() routes the iframe through the existing
 * GET /api/sso/{project} endpoint so the end user's session cookie (and
 * therefore their MRR for revenue prioritization) is set server-side —
 * the widget never handles the ssoSecret, only short-lived signed JWTs.
 */

type Mode = "popup" | "inline";

interface InitOptions {
  /** Project slug (the {slug} in /p/{slug}). Required. */
  project: string;
  /** Echoboard origin. Defaults to the origin this script was loaded from. */
  host?: string;
  /** "popup" (floating launcher, default) or "inline" (fills a container). */
  mode?: Mode;
  /** Inline mode: CSS selector or element to render into. */
  target?: string | HTMLElement;
  /** Popup mode: which side the launcher sits on. */
  position?: "right" | "left";
  /** Launcher label. */
  label?: string;
  /** Launcher/accent color (any CSS color). */
  accent?: string;
  /** Identify the user immediately (same JWT as the SSO flow). */
  token?: string;
}

interface State {
  opts: Required<Pick<InitOptions, "project" | "host" | "mode" | "position" | "label" | "accent">> &
    Pick<InitOptions, "target">;
  token: string | null;
  root: HTMLElement | null;
  iframe: HTMLIFrameElement | null;
  panel: HTMLElement | null;
  launcher: HTMLButtonElement | null;
  isOpen: boolean;
  loaded: boolean;
}

// Captured at parse time; inside event handlers document.currentScript is null.
const ownScript = document.currentScript as HTMLScriptElement | null;

let state: State | null = null;

function embedPath(project: string): string {
  return `/embed/${encodeURIComponent(project)}`;
}

/** iframe src: plain embed, or embed via the SSO endpoint when identified. */
function buildSrc(): string {
  if (!state) return "";
  const { host, project } = state.opts;
  const path = embedPath(project);
  if (!state.token) return host + path;
  const qs = new URLSearchParams({ token: state.token, redirect: path });
  return `${host}/api/sso/${encodeURIComponent(project)}?${qs.toString()}`;
}

function ensureIframe(): HTMLIFrameElement {
  if (!state) throw new Error("Echoboard: llama a init() primero");
  if (!state.iframe) {
    const iframe = document.createElement("iframe");
    iframe.className = "eb-w-frame";
    iframe.title = "Echoboard — feedback";
    iframe.setAttribute("loading", "lazy");
    state.iframe = iframe;
  }
  if (!state.loaded) {
    state.iframe.src = buildSrc();
    state.loaded = true;
  }
  return state.iframe;
}

const STYLE = `
.eb-w-launcher{position:fixed;bottom:20px;z-index:2147483000;display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:10px 18px;font:600 14px/1 system-ui,-apple-system,sans-serif;color:#fff;background:var(--eb-accent,#4f46e5);cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}
.eb-w-launcher:hover{filter:brightness(1.08)}
.eb-w-right{right:20px}.eb-w-left{left:20px}
.eb-w-panel{position:fixed;bottom:76px;z-index:2147483000;width:400px;max-width:calc(100vw - 32px);height:620px;max-height:calc(100vh - 100px);border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none}
.eb-w-panel.eb-w-open{display:block}
.eb-w-frame{width:100%;height:100%;border:0;display:block}
.eb-w-inline{width:100%;height:100%;min-height:480px}
@media (prefers-color-scheme:dark){.eb-w-panel{background:#0a0a0a}}
`;

function injectStyle(): void {
  if (document.getElementById("eb-w-style")) return;
  const style = document.createElement("style");
  style.id = "eb-w-style";
  style.textContent = STYLE;
  document.head.appendChild(style);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === "Escape") close();
}

function mountPopup(): void {
  if (!state) return;
  injectStyle();
  const side = state.opts.position === "left" ? "eb-w-left" : "eb-w-right";

  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = `eb-w-launcher ${side}`;
  launcher.style.setProperty("--eb-accent", state.opts.accent);
  launcher.textContent = state.opts.label;
  launcher.setAttribute("aria-expanded", "false");
  launcher.addEventListener("click", toggle);

  const panel = document.createElement("div");
  panel.className = `eb-w-panel ${side}`;

  const root = document.createElement("div");
  root.id = "eb-w-root";
  root.append(panel, launcher);
  document.body.appendChild(root);

  state.root = root;
  state.panel = panel;
  state.launcher = launcher;
  document.addEventListener("keydown", onKeydown);
}

function mountInline(): void {
  if (!state) return;
  injectStyle();
  const target =
    typeof state.opts.target === "string"
      ? document.querySelector<HTMLElement>(state.opts.target)
      : (state.opts.target ?? null);
  if (!target) {
    console.error("Echoboard: no se encontró el contenedor `target` para el modo inline");
    return;
  }
  const iframe = ensureIframe();
  iframe.classList.add("eb-w-inline");
  target.appendChild(iframe);
  state.root = target;
  state.isOpen = true;
}

function init(options: InitOptions): void {
  if (state?.root) destroy();
  if (!options?.project) {
    console.error("Echoboard: falta la opción `project` en init()");
    return;
  }
  const host = (options.host ?? (ownScript ? new URL(ownScript.src).origin : "")).replace(/\/+$/, "");
  if (!host) {
    console.error("Echoboard: no se pudo detectar `host`; pásalo en init()");
    return;
  }
  state = {
    opts: {
      project: options.project,
      host,
      mode: options.mode === "inline" ? "inline" : "popup",
      target: options.target,
      position: options.position === "left" ? "left" : "right",
      label: options.label ?? "Feedback",
      accent: options.accent ?? "#4f46e5",
    },
    token: options.token ?? null,
    root: null,
    iframe: null,
    panel: null,
    launcher: null,
    isOpen: false,
    loaded: false,
  };

  const mount = () => (state?.opts.mode === "inline" ? mountInline() : mountPopup());
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
}

/**
 * Identifies the end user with an HS256 JWT signed (server-side, by the
 * customer's backend) with the project's ssoSecret. Re-routes the iframe
 * through /api/sso so votes carry the user's MRR from this point on.
 */
function identify(token: string): void {
  if (!state) {
    console.error("Echoboard: llama a init() antes de identify()");
    return;
  }
  if (typeof token !== "string" || !token) return;
  state.token = token;
  state.loaded = false; // force reload through the SSO endpoint on next open
  if (state.isOpen || state.opts.mode === "inline") ensureIframe();
}

function open(): void {
  if (!state || state.opts.mode !== "popup" || !state.panel) return;
  const iframe = ensureIframe();
  if (!iframe.parentElement) state.panel.appendChild(iframe);
  state.panel.classList.add("eb-w-open");
  state.launcher?.setAttribute("aria-expanded", "true");
  state.isOpen = true;
}

function close(): void {
  if (!state || state.opts.mode !== "popup") return;
  state.panel?.classList.remove("eb-w-open");
  state.launcher?.setAttribute("aria-expanded", "false");
  state.isOpen = false;
}

function toggle(): void {
  if (state?.isOpen) close();
  else open();
}

function destroy(): void {
  if (!state) return;
  document.removeEventListener("keydown", onKeydown);
  if (state.opts.mode === "inline") state.iframe?.remove();
  else state.root?.remove();
  state = null;
}

const api = { init, identify, open, close, toggle, destroy };

declare global {
  interface Window {
    Echoboard: typeof api;
  }
}
window.Echoboard = api;

// Auto-init: <script src=".../widget.js" data-project="slug" [data-mode] [data-target]
//            [data-position] [data-label] [data-accent] [data-token] defer>
const autoProject = ownScript?.dataset.project;
if (ownScript && autoProject) {
  const d = ownScript.dataset;
  init({
    project: autoProject,
    host: d.host,
    mode: d.mode === "inline" ? "inline" : "popup",
    target: d.target,
    position: d.position === "left" ? "left" : "right",
    label: d.label,
    accent: d.accent,
    token: d.token,
  });
}

export {};
