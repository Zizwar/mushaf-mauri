import React, { Component } from "react";
import { List } from "native-base";

import { Icon } from "../component";
import { listVoiceMoqri } from "../data";
import { connect } from "react-redux";
import { setAuthorMoqri, setPlayer } from "../../reducer";
import * as lang from "../../i18n";
import { Itemino } from "../component";
class AuthorMenu extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
  }
  UNSAFE_componentWillMount() {
    this.listAutor = listVoiceMoqri(this.lang);
  }
  goBack = () => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  onPressAuthor = (id) => {
    const { setAuthorMoqri, setPlayer, moqri, close } = this.props;
    if (id === moqri) return;
    setAuthorMoqri(id);
    setPlayer("play");
    close();
  };

  render() {
    const {
      theme: { backgroundColor, color },
      lang,
      close,
    } = this.props;
    return (
      <List
        dataArray={this.listAutor}
        renderRow={(data, row, index) => (
          <Itemino
            onPress={() => {
              this.onPressAuthor(data.id);
              close();
            }}
            lang={lang}
            backgroundColor={backgroundColor}
            color={color}
            text={data.voice}
            index={index + 1}
            noborder={true}
            height={50}
          />
        )}
      />
    );
  }
}
const mapStateToProps = ({ wino, lang, moqri, theme }) => ({
  wino,
  lang,
  moqri,
  theme,
});

const mapDispatchToProps = {
  setPlayer,
  setAuthorMoqri,
};
export default connect(mapStateToProps, mapDispatchToProps)(AuthorMenu);
