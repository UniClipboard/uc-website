export const acceptsMarkdown = (accept: string | null): boolean =>
  accept?.split(",").some((entry) => {
    const [mediaType, ...parameters] = entry.trim().toLowerCase().split(";");

    if (mediaType !== "text/markdown") return false;

    const quality = parameters.find((parameter) =>
      parameter.trim().startsWith("q="),
    );
    return quality === undefined || Number(quality.trim().slice(2)) > 0;
  }) ?? false;
