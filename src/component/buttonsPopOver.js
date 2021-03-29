import React from "react";

import { Col, Grid, Row, Text, Button, Content } from "native-base";

import { Clipboard, Share } from "react-native";
import { Icon } from "./componentIno";
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
      message: `${text} | ${lang["sura_s"]}:${sura} ${lang["aya"]}:${aya}  \n https://meshaf.me/d/a${aya}s${sura}r1z`,
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
  close,
  play,
  lang,
  toasti,
  note,
  tarajem,
  stop,
  color,
  addBookmarks,
  wino,
}) => (
  <Content>
    <Grid>
      <Row style={styles.row}>
        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) => {
              close();
              setTimeout((_) => play(wino,true), 100);
            }}
            style={{ marginBottom: 1 }}
          >
            <Icon active name="md-play" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["play"]}
          </Text>
        </Col>
        <Col style={styles.col}>
          <Button transparent onPress={note} style={{ marginBottom: 1 }}>
            <Icon name="md-list" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["note"]}
          </Text>
        </Col>

        <Col style={styles.col}>
          <Button
            transparent
            onPress={addBookmarks}
            style={{ marginBottom: 1 }}
          >
            <Icon name="md-bookmark" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["addFav"]}
          </Text>
        </Col>
        <Col style={styles.col}>
          <Button
            transparent
            onPress={(_) => {
              close();
              setTimeout((_) => tarajem("open"), 10);
            }}
            style={{ marginBottom: 1 }}
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
            style={{ marginBottom: 1 }}
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
            style={{ marginBottom: 1 }}
          >
            <Icon active name="md-copy" style={{ color }} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {lang["copy"]}
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
    fontSize: 12,
  },
  icon: {
    width: 45,
    height: 45,
    justifyContent: "center",
  },
  col: {
    alignItems: "center",
    paddingHorizontal: 5,
    padding: 2,
  },
  row: {
    paddingBottom: 1,
  },
};
