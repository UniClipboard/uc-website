// iOS 公测通过邮箱申请，由维护者手动邀请进 TestFlight。
// 用户在下载区域 iOS 标签里提交邮箱，POST /api/v1/ios-beta-signups。
// 管理后台：/admin/ios-beta

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

export const ANDROID_RELEASE: AndroidRelease = {
  channel: "stable",
  version: "1.0.11",
  releasePageUrl:
    "https://github.com/UniClipboard/uc-android/releases/tag/v1.0.11",
  items: [
    {
      arch: "arm64-v8a",
      url: "https://github.com/UniClipboard/uc-android/releases/download/v1.0.11/SyncClipboard-1.0.11-arm64-v8a.apk",
      recommended: true,
    },
    {
      arch: "armeabi-v7a",
      url: "https://github.com/UniClipboard/uc-android/releases/download/v1.0.11/SyncClipboard-1.0.11-armeabi-v7a.apk",
    },
    {
      arch: "x86_64",
      url: "https://github.com/UniClipboard/uc-android/releases/download/v1.0.11/SyncClipboard-1.0.11-x86_64.apk",
    },
    {
      arch: "universal",
      url: "https://github.com/UniClipboard/uc-android/releases/download/v1.0.11/SyncClipboard-1.0.11-universal.apk",
    },
  ],
  minOS: "Android 8+",
};

export type MobileGroupItem = {
  arch: string;
  ext: string;
  url: string;
  minOS: string;
  recommended?: boolean;
  actionLabel?: string;
  disabled?: boolean;
  external?: boolean;
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
};

export function buildMobileGroups(labels: MobileGroupLabels): MobileGroup[] {
  // iOS tab carries no download items — the DownloadFocus card renders an
  // email signup form for it (gated by the `iosSignup` prop).
  const iosGroup: MobileGroup = {
    os: "ios",
    label: labels.platformIOS,
    betaLabel: labels.iosBetaBadge,
    items: [],
  };

  const androidGroup: MobileGroup = {
    os: "android",
    label: labels.platformAndroid,
    items: ANDROID_RELEASE.items.map((it) => ({
      arch: it.arch,
      ext: labels.androidExtLabel,
      url: it.url,
      minOS: labels.androidMinOS,
      recommended: it.recommended,
      external: true,
    })),
  };

  return [iosGroup, androidGroup];
}

export function getAndroidPrimaryDownloadUrl(): string {
  const primary =
    ANDROID_RELEASE.items.find((item) => item.recommended) ??
    ANDROID_RELEASE.items[0];
  return primary?.url ?? ANDROID_RELEASE.releasePageUrl;
}
