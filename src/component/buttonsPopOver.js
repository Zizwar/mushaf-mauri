import React from "react";

import { Col, Grid, Row, Button } from "native-base";

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
      message: `${text} | ${lang["sura_s"]}:${sura} ${lang["aya"]}:${aya} | \n Mushaf Mauri \n https://meshaf.me/a${aya}s${sura}r1z`,
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
  wino,
}) => (
  <Grid>
    <Row transparent style={styles.row}>
      <Col transparent style={styles.col}>
        <Button
          transparent
          onPress={(_) => {
            close();
            setTimeout((_) => play(wino, true), 10);
          }}
        >
          <Icon name="md-play" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button transparent onPress={note}>
          <Icon  name="md-bookmark" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button
          transparent
          onPress={(_) => {
            close();
            setTimeout((_) => tarajem("open"), 10);
          }}
        >
          <Icon name="md-book" style={{ color }} />
        </Button>
      </Col>

      <Col style={styles.col}>
        <Button transparent onPress={(_) => onShare(wino, toasti, close, lang)}>
          <Icon name="md-share" style={{ color }} />
        </Button>
      </Col>
      <Col style={styles.col}>
        <Button
          transparent
          onPress={(_) =>
            writeToClipboard(wino.text, toasti, close, lang["copy_done"])
          }
        >
          <Icon name="md-copy" style={{ color }} />
        </Button>
      </Col>
    </Row>
  </Grid>
);

const styles = {
  container: {
    flex: 1,
    width: null,
    height: null,
    // backgroundColor: "#FFF"
  },

  iconText: {
    fontSize: 12,
  },
  col: {
    alignItems: "center",
    //paddingHorizontal: -1,
     padding: 12
  },
  row: {
    //  paddingBottom: 1
  },
};
