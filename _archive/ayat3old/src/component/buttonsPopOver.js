import React from "react";

import {
  Content,
  Item,
  Col,
  Grid,
  Icon,
  Text,
  Row,
  Button,
  ListItem,
  Body,
  Card,
  CardItem,
  View,
  Container,
  Thumbnail
} from "native-base";

import { Clipboard, Share, Image } from "react-native";
//export const Icong = ({name }) => (<Thumbnail square small small source={{uri: '../../assets/'+name+'.png'}} />);

//export const Icong= ({name,size=56 }) =>IcongTmp({name:'../../assets/'+name+'.png',size});

const writeToClipboard = async (text, toasti, close, done) => {
  await Clipboard.setString(text);
  close();
  toasti(done);
};
//
const onShare = async (wino, toasti, close, lang) => {
  const { text, aya, sura } = wino;
  try {
    const result = await Share.share({
      message: `${text} | ${lang["sura_s"]}:${sura} ${lang["aya"]}:${aya} | \n https://ayat.app/a${aya}s${sura}r1z`
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
        // toasti('shared with activity type of'+ result.activityType)
      } else {
        // shared
        close();
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    toasti(error.message);
  }
};
//
export const ButtonPopOver = ({
  color,

  close,
  play,
  lang,
  toasti,
  note,
  tarajem,
  stop,
  addBookmarks,
  wino
}) => (
  <Grid>
    <Row transparent style={styles.row}>
      <Col transparent style={styles.col}>
        <Button
          transparent
          onPress={_ => {
            close();
            setTimeout(_ => play(wino), 100);
          }}
        >
          <Icon  name="play" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button transparent onPress={note}>
          <Icon size={20} name="bookmark" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button
          transparent
          onPress={_ => {
            close();
            setTimeout(_ => tarajem("open"), 10);
          }}
        >
          <Icon  name="book" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button transparent onPress={_ => onShare(wino, toasti, close, lang)}>
          <Icon  name="share" style={{ color }} />
        </Button>
      </Col>
      <Col style={styles.col}>
        <Button
          transparent
          onPress={_ =>
            writeToClipboard(wino.text, toasti, close, lang["copy_done"])
          }
        >
          <Icon  name="copy" style={{ color }} />
        </Button>
      </Col>
    </Row>
  </Grid>
);

const styles = {
  container: {
    flex: 1,
    width: null,
    height: null
    // backgroundColor: "#FFF"
  },

  iconText: {
    fontSize: 12
  },
  col: {
    alignItems: "center"
    //paddingHorizontal: -1,
    // padding: 2
  },
  row: {
    //  paddingBottom: 1
  }
};
