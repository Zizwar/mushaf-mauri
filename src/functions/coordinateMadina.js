import { Dimensions } from "react-native";
import { coordinateMadina } from "../data";
const { width: WIDTH } = Dimensions.get("window");
let scrW_mosshaf = WIDTH + 20;

export const coordinatePageMadina = (page) => {
  const coordinatePage = coordinateMadina[page];

  let sura,
    aya,
    top,
    left,
    prev_top,
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
    fp_ofwidth = 5,
    fp_ofheight = 10;
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
  // for ( [sura, aya, left, top] of coordinatePage) {
  for (let item in coordinatePage) {
    sura = item.split("_")[0];
    aya = item.split("_")[1];
    top = coordinatePage[sura + "_" + aya][1];
    left = coordinatePage[sura + "_" + aya][0];
    //console.log("====", { sura, aya, left, top });
    //  top = top - ofheight;
    // left = left - ofwidth;
    let wino_ = {
      aya: aya,
      sura: sura,
      page: page,
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
  //  "agr b_top =",b_top,"_______________________");
  //let b_top = 0;
  //let b_left = 0;
  //top = b_top + top;
  //left = b_left + left;
  scrW_mosshaf = scrW_mosshaf + 300;
  width = (scrW_mosshaf / 456) * width;
  height = (scrW_mosshaf / 456) * height;
  left = (scrW_mosshaf / 456) * left; //+ 2;
  top = (scrW_mosshaf / 456) * top; //+ 7;

  return { width, height, left, top, wino, id: wino.id };
}
//
