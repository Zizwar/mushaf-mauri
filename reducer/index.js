export const PICKER_IS_VISIBLE = "wino/picker/ISVISIBLE";
export const SET_EXACT_AYA = "wino/set/EXACT_AYA";
export const SET_TEMP = "wino/set/TEMP";

export const NOT_RENDER_SET_EXACT_AYA = "wino/not/RENDER_SET_EXACT_AYA";
export const DESACTIVE_RE_RENDER = "wino/acttive/RE_RENDER";
export const ACTIVE_RE_RENDER = "wino/desacttive/RE_RENDER";
export const SET_AUTHOR = "wino/set/AUTHOR";
export const SET_AUTHOR_MOQRI = "wino/set/AUTHOR_MOQRI";
export const ADD_BOOKMARKS = "wino/add/BOOKMARKS";
export const SET_BOOKMARKS = "wino/set/BOOKMARKS";
export const SET_KHITMA = "wino/set/KHITMA";
export const SET_PLAYER_TRUE = "wino/set/PLAYER_TRUE";
export const SET_PLAYER_FALSE = "wino/set/PLAYER_FALSE";
export const SET_TEKRAR = "wino/set/TEKRAR";
export const SET_REPEAT = "wino/set/SET_REPEAT";
export const SET_ALARM = "wino/set/SET_ALARM";
export const SET_LANG = "wino/set/SET_LANG";
export const SET_AWK = "wino/set/SET_AWK";
export const SET_PRORATE = "wino/set/SET_PRORATE";

export const SET_THEME = "wino/set/SET_THEME";

export const SET_DOWNLOAD_WARSH = "wino/set/SET_DOWNLOAD_WARSH";

export const SET_MENU = "wino/set/SET_MENU";
export const SET_OPTIONS = "wino/set/SET_OPTIONS";
export const SET_QUIRA = "wino/set/SET_QUIRA";
export const SET_LIST_LOCAL_DB = "wino/set/SET_LIST_LOCAL_DB";
export const SET_FULL_DB = "wino/set/SET_FULL_DB";
export const SET_RECORD = "wino/set/SET_RECORD";
export const SET_FIRST = "wino/set/SET_FIRST";
export const SET_FONT_SIZE = "wino/set/SET_FONT_SIZE";
export const SET_TARJAMA = "wino/set/SET_TARJAMA";
export const SET_TARAJEM_DB = "wino/set/SET_TARAJEM_DB";

const initialState = {
  tmp: null,
  theme: { backgroundColor: "#fff", color: "#000" },
  tarajemDB: [],
  records: [],
  first: true,
  fontSize: 14,
  isPickerVisible: false,
  wino: { aya: 1, sura: 1, page: 1 },
  rerender: false,
  author: "sa3dy",
  bookmarks: [],
  khitma: [],
  moqri: "Hudhaify_64kbps",
  player: false,
  isRepeat: false,
  tikrar: [],
  alarm: [],
  listDB: [],
  lang: "ar",
  quira: "warsh",
  prorate: false,
  awk: true,
  menu: 1,
  downloadsWarsh: 0,

  //downloads:{tilawat:[],safahat:[],tafasir:[]},
  options: [],
  modeKids: false,
  tarjama: "ar_muyassar",
};
export default function reducer(state = initialState, action) {
  switch (action.type) {
    case PICKER_IS_VISIBLE:
      return { ...state, isPickerVisible: action.payload.data };

    case SET_EXACT_AYA:
      return {
        ...state,
        wino: action.payload.data,
        rerender: true,
      };

    case SET_TEMP:
      return {
        ...state,
        tmp: action.payload.data,
        rerender: true,
      };
    case SET_TARAJEM_DB:
      return {
        ...state,
        tarajemDB: action.payload.data,
      };
    case SET_TARJAMA:
      return {
        ...state,
        tarjama: action.payload.data,
      };
    case ADD_BOOKMARKS:
      return {
        ...state,
        bookmarks: [...state.bookmarks, action.payload.data],
      };

    case SET_BOOKMARKS:
      return {
        ...state,
        bookmarks: action.payload.data,
      };
    case SET_KHITMA:
      return {
        ...state,
        khitma: action.payload.data,
      };

    case NOT_RENDER_SET_EXACT_AYA:
      return {
        ...state,
        wino: action.payload.data,
        rerender: false,
      };

    case SET_PLAYER_TRUE:
      return {
        ...state,
        player: action.payload.data,
        rerender: true,
      };
    case SET_PLAYER_FALSE:
      return {
        ...state,
        player: action.payload.data,
        rerender: false,
      };
    case ACTIVE_RE_RENDER:
      return {
        ...state,
        rerender: action.payload.data,
      };
    case DESACTIVE_RE_RENDER:
      return {
        ...state,
        rerender: false,
      };
    case SET_AUTHOR:
      return {
        ...state,
        author: action.payload.data,
      };
    case SET_AUTHOR_MOQRI:
      return {
        ...state,
        moqri: action.payload.data,
      };

    case SET_TEKRAR:
      return {
        ...state,
        tekrar: action.payload.data,
      };

    case SET_REPEAT:
      return {
        ...state,
        isRepeat: action.payload.data,
      };
    case SET_ALARM:
      return {
        ...state,
        alarm: action.payload.data,
      };
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.data,
      };
    case SET_AWK:
      return {
        ...state,
        awk: action.payload.data,
      };

    case SET_DOWNLOAD_WARSH:
      return {
        ...state,
        downloadsWarsh: action.payload.data,
      };
    case SET_OPTIONS:
      return {
        ...state,
        options: action.payload.data,
      };
    case SET_MENU:
      return {
        ...state,
        menu: action.payload.data,
      };
    case SET_LIST_LOCAL_DB:
      return {
        ...state,
        listDB: action.payload.data,
      };
    case SET_QUIRA:
      return {
        ...state,
        quira: action.payload.data,
      };
    case SET_PRORATE:
      return {
        ...state,
        prorate: action.payload.data,
      };

    case SET_THEME:
      return {
        ...state,
        theme: action.payload.data,
      };
    case SET_RECORD:
      return {
        ...state,
        records: action.payload.data,
      };
    case SET_FIRST:
      return {
        ...state,
        first: action.payload.data,
      };
    case SET_FONT_SIZE:
      return {
        ...state,
        fontSize: action.payload.data,
      };
    case SET_FULL_DB:
      return action.payload.data;

    //////end
    default:
      return state;
  }
}

