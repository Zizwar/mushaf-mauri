import { Dimensions } from "react-native";
import { coordinateMadina } from "../data";
const { width: WIDTH } = Dimensions.get("window");

const MARGIN_PAGE = 48;
const SCREEN_DEFAULT_WIDTH = 456;
const WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2.15 ;
const LEFT = -10//(MARGIN_PAGE / 2) + 16; // -22//+(MARGIN_PAGE * 0.6);
const TOP = -20; //-44;

export const coordinatePageMadina = (page) => {

  const coordinatePage = coordinateMadina[page];

  let prev_top,
    prev_left,
    width,
    diff,
    hl_id,
    b_top = 0,
    b_left = 0,
    //
    height = 30,
    mgwidth = 40,
    twidth = 416,
    ofwidth = 10,
    ofheight = 15,
    fasel_sura = 110,
    page_top = 37,
    page_sura_top = 80,
    fp_height = 20,
    fp_mgwidth = 80,
    fp_twidth = 376,
    fp_ofwidth = 15,
    fp_ofheight = 20;
  //

  if (page === 1 || page === 2) {
    height = fp_height;
    mgwidth = fp_mgwidth;
    twidth = fp_twidth;
    ofwidth = fp_ofwidth;
    ofheight = fp_ofheight;
  }
  prev_top = null;
  prev_left = null;
  let count = 1;
  let allPosition = [];
  for (let [sura, aya,  top,left] of coordinatePage) {
    // for (let item in coordinatePage) {
    //  sura = item.split("_")[0];
    //  aya = item.split("_")[1];
    //  top = coordinatePage[sura + "_" + aya][1];
    //  left = coordinatePage[sura + "_" + aya][0];
    //console.log("====", { sura, aya, left, top });
    top = top - ofheight;
    left = left - ofwidth;
    let wino_ = {
      aya,
      sura,
      page,
      id: "s" + sura + "a" + aya + "z",
    };
    width = 0;

    hl_id = "s" + sura + "a" + aya + "z";
    if (count === 1) {
      prev_left = twidth;
      if (page === 1 || page === 2) {
        prev_top = 270;
      } else {
        if (aya === 1) {
          prev_top = page_sura_top;
        } else {
          prev_top = page_top;
        }
      }
    } else {
      if (aya === 1) {
        prev_top += fasel_sura;
        prev_left = twidth;
      }
    }
    diff = top - prev_top;
    if (diff > height * 1.6) {
      allPosition.push(
        hl_draw(
          hl_id + "_1",
          prev_top,
          mgwidth,
          prev_left - mgwidth,
          height,
          b_top,
          b_left,
          wino_ //.id+"d_1"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_2",
          top,
          left,
          twidth - left,
          height,
          b_top,
          b_left,
          wino_ //_.id+ "_2"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_3",
          prev_top + height,
          mgwidth,
          twidth - mgwidth,
          diff - height,
          b_top,
          b_left,
          wino_ //id +"_3"
        )
      );
    } else if (diff > height * 0.6) {
      allPosition.push(
        hl_draw(
          hl_id + "_1",
          prev_top,
          mgwidth,
          prev_left - mgwidth,
          height,
          b_top,
          b_left,
          wino_ //.id+"d_1"
        )
      );
      allPosition.push(
        hl_draw(
          hl_id + "_2",
          top,
          left,
          twidth - left,
          height,
          b_top,
          b_left,
          wino_ //.id +"_2"
        )
      );
    } else {
      width = prev_left - left;
      allPosition.push(
        hl_draw(hl_id + "_1", top, left, width, height, b_top, b_left, wino_)
      );
    }
    count++;
    prev_top = top;
    prev_left = left;
  }
  return allPosition;
};
//

function hl_draw(id, top, left, width, height, b_top = 0, b_left = 0, wino) {
  width = (WIDTH / WIDTH_SCREEN_RENDER) * width;
  height = (WIDTH / WIDTH_SCREEN_RENDER) * height;
  left = (WIDTH / WIDTH_SCREEN_RENDER) * left + LEFT;
  top = (WIDTH / WIDTH_SCREEN_RENDER) * top + TOP;
  return { width, height, left, top, wino, id: wino.id };
}
//
