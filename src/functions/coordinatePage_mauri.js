import { coordinateMuhammadi } from "../data";
import { Dimensions } from "react-native";

let { width: WIDTH, height: HEIGHT } = Dimensions.get("screen");
//Create layer  quran mauri
const DEVICE_WIDTH_HEIGHT ={ width: WIDTH, height: HEIGHT }; //change to dynamic dimension

const ORIGINAL_WIDTH_HEIGHT = { width: 456, height: 990 }; //no change
const WIDTH_SCREEN_RENDER = 456;
const NEXT_PAGE_LEFT = 0;
const NEXT_PAGE_TOP = 985.8; // ORIGINAL_WIDTH_HEIGHT.height;
const MARGIN_LEFT_AYA = 30;
const MARGIN_TOP = 20;

const NUMBER_LINE = 15;
const HEIGHT_LINE = DEVICE_WIDTH_HEIGHT.height / NUMBER_LINE;

let oldLine = 0;
let oldLeft = DEVICE_WIDTH_HEIGHT.width;
let line = 0;
export const coordinatePage = (page, mosshaf) => {
  const allPosition = [];
  //===>
  const [nextPageSura = null, nextAya] = coordinateMuhammadi[page]
    ? coordinateMuhammadi[page][0]
    : [];

  const coordinatePage = nextPageSura
    ? [
        ...coordinateMuhammadi[page - 1],
        [nextPageSura, nextAya, NEXT_PAGE_LEFT, NEXT_PAGE_TOP],
      ]
    : coordinateMuhammadi[page - 1];

  for (let [index, [sura, aya, left, top]] of coordinatePage.entries()) {
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
      oldLeft = left;
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
      oldLine = thisLine;
      oldLeft = left;
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
      oldLine = thisLine;
      oldLeft = left;
    }
  }

  return allPosition;
  ////===>
};
//
const renderLineFahres=({ left, line, width, wino })=> {
  //===>
  let top = +(HEIGHT_LINE * line).toFixed(2);
  let height = +HEIGHT_LINE.toFixed(2);
  left = +left.toFixed(2);
  width = +width.toFixed(2);
  //recalc 
 

 console.log("original",{ left,line, width, top, height, id: wino.id, });
   return { left, width, top, height, id: wino.id, wino };
}

//