//playfunction
export function setPlayer(arg) {
  if (arg)
    return {
      type: SET_PLAYER_TRUE,
      payload: {
        data: arg,
      },
    };
  else
    return {
      type: SET_PLAYER_FALSE,
      payload: {
        data: arg,
      },
    };
}

export function reRender(arg) {
  if (arg)
    return {
      type: ACTIVE_RE_RENDER,
      payload: {
        data: arg,
      },
    };
  else
    return {
      type: DESACTIVE_RE_RENDER,
      payload: {
        data: arg,
      },
    };
}
export function setExactAya(arg, r) {
  if (r)
    return {
      type: NOT_RENDER_SET_EXACT_AYA,
      payload: {
        data: arg,
      },
    };
  return {
    type: SET_EXACT_AYA,
    payload: {
      data: arg,
    },
  };
}
export function setTmp(arg) {
  return {
    type: SET_TEMP,
    payload: {
      data: arg,
    },
  };
}

export function togglePicker(arg) {
  return {
    type: PICKER_IS_VISIBLE,
    payload: {
      data: arg,
    },
  };
}
export function setTarjama(arg) {
  return {
    type: SET_TARJAMA,
    payload: {
      data: arg,
    },
  };
}
export function setTarajemDB(arg) {
  return {
    type: SET_TARAJEM_DB,
    payload: {
      data: arg,
    },
  };
}
export function setBookmarks(arg) {
  return {
    type: SET_BOOKMARKS,
    payload: {
      data: arg,
    },
  };
}
export function addBookmarks(arg) {
  return {
    type: ADD_BOOKMARKS,
    payload: {
      data: arg,
    },
  };
}
export function setKhitma(arg) {
  return {
    type: SET_KHITMA,
    payload: {
      data: arg,
    },
  };
}
export function setAuthorMoqri(arg) {
  return {
    type: SET_AUTHOR_MOQRI,
    payload: {
      data: arg,
    },
  };
}
export function setAuthor(arg) {
  return {
    type: SET_AUTHOR,
    payload: {
      data: arg,
    },
  };
}
export function setRepeat(arg) {
  return {
    type: SET_REPEAT,
    payload: {
      data: arg,
    },
  };
}
export function setTekrar(arg) {
  return {
    type: SET_TEKRAR,
    payload: {
      data: arg,
    },
  };
}
export function setAlarm(arg) {
  return {
    type: SET_ALARM,
    payload: {
      data: arg,
    },
  };
}
export function setLang(arg) {
  return {
    type: SET_LANG,
    payload: {
      data: arg,
    },
  };
}
export function setAwk(arg) {
  return {
    type: SET_AWK,
    payload: {
      data: arg,
    },
  };
}
export function setMenu(arg) {
  return {
    type: SET_MENU,
    payload: {
      data: arg,
    },
  };
}
export function setDownloads(arg, r) {
  switch (r) {
    case "warsh":
      return {
        type: SET_DOWNLOAD_WARSH,
        payload: {
          data: arg,
        },
      };
  }
}
export function setOptions(arg) {
  return {
    type: SET_OPTIONS,
    payload: {
      data: arg,
    },
  };
}
export function setListLocalDB(arg) {
  return {
    type: SET_LIST_LOCAL_DB,
    payload: {
      data: arg,
    },
  };
}
export function setProrate(arg) {
  return {
    type: SET_PRORATE,
    payload: {
      data: arg,
    },
  };
}
export function setTheme(arg) {
  return {
    type: SET_THEME,
    payload: {
      data: arg,
    },
  };
}
export function setRecord(arg) {
  return {
    type: SET_RECORD,
    payload: {
      data: arg,
    },
  };
}
export function setQuira(arg) {
  return {
    type: SET_QUIRA,
    payload: {
      data: arg,
    },
  };
}
export function setFullReduces(arg) {
  return {
    type: SET_FULL_DB,
    payload: {
      data: arg,
    },
  };
}
export function setFontSize(arg) {
  return {
    type: SET_FONT_SIZE,
    payload: {
      data: arg,
    },
  };
}
export function setFirst(arg) {
  return {
    type: SET_FIRST,
    payload: {
      data: arg,
    },
  };
}
