import React, { PureComponent } from "react";

import { Modal, StyleSheet } from "react-native";

import { View, Item, Input, Button } from "native-base";
import { Icon } from "./componentIno";
class AddNote extends PureComponent {
  state = { note: this.props.alarm ? "ورتل القران ترتيلا" : "" };
  render() {
    const {
      note,
      show,
      cancel,
      color,
      backgroundColor,
      placeholder,
    } = this.props;
    return (
      <Modal
        animationType="slide"
        transparent
        visible={show}
        onRequestClose={cancel}
      >
        <View style={styles.overlay}>
          <View style={styles.resultContainer}>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingLeft: 50,
                paddingRight: 50,
                backgroundColor,
              }}
            >
              <Item>
                <Input
                  style={{
                    textAlign: "center",
                  }}
                  placeholder={placeholder}
                  onChangeText={(note) => this.setState({ note })}
                  multiline={true}
                  numberOfLines={3}
                />
              </Item>
              <Item>
                <Button transparent onPress={cancel}>
                  <Icon style={{ color }} name="ios-close-circle-outline" />
                </Button>
                <Button transparent onPress={(_) => note(this.state.note)}>
                  <Icon style={{ color }} name="ios-checkmark-circle-outline" />
                </Button>
              </Item>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultContainer: {
    marginTop: 30,
    width: "95%",
    height: 300,
    backgroundColor: "#fff",
    borderRadius: 2,
    alignItems: "center",
    padding: 15,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  action: { padding: 5, margin: 10 },
  title: { color: "#000", fontSize: 18, fontWeight: "500" },
  result: { flex: 1, textAlign: "center", overflow: "hidden", marginTop: 20 },
});

export default AddNote;
