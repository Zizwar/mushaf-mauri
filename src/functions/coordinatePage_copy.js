import {
    coordinateMuhammadi,
} from "../data";
import { Dimensions } from "react-native";

//end constect
let { width: WIDTH } = Dimensions.get("window");

let LEFT = 2;
let TOP = 12;

const MARGIN_PAGE = 54;

const SCREEN_DEFAULT_WIDTH = /*WIDTH - 54;/*/ 456;
//
let WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH;
export const coordinatePage = (page, mosshaf) => {
    // const getResSql_ =   getResSql(page);
    //console.log("res=>"+getResSql_[0])
    let currMosshaf = mosshaf;
    //defult HAFS

    if (
        currMosshaf === "hafsDorar" ||
        currMosshaf === "hafsShohbah" ||
        currMosshaf === "hafs" ||
        currMosshaf === "hafsMadina"
    ) {
        currMosshaf = "hafs";
        WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2; //+ 0.6 / MARGIN_PAGE_RENDER;// - 22;
        LEFT = -(MARGIN_PAGE / 2) + 16; // -22//+(MARGIN_PAGE * 0.6);
        TOP = -26; //-44;

        /* WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH+16// + MARGIN_PAGE;
            LEFT = (MARGIN_PAGE / 2)-16;
            TOP = -3;
            */
    }

    //warsh

    if (currMosshaf === "warsh") {
        WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2; //+ 0.6 / MARGIN_PAGE_RENDER;// - 22;
        LEFT = -(MARGIN_PAGE / 2) + 16; // -22//+(MARGIN_PAGE * 0.6);
        TOP = -26; //-44;
    }

    if (currMosshaf === "hafsAlsose") {
        //   currMosshaf = "hafs";
        WIDTH_SCREEN_RENDER = SCREEN_DEFAULT_WIDTH - MARGIN_PAGE / 2; //+ 0.6 / MARGIN_PAGE_RENDER;// - 22;
        LEFT = -(MARGIN_PAGE / 2) + 16; // -22//+(MARGIN_PAGE * 0.6);
        TOP = -26; //-44;
    }

    let prev_top = null,
        prev_left = null,
        width,
        betw,
        id,
        height = 10,
        percentMaxHeight = 0.5,
        percentMinHeight = 0.6,
        marginWidth = 40,
        totalWidth = 416,
        fasel_sura = 110,
        page_top = 37,
        page_sura_top = 80,
        count = 1,
        allPosition = [];
    //if (currMosshaf === "warsh")
    const coordinate = coordinateMuhammadi[page];
    for (const [sura, aya, left, top] of coordinate) {
        let wino = {
            aya,
            sura,
            page,
            id: `s${sura}a${aya}z`,
        };

        width = 0;

        id = `s${sura}a${aya}z`;
        if (count === 1) {
            prev_left = totalWidth;
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
                prev_left = totalWidth;
            }
        }
        betw = top - prev_top;
        if (betw > height * percentMaxHeight) {
            allPosition.push(
                hl_draw(
                    `${id}_1`,
                    prev_top,
                    marginWidth,
                    prev_left - marginWidth,
                    height,
                    wino //.id+"d_1"
                )
            );
            allPosition.push(
                hl_draw(
                    `${id}_2`,
                    top,
                    left,
                    totalWidth - left,
                    height,
                    wino //_.id+ "_2"
                )
            );
            allPosition.push(
                hl_draw(
                    `${id}_3`,
                    prev_top + height,
                    marginWidth,
                    totalWidth - marginWidth,
                    betw - height,
                    wino
                )
            );
        } else if (betw > height * percentMinHeight) {
            allPosition.push(
                hl_draw(
                    `${id}_1`,
                    prev_top,
                    marginWidth,
                    prev_left - marginWidth,
                    height,
                    wino //.id+"d_1"
                )
            );
            allPosition.push(
                hl_draw(
                    `${id}_2`,
                    top,
                    left,
                    totalWidth - left,
                    height,
                    wino //.id +"_2"
                )
            );
        } else {
            width = prev_left - left;
            allPosition.push(hl_draw(`${id}_1`, top, left, width, height, wino));
        }
        count++;
        prev_top = top;
        prev_left = left;
    }
    return allPosition;
    // wino.tafssir[page] = winotafssir
    //    );//forlodash
};
//

function hl_draw(id, top, left, width, height, wino) {
    //  "agr b_top =",b_top,"_______________________");
    //let b_top = 0;
    //let b_left = 0;
    //top = b_top + top;
    //left = b_left + left;
    //return { width, height, left, top, wino, id };
    width = (WIDTH / WIDTH_SCREEN_RENDER) * width;
    height = (WIDTH / WIDTH_SCREEN_RENDER) * height;
    left = (WIDTH / WIDTH_SCREEN_RENDER) * left + LEFT;
    top = (WIDTH / WIDTH_SCREEN_RENDER) * top + TOP;

    return { width, height, left, top, wino, id };

    ///creeat composite
}
//