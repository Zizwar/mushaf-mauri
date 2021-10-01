import { coordinateMuhammadi } from "../data";
import { Dimensions } from "react-native";

const { width: WIDTH } = Dimensions.get("window");
//Create layer  quran mauri
//change to dynamic dimension
 
const NEXT_PAGE_LEFT = 0;

const MARGIN_LEFT_AYA = 15;
const MARGIN_PAGE_TOP = 4.2;
const MARGIN_HEIGHT_AYA = 0.3;
const MARGIN_WIDTH = 25;
const ORIGIN_PAGE_TOP = 985.8;
const ORIGINAL_WIDTH_HEIGHT = {
  width: 456,
  height: ORIGIN_PAGE_TOP + MARGIN_PAGE_TOP,
};
/*
  ((ORIGIN_PAGE_TOP - MARGIN_PAGE) *
  (WIDTH / ORIGINAL_WIDTH_HEIGHT.width))+ MARGIN_HEIGHT_SCALA;
  */
const HEIGHT_SCALA = WIDTH * 1.471676300578035 - MARGIN_WIDTH;
const DEVICE_WIDTH_HEIGHT = { width: WIDTH, height: HEIGHT_SCALA };
const NUMBER_LINE = 15;
const HEIGHT_LINE = HEIGHT_SCALA / NUMBER_LINE + MARGIN_HEIGHT_AYA;

export const coordinatePageMuhammadi = (page) => {
  let oldLine = 0;
  let oldLeft = DEVICE_WIDTH_HEIGHT.width;

  const allPosition = [];
  //===>
  const [nextPageSura = null, nextAya] = coordinateMuhammadi[page + 1]
    ? coordinateMuhammadi[page + 1][0]
    : [];

  const coordinatePage = nextPageSura
    ? [
        ...coordinateMuhammadi[page],
        [nextPageSura, nextAya, NEXT_PAGE_LEFT, ORIGIN_PAGE_TOP],
      ]
    : coordinateMuhammadi[page];

  for (let [sura, aya, left, top] of coordinatePage) {
    left =
      (left / ORIGINAL_WIDTH_HEIGHT.width) * DEVICE_WIDTH_HEIGHT.width -
      MARGIN_LEFT_AYA;
    let line = parseInt(
      ((top / ORIGINAL_WIDTH_HEIGHT.height) * DEVICE_WIDTH_HEIGHT.height) /
        HEIGHT_LINE
    );

    //if 1 line
    const lineNumber = line - oldLine;
    thisLine = line;
    const wino = {
      aya,
      sura,
      page,
      id: `s${sura}a${aya}z`,
    };
    if (!lineNumber) {
      //alert("lineNumber1")
      allPosition.push(
        renderLineFahres({ left, line, width: oldLeft - left, wino })
      );
      // oldLeft = left;
      //  return;
    }
    //if 2 lineNumber
    else if (lineNumber === 1) {
      //alert("lineNumber2")
      //lastLine
      allPosition.push(
        renderLineFahres({
          left,
          line,
          width: DEVICE_WIDTH_HEIGHT.width - left,
          wino,
        })
      );
      //firstLine
      allPosition.push(
        renderLineFahres({ left: 0, line: oldLine, width: oldLeft, wino })
      );
      // oldLine = thisLine;
      // oldLeft = left;
    }
    //if multilineNumber
    else if (lineNumber > 1) {
      //alert("multi line")
      //lastLine
      allPosition.push(
        renderLineFahres({
          left,
          line,
          width: DEVICE_WIDTH_HEIGHT.width - left,
          wino,
        })
      );
      //firstLine
      allPosition.push(
        renderLineFahres({ left: 0, line: oldLine, width: oldLeft, wino })
      );

      //renderMultiLine Btwn
      for (let ii = oldLine + 1; ii < thisLine; ii++)
        allPosition.push(
          renderLineFahres({
            left: 0,
            line: ii,
            width: DEVICE_WIDTH_HEIGHT.width,
            wino,
          })
        );
    }
    oldLine = thisLine;
    oldLeft = left;
  }

  return allPosition;
  ////===>
};
//
let test=0
const renderLineFahres = ({ left, line, width, wino }) => {
  //===>
  let top = +(HEIGHT_LINE * line).toFixed(2) + MARGIN_PAGE_TOP; //+200;
  let height = +HEIGHT_LINE.toFixed(2);
  left = +left.toFixed(2);
  width = +width.toFixed(2);
  //recalc
  test++
  if(5>test)console.log({ width, height, left, top, wino, id: wino.id })
  //  console.log("original", { left, line, width, top, height, id: wino.id });
  return { left, width, top, height, id: wino.id, wino };
};

//
