import { z } from "zod";

// iOS 公测走公开的 TestFlight 邀请链接，用户直接在 iPhone / iPad 上打开即可加入。
// 历史邮箱申请数据仍由 /admin/ios-beta 管理。

export const IOS_TESTFLIGHT_URL = "https://testflight.apple.com/join/nyNQ8dQe";

export type MobileReleaseChannel = "beta" | "stable";

export type AndroidApk = {
  arch: string;
  url: string;
  recommended?: boolean;
};

export type IosRelease = {
  channel: MobileReleaseChannel;
  version: string;
  minOS: string;
};

export type AndroidRelease = {
  channel: MobileReleaseChannel;
  version: string;
  releasePageUrl: string;
  items: AndroidApk[];
  minOS: string;
};

export const IOS_RELEASE: IosRelease = {
  channel: "beta",
  // TODO(mobile-release): 拿到正式 TF 构建版本号后替换。
  version: "1.0",
  minOS: "iOS 16+",
};

// Used only if the GitHub Releases fetch below fails (network error, rate
// limit, unexpected asset naming). Update when the fallback drifts too far
// from reality — see getAndroidRelease() for the live source of truth.
const ANDROID_RELEASE_FALLBACK: AndroidRelease = {
  channel: "stable",
  version: "1.2.0",
  releasePageUrl: "https://github.com/UniClipboard/UniClip/releases/tag/v1.2.0",
  items: [
    {
      arch: "arm64-v8a",
      url: "https://github.com/UniClipboard/UniClip/releases/download/v1.2.0/UniClip-1.2.0-arm64-v8a.apk",
      recommended: true,
    },
    {
      arch: "armeabi-v7a",
      url: "https://github.com/UniClipboard/UniClip/releases/download/v1.2.0/UniClip-1.2.0-armeabi-v7a.apk",
    },
    {
      arch: "x86_64",
      url: "https://github.com/UniClipboard/UniClip/releases/download/v1.2.0/UniClip-1.2.0-x86_64.apk",
    },
    {
      arch: "universal",
      url: "https://github.com/UniClipboard/UniClip/releases/download/v1.2.0/UniClip-1.2.0-universal.apk",
    },
  ],
  minOS: "Android 8+",
};

const ANDROID_GITHUB_REPO = "UniClipboard/UniClip";
const ANDROID_RELEASE_FEED_URL = `https://api.github.com/repos/${ANDROID_GITHUB_REPO}/releases/latest`;
const ANDROID_RELEASE_REVALIDATE_SECONDS = 60 * 60;
const ANDROID_ARCHES = [
  "arm64-v8a",
  "armeabi-v7a",
  "x86_64",
  "universal",
] as const;
const ANDROID_RECOMMENDED_ARCH: (typeof ANDROID_ARCHES)[number] = "arm64-v8a";

const githubReleaseSchema = z.object({
  tag_name: z.string().min(1),
  html_url: z.string().url(),
  assets: z.array(
    z.object({
      name: z.string(),
      browser_download_url: z.string().url(),
    }),
  ),
});

// Fetches the latest Android release straight from GitHub Releases so the
// download link stays current without a cron job or DB write — the fetch
// result itself is cached by Next.js's data cache for
// ANDROID_RELEASE_REVALIDATE_SECONDS, so this hits the GitHub API at most
// once per revalidate window regardless of traffic.
export async function getAndroidRelease(): Promise<AndroidRelease> {
  try {
    const response = await fetch(ANDROID_RELEASE_FEED_URL, {
      next: { revalidate: ANDROID_RELEASE_REVALIDATE_SECONDS },
      headers: { accept: "application/vnd.github+json" },
    });
    if (!response.ok) return ANDROID_RELEASE_FALLBACK;

    const parsed = githubReleaseSchema.safeParse(await response.json());
    if (!parsed.success) return ANDROID_RELEASE_FALLBACK;

    const items: AndroidApk[] = [];
    for (const arch of ANDROID_ARCHES) {
      const asset = parsed.data.assets.find((a) =>
        a.name.endsWith(`-${arch}.apk`),
      );
      if (!asset) continue;
      items.push({
        arch,
        url: asset.browser_download_url,
        recommended: arch === ANDROID_RECOMMENDED_ARCH,
      });
    }
    if (items.length === 0) return ANDROID_RELEASE_FALLBACK;

    return {
      channel: "stable",
      version: parsed.data.tag_name.replace(/^v/, ""),
      releasePageUrl: parsed.data.html_url,
      items,
      minOS: ANDROID_RELEASE_FALLBACK.minOS,
    };
  } catch {
    return ANDROID_RELEASE_FALLBACK;
  }
}

export type MobileGroupItem = {
  arch: string;
  ext: string;
  url: string;
  minOS: string;
  recommended?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  external?: boolean;
  hint?: string;
};

export type MobileGroup = {
  os: "ios" | "android";
  label: string;
  items: MobileGroupItem[];
  betaLabel?: string;
};

export type MobileGroupLabels = {
  platformIOS: string;
  platformAndroid: string;
  iosBetaBadge: string;
  androidMinOS: string;
  androidExtLabel: string;
  androidHintArm64?: string;
  androidHintArmV7?: string;
  androidHintX64?: string;
  androidHintUniversal?: string;
};

const ANDROID_HINT_KEYS: Record<string, keyof MobileGroupLabels> = {
  "arm64-v8a": "androidHintArm64",
  "armeabi-v7a": "androidHintArmV7",
  x86_64: "androidHintX64",
  universal: "androidHintUniversal",
};

export function buildMobileGroups(
  labels: MobileGroupLabels,
  androidRelease: AndroidRelease,
): MobileGroup[] {
  // iOS group carries no download items — consumers render an email signup
  // form for it instead of a list of installers.
  const iosGroup: MobileGroup = {
    os: "ios",
    label: labels.platformIOS,
    betaLabel: labels.iosBetaBadge,
    items: [],
  };

  const androidGroup: MobileGroup = {
    os: "android",
    label: labels.platformAndroid,
    items: androidRelease.items.map((it) => {
      const hintKey = ANDROID_HINT_KEYS[it.arch];
      const hint = hintKey ? labels[hintKey] : undefined;
      return {
        arch: it.arch,
        ext: labels.androidExtLabel,
        url: it.url,
        minOS: labels.androidMinOS,
        recommended: it.recommended,
        external: true,
        hint: typeof hint === "string" ? hint : undefined,
      };
    }),
  };

  return [iosGroup, androidGroup];
}

export function getAndroidPrimaryDownloadUrl(
  androidRelease: AndroidRelease,
): string {
  const primary =
    androidRelease.items.find((item) => item.recommended) ??
    androidRelease.items[0];
  return primary?.url ?? androidRelease.releasePageUrl;
}
