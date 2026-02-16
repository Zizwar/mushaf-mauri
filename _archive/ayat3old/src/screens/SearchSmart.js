import React, { Component } from "react";
import {
  Container,
  Header,
  Title,
  Button,
  Icon,
  Tabs,
  Tab,
  Text,
  Right,
  Left,
  Body,
  TabHeading
} from "native-base";
import Search from "./Search";
import SearchSura from "./SearchSura";
import SearchPage from "./SearchPage";
import * as lang from "../../i18n";
//
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
//
class SearchSmart extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
  }
  render() {
    return (
      <Container>
        <Header hasTabs>
          <Left>
            <Button transparent onPress={() => this.props.navigation.goBack()}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body style={{ flex: 3 }}>
            <Title> {this.lang["search"]}</Title>
          </Body>
          <Right />
        </Header>

        <Tabs style={{ elevation: 3 }}>
          <Tab
            heading={
              <TabHeading>
                <Icon name="ios-search" />
                <Text>{this.lang["search"]}</Text>
              </TabHeading>
            }
          >
            <Search
              goBack={this.props.navigation.goBack}
            //  handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

          <Tab
            heading={
              <TabHeading>
                <Icon name="ios-copy" />
                <Text>{this.lang["sura"]}</Text>
              </TabHeading>
            }
          >
            <SearchSura
              goBack={this.props.navigation.goBack}
             // handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

          <Tab
            heading={
              <TabHeading>
                <Icon name="ios-book" />
                <Text>{this.lang["page"]}</Text>
              </TabHeading>
            }
          >
            <SearchPage
              go={this.lang["go"]}
pageNumber={this.lang["enterPageNum"]}
              goBack={this.props.navigation.goBack}
              //handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

      { /*   <Tab
            heading={
              <TabHeading>
                <Icon name="md-book" />
                <Text>{this.lang["juz"] + "-" + this.lang["hizb"]}</Text>
              </TabHeading>
            }
          >
            <Search />
          </Tab>*/}
        </Tabs>
      </Container>
    );
  }
}
const mapStateToProps = ({ wino, lang }) => ({
  wino,
  lang
});

const mapDispatchToProps = {
  setExactAya
};
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SearchSmart);
