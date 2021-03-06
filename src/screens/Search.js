import React, { Component } from "react";
import {
  Item,
  Input,
  Container,
  Header,
  Content,
  Button,
  List,
  Thumbnail,
  Left,
} from "native-base";

import { Icon } from "../component";
//tajwed
import { searchAyatByText, getNameBySura } from "../functions";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import * as lang from "../../i18n";

import { ScreenAya } from "../component";

//import styles from "./styles";

class Search extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.state = {
      searchText: this.props.searchText,
      resault: null,
      items: [],
    };
  }

  //componentWillMount() {}
  componentDidMount() {
    if (this.state.searchText !== "") this.search();
  }
  search = (text) => {
    const { searchText } = this.state;
    if (text === "wino") alert(test); //remove
    if (searchText)
      if (searchText.length <= 2) alert(this.lang["search_err_length"]);
      else {
        const resault =
          searchAyatByText(searchText) || this.lang["search_nores"];
        this.setState({ resault });
      }
  };
  goBack = () => {
    const { togl, goBack, navigation } = this.props;
    if (goBack) {
      goBack();
      return;
    }
    if (togl) togl("close");
    else navigation.goBack();
  };

  render() {
    const { backgroundColor, fontSize, setExactAya, color,lang:_lang } = this.props;
    const { searchText, resault } = this.state;
    return (
      <Container style={{ backgroundColor }}>
        <Header searchBar rounded style={{ backgroundColor }}>
          {this.props.togl && (
            <Left>
              <Button transparent onPress={this.goBack}>
                <Icon name="ios-arrow-down" />
              </Button>
            </Left>
          )}

          <Item style={{ margin: 15, backgroundColor }}>
            <Input
              placeholder={this.lang["search"]}
              value={searchText}
              onChangeText={(text) => this.setState({ searchText: text })}
              onSubmitEditing={() => this.search(searchText)}
              style={{ margin: 9, textAlign: "center" }}
            />
            <Button transparent onPress={() => this.search(searchText)}>
              <Icon style={{ color }} name="ios-search" />
            </Button>
          </Item>
        </Header>

        <Content>
          {resault && (
            <List
              dataArray={resault}
              renderRow={(data) => (
                <ScreenAya
                  onpress={() => {
                  //  console.log({data})
                    setExactAya(data);
                    this.goBack(true);
                  }}
                  aya={data.aya}
                  text={data.text}
                //  sura={data.sura}
                  sura={getNameBySura({ sura: data.sura, lang: _lang })}
                  fontSize={fontSize}
                  backgroundColor={backgroundColor}
                  color={color}
                  //page={data.page}
                />
              )}
            />
          )}
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({
  wino,
  lang,
  fontSize,
  theme: { backgroundColor, color },
}) => ({
  wino,
  lang,
  fontSize,
  backgroundColor,
  color,
});

const test = `
		  Dev:Ibrahim BIDI; \n
		  Email:Zizwar@gmail.com
		  `;
const mapDispatchToProps = {
  setExactAya,
};
export default connect(mapStateToProps, mapDispatchToProps)(Search);
