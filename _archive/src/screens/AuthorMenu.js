import React, { Component } from "react";
import { List, View } from "native-base";

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
    //this.props.back();
    //  if (this.props.togl) this.props.togl("close");
    //else
    // this.props.navigation.goBack();
    //  if (this.props.handleMenu) this.props.handleMenu("open");
    //  this.props.navigation.toggleDrawer();
  };
  onPressAuthor = (id) => {
    const { setAuthorMoqri, setPlayer, moqri } = this.props;
    if (id === moqri) return;
    setAuthorMoqri(id);
    setPlayer("play");
    // close();
    this.goBack();
  };

  render() {
    const {
      theme: { backgroundColor, color },
      lang,
      back,
    } = this.props;
    return (
      <View>
        {back}
        <List
          dataArray={this.listAutor}
          renderRow={(data, _row, index) => (
            <Itemino
              onPress={() => {
                this.onPressAuthor(data.id);
                this.goBack();
                //   close();
              }}
              lang={lang}
              backgroundColor={backgroundColor}
              color={color}
              text={data.voice}
              index={index + 1}
              noborder={true}
              height={50}
              key={index}
            />
          )}
        />
      </View>
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
