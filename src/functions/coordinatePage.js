import { coordinateMuhammadi } from "../data";
import { Dimensions } from "react-native";

let { width: WIDTH, height: HEIGHT } = Dimensions.get("window");
//Create layer  quran mauri
const DEVICE_WIDTH_HEIGHT = { width: WIDTH, height: HEIGHT }; //change to dynamic dimension

const ORIGINAL_WIDTH_HEIGHT = { width: 456, height: 825 }; //no change /1273
const WIDTH_SCREEN_RENDER = 456;
const NEXT_PAGE_LEFT = 0;
const NEXT_PAGE_TOP = 985.8; // ORIGINAL_WIDTH_HEIGHT.height;
const MARGIN_LEFT_AYA = 10;
const MARGIN_TOP = 20;
const MARGIN_HEIGHT_AYA = -1;
const MARGIN_PAGE = 10;

const HEIGHT_SCALA =
  (NEXT_PAGE_TOP - MARGIN_PAGE) *
  (WIDTH / ORIGINAL_WIDTH_HEIGHT.width);

const NUMBER_LINE = 15;
const HEIGHT_LINE = HEIGHT_SCALA / NUMBER_LINE; //+ MARGIN_HEIGHT_AYA;

export const coordinatePage = (page, mosshaf) => {
  let oldLine = 0;
  let oldLeft = DEVICE_WIDTH_HEIGHT.width;
  let oldTop = 0;
  let line = 0;
  const allPosition = [];
  //===>
  const [nextPageSura = null, nextAya] = coordinateMuhammadi[page + 1]
    ? coordinateMuhammadi[page + 1][0]
    : [];

  const coordinatePage = nextPageSura
    ? [
        ...coordinateMuhammadi[page],
        [nextPageSura, nextAya, NEXT_PAGE_LEFT, NEXT_PAGE_TOP],
      ]
    : coordinateMuhammadi[page];

  for (let [sura, aya, left, top] of coordinatePage) {
    left =
      (left / ORIGINAL_WIDTH_HEIGHT.width) * DEVICE_WIDTH_HEIGHT.width -
      MARGIN_LEFT_AYA;
    top = (top / HEIGHT_SCALA) * DEVICE_WIDTH_HEIGHT.height;
    let line = parseInt(
      ((top / HEIGHT_SCALA) * DEVICE_WIDTH_HEIGHT.height) / HEIGHT_LINE
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
        renderLineFahres({ left, top, line, width: oldLeft - left, wino })
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
    oldTop = top;
  }

  return allPosition;
  ////===>
};
//
const renderLineFahres = ({ left, line, width, wino }) => {
  //===>
  let top = +(HEIGHT_LINE * line).toFixed(2); //+200;
  let height = +HEIGHT_LINE.toFixed(2);
  left = +left.toFixed(2);
  width = +width.toFixed(2);
  //recalc

  //  console.log("original", { left, line, width, top, height, id: wino.id });
  return { left, width, top, height, id: wino.id, wino };
};

//
