import { coordinateMuhammadi } from "../data";
import { Dimensions } from "react-native";

let { width: WIDTH, height: HEIGHT } = Dimensions.get("window");
//Create layer  quran mauri
const DEVICE_WIDTH_HEIGHT = { width: WIDTH, height: HEIGHT }; //change to dynamic dimension

const ORIGINAL_WIDTH_HEIGHT = { width: 456, height: 707 }; //no change
const WIDTH_SCREEN_RENDER = 456;
const NEXT_PAGE_LEFT = 0;
const NEXT_PAGE_TOP = 985.8; // ORIGINAL_WIDTH_HEIGHT.height;
const MARGIN_LEFT_AYA = 10;
const MARGIN_PAGE_TOP = 0;
const MARGIN_HEIGHT_AYA = 0.3;
const MARGIN_PAGE = 20;
const MARGIN_HEIGHT_SCALA = -110;
const PERCENT_MIN = 0.5;
const PERCENT_MAX = 3;

const HEIGHT_SCALA =
  ((ORIGINAL_WIDTH_HEIGHT.height - MARGIN_PAGE) *
    (WIDTH / ORIGINAL_WIDTH_HEIGHT.width)) +
  MARGIN_HEIGHT_SCALA;

const NUMBER_LINE = 15;
const HEIGHT_LINE = HEIGHT_SCALA / NUMBER_LINE + MARGIN_HEIGHT_AYA;
let oldTop = HEIGHT_SCALA;
export const coordinatePage = (page, mosshaf) => {
  let oldLine = 0;
  let oldLeft = DEVICE_WIDTH_HEIGHT.width;

  let line = 0;
  const allPosition = [];
  oldTop = HEIGHT_SCALA;
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
    top = (top / ORIGINAL_WIDTH_HEIGHT.height) * HEIGHT_SCALA;

    let line =// parseInt(
      ((top / HEIGHT_SCALA) * ORIGINAL_WIDTH_HEIGHT.height) / HEIGHT_LINE
   // );

    //if 1 line
    const lineNumber = line - oldLine;
    //oldTop = top;
    thisLine = line;
    const btwLineHight = top - oldTop;

    const wino = {
      aya,
      sura,
      page,
      id: `s${sura}a${aya}z`,
    };
    //if (btwLineHight < HEIGHT_LINE) {
   if(line<PERCENT_MIN){
    // if (!lineNumber) {
      //alert("lineNumber1")
      allPosition.push(
        renderLineFahres({ left, top, line, width: oldLeft - left, wino })
      );
      // oldLeft = left;
      //  return;
    }
    //if 2 lineNumber
    // else if (btwLineHight > HEIGHT_LINE && btwLineHight < HEIGHT_LINE * 2) {
  
    //if multilineNumber
   else if (line > PERCENT_MAX) {
      //   else if (lineNumber > 1) {
      //alert("multi line")
      //lastLine
      allPosition.push(
        renderLineFahres({
          left,
          top, // top: top + HEIGHT_LINE,
          line,
          width: DEVICE_WIDTH_HEIGHT.width - left,
          wino,
        })
      );
      //firstLine
      allPosition.push(
        renderLineFahres({ top, left: 0, line: oldLine, width: oldLeft, wino })
      );

      //renderMultiLine Btwn
      for (let ii = oldLine + 1; ii < thisLine; ii++)
        allPosition.push(
          renderLineFahres({
            top, //   top: top + HEIGHT_LINE,
            left: 0,
            line: ii,
            width: DEVICE_WIDTH_HEIGHT.width,
            wino,
          })
        );
    }   else  {
      //alert("lineNumber2")
      //lastLine
      allPosition.push(
        renderLineFahres({
          top, //  top: top + HEIGHT_LINE,
          left,
          line,
          width: DEVICE_WIDTH_HEIGHT.width - left,
          wino,
        })
      );
      //firstLine
      allPosition.push(
        renderLineFahres({ left: 0, top, line: oldLine, width: oldLeft, wino })
      );
      // oldLine = thisLine;
      // oldLeft = left;
    }

    oldLine = thisLine;
    oldLeft = left;
    oldTop = top;
  }

  return allPosition;
  ////===>
};
//
const renderLineFahres = ({ left, line, top = 0, width, wino }) => {
  //===>
  //top = HEIGHT_SCALA - top; //
  top = +(HEIGHT_LINE * line).toFixed(2) + MARGIN_PAGE_TOP; //+200;
  let height = +HEIGHT_LINE.toFixed(2);
  left = +left.toFixed(2);
  width = +width.toFixed(2);
  //
  oldTop = top;
  //recalc

  //  console.log("original", { left, line, width, top, height, id: wino.id });
  return { left, width, top, height, id: wino.id, wino };
};

//
