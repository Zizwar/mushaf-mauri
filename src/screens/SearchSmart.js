import React, { Component } from "react";
import { Container, Tabs, Tab, Text, TabHeading } from "native-base";

import { Icon } from "../component";
import Search from "./Search";
import SearchSura from "./Suras";
import SearchPage from "./SearchPage";
import * as lang from "../../i18n";
//
import { connect } from "react-redux";
import { setExactAya } from "../../reducer";
import { Headerino } from "../component";
//
class SearchSmart extends Component {
  constructor(props) {
    super(props);
    this.lang = lang[this.props.lang];
  }
  // componentWillMount(){}
  render() {
    const {
      theme: { backgroundColor, color },
      navigation,
      lang,
    } = this.props;
    return (
      <Container>
        <Headerino
          onPress={_=>navigation.goBack()}
          lang={lang}
          text={this.lang["search"]}
          color={color}
          backgroundColor={backgroundColor}
        />
        <Tabs
          initialPage={2}
          page={2}
          style={{ elevation: 3, backgroundColor: color }}
        >
          <Tab
            style={{ backgroundColor: color }}
            heading={
              <TabHeading style={{ backgroundColor }}>
                <Icon style={{ color }} name="ios-search" />
                <Text style={{ color }}>{this.lang["search"]}</Text>
              </TabHeading>
            }
          >
            <Search
              goBack={navigation.goBack}
              //  handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

          <Tab
            heading={
              <TabHeading style={{ backgroundColor }}>
                <Icon name="ios-copy" style={{ color }} />
                <Text style={{ color }}>{this.lang["sura"]}</Text>
              </TabHeading>
            }
          >
            <SearchSura
              goBack={navigation.goBack}
              // handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

          <Tab
            heading={
              <TabHeading style={{ backgroundColor }}>
                <Icon name="ios-book" style={{ color }} />
                <Text style={{ color }}>{this.lang["page"]}</Text>
              </TabHeading>
            }
          >
            <SearchPage
              go={this.lang["go"]}
              pageNumber={this.lang["enterPageNum"]}
              page_num={this.lang["page_num638"]}
              goBack={navigation.goBack}
              //handleMenu={this.props.navigation.state.params.handleMenu}
            />
          </Tab>

          {/*   <Tab
            heading={
              <TabHeading style={{ backgroundColor }}>
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
const mapStateToProps = ({ wino, lang, theme }) => ({
  theme,
  wino,
  lang,
});

const mapDispatchToProps = {
  setExactAya,
};
export default connect(mapStateToProps, mapDispatchToProps)(SearchSmart);
