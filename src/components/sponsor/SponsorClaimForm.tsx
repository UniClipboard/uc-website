"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Rocket, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { monogramFor, type SponsorTier } from "@/lib/sponsors";

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const URL_RE = /^https?:\/\//i;
const EXPO_OUT = [0.16, 1, 0.3, 1] as const;
const PARCHMENT = "#f4efe0";

type Step = "welcome" | "identity" | "message" | "review" | "success";
const ROMAN = ["I", "II", "III"];

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
};

/** A hand-drawn "wax seal" medallion — brand monogram inside an engraved
 * coin edge. Stands in for the generic checkmark-in-a-circle. */
function SealMedallion({ gold, size = 96 }: { gold: boolean; size?: number }) {
  const stroke = gold ? "#e8c874" : PARCHMENT;
  const dim = gold ? "rgba(232,200,116,0.4)" : "rgba(244,239,224,0.28)";
  const ticks = Array.from({ length: 28 });
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden
      className="overflow-visible"
    >
      <circle cx={60} cy={60} r={52} fill="none" stroke={dim} strokeWidth={1} />
      <circle
        cx={60}
        cy={60}
        r={44}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
      />
      {ticks.map((_, i) => {
        const a = (i / ticks.length) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={60 + Math.cos(a) * 52}
            y1={60 + Math.sin(a) * 52}
            x2={60 + Math.cos(a) * 47}
            y2={60 + Math.sin(a) * 47}
            stroke={dim}
            strokeWidth={1}
          />
        );
      })}
      <text
        x={60}
        y={75}
        textAnchor="middle"
        fontSize={42}
        className="font-serif italic"
        fill={stroke}
      >
        U
      </text>
    </svg>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-[3px] border border-amber-200/50 px-6 py-3.5 text-sm font-semibold tracking-wide text-amber-100 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
      />
      <span className="relative z-10 flex items-center gap-2 transition-colors duration-300 group-hover:text-[#150f05]">
        {children}
      </span>
    </button>
  );
}

function AvatarPreview({
  src,
  name,
  size = 64,
}: {
  src: string | null;
  name: string;
  size?: number;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className="flex-none rounded-full object-cover ring-1 ring-[#f4efe0]/15"
        style={{ width: size, height: size }}
      />
    );
  }
  const m = monogramFor(name || "?");
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full font-semibold ring-1 ring-[#f4efe0]/15"
      style={{
        width: size,
        height: size,
        background: m.bg,
        color: m.fg,
        fontSize: size * 0.36,
      }}
    >
      {m.initials}
    </span>
  );
}

