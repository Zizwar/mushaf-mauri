import React, { Component } from "react";
import { Content, List } from "native-base";
import { connect } from "react-redux";

import * as lang from "../../i18n";

import { Itemino } from "../component";
import AuthorMenu from "./AuthorMenu";
import { setLang, reRender, setQuira ,setTheme} from "../../reducer";
class Menu extends Component {
  constructor(props) {
    super(props);

    this.lang = lang[this.props.lang];
    this.menus = [
      {
        name: this.lang["tafsir"],
        route: "Tafsir",
        icon: "document",
        bg: "#477EEA",
      },
      {
        name: this.lang["favs"],
        route: "BookMarks",
        icon: "bookmark",
        bg: "#477EEA",
      },

      {
        name: this.lang["bu_download_recites"],
        route: "author",
        icon: "headset",
        bg: "#477EEA",
      },
      {
        name: this.lang["mosshaf_type"],
        route: "mushaf",
        icon: "book",
      },
      {
        name: this.lang["color"],
        route: "color",
        icon: "color-fill",
        bg: "#477EEA",
      },
      {
        name: this.lang["choose_lang"],
        route: "choose_lang",
        icon: "flag",
        bg: "#477EEA",
      },
      {
        name: this.lang["bu_download_cnt"],
        route: "Store",
        icon: "cloud-download",
        bg: "#477EEA",
      },
    ];
    this.dataMushaf = [
      "warsh",
    ];

    this.state = {
      active: "menu",
    };
  }
  author = () => this.setState({ active: "author" });
  shooselang = () => this.setState({ active: "lang" });
  changeMushaf = () => this.setState({ active: "mushaf" });
  switchLangTo = (lang) => {
    const { setLang, reRender, close } = this.props;
    setLang(lang);
    reRender("switchLang");
    close();
  };
  render() {
    const {
      navigation,
      setQuira,
      color,
      changeColor,
      close,
      lang,
      setTheme,
    } = this.props;
    const { active } = this.state;

    const ListMenu = (
      <List
        transparent
        dataArray={this.menus}
        renderRow={(data,i,index) => (
          <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
            <Itemino
              onPress={() => {
                switch (data.route) {
                  case "color":
                    return changeColor();
                  case "mushaf":
                    return this.changeMushaf();
                  case "author":
                    return this.author();
                  case "choose_lang":
                    return this.shooselang();
                  default: {
                    navigation.navigate(data.route);
                    close();
                  }
                }
              }}
              lang={lang}
              color={color}
              text={data.name}
              icon={data.icon}
              noborder={true}
              key={`menu_${index}`}
            />
          </Content>
        )}
      />
    );

    const ListMushaf = (
      <List
        transparent
        dataArray={this.dataMushaf}
        renderRow={(data, i, index) => (
          <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
            <Itemino
              onPress={() => {
                setTheme({ backgroundColor: "#fff", color: "#000" });
                setQuira(data);
                             
                close();
              }}
              lang={lang}
              color={color}
              text={this.lang[`mosshaf_${data}`]}
              index={index + 1}
               key={`mus_${index}`}
              noborder={true}
            />
          </Content>
        )}
      />
    );
    const ListLang = (
      <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
        <Itemino
          onPress={() => this.switchLangTo("ar")}
          lang={lang}
          color={color}
          text={this.lang["l_arabic"]}
          index={1}
          key={`lng_${1}`}
          noborder={true}
        />
        <Itemino
          onPress={() => this.switchLangTo("en")}
          lang={lang}
          color={color}
          text={this.lang["l_english"]}
          index={2}
          key={`lng_${2}`}
          noborder={true}
        />
      </Content>
    );

    switch (active) {
      case "menu":
        return ListMenu;
      case "lang":
        return ListLang;
      case "mushaf":
        return ListMushaf;

      case "author":
        return (
          <Content style={{ flex: 1, backgroundColor: "#ffffff00" }}>
            <AuthorMenu close={close} />
          </Content>
        );

      default:
        return ListMenu;
    }
  }
}

const mapStateToProps = ({ lang }) => ({ lang });

const mapDispatchToProps = { reRender, setLang, setQuira,setTheme };
export default connect(mapStateToProps, mapDispatchToProps)(Menu);
