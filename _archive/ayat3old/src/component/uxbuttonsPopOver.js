import React from "react";

import {
  Content,
  Col,
  Text,
  Button,
  ListItem,
  List,
  Right,
  Left,
  Body,
  View,
  Container,
  Thumbnail,
  Grid,
  Row
  
} from "native-base";
import {Clipboard,Share,Image} from "react-native";
//export const Icong = ({name }) => (<Thumbnail square source={{uri: '../../assets/'+name+'.png'}} />);

const writeToClipboard = async (text,toasti,close,done) => {
  await Clipboard.setString(text);
   close();
  toasti(done);
 
};
//
const  onShare = async (wino,toasti,close,_lang) => {
  const {text,aya,sura}=wino
    try {
      const result = await Share.share({
        message:
          `${text} | ${_lang["sura_s"]}:${sura} ${_lang["aya"]}:${aya} | \n https://ayat.app/a${aya}s${sura}r1z`
      })

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          // toasti('shared with activity type of'+ result.activityType)
        
        } else {
          // shared
           close()
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      toasti(error.message);
    }
  };
//
export const ButtonPopOver = ({ close,play,_lang, toasti,note,tarajem, stop,navigate, addBookmarks, wino }) => (
 
  <Content>
    <Grid style={styles.container}>
      <Row style={styles.row}>
   
            <Left>
       
     <Col style={styles.col}>
             <Button
            transparent 
               onPress={note}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/note.png')} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
           {_lang["note"]}
          </Text>
               </Col>
            </Left>
           
          
             <Body>
                   <Col style={styles.col}>
                    <Button
            transparent
            onPress={addBookmarks}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/bookmark.png')} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
             {_lang["addFav"]}
          </Text>
               </Col>

            </Body>
            
        
        
        
        <Right>
      
     <Col style={styles.col}>
              <Button
            transparent
             onPress={_ =>{close(); setTimeout(_=> tarajem('open'),10) }}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/tafasir.png')} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
             {_lang["download_ttarajem_tarajem"]}
          </Text>
              </Col>
            </Right>
            
   </Row><Row>
            <Left>
               <Col style={styles.col}>
             <Button
            transparent
            onPress={_=>onShare(wino,toasti,close,lang)}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/share.png')} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
            {_lang["share"]}
          </Text>
               </Col>
            </Left>
            
             <Body>
         
       <Col style={styles.col}>
              <Button
            transparent
            onPress={_ =>{close();navigate("Reciting"); }}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/repeat.png')} />
          </Button>
              <Text numberOfLines={1} style={styles.iconText}>
             {_lang["bu_telawa"]}
          </Text>
              </Col>
            </Body>
            
             <Right>
               <Col style={styles.col}>
              <Button
            transparent
            onPress={_=>writeToClipboard(wino.text,toasti,close,_lang["copy_done"])}
            style={{ marginBottom: 1 }}
          >
            <Thumbnail square source={require('../../assets/copy.png')} />
          </Button>
          <Text numberOfLines={1} style={styles.iconText}>
           { _lang["copy"]}
          </Text>
               </Col>
            </Right>
   </Row>
    </Grid>
  
  </Content>
  );


const styles = {
  container: {
    backgroundColor: "#FFF"
  },
  iconContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    paddingLeft: 1
  },
  iconText: {
    fontSize: 12
  },
  icon: {
    width: 45,
    height: 45,
    justifyContent: "center"
  },
  col: {
     justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 1,
    margin: 20
  },
  row: {
    paddingBottom: 5
  }
};