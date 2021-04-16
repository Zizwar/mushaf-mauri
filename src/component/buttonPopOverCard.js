import React from "react";

import {
  Content,
  Col,
  Text,
  Button,
  Right,
  Left,
  Body,
  Thumbnail,
  Grid,
  Row,
} from "native-base";
import { Clipboard, Share } from "react-native";
import { Icon } from "./componentIno";
//export const Icong = ({name }) => (<Thumbnail square source={{uri: '../../assetsme+'.png'}} />);

const writeToClipboard = async (text, toasti, close, done) => {
  await Clipboard.setString(text);
  close("close");
  toasti(done);
};
//
const onShare = async (wino, toasti, close, lang) => {
  const { text, aya, sura } = wino;
  try {
    const result = await Share.share({
      message: `${text} | ${lang["sura_s"]}:${sura} ${lang["aya"]}:${aya} | \n https://mushaf.ma/d/a${aya}s${sura}r1z`,
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
        // toasti('shared with activity type of'+ result.activityType)
      } else {
        // shared
        close("close");
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error) {
    toasti(error.message);
  }
};
//
export const ButtonPopOverCard = ({
  play,
  close,
  lang,
  toasti,
  note,
  tarajem,
  navigate,
  addBookmarks,
  stop,
  color,
  wino,
}) => (
  <Content>
    <Grid style={styles.container}>
      <Row style={styles.row}>
        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) => {
              close();
              setTimeout((_) => play(wino, true), 100);
            }}
            style={styles.iconButton}
          >
            <Icon active name="md-play" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["play"]}
          </Text>
        </Col>
  <Col style={styles.col}>
              <Button
            transparent
            onPress={_ =>{close();navigate("Reciting"); }}
            style={{ marginBottom: 1 }}
          >
           <Icon name="md-document" style={{ color }} />
          </Button>
              <Text numberOfLines={1} style={styles.iconText}>
             {lang["bu_telawa"]}
          </Text>
              </Col>
        <Col style={styles.col}>
          <Button transparent onPress={addBookmarks} style={styles.iconButton}>
            <Icon name="md-bookmark" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["fav"]}
          </Text>
        </Col>

        <Col style={styles.col}>
          <Button transparent onPress={note} style={styles.iconButton}>
            <Icon name="md-list" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["note"]}
          </Text>
        </Col>
      </Row>
      <Row>
        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) => {
              close();
              setTimeout((_) => tarajem("open"), 10);
            }}
            style={styles.iconButton}
          >
            <Icon active name="md-book" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["download_ttarajem_tarajem"]}
          </Text>
        </Col>

        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) => onShare(wino, toasti, close, lang)}
            style={styles.iconButton}
          >
            <Icon active name="md-share" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["share"]}
          </Text>
        </Col>
        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) =>
              writeToClipboard(wino.text, toasti, close, lang["copy_done"])
            }
            style={styles.iconButton}
          >
            <Icon active name="md-copy" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["copy"]}
          </Text>
        </Col>

       <Col style={styles.col}>
          <Button
            transparent
        
            style={styles.iconButton}
          >
            <Icon active name="md-recorder" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["record"]}
          </Text>
        </Col>
</Row>
    </Grid>
  </Content>
);

const styles = {
  container: {
    flex: 1,
    width: null,
    height: null,
    backgroundColor: "#FFF",
  },
  iconContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingLeft: 1,
  },
  iconText: {
    fontSize: 11,
  },
  icon: {
    width: 45,
    height: 45,
    justifyContent: "center",
  },
  col: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    margin: 10,
    paddingHorizontal: 0,
    padding: 2,
  },
  row: {
    paddingBottom: 5,
  },
  iconButton: {
    width: "100%",

    justifyContent: "center",
  },
};
