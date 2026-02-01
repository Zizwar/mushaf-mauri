import React, { Component } from "react";
import { ListView } from "react-native";
import {
  Container,
  Header,
  Title,
  Content,
  Button,
  List,
  ListItem,
  Text,
  Thumbnail,
  Left,
  Right,
  Toast,
  Body,
  Switch,
  H3,
} from "native-base";
import DateTimePicker from "react-native-modal-datetime-picker";
import { Constants, Notifications, Permissions } from "expo";
import { connect } from "react-redux";
import ActionButton from "react-native-action-button";

import { Icon } from "../component";
import { setAlarm } from "../../reducer";

import * as lang from "../../i18n";

import AddNote from "../component/addNote";

const toasti = (text) =>
  Toast.show({
    text,
    type: "success",
    duration: 3000,
  });
class Alarm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isDateTimePickerVisible: false,
      time: null,
      date: null,
      tomorrow: null,
      listViewData: [],
      visibleAddNote: false,
    };
    this.lang = lang[this.props.lang];
    this.ds = new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 });
  }
  //componentWillMount() {}
  _showDateTimePicker = () => this.setState({ isDateTimePickerVisible: true });
  _hideDateTimePicker = () => this.setState({ isDateTimePickerVisible: false });
  _handleDatePicked = (date_) => {
    console.log("A date has been picked: ", date_);
    const date = new Date(date_);
    const hh = date.getHours();
    const mm = date.getMinutes();
    const time = hh + ":" + mm;
    this.setState({ visibleAddNote: true, time, date });
    this._hideDateTimePicker();
  };
  componentDidMount() {
    this.setState({
      listViewData: this.props.alarm,
    });
    this.permissionsAndListener();
  }
  deleteRow = (secId, rowId, rowMap) => {
    rowMap[`${secId}${rowId}`].props.closeRow();
    const newData = [...this.state.listViewData];
    newData.splice(rowId, 1);
    this.setState({ listViewData: newData });
    this.props.setAlarm(newData);
  };
  goBack = () => {
    if (this.props.togl) this.props.togl("close");
    else this.props.navigation.goBack();
    if (this.props.handleMenu) this.props.handleMenu("open");
  };
  returnDateNotif = (date_) => {
    const date = new Date(date_);
    const hh = date.getHours();
    const mm = date.getMinutes();
    const time = hh + ":" + mm;
    this.setState({ time });
    // var now = new Date().getTime(),
    const today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate());
    tomorrow.setHours(hh);
    tomorrow.setMinutes(mm);
    const reqT = tomorrow.getTime();
    const now = new Date().getTime();
    if (now >= reqT) {
      tomorrow.setTime(reqT + 86400 * 1000);
    }
    if (tomorrow) this.setState({ time, tomorrow });
  };
  notifer() {
    const localNotification = {
      title: "Mauri",
      body: "new version !",
      sound: true,
      icon:
        "https://cdn2.iconfinder.com/data/icons/circle-icons-1/64/booklet-512.png",
      color: "#F44",
      priority: "high", // (optional) (min | low | high | max)
      vibrate: [0, 100],
      link: "mushaf.me",
      repeat: "no-repeat",
    };

    const schedulingOptions = {
      time: new Date().getTime() + 1000, // Number(e.nativeEvent.text)
    };

    // Notifications show only when app is not active.
    // (ie. another app being used or device's screen is locked)
    Notifications.scheduleLocalNotificationAsync(
      localNotification,
      schedulingOptions
    );
  }

  handleNotification = () => {
    console.warn("ok! got your notif");
  };

  permissionsAndListener = async () => {
    let result = await Permissions.askAsync(Permissions.NOTIFICATIONS);

    if (Constants.isDevice && result.status === "granted") {
      console.log("Notification permissions granted.");
    }

    Notifications.addListener(this.handleNotification);
    //this.notifer()
  };

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={() => this.goBack()}>
              <Icon name="ios-close" />
            </Button>
          </Left>
          <Body>
            <Title>{this.lang["mozaker"]}</Title>
          </Body>
          <Right />
        </Header>
        <Content>
          <AddNote
            show={this.state.visibleAddNote}
            note={(note) => {
              this.setState({ visibleAddNote: false });
              toasti(this.lang["mozaker_msg"] + ": " + note);
              //  this.addNote(note);

              const listViewData = [
                ...this.state.listViewData,
                { note, time: this.state.time },
              ];

              this.setState({
                listViewData,
              });
              this.props.setAlarm(listViewData);
            }}
            cancel={(_) => this.setState({ visibleAddNote: false })}
          />

          <List
            dataSource={this.ds.cloneWithRows(this.state.listViewData)}
            // dataArray={datas}
            renderRow={(data) => (
              <ListItem
                onPress={() => {
                  //this.goBack();
                }}
                avatar
              >
                <Left>
                  <Switch trackColor="#046f98" value={true} />
                </Left>
                <Body style={{ paddingRight: 20 }}>
                  <H3 style={{ textAlign: "right" }}>{data.time}</H3>
                  <Text note>{data.note}</Text>
                </Body>
                <Thumbnail
                  small
                  style={{ width: 24, height: 24, paddingRight: 5 }}
                  source={require("../../assets/number.png")}
                />
              </ListItem>
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
            leftOpenValue={75}
            rightOpenValue={-75}
          />
        </Content>
        <ActionButton
          buttonColor="rgba(231,76,60,1)"
          onPress={this._showDateTimePicker}
        />
        <DateTimePicker
          isVisible={this.state.isDateTimePickerVisible}
          onConfirm={this._handleDatePicked}
          onCancel={this._hideDateTimePicker}
          mode="time"
        />
      </Container>
    );
  }
}
const mapStateToProps = ({ alarm, lang }) => ({
  alarm,
  lang,
  // wino
});

const mapDispatchToProps = {
  setAlarm,
};
export default connect(mapStateToProps, mapDispatchToProps)(Alarm);
