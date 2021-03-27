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
import { searchAyatByText, allSuwar } from "../functions";
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import * as lang from "../../i18n";

import { ScreenAya } from "../component";

//import styles from "./styles";

class Search extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
    this.allSuwar = allSuwar(this.props.lang);
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
    if (text === "wino") alert(test); //remove
    if (this.state.searchText)
      if (this.state.searchText.length <= 2) {
        this.setState({
          searchError: true,
          searchText: this.lang["search_err_length"],
        });
      } else {
        const txt = this.state.searchText;
        const resault = searchAyatByText(txt);
        if (resault) this.setState({ resault });
        else this.setState({ resault: this.lang["search_nores"] });
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
  getNameBySura = (id) => this.allSuwar.find((dt) => dt.id === id).name;
  render() {
    const { backgroundColor } = this.props;
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
              value={this.state.searchText}
              onChangeText={(text) => this.setState({ searchText: text })}
              onSubmitEditing={() => this.search(this.state.searchText)}
              style={{ margin: 9, textAlign: "center" }}
            />
            <Button
              transparent
              onPress={() => this.search(this.state.searchText)}
            >
              <Thumbnail
                small
                square
                source={require("../../assets/search.png")}
              />
            </Button>
          </Item>
        </Header>

        <Content>
          {this.state.resault && (
            <List
              dataArray={this.state.resault}
              renderRow={(data) => (
                <ScreenAya
                  onpress={() => {
                    this.props.setExactAya(data);
                    this.goBack(true);
                  }}
                  aya={data.aya}
                  text={data.text}
                  sura={this.getNameBySura(data.sura)}
                  fontSize={this.props.fontSize}
                />
              )}
            />
          )}
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, lang, fontSize, theme }) => ({
  wino,
  lang,
  fontSize,
  theme,
});

const test = `
		  Dev:Ibrahim BIDI; \n
		  Email:Zizwar@gmail.com
		  `;
const mapDispatchToProps = {
  setExactAya,
};
export default connect(mapStateToProps, mapDispatchToProps)(Search);
