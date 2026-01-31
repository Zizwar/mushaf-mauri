export const getImagePageUri = (pageId: number, quira: "madina" | "warsh" = "madina"): string => {
  switch (quira) {
    case "warsh":
      return `https://mushaf.ma/fahres/page/images/muhammadi/page${pageId + 2}.png`;
    case "madina":
    default:
      return `https://www.mushaf.ma/fahres/page/images/hafsTajweed/page${pageId}.png`;
  }
};
