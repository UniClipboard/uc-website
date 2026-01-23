import { act, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";

import { Navigation } from "@/components/landing/Navigation";

jest.mock("framer-motion", () => {
  let currentScrollY = 0;
  const motionValueEventHandlers: Array<(value: number) => void> = [];
  const motionComponentCache = new Map<
    string,
    React.ComponentType<Record<string, unknown>>
  >();

  const MOTION_PROP_KEYS = new Set<string>([
    "animate",
    "initial",
    "exit",
    "variants",
    "transition",
    "layout",
    "layoutId",
    "whileHover",
    "whileTap",
    "whileInView",
    "viewport",
  ]);

  const __reset = () => {
    currentScrollY = 0;
    motionValueEventHandlers.length = 0;
  };

  const __setScrollY = (value: number) => {
    currentScrollY = value;
    for (const handler of motionValueEventHandlers) handler(value);
  };

  const scrollY = {
    get: () => currentScrollY,
  };

  const getMotionPrimitive = (tag: string) => {
    const cached = motionComponentCache.get(tag);
    if (cached) return cached;

    const filterDomProps = (props: Record<string, unknown>) => {
      const out: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        if (!MOTION_PROP_KEYS.has(key)) out[key] = value;
      }
      return out;
    };

    const Component = React.forwardRef(
      (rawProps: Record<string, unknown>, ref: React.ForwardedRef<unknown>) => {
        const { children, ...rest } = rawProps as Record<string, unknown> & {
          children?: React.ReactNode;
        };
        const domProps = filterDomProps(rest);
        return React.createElement(
          tag,
          { ...(domProps as Record<string, unknown>), ref } as Record<
            string,
            unknown
          >,
          children,
        );
      },
    );
    Component.displayName = `motion.${tag}`;
    motionComponentCache.set(tag, Component);
    return Component;
  };

  return {
    __esModule: true,
    __reset,
    __setScrollY,
    motion: new Proxy(
      {},
      {
        get: (_target, key) => {
          if (typeof key !== "string") return undefined;
          return getMotionPrimitive(key);
        },
      },
    ),
    useScroll: () => ({ scrollY }),
    useMotionValueEvent: (
      _value: unknown,
      _event: string,
      handler: (value: number) => void,
    ) => {
      React.useEffect(() => {
        motionValueEventHandlers.push(handler);
        return () => {
          const index = motionValueEventHandlers.indexOf(handler);
          if (index !== -1) motionValueEventHandlers.splice(index, 1);
        };
      }, [handler]);
    },
  };
});

const mockUseLocale = jest.fn();
jest.mock("next-intl", () => ({
  useLocale: () => mockUseLocale(),
}));

const push = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ push }),
}));

const setTheme = jest.fn();
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme }),
}));

describe("Navigation", () => {
  beforeEach(() => {
    const { __reset } = jest.requireMock("framer-motion");

    __reset();
    push.mockClear();
    setTheme.mockClear();
  });

  it("renders a unified language/theme control pill", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    expect(screen.getByTestId("nav-controls")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch language" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Toggle theme" }),
    ).toBeInTheDocument();
  });

  it("treats the logo mark as decorative", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    expect(screen.getByTestId("nav-logo-icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("switches locale while preserving current pathname", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "Switch language" }));
    expect(push).toHaveBeenCalledWith("/zh");
  });

  it("toggles theme", () => {
    mockUseLocale.mockReturnValue("en");

    render(<Navigation />);

    fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("starts expanded when scrollY <= 64", () => {
    mockUseLocale.mockReturnValue("en");
    const { __setScrollY } = jest.requireMock("framer-motion");

    __setScrollY(64);
    render(<Navigation />);

    expect(screen.getByTestId("nav-root")).toHaveAttribute(
      "data-nav-variant",
      "expanded",
    );
  });

  it("becomes compact when scrollY > 64", () => {
    mockUseLocale.mockReturnValue("en");
    const { __setScrollY } = jest.requireMock("framer-motion");

    __setScrollY(0);
    render(<Navigation />);

    act(() => __setScrollY(65));
    expect(screen.getByTestId("nav-root")).toHaveAttribute(
      "data-nav-variant",
      "compact",
    );
  });

  it("uses a pill shape when compact", () => {
    mockUseLocale.mockReturnValue("en");
    const { __setScrollY } = jest.requireMock("framer-motion");

    __setScrollY(0);
    render(<Navigation />);

    act(() => __setScrollY(80));
    expect(screen.getByTestId("nav-shell")).toHaveAttribute(
      "data-nav-shape",
      "pill",
    );
  });
});
