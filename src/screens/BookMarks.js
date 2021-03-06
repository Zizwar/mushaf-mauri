import React, { Component } from "react";
import { Alert } from "react-native";
import {
  Container,
  Content,
  Button,
  List,
  ListItem,
  Text,
  Left,
  Right,
  Body,
  Segment,
} from "native-base";
//
import { connect } from "react-redux";
import { isRTL } from "expo-localization";

import { getNameBySura, pageToSuraAya, getJuzBySuraAya } from "../functions";

import { Icon } from "../component";
import { setExactAya, setBookmarks, reRender } from "../../reducer";
import * as lang from "../../i18n";
//
import { Headerino } from "../component";

class BookMarks extends Component {
  constructor(props) {
    super(props);
    //this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
    this.lang = lang[this.props.lang];
    this.state = {
      basic: true,
      listViewData: [],
      imgCapture: null,
      isActive: true,
    };
  }
  //
  captureThis = () => {
    this.refs.viewShot.capture().then((uri) => {
    //  console.log("do something with ", uri);
    });
  };
  //
  UNSAFE_componentWillMount() {
    this.setState({ listViewData: this.props.bookmarks });
  }
  deleteRow(secId, rowId, rowMap) {
    const { bookmarks, setBookmarks } = this.props;

console.log({secId, rowId, rowMap})
    // newData.splice(rowId, 1);
    const newData = [...bookmarks];
    newData.splice(rowId, 1);
    this.setState({ listViewData:newData });
    setBookmarks(newData);
  }

  delId = (id, { sura, aya }) => {
    const { bookmarks=[], setBookmarks, reRender } = this.props;

    // const newData = [...bookmarks];
   // console.log({sura,aya})
    const listViewData = bookmarks.filter(
      ({ id = [] }) => id.sura === sura && id.aya === aya
    );
   // console.log({listViewData})
    // newData.splice(rowId, 1);

   // this.setState({ listViewData });
    setBookmarks(listViewData);
    //newData.splice(id, 1);
    //setBookmarks(newData);
    reRender("bookmarks");
  };
  confirm = (cb, { sura, aya }) => {
    Alert.alert(
      this.lang["remove"],
      `${this.lang["sura"]}:${sura},${this.lang["aya"]}:${aya}`,
      [
        {
          text: this.lang["cancel"],
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: this.lang["alert_ok"],
          onPress: cb,
        },
      ],
      { cancelable: false }
    );
  };
  goBack = () => this.props.navigation.goBack();

  togl = (isActive) => this.setState({ isActive });
  renderItem = (data,rowId) => {
    const {
      setExactAya,
      lang,
      theme: { color },
    } = this.props;
    return (
      <ListItem
        onPress={() => {
          this.goBack();
          if (data.page) setExactAya(pageToSuraAya(data.page));
          else setExactAya(data.id);
        }}
        avatar
      >
        <Left>
          <Button transparent>
            <Icon
              style={{ color, fontSize: 22 }}
              name={data.page ? "md-star" : "md-bookmarks"}
            />
          </Button>
        </Left>
        <Body>
          <Text
            style={{
              color,
              textAlign: isRTL && lang !== "ar" ? "right" : null,
              fontSize: 15,
            }}
          >
            {`${this.lang["sura_s"]} ${getNameBySura({
              sura: data.id.sura,
              lang,
            })} ${this.lang["juz"]} ${getJuzBySuraAya({
              sura: data.id.sura,
              aya: data.id.sura,
            })} ${data.page ? `${this.lang["page"]} ${data.page}` : ""}`}
          </Text>
          {data.note && (
            <Text style={{ color, textAlign: "center" }} note>
              {data.note}
            </Text>
          )}
          <Text
            style={{ textAlign: isRTL && lang !== "ar" ? "right" : null }}
            note
          >
            {data.time}
          </Text>
        </Body>
        <Right>
          <Button
          
            transparent
            onPress={() => this.confirm(() => 
             // this.delId(id, data.id), data.id);
              this.deleteRow(rowId), data.id)
            }
          >
            <Icon style={{ color, fontSize: 20 }} name="md-close" />
          </Button>
        </Right>
      </ListItem>
    );
  };

  render() {
    const { isActive } = this.state;

    const {
      bookmarks,
      theme: { backgroundColor, color },
      lang,
    } = this.props;

    return (
      <Container>
        <Headerino
          onPress={() => this.goBack()}
          lang={lang}
          text={this.lang["favs"]}
          color={color}
          backgroundColor={backgroundColor}
        />

        <Segment style={{ backgroundColor }}>
          <Button
            onPress={() => this.togl(true)}
            first
            style={isActive ? { backgroundColor: color } : { backgroundColor }}
          >
            <Text style={!isActive ? { color } : { color: backgroundColor }}>
              {this.lang["fav"]}
            </Text>
          </Button>
          <Button
            onPress={() => this.togl(false)}
            last
            style={!isActive ? { backgroundColor: color } : { backgroundColor }}
          >
            <Text style={isActive ? { color } : { color: backgroundColor }}>
              {this.lang["note"]}
            </Text>
          </Button>
        </Segment>

        <Content style={{ backgroundColor }}>
          <List
            dataArray={bookmarks}
            renderRow={(data, secId, rowId, rowMap) => {
            //  console.log("====",{ secId, rowId, rowMap });
              if (data.page && isActive) return this.renderItem(data,rowId);
              else if (!isActive && !data.page) return this.renderItem(data,rowId);
            }}
            renderRightHiddenRow={(data, secId, rowId, rowMap) => (
              <Button
                full
                danger
                onPress={(_) => this.deleteRow(secId, rowId, rowMap)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon active name="trash" />
              </Button>
            )}
            renderLeftHiddenRow={(data, secId, rowId, rowMap) => (
              <Button
                full
                danger
                onPress={(_) => this.deleteRow(secId, rowId, rowMap)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon active name="trash" />
              </Button>
            )}
            leftOpenValue={75}
            rightOpenValue={-75}
          />
        </Content>
      </Container>
    );
  }
}
const mapStateToProps = ({ bookmarks, wino, lang, theme }) => ({
  theme,
  lang,
  bookmarks,
  wino,
});

const mapDispatchToProps = {
  setExactAya,
  setBookmarks,
  reRender,
};
export default connect(mapStateToProps, mapDispatchToProps)(BookMarks);
