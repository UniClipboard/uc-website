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

// Every Android download goes through the release host (FlareRelease), the same
// place the Android app updates from. Besides one source of truth it lets the
// release host send users in mainland China to a mirror, which a direct GitHub
// link can never do. GitHub is only used for the release notes page.
const RELEASE_HOST = "https://release.uniclipboard.app";
const ANDROID_MANIFEST_URL = `${RELEASE_HOST}/android/stable.json`;
const ANDROID_RELEASE_PAGE_BASE =
  "https://github.com/UniClipboard/UniClip/releases/tag";
const ANDROID_RELEASE_REVALIDATE_SECONDS = 60 * 60;
const ANDROID_RELEASE_TIMEOUT_MS = 5000;
const ANDROID_ARCHES = [
  "arm64-v8a",
  "armeabi-v7a",
  "x86_64",
  "universal",
] as const;
const ANDROID_RECOMMENDED_ARCH: (typeof ANDROID_ARCHES)[number] = "arm64-v8a";

// The tag and the file names end up in a URL path, so only plain ones are used.
const SAFE_ANDROID_TAG = /^v[0-9][0-9A-Za-z.-]*$/;
const SAFE_APK_NAME = /^[0-9A-Za-z._-]+\.apk$/;

function androidArtifactUrl(tag: string, name: string): string {
  return `${RELEASE_HOST}/android/artifacts/${tag}/${name}`;
}

// Used only if the manifest fetch below fails (network error, timeout, an
// unexpected shape). Update when the fallback drifts too far from reality - see
// getAndroidRelease() for the live source of truth.
const ANDROID_RELEASE_FALLBACK: AndroidRelease = {
  channel: "stable",
  version: "2.0.0.186",
  releasePageUrl: `${ANDROID_RELEASE_PAGE_BASE}/v2.0.0.186`,
  items: [
    {
      arch: "arm64-v8a",
      url: androidArtifactUrl("v2.0.0.186", "UniClip-2.0.0-arm64-v8a.apk"),
      recommended: true,
    },
  ],
  minOS: "Android 8+",
};

const androidManifestSchema = z.object({
  version: z.string().min(1),
  tagName: z.string().regex(SAFE_ANDROID_TAG),
  assets: z.array(z.object({ name: z.string() })),
});

// Reads the stable channel manifest of the release host so the download links
// stay current without a cron job or DB write. The fetch result is cached by
// Next.js's data cache for ANDROID_RELEASE_REVALIDATE_SECONDS, so the release
// host is hit at most once per window regardless of traffic.
export async function getAndroidRelease(): Promise<AndroidRelease> {
  try {
    const response = await fetch(ANDROID_MANIFEST_URL, {
      next: { revalidate: ANDROID_RELEASE_REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(ANDROID_RELEASE_TIMEOUT_MS),
    });
    if (!response.ok) return ANDROID_RELEASE_FALLBACK;

    const parsed = androidManifestSchema.safeParse(await response.json());
    if (!parsed.success) return ANDROID_RELEASE_FALLBACK;

    const { tagName, version, assets } = parsed.data;
    const items: AndroidApk[] = [];
    for (const arch of ANDROID_ARCHES) {
      const asset = assets.find(
        (a) => SAFE_APK_NAME.test(a.name) && a.name.endsWith(`-${arch}.apk`),
      );
      if (!asset) continue;
      items.push({
        arch,
        url: androidArtifactUrl(tagName, asset.name),
        recommended: arch === ANDROID_RECOMMENDED_ARCH,
      });
    }
    if (items.length === 0) return ANDROID_RELEASE_FALLBACK;

    return {
      channel: "stable",
      version,
      releasePageUrl: `${ANDROID_RELEASE_PAGE_BASE}/${tagName}`,
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