function StepHeader({
  index,
  total,
  title,
  subtitle,
  gold,
  backLabel,
  stepLabel,
  onBack,
}: {
  index: number;
  total: number;
  title: string;
  subtitle: string;
  gold: boolean;
  backLabel: string;
  stepLabel: string;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex flex-none items-center gap-1.5 text-xs whitespace-nowrap text-[#f4efe0]/40 transition-colors hover:text-[#f4efe0]/80"
        >
          <ArrowLeft
            className="size-3.5 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
          {backLabel}
        </button>
        <span className="flex-none font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-[#f4efe0]/30 uppercase">
          {stepLabel}
        </span>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <h2 className="text-[28px] font-bold tracking-tight text-[#f4efe0] sm:text-[32px]">
          {title}
        </h2>
        <span
          className={`font-serif text-3xl leading-none italic ${gold ? "text-amber-300/70" : "text-[#f4efe0]/25"}`}
        >
          {ROMAN[index]}
        </span>
      </div>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#f4efe0]/45">
        {subtitle}
      </p>

      <div className="mt-5 h-px w-full bg-[#f4efe0]/10">
        <motion.div
          className={
            gold
              ? "h-px bg-gradient-to-r from-amber-200 to-amber-400"
              : "h-px bg-[#f4efe0]/55"
          }
          initial={{ scaleX: index / total }}
          animate={{ scaleX: (index + 1) / total }}
          style={{ transformOrigin: "left" }}
          transition={{ duration: 0.6, ease: EXPO_OUT }}
        />
      </div>
    </div>
  );
}

function SponsorCardPreview({
  tier,
  name,
  note,
  avatarSrc,
  placeholderName,
}: {
  tier: SponsorTier;
  name: string;
  note: string;
  avatarSrc: string | null;
  placeholderName: string;
}) {
  const gold = tier === "gold";
  return (
    <div
      className={[
        "flex items-center gap-4 rounded-2xl border p-5",
        gold
          ? "border-amber-400/30 bg-amber-300/[0.06]"
          : "border-[#f4efe0]/12 bg-[#f4efe0]/[0.04]",
      ].join(" ")}
    >
      <AvatarPreview src={avatarSrc} name={name || placeholderName} size={56} />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1.5">
          <span
            className={[
              "truncate text-base font-semibold",
              gold ? "uc-gild" : "text-[#f4efe0]",
            ].join(" ")}
          >
            {name.trim() || placeholderName}
          </span>
          {gold && (
            <Sparkles
              className="size-3.5 flex-none text-amber-300/90"
              aria-hidden
            />
          )}
        </div>
        {note.trim() && (
          <p className="mt-0.5 truncate text-sm text-[#f4efe0]/50">
            {note.trim()}
          </p>
        )}
      </div>
    </div>
  );
}

const CORNER_TICKS = [
  "top-3 left-3 border-t border-l",
  "top-3 right-3 border-t border-r",
  "bottom-3 left-3 border-b border-l",
  "bottom-3 right-3 border-b border-r",
];

/** The single "certificate" payoff — name, appreciation, Pro seat and perks
 * as one engraved document instead of stacked cards. */
function Certificate({
  tier,
  name,
  placeholderName,
  eyebrow,
  body,
  tierLabel,
  proSeatTitle,
  proSeatBody,
  perksTitle,
  perks,
}: {
  tier: SponsorTier;
  name: string;
  placeholderName: string;
  eyebrow: string;
  body: string;
  tierLabel: string;
  proSeatTitle: string;
  proSeatBody: string;
  perksTitle: string;
  perks: string[];
}) {
  const gold = tier === "gold";
  return (
    <div
      className="relative overflow-hidden px-7 py-9 text-left sm:px-9 sm:py-10"
      style={{ background: "linear-gradient(180deg,#1a140b 0%,#0d0905 68%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6px] border border-[#f4efe0]/8"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 border border-[#f4efe0]/14"
      />
      {CORNER_TICKS.map((pos) => (
        <span
          key={pos}
          aria-hidden
          className={`absolute size-3.5 ${pos} ${gold ? "border-amber-400/45" : "border-[#f4efe0]/22"}`}
        />
      ))}

      <p className="font-mono text-[10px] tracking-[0.24em] text-[#f4efe0]/35 uppercase">
        {eyebrow}
      </p>
      <p
        className={
          gold
            ? "uc-gild mt-3 text-4xl leading-[1.05] font-bold tracking-tight sm:text-[42px]"
            : "mt-3 text-4xl leading-[1.05] font-bold tracking-tight text-[#f4efe0] sm:text-[42px]"
        }
      >
        {name.trim() || placeholderName}
      </p>
      <span
        className={[
          "mt-3.5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[10px] tracking-[0.14em] uppercase",
          gold
            ? "border-amber-400/30 text-amber-300/80"
            : "border-[#f4efe0]/18 text-[#f4efe0]/40",
        ].join(" ")}
      >
        {gold && <Sparkles className="size-3" aria-hidden />}
        {tierLabel}
      </span>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-[#f4efe0]/55">
        {body}
      </p>

      <div className="my-7 h-px w-full bg-[#f4efe0]/10" />

      <div className="flex items-start gap-3.5">
        <Rocket
          className="mt-0.5 size-4 flex-none text-amber-300/80"
          strokeWidth={1.8}
        />
        <div>
          <p className="text-sm font-semibold text-[#f4efe0]">{proSeatTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#f4efe0]/50">
            {proSeatBody}
          </p>
        </div>
      </div>

      <div className="my-7 h-px w-full bg-[#f4efe0]/10" />

      <p className="font-mono text-[10px] tracking-[0.2em] text-[#f4efe0]/35 uppercase">
        {perksTitle}
      </p>
      <ul className="mt-3 space-y-2">
        {perks.map((label) => (
          <li
            key={label}
            className="flex items-baseline gap-2.5 text-[13px] text-[#f4efe0]/65"
          >
            <span className="text-amber-300/70">·</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CONFETTI_COLORS_GOLD = ["#fdeec0", "#d9b15a", "#f5d78e", "#b9852f"];
const CONFETTI_COLORS_REGULAR = [PARCHMENT, "#c9c2ab", "#e8c874", "#a89a72"];

function ConfettiBurst({ gold }: { gold: boolean }) {
  const colors = gold ? CONFETTI_COLORS_GOLD : CONFETTI_COLORS_REGULAR;
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const angle = (360 / 22) * i + (Math.random() * 14 - 7);
        const distance = 90 + Math.random() * 70;
        return {
          x: Math.cos((angle * Math.PI) / 180) * distance,
          y: Math.sin((angle * Math.PI) / 180) * distance - 16,
          rotate: Math.random() * 320 - 160,
          w: 3 + Math.random() * 3,
          h: 7 + Math.random() * 6,
          delay: Math.random() * 0.15,
          color: colors[i % colors.length],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ width: p.w, height: p.h, background: p.color }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: 0,
            x: p.x,
            y: p.y + 44,
            scale: 1,
            rotate: p.rotate,
          }}
          transition={{ duration: 1.1, delay: p.delay, ease: EXPO_OUT }}
        />
      ))}
    </div>
  );
}

export function SponsorClaimForm({
  token,
  tier,
  wallHref,
}: {
  token: string;
  tier: SponsorTier;
  wallHref: string;
}) {
  const t = useTranslations("sponsorClaim");
  const gold = tier === "gold";

  const [step, setStep] = useState<Step>("welcome");
  const [direction, setDirection] = useState(1);

  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");
  const [githubLogin, setGithubLogin] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUpload, setAvatarUpload] = useState<string | null>(null);

  const [ghStatus, setGhStatus] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const previewSrc =
    avatarUpload || (avatarUrl.trim() ? avatarUrl.trim() : null);

  const go = (next: Step, dir: 1 | -1) => {
    setStepError(null);
    setDirection(dir);
    setStep(next);
  };

  const resetFile = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const lookupGithub = async () => {
    const login = githubLogin.trim();
    if (!login) {
      setGhStatus(t("githubEmpty"));
      return;
    }
    setGhLoading(true);
    setGhStatus(null);
    try {
      const res = await fetch(
        `/api/sponsor-invite/${encodeURIComponent(token)}/github-lookup?login=${encodeURIComponent(login)}`,
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setGhStatus(body?.error ?? `Lookup failed: ${res.status}`);
        return;
      }
      setGithubLogin(body.login ?? login);
      setName((n) => n.trim() || body.name || body.login || login);
      setUrl((u) => u.trim() || body.htmlUrl || "");
      setAvatarUrl(body.avatarUrl ?? "");
      setAvatarUpload(null);
      resetFile();
      setGhStatus(t("githubFound", { name: body.name || body.login }));
    } catch (e) {
      setGhStatus(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setGhLoading(false);
    }
  };

  const onPickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setStepError(t("avatarTooLarge"));
      resetFile();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUpload(reader.result as string);
      setStepError(null);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarUpload(null);
    setAvatarUrl("");
    resetFile();
  };

  const goIdentityNext = () => {
    setStepError(null);
    if (!name.trim()) {
      setStepError(t("errorRequired"));
      return;
    }
    go("message", 1);
  };

  const goMessageNext = () => {
    setStepError(null);
    const trimmedUrl = url.trim();
    if (trimmedUrl && !URL_RE.test(trimmedUrl)) {
      setStepError(t("errorUrl"));
      return;
    }
    go("review", 1);
  };

  const submit = () => {
    setStepError(null);
    const payload: Record<string, unknown> = {
      name: name.trim(),
      url: url.trim() || null,
      note: note.trim() || null,
      githubLogin: githubLogin.trim() || null,
    };
    if (avatarUpload) {
      payload.avatarUpload = avatarUpload;
    } else if (avatarUrl.trim()) {
      payload.avatarUrl = avatarUrl.trim();
    }

    startTransition(async () => {
      const res = await fetch(
        `/api/sponsor-invite/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const reason = body?.reason as string | undefined;
        const msg =
          reason === "used"
            ? t("invalidUsed")
            : reason === "expired"
              ? t("invalidExpired")
              : reason === "not_found"
                ? t("invalidNotFound")
                : (body?.error ?? t("errorGeneric"));
        setStepError(msg);
        return;
      }
      go("success", 1);
    });
  };

  const inputCls =
    "w-full border-b border-[#f4efe0]/15 bg-transparent px-0 py-2.5 text-[15px] text-[#f4efe0] placeholder:text-[#f4efe0]/25 outline-none transition-colors focus:border-amber-300/70";
  const labelCls =
    "font-mono text-[10px] font-medium tracking-[0.14em] text-[#f4efe0]/40 uppercase";
  const ghostBtnCls =
    "inline-flex flex-none items-center rounded-[3px] border border-[#f4efe0]/20 px-4 py-2.5 text-xs font-medium tracking-wider text-[#f4efe0]/70 uppercase transition-colors hover:border-amber-300/50 hover:text-amber-200 disabled:opacity-40";

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        {step === "welcome" && (
          <motion.div
            key="welcome"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: EXPO_OUT }}
            className="relative"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-6 hidden opacity-[0.14] sm:block"
            >
              <SealMedallion gold={gold} size={220} />
            </div>

            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-amber-300/40" />
              <span className="font-mono text-[10px] tracking-[0.22em] text-amber-200/70 uppercase">
                {gold ? t("badgeGold") : t("badgeRegular")}
              </span>
            </div>

            <h1 className="mt-6 max-w-md text-[clamp(2.75rem,9vw,4.75rem)] leading-[0.98] font-bold tracking-tight text-[#f4efe0]">
              {t("welcomeTitle")}
            </h1>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#f4efe0]/55">
              {t("welcomeBody")}
            </p>

            <div className="mt-10">
              <PrimaryButton onClick={() => go("identity", 1)}>
                {t("welcomeCta")}
                <ArrowRight className="size-4" strokeWidth={2.2} />
              </PrimaryButton>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-wide text-[#f4efe0]/30">
              {t("welcomeHint")}
            </p>
          </motion.div>
        )}

        {step === "identity" && (
          <motion.div
            key="identity"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EXPO_OUT }}
          >
            <StepHeader
              index={0}
              total={3}
              title={t("stepIdentityTitle")}
              subtitle={t("stepIdentitySubtitle")}
              gold={gold}
              backLabel={t("back")}
              stepLabel={t("stepOf", { current: 1, total: 3 })}
              onBack={() => go("welcome", -1)}
            />

            <div className="mt-9 flex flex-col items-center gap-3">
              <div className="relative inline-flex items-center justify-center">
                <span
                  aria-hidden
                  className="absolute -inset-2.5 rounded-full border border-dashed border-[#f4efe0]/15"
                />
                <AvatarPreview src={previewSrc} name={name} size={88} />
              </div>
              {previewSrc && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  {t("avatarRemove")}
                </button>
              )}
            </div>

            <div className="mt-8 border-b border-[#f4efe0]/10 pb-7">
              <label className={labelCls} htmlFor="cl-gh">
                {t("githubLabel")}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="cl-gh"
                  type="text"
                  value={githubLogin}
                  onChange={(e) => setGithubLogin(e.target.value)}
                  placeholder="e.g. mkdir700"
                  maxLength={100}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={lookupGithub}
                  disabled={ghLoading || !githubLogin.trim()}
                  className={ghostBtnCls}
                >
                  {ghLoading ? t("githubFetching") : t("githubButton")}
                </button>
              </div>
              <p className="mt-2 text-xs text-[#f4efe0]/35">
                {t("githubHint")}
              </p>
              {ghStatus && (
                <p className="mt-1 text-xs text-[#f4efe0]/45">{ghStatus}</p>
              )}
            </div>

            <div className="mt-7 space-y-6">
              <div>
                <span className={labelCls}>{t("avatarLabel")}</span>
                <div className="mt-2 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickFile(e.target.files?.[0])}
                    className="block w-full text-xs text-[#f4efe0]/50 file:mr-3 file:rounded-[3px] file:border file:border-[#f4efe0]/20 file:bg-transparent file:px-3 file:py-1.5 file:text-[10px] file:font-medium file:tracking-wider file:text-[#f4efe0]/70 file:uppercase"
                  />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => {
                      setAvatarUrl(e.target.value);
                      setAvatarUpload(null);
                    }}
                    placeholder={t("avatarUrlPlaceholder")}
                    maxLength={1000}
                    className="w-full border-b border-[#f4efe0]/15 bg-transparent px-0 py-1.5 text-xs text-[#f4efe0] outline-none placeholder:text-[#f4efe0]/25 focus:border-amber-300/70"
                  />
                  <p className="text-xs text-[#f4efe0]/35">{t("avatarHint")}</p>
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="cl-name">
                  {t("nameLabel")}
                </label>
                <input
                  id="cl-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  maxLength={120}
                  required
                  className={`mt-2 ${inputCls}`}
                />
              </div>
            </div>

            {stepError && (
              <p className="mt-4 text-xs text-red-400">{stepError}</p>
            )}

            <PrimaryButton
              onClick={goIdentityNext}
              disabled={!name.trim()}
              className="mt-8 w-full"
            >
              {t("continue")}
              <ArrowRight className="size-4" strokeWidth={2.2} />
            </PrimaryButton>
          </motion.div>
        )}

        {step === "message" && (
          <motion.div
            key="message"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EXPO_OUT }}
          >
            <StepHeader
              index={1}
              total={3}
              title={t("stepMessageTitle")}
              subtitle={t("stepMessageSubtitle")}
              gold={gold}
              backLabel={t("back")}
              stepLabel={t("stepOf", { current: 2, total: 3 })}
              onBack={() => go("identity", -1)}
            />

            <div className="mt-9 space-y-6">
              <div>
                <label className={labelCls} htmlFor="cl-note">
                  {t("noteLabel")}
                </label>
                <input
                  id="cl-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("notePlaceholder")}
                  maxLength={500}
                  className={`mt-2 ${inputCls}`}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="cl-url">
                  {t("urlLabel")}
                </label>
                <input
                  id="cl-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  maxLength={1000}
                  className={`mt-2 ${inputCls}`}
                />
              </div>
            </div>

            {stepError && (
              <p className="mt-4 text-xs text-red-400">{stepError}</p>
            )}

            <PrimaryButton onClick={goMessageNext} className="mt-8 w-full">
              {t("continue")}
              <ArrowRight className="size-4" strokeWidth={2.2} />
            </PrimaryButton>
          </motion.div>
        )}

        {step === "review" && (
          <motion.div
            key="review"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EXPO_OUT }}
          >
            <StepHeader
              index={2}
              total={3}
              title={t("stepReviewTitle")}
              subtitle={t("stepReviewSubtitle")}
              gold={gold}
              backLabel={t("back")}
              stepLabel={t("stepOf", { current: 3, total: 3 })}
              onBack={() => go("message", -1)}
            />

            <div className="mt-9">
              <SponsorCardPreview
                tier={tier}
                name={name}
                note={note}
                avatarSrc={previewSrc}
                placeholderName={t("namePlaceholder")}
              />
            </div>

            <p className="mt-5 text-center text-xs leading-relaxed text-[#f4efe0]/40">
              {t("reviewPendingNote")}
            </p>

            {stepError && (
              <p className="mt-4 text-center text-xs text-red-400">
                {stepError}
              </p>
            )}

            <PrimaryButton
              onClick={submit}
              disabled={pending}
              className="mt-7 w-full"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={2.2} />
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </PrimaryButton>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: EXPO_OUT }}
            className="relative flex flex-col items-center text-center"
          >
            <motion.div
              className="relative flex items-center justify-center"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: EXPO_OUT }}
            >
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: gold
                    ? "radial-gradient(circle, rgba(232,200,116,0.55), transparent 70%)"
                    : "radial-gradient(circle, rgba(244,239,224,0.35), transparent 70%)",
                }}
                initial={{ opacity: 0.9, scale: 0.6 }}
                animate={{ opacity: 0, scale: 2.4 }}
                transition={{ duration: 0.7, ease: EXPO_OUT }}
              />
              <ConfettiBurst gold={gold} />
              <SealMedallion gold={gold} size={104} />
            </motion.div>

            <h1 className="mt-7 text-3xl font-bold tracking-tight text-[#f4efe0]">
              {t("successTitle")}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#f4efe0]/55">
              {t("successBody")}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55, ease: EXPO_OUT }}
              className="mt-9 w-full max-w-md"
            >
              <Certificate
                tier={tier}
                name={name}
                placeholderName={t("namePlaceholder")}
                eyebrow={t("plaqueEyebrow")}
                body={t("plaqueBody")}
                tierLabel={gold ? t("tierGold") : t("tierRegular")}
                proSeatTitle={t("proSeatTitle")}
                proSeatBody={t("proSeatBody")}
                perksTitle={t("perksTitle")}
                perks={[
                  t("perkVote"),
                  t("perkContact"),
                  t("perkBadge"),
                  t("perkMission"),
                ]}
              />
            </motion.div>

            <a
              href={wallHref}
              className="mt-8 inline-flex items-center gap-1.5 text-sm text-[#f4efe0]/50 underline underline-offset-4 transition-colors hover:text-[#f4efe0]"
            >
              {t("viewWallCta")}
              <ArrowRight className="size-3.5" strokeWidth={2.2} />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
